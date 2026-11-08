# 视觉证据索引

## 面板 UI 改版 + slot 迁移（feat/gateway-panel-restyle，check-104）

两步走：`002` 是纯视觉改版（portal 规格卡片/pill/chip，仍挂旧 slot 浮层）；
`003` 是 slot 拓扑向 portal（dsh-remote-portal）对齐——`sidebar.panellist`（入口，
id=dsh-host-gateway，order 90）+ `main`（主内容页，key 同值 = 壳的 page-switch 契约），
旧 `sidebar.footer.action` 入口与 `shell.overlay` 注册移除（浮层类内容只剩配对二维码，
照 portal 的 QR-in-panel 语义留在面板内部）。视觉规格两步共用，数据通道零变化。

| 文件 | 说明 |
| --- | --- |
| `pc/panel-restyle_001-before-1440.png` | 历史：改版前 1440×900 @2x（cc59a7f，分隔线式区块、22px 大标题、footer 浮层入口） |
| `pc/panel-restyle_002-after-1440.png` | 历史：纯视觉改版后（卡片化 + pill，仍在旧 slot 浮层） |
| `pc/panel-restyle_003-page-1440.png` | **本笔交付**：slot 迁移后 1440×900 @2x，main 页面直出（h1 + pill 行 + subtitle + nav/内容双栏） |
| `mobile/panel-restyle_001-before-390.png` | 历史：改版前 390×844 @3x |
| `mobile/panel-restyle_002-after-390.png` | 历史：纯视觉改版后 390×844 @3x |
| `mobile/panel-restyle_003-page-390.png` | **本笔交付**：slot 迁移后 390×844 @3x，无横向溢出（截图脚本断言 `scrollWidth - clientWidth ≤ 0`） |

| `pc/panel-restyle_004-no-tools-1440.png` | 移除 header 齿轮「工具」按钮及下拉菜单后（1440×900 @2x，header 只剩 pill） |
| `mobile/panel-restyle_004-no-tools-390.png` | 同上 390×844 @3x |

| `pc/panel-restyle_005-tabs-1440.png` | nav 改 portal 水平 tab 条（accent 下划线选中），1440×900 @2x |
| `mobile/panel-restyle_005-tabs-390.png` | 同上 390×844 @3x，tab 条不换行可横滚、页面级溢出 0 |

| `pc/panel-restyle_006-three-tabs-1440.png` | tab 条只剩三项（通用设置/连接与配对/可信设备），安装应用 tab 及安装引导已删，1440×900 @2x |
| `mobile/panel-restyle_006-three-tabs-390.png` | 同上 390×844 @3x，页面级横向溢出 0 |

| `pc/panel-restyle_007-mode-toggle-1440.png` | 网关运行模式卡：chip 换开关（auth 卡同款 role=switch），三档下拉删除，1440×900 @2x |
| `mobile/panel-restyle_007-mode-toggle-390.png` | 同上 390×844 @3x，页面级横向溢出 0 |

采集方式（真实后端 + 真实 client.js，仅 DSH 壳层是 stub）：

```sh
# 一次性准备面板 harness 依赖（React 19 + esbuild，装在仓库外的临时目录）
mkdir -p /tmp/panel-harness-deps && cd /tmp/panel-harness-deps
npm init -y >/dev/null && npm i --silent react@19 react-dom@19 esbuild

# 改版后（本分支）
node docs/evidence/lib/panel-shot.mjs --client lib/client.js \
  --deps /tmp/panel-harness-deps --width 1440 --height 900 --scale 2 \
  --out screen/pc/panel-restyle_002-after-1440.png
# 改版前（base cc59a7f 的 client.js，同一后端、同一 harness）
node docs/evidence/lib/panel-shot.mjs --client <path-to-cc59a7f>/lib/client.js \
  --deps /tmp/panel-harness-deps --width 1440 --height 900 --scale 2 \
  --out screen/pc/panel-restyle_001-before-1440.png
# 390 档同理：--width 390 --height 844 --scale 3 --out screen/mobile/...
```

harness 说明见 `docs/evidence/README.md`。真实 DSH 壳内的观感（主题 token、
shell 尺寸）默认列为未覆盖项。
