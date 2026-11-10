/**
 * 面板截图采集（CDP 驱动 headless Chrome；移动端视口必须走
 * Emulation.setDeviceMetricsOverride，不能 --window-size=390——新版 headless 有
 * 500px 最小窗口，会像 dsh-bot-webui README 记载的那样误报「横向溢出」）。
 *
 * 流程：起 panel-harness → 打开页面 → 点侧栏底部按钮打开面板 → 等 pill 就绪
 * 与设备行出现 → 截图。视口与输出由参数决定。
 *
 * 用法：
 *   node docs/evidence/lib/panel-shot.mjs \
 *     --client <lib/client.js> --deps /tmp/panel-harness-deps \
 *     --width 1440 --height 900 --scale 2 --out screen/pc/panel-restyle_002-after-1440.png
 */
import { spawn } from 'node:child_process'
import { mkdirSync, rmSync } from 'node:fs'
import { dirname } from 'node:path'

const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const args = process.argv.slice(2)
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : fallback
}
const CLIENT = opt('client', '')
const DEPS = opt('deps', '/tmp/panel-harness-deps')
const WIDTH = Number(opt('width', '1440'))
const HEIGHT = Number(opt('height', '900'))
const SCALE = Number(opt('scale', '1'))
const OUT = opt('out', '')
const PORT = 9411 + (Number(opt('cdp-offset', '0')) || 0)

if (!CLIENT) {
  console.error('panel-shot: --client <lib/client.js> is required')
  process.exit(3)
}
if (!OUT) {
  console.error('panel-shot: --out <png> is required')
  process.exit(3)
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

const harness = spawn('node', [
  new URL('./panel-harness.mjs', import.meta.url).pathname,
  '--client', CLIENT,
  '--deps', DEPS,
  '--port', '0',
], { stdio: ['ignore', 'pipe', 'pipe'] })
let harnessUrl = ''
const harnessReady = new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error('harness did not report ready in 30s')), 30_000)
  harness.stdout.on('data', (chunk) => {
    const line = String(chunk)
    const match = /panel harness ready: (http:\/\/\S+)/.exec(line)
    if (match) { clearTimeout(timer); harnessUrl = match[1]; resolve() }
  })
  harness.on('exit', (code) => reject(new Error(`harness exited early (code ${code})`)))
})

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=/tmp/mgw-panel-shot-${PORT}`,
  'about:blank',
], { stdio: 'ignore' })

async function target() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()
      const page = list.find((item) => item.type === 'page')
      if (page) return page
    } catch { /* not up yet */ }
    await wait(250)
  }
  throw new Error('headless Chrome did not expose a page target')
}

try {
  await harnessReady
  const page = await target()
  const ws = new WebSocket(page.webSocketDebuggerUrl)
  let id = 0
  const pending = new Map()
  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data)
    const resolve = pending.get(msg.id)
    if (resolve) { pending.delete(msg.id); resolve(msg.result ?? msg.error) }
  })
  await new Promise((resolve) => ws.addEventListener('open', resolve))
  const send = (method, params = {}) => new Promise((resolve) => {
    const mid = ++id
    pending.set(mid, resolve)
    ws.send(JSON.stringify({ id: mid, method, params }))
  })
  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    if (result?.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? 'evaluate failed')
    return result?.result?.value
  }

  await send('Emulation.setDeviceMetricsOverride', {
    width: WIDTH, height: HEIGHT, deviceScaleFactor: SCALE, mobile: WIDTH < 700,
  })
  await send('Page.enable')
  await send('Page.navigate', { url: harnessUrl })
  await wait(1200)
  const ready = await evaluate('window.__panelReady === true')
  if (!ready) throw new Error('panel did not boot (window.__panelReady false)')

  // 面板已迁入 main pane（portal 同构拓扑），页面直出，无需点击入口。
  // --pairing：进「连接与配对」tab 并生成配对二维码，拍短码大字弹窗。
  const openPairing = args.includes('--pairing')
  // 等 pill 就绪（running/off）与可信设备卡出现。
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const state = await evaluate(`(() => {
      const pill = document.querySelector('.mgw-pill')
      const card = document.querySelector('[data-mgw-card="devices"]')
      return { pill: pill ? pill.getAttribute('data-state') : null, card: !!card }
    })()`)
    if (state.card && state.pill && state.pill !== 'loading') break
    await wait(250)
  }
  if (openPairing) {
    const opened = await evaluate(`(() => {
      const tabs = [...document.querySelectorAll('.mgw-nav button')]
      const pairing = tabs.find((t) => t.textContent?.includes('连接与配对'))
      if (!pairing) return 'tab-missing'
      pairing.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      return 'tab-ok'
    })()`)
    if (opened !== 'tab-ok') throw new Error(`pairing tab not found: ${opened}`)
    await wait(300)
    const generated = await evaluate(`(() => {
      const buttons = [...document.querySelectorAll('button')]
      const generate = buttons.find((b) => b.textContent?.includes('生成配对二维码'))
      if (!generate) return 'btn-missing'
      generate.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      return 'gen-ok'
    })()`)
    if (generated !== 'gen-ok') throw new Error(`generate button not found: ${generated}`)
    // 等配对弹窗 + 大字短码出现
    let codeText = ''
    for (let attempt = 0; attempt < 40; attempt += 1) {
      codeText = await evaluate(`document.querySelector('[data-mgw-pair-code]')?.textContent ?? ''`)
      if (codeText) break
      await wait(250)
    }
    if (!/^[0-9ABCDEFGHJKMNPQRSTVWXYZ]{8}$/.test(codeText)) throw new Error(`short code invalid on screen: "${codeText}"`)
    await wait(400)
  }

  const final = await evaluate(`(() => {
    const nav = document.querySelector('.mgw-nav')
    const content = document.querySelector('.mgw-content')
    const tabs = [...document.querySelectorAll('.mgw-nav button')]
    const nrect = nav?.getBoundingClientRect()
    const crect = content?.getBoundingClientRect()
    return {
      pill: document.querySelector('.mgw-pill')?.getAttribute('data-state') ?? null,
      cards: [...document.querySelectorAll('[data-mgw-card]')].map((el) => el.getAttribute('data-mgw-card')),
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      nav: nav ? {
        direction: getComputedStyle(nav).flexDirection,
        navBottom: nrect.bottom,
        contentTop: crect?.top ?? null,
        sameRow: new Set(tabs.map((t) => Math.round(t.getBoundingClientRect().top))).size === 1,
        tabScroll: nav.scrollWidth - nav.clientWidth,
      } : null,
    }
  })()`)
  if (final.overflow > 0) throw new Error(`horizontal overflow at ${WIDTH}: +${final.overflow}px`)
  if (final.nav) {
    console.log(`readings: nav=${final.nav.direction} navBottom=${final.nav.navBottom} contentTop=${final.nav.contentTop} sameRow=${final.nav.sameRow} tabScroll=${final.nav.tabScroll} pageOverflow=${final.overflow}`)
    if (final.nav.direction !== 'row') throw new Error(`nav not horizontal: ${final.nav.direction}`)
    if (final.nav.contentTop !== null && final.nav.navBottom > final.nav.contentTop) throw new Error('nav is not above content')
    if (!final.nav.sameRow) throw new Error('tabs are not on one row')
  }
  if (!OUT) throw new Error('unreachable')
  mkdirSync(dirname(OUT), { recursive: true })
  const shot = await send('Page.captureScreenshot', { format: 'png' })
  const { writeFileSync } = await import('node:fs')
  writeFileSync(OUT, Buffer.from(shot.data, 'base64'))
  console.log(`saved ${OUT} (${WIDTH}x${HEIGHT} @${SCALE}x, pill=${final.pill}, cards=${final.cards.join(',') || '-'})`)
} finally {
  chrome.kill('SIGKILL')
  harness.kill('SIGKILL')
  await wait(500)
  try { rmSync(`/tmp/mgw-panel-shot-${PORT}`, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }) } catch { /* chrome 可能仍在写 profile；残留只在 /tmp */ }
}
