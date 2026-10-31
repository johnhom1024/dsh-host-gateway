/**
 * UI 语言解析的优先级测试（`lib/client.js` 的 `resolveLocale`）。
 *
 * 回归来源：DSH 桌面端的 `Info.plist` 没有声明任何本地化
 * （`Bundle(...).localizations == []`），macOS 因此把整个应用报成英文，
 * `navigator.language` 恒为 `en` —— 即使用户在 DSH 设置里切成了中文。
 * 插件当时只读 `navigator.language`，于是面板在中文 DSH 里整屏英文。
 *
 * 正确做法是**先读宿主自己的语言**（DSH 把它写在 `<html lang>`，见
 * dsh-client-locale 的 `syncDocumentLanguage`），navigator 只作兜底。
 *
 * 这个测试直接从 `lib/client.js` 里截取那段代码求值，所以它验证的是**真实源码**，
 * 不是测试里另抄的一份逻辑（抄一份必然漂移）。
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const clientSource = readFileSync(join(root, 'lib', 'client.js'), 'utf8')

const START = 'const normalizeLocale = (value) => {'
const END = 'let UI_LOCALE = resolveLocale()'
const startAt = clientSource.indexOf(START)
const endAt = clientSource.indexOf(END)
assert.ok(startAt >= 0, '找不到 normalizeLocale（源码被改名了？）')
assert.ok(endAt > startAt, '找不到 UI_LOCALE 初始化（源码被改名了？）')
const snippet = clientSource.slice(startAt, endAt + END.length)

/** 在受控的 window/document/navigator 下求值那段真实源码。 */
function resolve(env) {
  const docEl = { lang: env.htmlLang ?? '' }
  const win = {
    localStorage: { getItem: (key) => env.storage?.[key] ?? null },
    __MGW_UI_LOCALE__: env.embedded,
  }
  const nav = { language: env.navigatorLang ?? '' }
  const doc = { documentElement: docEl }
  const factory = new Function(
    'window',
    'document',
    'navigator',
    `${snippet}; return { UI_LOCALE, resolveLocale, readHostLocale, normalizeLocale }`,
  )
  return factory(win, doc, nav)
}

const cases = [
  {
    name: '宿主是中文、navigator 报英文 → 中文（这正是用户踩到的那条）',
    env: { htmlLang: 'zh-CN', navigatorLang: 'en' },
    expect: 'zh',
  },
  { name: '宿主是英文、navigator 报中文 → 英文', env: { htmlLang: 'en', navigatorLang: 'zh-CN' }, expect: 'en' },
  { name: '宿主未设 lang、navigator 中文 → 中文', env: { htmlLang: '', navigatorLang: 'zh-CN' }, expect: 'zh' },
  { name: '宿主未设 lang、navigator 英文 → 英文（纯浏览器）', env: { htmlLang: '', navigatorLang: 'en' }, expect: 'en' },
  { name: '宿主是日文 → 日文', env: { htmlLang: 'ja', navigatorLang: 'en' }, expect: 'ja' },
  {
    name: 'localStorage 覆盖优先于宿主',
    env: { htmlLang: 'en', navigatorLang: 'en', storage: { 'mobile-gateway-ui-locale': 'zh' } },
    expect: 'zh',
  },
  { name: 'embedder 覆盖优先于宿主', env: { htmlLang: 'zh', embedded: 'en', navigatorLang: 'zh' }, expect: 'en' },
  { name: '一切为空 → 兜底中文', env: { htmlLang: '', navigatorLang: '' }, expect: 'zh' },
  { name: '宿主 lang 带地区（zh-TW）也算中文', env: { htmlLang: 'zh-TW', navigatorLang: 'en' }, expect: 'zh' },
]

for (const { name, env, expect } of cases) {
  const got = resolve(env).UI_LOCALE
  assert.equal(got, expect, `${name}：期望 ${expect}，实际 ${got}`)
}

// 优先级顺序必须写死在源码里：宿主语言出现在 navigator 之前。
const hostAt = snippet.indexOf('readHostLocale()')
const navAt = snippet.indexOf('navigator.language')
assert.ok(hostAt >= 0 && navAt >= 0, '源码里应同时出现 readHostLocale 与 navigator.language')
assert.ok(hostAt < navAt, '宿主语言必须排在 navigator 之前，否则又会退化成英文')

console.log(`ui-locale: ${cases.length} 条优先级用例通过`)
