# 视觉证据索引

## 面板 UI 改版（feat/gateway-panel-restyle，check-104）

参照 dsh-remote-portal 的面板视觉规格（卡片化区块 + 状态 pill + chip + alert）重排
`lib/client.js` DevicePanel 的呈现层；slot 摆放与模块 id 不变，数据通道零变化。

| 文件 | 说明 |
| --- | --- |
| `pc/panel-restyle_001-before-1440.png` | 改版前 1440×900 @2x：旧版分隔线式区块、22px 大标题、无状态 pill |
| `pc/panel-restyle_002-after-1440.png` | 改版后 1440×900 @2x：标题 + 运行中 pill 同行、卡片化区块（mode/auth/pairing/cloudflare/devices 带 chip） |
| `mobile/panel-restyle_001-before-390.png` | 改版前 390×844 @3x |
| `mobile/panel-restyle_002-after-390.png` | 改版后 390×844 @3x：无横向溢出（截图脚本断言 `scrollWidth - clientWidth ≤ 0`） |

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
