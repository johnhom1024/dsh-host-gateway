// `tool/result` 帧里的图片附件元数据（2026-11-02，C 第一笔）。
//
// 为什么只发元数据、不发字节：附件是宿主侧不可变对象，字节走已有的
// `{type:'attachment', sessionId, attachmentId}` 查询帧，宿主按「本会话日志引用过它」
// 授权（`session/attachment-invalid` / ATTACHMENT_NOT_REFERENCED）。帧里只放
// attachmentId / mediaType / bytes / width / height / name?。
//
// 兼容性口径（本文件第 3、4 组）：没有图片的 tool/result **不许出现 `images` 键**，
// user/message 与 assistant/message 的既有字段一个不许多、一个不许少——
// 线上 dsh-remote-webui 与本仓是同一个网关喂的，它的解析不许被我们改动波及。
import assert from 'node:assert/strict'
import { buildWireEvent } from '../lib/index.mjs'

const session = { id: 'sess-c' }
const image = {
  type: 'image',
  attachment: {
    attachmentId: 'sha256:95b7f93d6795dde4dc53e5e3a327dba7322e1dc4e5f6a99c68079e2a8602c512',
    mediaType: 'image/png',
    bytes: 5013,
    width: 778,
    height: 44,
    name: '40-pc-collapsed-1440.png',
  },
}
const expectedImage = {
  attachmentId: image.attachment.attachmentId,
  mediaType: 'image/png',
  bytes: 5013,
  width: 778,
  height: 44,
  name: '40-pc-collapsed-1440.png',
}

// ① 扁平形状（真机 0.2.4 日志 seq 428 就是这形）：text 块 + image 块并列
{
  const event = {
    type: 'tool/result', seq: 428, time: 1793520798682,
    data: {
      turn: 5, step: 34,
      message: {
        role: 'tool', source: { kind: 'tool', callId: 'call_00_GNtC6LpQPvOje53TNYju8120' },
        toolCallId: 'call_00_GNtC6LpQPvOje53TNYju8120',
        content: [{ type: 'text', text: '<path>/tmp/a.png</path>\n<type>image</type>' }, image],
      },
    },
  }
  const frame = buildWireEvent(session, event)
  assert.equal(frame.kind, 'event')
  assert.equal(frame.sessionId, 'sess-c')
  assert.equal(frame.event.type, 'tool/result')
  assert.deepEqual(frame.event.images, [expectedImage], '扁平 tool/result 必须带图片元数据')
  assert.equal(frame.event.preview, '<path>/tmp/a.png</path>\n<type>image</type>', '文本 preview 不受影响')
  // 字节一个不带：帧里不许出现 base64 长串
  assert.equal(JSON.stringify(frame).includes('iVBOR'), false)
  assert.ok(JSON.stringify(frame).length < 600)
}

// ② 嵌套形状：payload 在 `{type:'tool-result', content:[…]}` 里，也要抽出来
{
  const event = {
    type: 'tool/result', seq: 429, time: 1,
    data: {
      turn: 1, step: 0,
      message: { role: 'tool', toolCallId: 'c-nested', content: [
        { type: 'tool-result', content: [{ type: 'text', text: 'nested text' }, image] },
      ] },
    },
  }
  const frame = buildWireEvent(session, event)
  assert.deepEqual(frame.event.images, [expectedImage], '嵌套 tool-result 里的图片也要透出')
  assert.equal(frame.event.preview, 'nested text')
}

// ③ 无图：**不许出现 images 键**（老客户端看到的帧与 1.0.2 完全一致）
{
  const event = { type: 'tool/result', seq: 1, time: 1, data: { turn: 1, step: 0,
    message: { role: 'tool', toolCallId: 'c', content: [{ type: 'text', text: 'plain' }] } } }
  const frame = buildWireEvent(session, event)
  assert.equal(Object.hasOwn(frame.event, 'images'), false, '纯文本 tool/result 不许新增 images 键')
  // 1.0.2 的字段集合（`type/turn/step/callId/isError/preview` + `toolResultDetails` 的
  // `output` / `outputTruncated`），本笔只允许在**有图片**时多一个 `images`
  assert.deepEqual(Object.keys(frame.event).sort(),
    ['callId', 'isError', 'output', 'outputTruncated', 'preview', 'step', 'turn', 'type'],
    '1.0.2 的字段集合必须一字不变')
}

// ④ 被 offload 过的 image 块（没有 attachment）：跳过，不崩、不产生空 images
{
  const event = { type: 'tool/result', seq: 2, time: 1, data: { turn: 1, step: 0,
    message: { role: 'tool', toolCallId: 'c', content: [{ type: 'image', offloaded: true }] } } }
  const frame = buildWireEvent(session, event)
  assert.equal(Object.hasOwn(frame.event, 'images'), false)
}

// ⑤ 多图保序 + 没有 name 的图不带 name 键
{
  const second = { type: 'image', attachment: {
    attachmentId: 'sha256:' + 'a'.repeat(64), mediaType: 'image/jpeg', bytes: 900, width: 10, height: 20 } }
  const event = { type: 'tool/result', seq: 3, time: 1, data: { turn: 1, step: 0,
    message: { role: 'tool', toolCallId: 'c', content: [image, second] } } }
  const frame = buildWireEvent(session, event)
  assert.equal(frame.event.images.length, 2)
  assert.equal(frame.event.images[0].name, '40-pc-collapsed-1440.png')
  assert.deepEqual(frame.event.images[1], {
    attachmentId: 'sha256:' + 'a'.repeat(64), mediaType: 'image/jpeg', bytes: 900, width: 10, height: 20 })
  assert.equal(Object.hasOwn(frame.event.images[1], 'name'), false)
}

// ⑥ 回归栅栏：user/message 与 assistant/message 的形状不许被这笔改动波及
{
  const user = buildWireEvent(session, { type: 'user/message', seq: 4, time: 1, data: {
    content: [{ type: 'text', text: 'hi' }, image], source: { kind: 'user' } } })
  assert.deepEqual(Object.keys(user.event).sort(), ['images', 'source', 'text', 'type'])
  assert.deepEqual(user.event.images, [expectedImage])

  const assistant = buildWireEvent(session, { type: 'assistant/message', seq: 5, time: 1, data: {
    turn: 1, step: 0, message: { content: [{ type: 'text', text: 'ok' }] } } })
  assert.equal(Object.hasOwn(assistant.event, 'images'), false, 'assistant 无图时也不许新增键')
  assert.deepEqual(assistant.event.toolCalls, [], 'assistant 的既有字段形状不变（空数组照旧）')
}

console.log('TOOL RESULT IMAGES TESTS PASSED')
