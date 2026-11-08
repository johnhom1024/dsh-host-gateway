/**
 * 面板截图 harness：真实网关后端（本仓库 lib/index.mjs 的 apply 管理路由）+ 真实
 * client.js（--client 指定，改版前后各指一次），只有 DSH 壳层是 stub——面板不是
 * 交付物的一部分，stub 只负责挂载与 React 供给。
 *
 * 复现：
 *   mkdir -p /tmp/panel-harness-deps && cd /tmp/panel-harness-deps
 *   npm init -y >/dev/null && npm i --silent react@19 react-dom@19 esbuild
 *   node docs/evidence/lib/panel-harness.mjs \
 *     --client ~/project/wt/dev/gateway-panel-restyle/lib/client.js \
 *     --deps /tmp/panel-harness-deps --port 0
 *   # 打印 http://127.0.0.1:<port>/ ;用 docs/evidence/lib/panel-shot.mjs 采图
 */
import http from 'node:http'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const argv = process.argv.slice(2)
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`)
  return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : fallback
}
const HERE = path.dirname(fileURLToPath(import.meta.url))
const CLIENT = arg('client', path.join(HERE, '..', '..', '..', 'lib', 'client.js'))
const DEPS = arg('deps', '/tmp/panel-harness-deps')
const PORT = Number(arg('port', '0'))

const repoRoot = path.join(HERE, '..', '..', '..')
const plugin = (await import(pathToFileURL(path.join(repoRoot, 'lib', 'index.mjs')))).default
const { createRegistry } = await import(pathToFileURL(path.join(repoRoot, 'lib', 'devices.js')))

function pathToFileURL(p) {
  return 'file://' + p.split('/').map((seg) => encodeURIComponent(seg)).join('/')
}

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'mgw-panel-harness-'))
// 预置一台「已配对设备」，让 可信设备 卡有真实行可看（token 只存在于这个临时目录）
const deviceFile = path.join(temp, 'devices.json')
const knownToken = crypto.randomBytes(32).toString('base64url')
const tokenHash = crypto.createHash('sha256').update(knownToken, 'utf8').digest('hex')
fs.writeFileSync(deviceFile, JSON.stringify({
  version: 3,
  devices: [{
    id: crypto.randomUUID(),
    name: 'Integration iPhone',
    tokenHash,
    createdAt: Date.now() - 86_400_000,
    lastSeenAt: Date.now() - 3_600_000,
  }],
}, null, 2), { mode: 0o600 })

let managementRoute
let upgradeRoute
const events = {}
const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', 'http://x')
  if (url.pathname === '/' || url.pathname === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(`<!doctype html>
<html lang="zh-CN">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>mgw panel harness</title>
<style>
  html, body { margin: 0; min-height: 100%; background: var(--dsw-alias-bg-base, #f7f7f8); color-scheme: light dark; }
  [data-mgw-hostbar] { display: flex; justify-content: center; padding: 16px; }
</style></head>
<body><div data-mgw-hostbar="1" id="hostbar"></div><div id="root"></div><script src="/panel.js"></script></body>
</html>`)
    return
  }
  if (url.pathname === '/panel.js') {
    res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' })
    res.end(bundle())
    return
  }
  if (managementRoute && (url.pathname === managementRoute.path || url.pathname.startsWith(`${managementRoute.path}/`))) {
    managementRoute.handler(req, res)
    return
  }
  res.writeHead(404).end()
})
server.on('upgrade', (req, socket, head) => {
  if (upgradeRoute) upgradeRoute.handler(req, socket, head)
  else socket.destroy()
})

const ctx = {
  webServer: {
    port: 0,
    register(route) { managementRoute = route; return () => { managementRoute = undefined } },
    registerUpgrade(route) { upgradeRoute = route; return () => { upgradeRoute = undefined } },
  },
  connection: {
    createPeer: () => ({ principal: { kind: 'owner' }, interactions: 'none', signal: new AbortController().signal }),
    createSharedFetchHandler: () => null,
  },
  typertGateway: {
    async invoke() { throw new Error('panel harness does not serve sessions') },
    async *stream() { yield { type: 'baseline', value: { items: [], archivedSessionIds: [] } }; await new Promise(() => {}) },
  },
  agentDefaultModel: {},
  on(name, listener) { events[name] = listener; return () => {} },
  effect(factory) { return factory() },
}

let dispose
try {
  dispose = plugin.apply(ctx, {
    requireAuth: true,
    gatewayEnabled: true,
    deviceFile,
    adminLoopbackOnly: true,
    pairingTtlMs: 60_000,
  })
} catch (error) {
  console.error(`harness: plugin.apply failed: ${error.message}`)
  process.exit(3)
}

// ── esbuild 打包面板（真实 client.js + React stub 壳） ─────────────────────
const depsRequire = createRequire(path.join(DEPS, 'package.json'))
const esbuild = depsRequire('esbuild')
let bundleCache = { source: '', mtime: -1, code: '' }
function bundle() {
  const stat = fs.statSync(CLIENT)
  if (bundleCache.source === CLIENT && bundleCache.mtime === stat.mtimeMs) return bundleCache.code
  // entry 与 client.js 都放进 deps 目录：react/react-dom 作为 node_modules 兄弟目录解析最稳。
  const workDir = DEPS
  const entry = path.join(workDir, '.mgw-panel-entry.js')
  fs.copyFileSync(CLIENT, path.join(workDir, '.mgw-panel-client.js'))
  fs.writeFileSync(entry, `\
import React from 'react'
import { createRoot } from 'react-dom/client'

// DSH 壳层 stub：client.js 只向壳要 react 与 slots 两个能力。
window.__ModuleLoader__ = {
  load(def) { window.__mgwPanel = def.factory((name) => (name === 'react' ? React : undefined)) },
}

const mount = async () => {
  await import('./.mgw-panel-client.js')
  const exports = window.__mgwPanel
  const captured = {}
  const slots = {
    inject: (_seat, fn) => { fn() },
    register: (meta, comp) => { captured[\`\${meta.name}:\${meta.id || meta.key || ''}\`] = comp },
  }
  exports.apply({
    effect: (fn) => fn(),
    slots,
  })
  const Footer = captured['sidebar.footer.action:mobile-gateway-devices']
  const Overlay = captured['shell.overlay:mobile-gateway-devices-panel']
  if (!Footer || !Overlay) throw new Error('panel slots missing after apply: ' + Object.keys(captured).join(', '))
  const root = createRoot(document.getElementById('root'))
  root.render(React.createElement(React.Fragment, null,
    React.createElement('div', { 'data-mgw-hostbar': '1' }, React.createElement(Footer, { wide: true })),
    React.createElement(Overlay)))
  window.__panelReady = true
}
mount()
`)
  const result = esbuild.buildSync({
    absWorkingDir: workDir,
    entryPoints: [path.basename(entry)],
    bundle: true,
    format: 'iife',
    platform: 'browser',
    outfile: 'panel.js',
    write: false,
    logLevel: 'silent',
  })
  bundleCache = { source: CLIENT, mtime: stat.mtimeMs, code: result.outputFiles[0].text }
  return bundleCache.code
}

await new Promise((resolve) => { server.listen(PORT, '127.0.0.1', resolve) })
const address = server.address()
const actualPort = typeof address === 'object' ? address.port : PORT
console.log(`panel harness ready: http://127.0.0.1:${actualPort}/ (client=${CLIENT})`)
console.log(`device token kept only in ${temp}`)

const shutdown = () => {
  try { dispose && dispose() } catch { /* already gone */ }
  server.close()
  fs.rmSync(temp, { recursive: true, force: true })
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
// 一直存活，由调用方（panel-shot.mjs 或人工）结束进程。
setInterval(() => {}, 60_000)
