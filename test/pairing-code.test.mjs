/**
 * 短码配对（方案 B）单元测试：码格式、大小写归一、失败作废阈值。
 * IP 节流是升级路径行为，集成部分在 pairing-throttle.test.mjs（独立 harness
 * 注入小阈值，避免污染 auth.test.mjs 的 127.0.0.1 全局节流状态）。
 */
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { createRegistry, generatePairingCode, normalizePairingCode, CROCKFORD_ALPHABET } = require('../lib/devices.js')

// ── 码格式：生成 10 个，逐个校验字符集/长度/无易混符 ─────────────────────────
const codes = Array.from({ length: 10 }, () => generatePairingCode())
for (const code of codes) {
  assert.match(code, /^[0-9ABCDEFGHJKMNPQRSTVWXYZ]{8}$/, `format: ${code}`)
  assert.equal(code.length, 8, `length: ${code}`)
  for (const banned of ['I', 'L', 'O', 'U']) assert.equal(code.includes(banned), false, `no ${banned}: ${code}`)
  for (const ch of code) assert.equal(CROCKFORD_ALPHABET.includes(ch), true, `charset: ${ch} in ${code}`)
}
console.log(`码规格自测 10 例：${codes.join(' ')}`)
// 唯一性：40 位熵下 10 连发不应碰撞
assert.equal(new Set(codes).size, 10)

// ── 大小写归一：小写/带空白输入命中同一记录 ─────────────────────────────────
{
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'mgw-short-code-'))
  const registry = createRegistry(path.join(temp, 'devices.json'), { pairingTtlMs: 60_000 })
  const { code } = registry.createPairing('Case iPhone')
  const lower = code.toLowerCase()
  assert.notEqual(lower, code, 'fixture: lowercase differs')
  assert.equal(registry.hasPairing(lower), true)
  assert.equal(registry.hasPairing(` ${code} `), true)
  const claimed = registry.claimPairing(lower, 'case-device-001', 'Case iPhone')
  assert.ok(claimed, 'lowercase input must claim')
  assert.equal(claimed.device.name, 'Case iPhone')
}

// ── 失败作废：5 次错码后，正确码也拒（threshold 可调） ────────────────────────
{
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'mgw-void-'))
  const registry = createRegistry(path.join(temp, 'devices.json'), { pairingTtlMs: 60_000, pairingMaxFailures: 5 })
  const { code } = registry.createPairing('Void iPhone')
  // 4 次错码：正确码仍可用
  for (let i = 0; i < 4; i += 1) assert.equal(registry.claimPairing('AAAAAAAA'), undefined, `wrong try ${i + 1} rejected`)
  const stillOk = registry.claimPairing(code, 'void-device-001')
  assert.ok(stillOk, 'correct code survives 4 failures')
  // 重新生成后再错 5 次：第 5 次起作废（正确码也拒）
  const second = registry.createPairing('Void iPhone 2')
  for (let i = 0; i < 5; i += 1) assert.equal(registry.claimPairing('BBBBBBBB'), undefined, `wrong try ${i + 1} rejected`)
  assert.equal(registry.hasPairing(second.code), false, 'pairing voided after 5 failures')
  assert.equal(registry.claimPairing(second.code, 'void-device-002'), undefined, 'correct code also rejected after voiding')
  // 归一只做大小写：错位符 I/L/O/U 不翻成合法候选
  assert.equal(normalizePairingCode('abcdilou'), 'ABCDILOU', 'no homoglyph folding')
  assert.equal(registry.claimPairing('ABCDILOU'), undefined)
}

// ── TTL / 单次使用回归（短码下语义不变） ────────────────────────────────────
{
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'mgw-ttl-'))
  const registry = createRegistry(path.join(temp, 'devices.json'), { pairingTtlMs: 60_000 })
  const pairing = registry.createPairing('TTL iPhone')
  const claimed = registry.claimPairing(pairing.code, 'ttl-device-001')
  assert.ok(claimed)
  assert.equal(registry.claimPairing(pairing.code), undefined, 'single use')
  const stored = fs.readFileSync(path.join(temp, 'devices.json'), 'utf8')
  assert.equal(stored.includes(pairing.code), false, 'code never persisted')
  assert.equal(stored.includes(claimed.token), false, 'token never persisted')
}

console.log('short-code pairing tests passed')
