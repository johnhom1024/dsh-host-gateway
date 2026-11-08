# docs/evidence — 面板 UI 改版取证（feat/gateway-panel-restyle）

本目录存放本分支的取证门禁与采集工具。编号沿用团队 check-NN 惯例；本仓库在此
之前没有 check 脚本，`check-104` 与 dsh-bot-webui 家族的 103 号以后顺延。

## check-104-panel-restyle.mjs

静态源码门禁，51 条断言，四组：

- **A. slot 拓扑 = portal 同构**（2026-11-08 打回反转）：`sidebar.panellist`（入口，
  id=PANEL_ID，order 90）与 `main`（主内容页，key=PANEL_ID）各恰一次且同值
  （portal 的 page-switch 契约）；旧 `sidebar.footer.action` 入口与 `shell.overlay`
  注册已移除（浮层类内容只剩配对二维码，照 portal 的 QR-in-panel 语义留在面板内部）；
  模块 id 仍为 `dsh-host-gateway`；main 页面渲染 DevicePanel（设备表/配对/状态搬进
  main pane）。
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
| A-删pill | pill 元素与钩子移除 | B2（实测命中） |
| B-挂错slot | `sidebar.panellist` → `sidebar.footer.action`（回退旧入口） | A2/A4（实测命中） |
| C-删词条 | 删 `"运行中": "Running"` EN 词条 | C1/C2（实测命中） |
| D-注入后端 | 源码注入 `/mgw/password` 字符串 | D1（实测命中） |
| E-塞回工具按钮 | 向 headerTop 塞回齿轮按钮 + setToolsOpen | B5/C1（实测命中） |
| F-nav改回竖排 | nav flex-direction 改回 column | B7（实测命中） |
| G-塞回安装tab | nav 塞回 install + **自足注入** `const INSTALL_SHOTS=[]` | B10/B11/B12/C1（实测命中） |
| H-塞回下拉 | 向 mode 卡塞回 GatewaySelect 三档下拉 | B14（实测命中） |

B5/B6（feat/remove-tools-menu 新增）：header 不再渲染齿轮「工具」按钮，toolsMenu/
runTool/toolsOpen/toolBusy/toolNotice/stoppedRef 全部死代码清零；D2 通道清单同步
移除 `/mgw/tools/`（后端端点保留，前端入口已删）。

B10/B11/B12（feat/remove-install-tab）：nav 只剩三个 tab；InstallGuide 组件、
RELEASES_LATEST/TESTFLIGHT_*/INSTALL_SHOTS 常量、三个 install state、GitHub
Release 拉取 useEffect、19 个安装类词条（EN+JA 38 行）全部清零；负向 mutant G
初版锚定已删常量（no-op，漏 B11），feat/mode-toggle 笔改为自足注入
`const INSTALL_SHOTS=[]` 后实测命中 B10/B11/B12/C1（EXIT 1）。

B13/B14/B15（feat/mode-toggle）：mode 卡 chip 换成 role=switch 开关
（`data-mgw-mode-switch`，开=persistent / 关=disabled），三档 GatewaySelect
下拉删除，「临时开启」「常驻开启」「关闭」词条（EN/JA）删净，新增
「开启/关闭网关运行模式」title 词条；temporary 仅后端保留，当前临时态时
开关如实显示为开、描述行照旧倒计时。B14 抓 mutant H。

B7/B8/B9（同分支第二笔）：nav 为 portal 水平 tab 条（flex-direction: row +
nowrap + overflow-x:auto），mgw-body 纵向（tab 上内容下），选中态 accent 下划线。
几何读数由 `panel-shot.mjs` 实测输出：1440 `nav=row navBottom=202.75 contentTop=218.75
sameRow=true pageOverflow=0`；390 `nav=row navBottom=196.75 contentTop=212.75
sameRow=true pageOverflow=0`。负向 mutant F（nav 改回竖排）命中 B7，EXIT 1。

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
