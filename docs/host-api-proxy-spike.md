# Host API 路由代理（spike 记录，2026-10-30）

> 状态：**已落地**（`Config.hostApiPaths`，默认关闭），是 fork 相对上游的新增能力之一。
> 目标：让移动端 WebUI 能拿到宿主侧某些 `POST /api/...` 视图，而不把 `/api` 暴露到网络。

## 1. 是什么

网关本来就用 `connection.createSharedFetchHandler('/api')`（`lib/dsh-host-adapter.mjs`，文件上传那处）
**在宿主进程内**直派精确 Fetch 路由：不监听回环 HTTP、不要浏览器 cookie、不暴露公网 `/api`。

这个能力把同一机制抽成一个语义方法 + 一条 WS 查询，**白名单受控、默认关闭**：

```js
// lib/dsh-host-adapter.mjs
const api = createDshHostAdapter(gateway, peer, connection, {
  hostApiPaths: ['/api/bot'],   // 空数组 = 功能不存在
})
await api.hostApi.call('/api/bot', { endpoint: 'state' })
```

```js
// 客户端 → 网关
{ "type": "host-api", "pathname": "/api/bot", "body": { "endpoint": "state" }, "requestId": "r1" }
// 网关 → 客户端
{ "kind": "host-api", "pathname": "/api/bot", "result": { "ok": true, "value": { … } }, "requestId": "r1" }
```

## 2. 安全边界（与既有 `apiProxy` 否决决议一致）

`test/host-adapter.test.mjs` 有一条硬断言：网关源码不得出现 `apiProxy` / `api.events.mux` /
`api.respond(`。这条能力不碰 typert、不碰 Remote 信封，只走**精确 Fetch 路由**，因此不违反它。

| 项 | 取值 | 理由 |
|---|---|---|
| 默认状态 | **关闭**（`hostApiPaths: []`） | 空白名单 = 功能不存在，能力位不出现 |
| 路径范围 | 只能是**精确注册的 Fetch 路由**（`fetchRoutes` 按 pathname 查） | 未注册路径直接 404，无法借此调 typert 端点 |
| 调用者 | 固定网关自己的 owner Peer（`createPeer({ principal: { kind: 'owner' } })`） | Host 的 `createSharedFetchHandler` 对精确路由只放 owner；网关无法提权 |
| 方法 | 恒为 `POST` + `application/json` | 宿主插件路由的契约；不做通用 HTTP 转发 |
| 语义失败 | 路由返回 `HTTP 200 + {ok:false}` 原样透传 | 这类路由常用 200 表达业务失败（只读、未找到），不等于传输失败 |
| 能力位 | `hello.capabilities` 含 `host-api-proxy-v1`，仅在白名单非空且 handler 存在时出现 | 客户端据此决定「要不要显示依赖 Host API 的入口」 |

错误码：`host-api-unavailable`（关着）、`host-api-path-denied`（不在白名单）、`host-api-failed`（HTTP 非 2xx）。

## 3. 改动清单

| 文件 | 改动 |
|---|---|
| `lib/dsh-host-adapter.mjs` | 第 4 参 `options`；复用已有的 `uploadHandler`；新增 `hostApi: { available, paths, call }` |
| `lib/index.mjs` | `Config.hostApiPaths`（默认 `[]`）；构造适配器时传入；hello 加 `host-api-proxy-v1`；`handleQuery` 加 `host-api` 分支；WS 分发白名单加 `host-api` |
| `test/host-api-proxy.test.mjs` | 新增，9 组：默认关、无 connection、越权路径、请求形状、空 body、HTTP 失败、语义失败、query op、能力位/配置/旧决议断言 |

## 4. 验证

### 4.1 单元（`node test/host-api-proxy.test.mjs`）

```
host-api-proxy: 9 groups passed
```

### 4.2 真实宿主（端到端，只读）

桌面宿主无法热加载新插件代码，所以用一个**临时 profile** 起第二个宿主：
同一 `DSH_HOME`、`requireAuth: false`、`lanEnabled: false`、
`hostApiPaths: ['/api/bot']`，端口随机。因为单写者锁，这个宿主天然只读——正好验证只读路径。

```
hello.capabilities 含 host-api-proxy-v1 = true
host-api /api/bot {endpoint:'state'} →
  ok = true
  revision 单调递增
  字段结构与宿主插件文档一致
  只读态原因字符串原样透传（含单写者锁的说明与持有者 pid）
负例 /api/deep-view → host-api-path-denied
```

复现（复用这套 profile 即可，不必重启桌面 GUI）：

```bash
# <profile> 的 bundles 含 dsh-base / dsh-web-app / 宿主插件 / 本仓库的网关
cd ~ && dsh --profile <profile> --no-open --port 0      # 端口随机，日志里有 dsh web: http://127.0.0.1:<port>/
# 连 ws://127.0.0.1:<port>/ws/mobile，发 hello 后发 host-api 帧
```

> 临时 profile 里必须 `.npmrc` 写 `auto-install-peers=false`，并显式 pin 相关
> `@deepseek-ai/dsh-*` 版本。否则 pnpm 会把宿主插件的 `*` peer 解析成陈旧版本，牵出
> 未发布到 registry 的包导致安装失败。

## 5. 尚未做（按需要再补）

1. **客户端帧族的正式命名**：现在只有一条 `host-api` 查询，WebUI 侧还没有对应的 store/协议章节。
   落地时应并入 PROTOCOL.md，并决定是 `host-api` 通用帧还是专用帧（如 `bot-state` / `bot-action`）。
2. **载荷上限**：`response.json()` 无字节上限。当前实测几十 KB 量级，纪元多、条目多时会涨；
   接裁剪或加 `maxResponseBytes`。
3. **轮询放大**：宿主侧实时片段若每轮都发且不跟 revision，客户端轮询时网关应单例轮询 + 按需下发。
4. **能力位命名**：`host-api-proxy-v1` 表达「网关能代理白名单 Host API」；目标路由是否存在另由
   零副作用探针判断。两者不要合并。
