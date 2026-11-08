# docs/evidence — 面板 UI 改版取证（feat/gateway-panel-restyle）

本目录存放本分支的取证门禁与采集工具。编号沿用团队 check-NN 惯例；本仓库在此
之前没有 check 脚本，`check-104` 与 dsh-bot-webui 家族的 103 号以后顺延。

## check-104-panel-restyle.mjs

静态源码门禁，39 条断言，四组：

- **A. slot 挂载点不变**：`sidebar.footer.action` + `shell.overlay` 各恰一次；
  模块 id 仍为 `dsh-host-gateway`；未向 portal 的 `sidebar.panellist`/`main`
  挂载对齐（本轮只改呈现）。
- **B. 区块结构**：portal 规格的 `.mgw-pill/.mgw-chip/.mgw-card-head/.mgw-card-title/.mgw-alert`
  都在；五张卡带 `data-mgw-card="mode|auth|pairing|cloudflare|devices"` 钩子。
- **C. i18n 完整性**：源码中每个 `tr('…')` 单串键都有 EN 词条（zh 为 key 本身，
  EN 对表搬）；本轮新增键（运行中/已停止/连接中/异常/已开启/已关闭/「N 台在线」）
  EN/JA 双表齐全。
- **D. 行为零变化**：不出现任何密码门后端语义（`/mgw/password`、`passwordArmed`、
  `needs-password`、`createPasswordGate`）；既有数据通道（status/devices/
  public-setup/tools/gateway/auth/cloudflare/pair）全数保留。

```sh
node docs/evidence/check-104-panel-restyle.mjs              # 正向，EXIT 0
node docs/evidence/check-104-panel-restyle.mjs --self-test  # 负向，全部命中 EXIT 1
```

负向四档（--self-test，全部命中 → EXIT 1；任一逃脱 → EXIT 2；前置不满足 → EXIT 3）：

| mutant | 变异 | 命中目标 |
| --- | --- | --- |
| A-删pill | pill 元素与钩子移除 | B 组区块断言 |
| B-挂错slot | `shell.overlay` → `sidebar.panellist` | A 组挂载点断言 |
| C-删词条 | 删 `"运行中": "Running"` EN 词条 | C 组 i18n 断言 |
| D-注入后端 | 源码注入 `/mgw/password` 字符串 | D 组纯度断言 |

## lib/panel-harness.mjs + lib/panel-shot.mjs — 面板截图 harness

**真实网关后端 + 真实 client.js，只有 DSH 壳层是 stub**（stub 只提供
`__ModuleLoader__`/`slots`/React 供给，面板代码逐字节来自 `--client` 指定文件）。
后端即本仓库 `lib/index.mjs` 的 `apply()` 管理路由：`/mgw/status`、`/mgw/devices`
（预置一台已配对设备，token 只存临时目录）与真实 `gatewayEnabled: persistent` 状态，
截图里的 pill/chip 读数来自真实状态流。

采集：`panel-shot.mjs` 用 CDP 驱动 headless Chrome（移动端视口必须走
`Emulation.setDeviceMetricsOverride`，理由见 screen/README 与 dsh-bot-webui 的
历史误判记录），真实点击侧栏底部按钮打开面板，等 pill 就绪后截图，并断言
`scrollWidth - clientWidth ≤ 0`。

依赖引导与完整命令见 `screen/README.md`。

## 已知边界（未覆盖）

- 真实 DSH 壳内的观感：主题 token 深浅色、shell 级字号/间距、`--dsw-alias-*`
  变量在宿主的真实取值 —— harness 用了同族回退值，默认列为未覆盖。
- WebUI/移动端真实设备上的触控、字体栈、安全区。
- JS 行为回归由 `pnpm test` 全链覆盖（含 `ui-locale` 回归）。
