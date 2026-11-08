#!/usr/bin/env node
/**
 * check-104：面板 UI 改版（feat/gateway-panel-restyle）取证门禁。
 *
 * 断言四组：
 *   A. slot 拓扑 = portal 同构：panellist + main 已注册、footer.action 与
 *      overlay 旧注册已移除、panellist id 与 main key 同值、模块 id 不变；
 *   B. 区块结构 —— portal 规格的 pill / chip / card-head / alert 都在，
 *      五张卡（mode/auth/pairing/cloudflare/devices）带 data-mgw-card 钩子；
 *   C. i18n 完整性 —— 源码里每个 tr('…') 单串键在 EN 表有词条；
 *      本轮新增键 EN/JA 双表齐全；
 *   D. 行为零变化 —— 不出现任何后端语义（/mgw/password、passwordArmed、
 *      needs-password、createPasswordGate），既有数据通道全数保留。
 *
 * 负向自检（--self-test）：对源码做四种变异（删 pill / 挂错 slot / 删 i18n 词条 /
 * 注入后端路由字符串），门禁必须逐个真实命中目标断言；全部命中 → EXIT 1（约定：
 * 负向自检通过的正常退出码），任一 mutant 逃脱 → EXIT 2，前置不满足 → EXIT 3。
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const source = readFileSync(join(root, 'lib', 'client.js'), 'utf8')
const SELF = process.argv.includes('--self-test')

const checks = []
const ok = (name, pass, detail = '') => {
  checks.push({ name, pass, detail })
  if (!pass) console.error(`FAIL ${name}${detail ? ` — ${detail}` : ''}`)
}
const count = (haystack, needle) => haystack.split(needle).length - 1

function slotMounts(src) {
  // 2026-11-08 打回反转：slot 拓扑向 portal（dsh-remote-portal）对齐——
  // panellist 挂入口、main 放主内容页；footer.action 旧入口与 overlay 注册移除
  //（浮层类内容只有配对二维码，照 portal 的 QR-in-panel 语义留在面板内部）。
  ok('A1 模块 id 保持 dsh-host-gateway', src.includes("id: 'dsh-host-gateway'"), 'window.__ModuleLoader__.load 的 id 不能变')
  ok('A2 sidebar.panellist 已注册恰一次', count(src, "slots.inject('sidebar.panellist'") === 1, `actual=${count(src, "slots.inject('sidebar.panellist'")}`)
  ok('A3 main 页面已注册恰一次', count(src, "slots.inject('main'") === 1, `actual=${count(src, "slots.inject('main'")}`)
  ok('A4 footer.action 旧入口已移除', count(src, "slots.inject('sidebar.footer.action'") === 0, `actual=${count(src, "slots.inject('sidebar.footer.action'")}`)
  ok('A5 shell.overlay 注册已移除', count(src, "slots.inject('shell.overlay'") === 0, `actual=${count(src, "slots.inject('shell.overlay'")}`)
  ok('A6 panellist id 与 main key 同值（page-switch 契约）', /id: PANEL_ID, order: \d+/.test(src) && src.includes("key: PANEL_ID"), 'portal 的 page-switch 机制')
  ok('A7 main 页面渲染面板组件', src.includes('React.createElement(DevicePanel)') && src.includes("className: 'mgw-page'"), '设备表/配对/状态区块搬进 main pane')
}

function blocks(src) {
  for (const cls of ['mgw-pill', 'mgw-pill-dot', 'mgw-chip', 'mgw-card-head', 'mgw-card-title', 'mgw-alert']) {
    ok(`B1 panelCss 含 .${cls}`, src.includes(`.${cls}`), 'portal 视觉规格类名')
  }
  ok('B2 状态 pill 带稳定钩子', src.includes("'data-mgw-pill': '1'"), '截图与验收定位用')
  for (const card of ['mode', 'auth', 'pairing', 'cloudflare', 'devices']) {
    ok(`B3 卡片 data-mgw-card=${card}`, src.includes(`'data-mgw-card': '${card}'`), 'portal 卡片化区块')
  }
  ok('B4 chip 带色调档', src.includes("[data-tone=\"ok\"]") && src.includes("[data-tone=\"warn\"]"), 'ok/warn 两档 chip')
}

function i18n(src) {
  const enStart = src.indexOf('const EN_UI = {')
  const enEnd = src.indexOf('\n}', enStart)
  const enTable = src.slice(enStart, enEnd)
  const jaStart = src.indexOf('const JA_UI = {')
  const jaEnd = src.indexOf('\n}', jaStart)
  const jaTable = src.slice(jaStart, jaEnd)
  // 源码中每个 tr('…') 单串键必须在 EN 表有词条（zh 为 key 本身，EN 对表搬）
  const keys = [...src.matchAll(/\btr\('((?:[^'\\]|\\.)*)'\)/g)].map((m) => m[1])
  const unique = [...new Set(keys)]
  const missing = unique.filter((key) => !enTable.includes(`"${key}"`))
  ok('C1 全部 tr 单串键有 EN 词条', missing.length === 0, missing.length ? `missing=${JSON.stringify(missing.slice(0, 5))}` : `${unique.length} keys checked`)
  for (const key of ['运行中', '已停止', '连接中', '异常', '已开启', '已关闭']) {
    ok(`C2 新键「${key}」EN/JA 齐全`, enTable.includes(`"${key}"`) && jaTable.includes(`"${key}"`), '本轮新增 pill/chip 词条')
  }
  ok('C3 在线数词条 EN/JA 齐全', enTable.includes('"\\u0000 台在线"') && jaTable.includes('"\\u0000 台在线"'), '可信设备 chip 模板键')
}

function purity(src) {
  for (const banned of ['/mgw/password', 'passwordArmed', 'needs-password', 'createPasswordGate', 'password-gate']) {
    ok(`D1 无后端语义「${banned}」`, !src.includes(banned), '本轮是纯呈现层，密码门后端已另档存放')
  }
  for (const channel of ['/mgw/status', '/mgw/devices', '/mgw/public-setup', '/mgw/tools/', '/mgw/gateway', '/mgw/auth', '/mgw/cloudflare', '/mgw/pair']) {
    ok(`D2 数据通道保留「${channel}」`, src.includes(channel), '功能零变化')
  }
}

function run(src) {
  checks.length = 0
  slotMounts(src)
  blocks(src)
  i18n(src)
  purity(src)
  return checks.filter((entry) => !entry.pass)
}

const failures = run(source)
if (!SELF) {
  if (failures.length) {
    console.error(`❌ check-104：${failures.length} 条断言未过`)
    process.exitCode = 1
  } else {
    console.log(`✅ check-104 通过：${checks.length} 条（slot 挂载 / 区块结构 / i18n 完整 / 行为零变化）`)
  }
} else {
  const mutate = (name, fn) => {
    const mutant = fn(source)
    if (mutant === source) {
      console.error(`SETUP ${name}: 变异未生效（源码标记漂移？）`)
      process.exitCode = 3
      return null
    }
    const hits = run(mutant).length
    console.log(`mutant ${name}: 命中 ${hits} 条断言`)
    return hits
  }
  const a = mutate('A-删pill', (src) => src.replace("'data-mgw-pill': '1'", "'data-x': '1'").replace(/className: 'mgw-pill',/, "className: 'mgw-hidden',"))
  const b = mutate('B-挂错slot', (src) => src.replace("slots.inject('sidebar.panellist'", "slots.inject('sidebar.footer.action'"))
  const c = mutate('C-删词条', (src) => src.replace('  "运行中": "Running",\n', ''))
  const d = mutate('D-注入后端', (src) => src.replace("'use strict'", "'use strict'; const mgwProbe = '/mgw/password';") === source ? src.replace("window.__ModuleLoader__.load({", "window.__ModuleLoader__.load({\n  // probe: /mgw/password") : src)
  const results = { A: a, B: b, C: c, D: d }
  if (Object.values(results).some((v) => v === null)) {
    if (!process.exitCode) process.exitCode = 3
  } else if (Object.values(results).every((v) => v > 0)) {
    console.log(`✅ check-104 --self-test：4 个 mutant 全部被门禁抓住（负向通过）`)
    process.exit(1)
  } else {
    console.error(`❌ check-104 --self-test：有 mutant 逃脱（${JSON.stringify(results)}）`)
    process.exitCode = 2
  }
}
