/**
 * 配对 IP 节流集成测试：独立 harness 注入小阈值（3 次/400ms 窗口），验证
 * 超限后 429、窗口滑出后恢复。不与 auth.test.mjs 共享实例，避免 127.0.0.1
 * 节流状态串场。
 */
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const assert = require('node:assert/strict')
const fs = require('node:fs')
const http = require('node:http')
const os = require('node:os')
const path = require('node:path')
const { once } = require('node:events')
const WebSocket = require('ws')
const plugin = (await import('../lib/index.mjs')).default

function expectRejected(url, protocols) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url, protocols)
    ws.once('open', () => reject(new Error('expected WebSocket rejection')))
    ws.once('unexpected-response', (_request, response) => {
      let body = ''
      response.on('data', (chunk) => { body += chunk })
      response.on('end', () => resolve({ status: response.statusCode, reason: response.statusMessage, body }))
      response.on('error', () => resolve({ status: response.statusCode, reason: response.statusMessage, body }))
    })
    ws.once('error', () => {})
  })
}

;(async () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'mgw-pair-throttle-'))
  let managementRoute
  let upgradeRoute
  const server = http.createServer((req, res) => {
    const url = new URL(req.url || '/', 'http://x')
    if (managementRoute && (url.pathname === managementRoute.path || url.pathname.startsWith(`${managementRoute.path}/`))) {
      managementRoute.handler(req, res)
      return
    }
    res.writeHead(404).end()
  })
  const webServer = {
    port: 0,
    register(route) { managementRoute = route; return () => { managementRoute = undefined } },
    registerUpgrade(route) { upgradeRoute = route; return () => { upgradeRoute = undefined } },
  }
  server.on('upgrade', (req, socket, head) => {
    if (upgradeRoute) upgradeRoute.handler(req, socket, head)
    else socket.destroy()
  })
  const events = {}
  const ctx = {
    webServer,
    connection: {
      createPeer: () => ({ principal: { kind: 'owner' }, interactions: 'none', signal: new AbortController().signal }),
      createSharedFetchHandler: () => null,
    },
    typertGateway: {
      async invoke() { throw new Error('throttle harness does not serve sessions') },
      async *stream() { yield { type: 'baseline', value: { items: [], archivedSessionIds: [] } }; await new Promise(() => {}) },
    },
    agentDefaultModel: {},
    on(name, listener) { events[name] = listener; return () => {} },
    effect(factory) { return factory() },
  }
  plugin.apply(ctx, {
    requireAuth: true,
    gatewayEnabled: true,
    deviceFile: path.join(temp, 'devices.json'),
    adminLoopbackOnly: true,
    pairingTtlMs: 60_000,
    pairingIpFailureLimit: 3,
    pairingIpWindowMs: 400,
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const webServerPort = server.address().port
  const base = `http://127.0.0.1:${webServerPort}`
  const wsUrl = `ws://127.0.0.1:${webServerPort}/ws/mobile`

  // 前置：开启鉴权后匿名升级被 401（普通拒绝路径）
  assert.equal((await expectRejected(wsUrl)).status, 401)

  // 连续 4 次坏 pairing（>limit=3 记账）后，第 5 次 pairing 凭证得到 429
  for (let i = 0; i < 4; i += 1) {
    const result = await expectRejected(wsUrl, ['dsh-mobile-v1', `dsh-pair.${'A'.repeat(8)}`, 'dsh-device.throttle-001'])
    assert.equal(result.status, 401, `wrong code try ${i + 1} still 401`)
    assert.equal(result.reason, 'Unauthorized')
    assert.match(result.body, /invalid or expired pairing code/)
  }
  const throttled = await expectRejected(wsUrl, ['dsh-mobile-v1', `dsh-pair.${'B'.repeat(8)}`, 'dsh-device.throttle-001'])
  assert.equal(throttled.status, 429, 'throttled after limit')
  assert.equal(throttled.reason, 'Too Many Requests')
  assert.match(throttled.body, /too many pairing attempts/)

  // 窗口滑出（400ms）后恢复 401（重新开始计数）
  await new Promise((resolve) => setTimeout(resolve, 450))
  const recovered = await expectRejected(wsUrl, ['dsh-mobile-v1', `dsh-pair.${'C'.repeat(8)}`, 'dsh-device.throttle-001'])
  assert.equal(recovered.status, 401, 'recovers after window')

  // 正确配对码不受节流误伤（窗口内清白路径）：生成新码后立即 claim 成功
  const pairResponse = await fetch(`${base}/mgw/pair`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: base },
    body: JSON.stringify({ name: 'Throttle iPhone', publicUrl: wsUrl }),
  })
  assert.equal(pairResponse.status, 201)
  const pairBody = await pairResponse.json()
  const pairedSocket = new WebSocket(wsUrl, ['dsh-mobile-v1', `dsh-pair.${pairBody.payload.pairingCode}`], { headers: { 'X-DSH-Device-ID': 'throttle-device-001' } })
  const pairedPromise = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timed out waiting for paired')), 2000)
    const onMessage = (data) => {
      const frame = JSON.parse(data.toString())
      if (frame.kind !== 'paired') return
      clearTimeout(timer)
      pairedSocket.off('message', onMessage)
      resolve(frame)
    }
    pairedSocket.on('message', onMessage)
  })
  await once(pairedSocket, 'open')
  assert.ok(await pairedPromise, 'valid code claims despite prior failures (failures were on other hashes)')
  pairedSocket.close()

  pairedSocket.close()
  server.close()
  console.log('pairing IP throttle tests passed')
  process.exit(0)
})().catch((error) => {
  console.error(error)
  process.exit(1)
})
