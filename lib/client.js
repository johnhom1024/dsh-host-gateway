// Browser half of dsh-host-gateway. The package manifest makes this
// bundle part of DSH's client-module graph; it contributes one sidebar footer
// action and one shell overlay without replacing shipped UI seats.
window.__ModuleLoader__.load({
  id: 'dsh-host-gateway',
  factory: (require) => {
    const React = require('react')
    const module = { exports: {} }
    const exports = module.exports
    // UI locale. Order matters — the **host's own language setting** outranks the
    // browser, because DSH lets the user pick a language unrelated to
    // `navigator.language`:
    //
    //   1. `localStorage` override      (explicit per-browser escape hatch)
    //   2. `window.__MGW_UI_LOCALE__`   (embedder override)
    //   3. **`document.documentElement.lang`**  ← what DSH actually writes
    //   4. `navigator.language`         (standalone fallback)
    //
    // Why #3 is load-bearing: the shipped Desktop app declares no localizations
    // (`Bundle(...).localizations == []`, and Info.plist has neither
    // `CFBundleLocalizations` nor `CFBundleDevelopmentRegion`), so macOS reports
    // the whole app as English and `navigator.language` reads `en` **even when the
    // user switched the DSH UI to Chinese**. DSH tracks its locale separately and
    // mirrors it into `<html lang>` (`syncDocumentLanguage` in dsh-client-locale),
    // so that attribute — not navigator — is the host's real answer. Reading
    // navigator here is what made this panel English-only inside a Chinese DSH.
    //
    // #3 is also live: `apply()` subscribes to `locale/change` and re-renders, so
    // switching language in DSH Settings updates this panel without a reload.
    const normalizeLocale = (value) => {
      const tag = String(value ?? '').trim()
      if (tag === '') return null
      if (/^zh/i.test(tag)) return 'zh'
      if (/^ja/i.test(tag)) return 'ja'
      if (/^en/i.test(tag)) return 'en'
      return null
    }
    const readHostLocale = () => {
      try { return normalizeLocale(document.documentElement.lang) } catch { return null }
    }
    const resolveLocale = () => {
      try {
        const forced = normalizeLocale(window.localStorage.getItem('mobile-gateway-ui-locale'))
        if (forced !== null) return forced
      } catch { /* storage unavailable */ }
      try {
        const embedded = normalizeLocale(window.__MGW_UI_LOCALE__)
        if (embedded !== null) return embedded
      } catch { /* window unavailable */ }
      const host = readHostLocale()
      if (host !== null) return host
      try {
        return normalizeLocale(navigator.language) ?? 'zh'
      } catch { return 'zh' }
    }
    // `let`, not `const`: the host can switch language while we are mounted.
    let UI_LOCALE = resolveLocale()
    const EN_UI = {
  "正在读取网关环境…": "Reading gateway environment...",
  "macOS 电脑": "macOS computer",
  "Windows 电脑": "Windows computer",
  "Linux 服务器": "Linux server",
  "当前设备": "this device",
  "当前检测：\u0000；局域网入口\u0000；\u0000。": "Detected: \u0000; LAN entry \u0000; \u0000.",
  "已就绪": "ready",
  "未就绪": "not ready",
  "公网服务器入口已配置": "public server entry configured",
  "\u0000 Tunnel 已连接": "\u0000 Tunnel connected",
  "命名": "named",
  "隧道已连接，公网入口未验证或检测失败": "tunnel connected, public entry not verified or check failed",
  "Cloudflare Tunnel 连接中": "Cloudflare Tunnel connecting",
  "外网入口未连接": "public entry not connected",
  "手机与 DSH 处于可互访的同一局域网时，建议选“局域网直连”。": "When the phone and DSH are on the same reachable LAN, choose \"LAN direct\".",
  "如果手机和 DSH 在同一局域网，先确认局域网入口已开启并监听成功。": "If the phone and DSH are on the same LAN, first confirm the LAN entry is enabled and listening.",
  "手机在外网时，建议使用已配置的公网服务器地址（“自动选择”）。": "When the phone is off-LAN, use the configured public server address (\"Auto\").",
  "手机在外网时，建议选“Cloudflare 外网”；当前命名 Tunnel 有固定域名。": "When the phone is off-LAN, choose \"Cloudflare\"; the named Tunnel has a fixed domain.",
  "手机在外网临时使用时，建议选“Cloudflare 外网”；Quick 地址变化后需要重新确认。": "For temporary off-LAN use, choose \"Cloudflare\"; a Quick address change requires re-confirmation.",
  "手机在外网时，无自有域名可开启 Quick Tunnel；有域名且需要固定地址可配置命名 Tunnel。": "Off-LAN without a domain, enable Quick Tunnel; with a domain and a fixed address, configure a named Tunnel.",
  "手机在外网时，若使用受支持的 Ubuntu/Debian 服务器且有固定公网 IPv4，可先配置“公网接入”，再选“自动选择”。": "Off-LAN on a supported Ubuntu/Debian server with a fixed public IPv4, configure \"Public access\" first, then choose \"Auto\".",
  "手机在外网时，需要一个可访问的 wss:// 地址；可在“手动输入地址”中填写。": "Off-LAN requires a reachable wss:// address; enter it under \"Manual address\".",
  "在线": "Online",
  "离线": "Offline",
  "最近连接：\u0000": "Last seen: \u0000",
  "尚未连接": "Never connected",
  "吊销 \u0000": "Revoke \u0000",
  "吊销中…": "Revoking...",
  "吊销": "Revoke",
  "已刷新 · \u0000": "Refreshed · \u0000",
  "当前浏览器不允许直接写入剪贴板，请选中文本后手动复制": "This browser does not allow direct clipboard writes; select the text and copy it manually",
  "关闭设备鉴权后，任何能访问移动网关的人都可以控制 DSH。此选项仅限 Debug 阶段使用，确定继续吗？": "Disabling device authentication lets anyone who can reach the mobile gateway control DSH. This is for Debug only. Continue?",
  "已吊销 \u0000": "Revoked \u0000",
  "吊销失败：\u0000": "Revoke failed: \u0000",
  "设备配对二维码": "Device pairing QR code",
  "关闭配对窗口": "Close pairing window",
  "使用移动客户端扫码": "Scan with the mobile client",
  "一次性设备配对二维码": "One-time device pairing QR code",
  "Base64URL 配对字符串": "Base64URL pairing string",
  "✓ 已复制": "✓ Copied",
  "复制配对 Token": "Copy pairing token",
  "已复制到剪贴板": "Copied to clipboard",
  "有效期至 \u0000；扫码成功后此二维码立即失效。": "Valid until \u0000; this QR is invalidated immediately after a successful scan.",
  "移动设备管理": "Mobile device management",
  "移动设备": "Mobile devices",
  "正在加载网关状态…": "Loading gateway status...",
  "移动网关已开启 · \u0000": "Mobile gateway on · \u0000",
  "设备鉴权已开启": "device authentication on",
  "本机设备鉴权已关闭": "local device authentication off",
  "移动网关已关闭 · 普通 WebUI 模式": "Mobile gateway off · normal WebUI mode",
  "关闭": "Off",
  "移动网关设置分组": "Mobile gateway settings group",
  "通用设置": "General",
  "连接与配对": "Connection & pairing",
  "可信设备": "Trusted devices",
  "关闭重启提醒": "Dismiss restart reminder",
  "关闭提醒": "Dismiss",
  "若安装或更新后连接异常，请重启应用": "If connections misbehave after install or update, restart the app",
  "完全退出并重启 APP／Desktop；Web UI 请重启 DSH Web 服务。": "Fully quit and restart the APP/Desktop; for the Web UI, restart the DSH Web service.",
  "端口仍被占用时，请关闭其他 Harness 实例。": "If the port is still in use, close other Harness instances.",
  "网关运行模式": "Gateway mode",
  "重启后保持开启": "Stay on after restart",
  "等待可信设备连接，约 \u0000 分钟后自动关闭": "Waiting for a trusted device; auto-off in ~\u0000 min",
  "设备已连接过，本次运行保持开启；重启后重新计时": "A device has connected; stays on for this run and the timer restarts after a restart",
  "不接受移动设备连接": "No mobile device connections",
  "临时开启": "Temporary",
  "常驻开启": "Persistent",
  "设备鉴权": "Device authentication",
  "已开启，仅允许可信设备连接": "On — only trusted devices may connect",
  "已关闭，仅影响本机 Debug 入口": "Off — affects only the local Debug entry",
  "关闭设备鉴权": "Disable device authentication",
  "开启设备鉴权": "Enable device authentication",
  "Debug 模式：本机 DSH 入口将跳过设备凭证校验；独立局域网入口仍强制鉴权。": "Debug mode: the local DSH entry skips device credential checks; the separate LAN entry still enforces authentication.",
  "配对连接方式": "Pairing route",
  "连接方式说明与场景建议": "Route descriptions and advice",
  "怎么选连接方式": "How to choose a route",
  "局域网直连": "LAN direct",
  "手机与 DSH 在同一个可互访的局域网，使用 ws:// 私有地址；离开该网络就无法直连。": "Phone and DSH on the same reachable LAN, using a private ws:// address; unreachable once off that network.",
  "Cloudflare Channel（命名 Tunnel）": "Cloudflare Channel (named Tunnel)",
  "PC 主动连接 Cloudflare，外网用固定域名的 wss://；需要 Cloudflare 账户和域名。": "The PC dials Cloudflare; off-LAN access uses a fixed-domain wss://; needs a Cloudflare account and domain.",
  "无需账户或域名，Cloudflare 分配临时 wss:// 地址；隧道重建后地址可能变化。": "No account or domain needed; Cloudflare assigns a temporary wss:// address that may change when the tunnel rebuilds.",
  "公网服务器连接": "Public server",
  "DSH 运行在有固定公网 IPv4 的 Linux 服务器上，配置公网入口后用 wss:// 公网 IP 连接。": "DSH runs on a Linux server with a fixed public IPv4; configure public access, then connect via wss:// to the public IP.",
  "结合当前环境": "Based on this environment",
  "面板无法判断手机当前网络；请按手机所在位置选择，提示不会替你修改选择。": "The panel cannot detect the phone’s network; choose based on where the phone is. Hints will not change the selection.",
  "自动选择 · 优先外网": "Auto · prefer off-LAN",
  "局域网直连 · 当前不可用": "LAN direct · currently unavailable",
  "Cloudflare 外网": "Cloudflare (off-LAN)",
  "手动输入地址": "Manual address",
  "外网使用 Cloudflare Tunnel 进行连接，请在下方进行设置。": "Off-LAN connections use Cloudflare Tunnel; configure it below.",
  "WebSocket 地址": "WebSocket address",
  "局域网监听失败：\u0000": "LAN listener failed: \u0000",
  "局域网入口已开启\u0000": "LAN entry on\u0000",
  "，端口 \u0000": ", port \u0000",
  "局域网入口启动中…": "LAN entry starting...",
  "正在生成…": "Generating...",
  "请先开启移动网关": "Enable the mobile gateway first",
  "等待连接地址": "Waiting for an address",
  "生成配对二维码": "Generate pairing QR",
  "配对码仅可使用一次，5 分钟内有效。": "The pairing code is single-use and valid for 5 minutes.",
  "Cloudflare Tunnel · 外网接入": "Cloudflare Tunnel · off-LAN access",
  "首次开启自动准备 Tunnel 组件。": "Enabling it prepares the Tunnel component automatically.",
  "接入方式": "Access method",
  "Cloudflare 接入方式": "Cloudflare access method",
  "Quick Tunnel · 无需域名": "Quick Tunnel · no domain",
  "命名 Tunnel · 固定域名": "Named Tunnel · fixed domain",
  "临时地址可能变化，变化后需重新扫码。": "The temporary address may change; re-scan after a change.",
  "先在 Cloudflare 创建命名 Tunnel，把公开域名的 Service URL 设为 ": "Create a named Tunnel in Cloudflare first, set the public hostname’s Service URL to ",
  "。Tunnel Token 仅授权连接，不能自动创建公开主机名或 DNS；还需确认域名存在指向 Tunnel UUID.cfargotunnel.com 的已代理 CNAME 记录。": ". The Tunnel Token only authorises the connection; it cannot create public hostnames or DNS. Also confirm a proxied CNAME for the domain points to <Tunnel UUID>.cfargotunnel.com.",
  "公开域名": "Public hostname",
  "已保存；留空则保持原 Token": "Saved; leave blank to keep the current token",
  "粘贴 eyJ… Token": "Paste eyJ... token",
  "正在处理…": "Working...",
  "保存并连接": "Save and connect",
  "一键开启 Quick Tunnel": "Enable Quick Tunnel",
  "开启命名 Tunnel": "Enable named Tunnel",
  "检测公网 DNS / TLS / WebSocket": "Check public DNS / TLS / WebSocket",
  "重启 Tunnel": "Restart Tunnel",
  "关闭 Cloudflare Tunnel": "Disable Cloudflare Tunnel",
  "重启会短暂断开连接。": "Restarting briefly drops connections.",
  "未开启": "Off",
  "正在启动本机入口…": "Starting local entry...",
  "正在准备 cloudflared（首次需下载）…": "Preparing cloudflared (downloads on first use)...",
  "正在连接 Cloudflare…": "Connecting to Cloudflare...",
  "隧道传输已连接（不等于公网入口可达）": "Tunnel transport connected (does not mean the public entry is reachable)",
  "等待移动网关开启": "Waiting for the mobile gateway",
  "（检测时间：\u0000）": "(checked at \u0000)",
  "公网接入": "Public access",
  "正在检查系统组件…": "Checking system components...",
  "端口需要更新：Nginx 当前为 \u0000，DSH 当前为 \u0000": "Port update needed: Nginx is \u0000, DSH is \u0000",
  "已配置\u0000": "Configured\u0000",
  "，Nginx 转发至 DSH 端口 \u0000": ", Nginx forwards to DSH port \u0000",
  "Helper 已就绪，将自动使用当前 DSH 端口\u0000": "Helper ready; will use the current DSH port automatically\u0000",
  "服务器公网 IPv4": "Server public IPv4",
  "正在配置 Nginx 与证书…": "Configuring Nginx and certificates...",
  "更新公网配置": "Update public config",
  "配置公网接入": "Configure public access",
  "尚未安装系统 Helper。请在服务器执行一次初始化：": "System Helper is not installed. Run the one-time init on the server:",
  "刷新中…": "Refreshing...",
  "刷新": "Refresh",
  "加载中…": "Loading...",
  "暂无已配对设备。": "No paired devices yet.",
  "当前没有在线设备。": "No devices online.",
  "收起离线设备": "Hide offline devices",
  "展开其他已配对设备（\u0000）": "Show other paired devices (\u0000)",
  "插件版本 \u0000": "Plugin version \u0000",
  "运行中": "Running",
  "已停止": "Stopped",
  "连接中": "Connecting",
  "异常": "Error",
  "已开启": "On",
  "已关闭": "Off",
  "\u0000 台在线": "\u0000 online"
}
    const JA_UI = {
  "正在读取网关环境…": "ゲートウェイ環境を読み取り中…",
  "macOS 电脑": "macOS コンピュータ",
  "Windows 电脑": "Windows コンピュータ",
  "Linux 服务器": "Linux サーバー",
  "当前设备": "このデバイス",
  "当前检测：\u0000；局域网入口\u0000；\u0000。": "現在の検出結果：\u0000；LAN 入口\u0000；\u0000。",
  "已就绪": "準備完了",
  "未就绪": "未準備",
  "公网服务器入口已配置": "パブリックサーバーの入口が設定済みです",
  "\u0000 Tunnel 已连接": "\u0000 Tunnel が接続されています",
  "命名": "名前付き",
  "隧道已连接，公网入口未验证或检测失败": "トンネルは接続されていますが、パブリック入口は未検証か検出に失敗しました",
  "Cloudflare Tunnel 连接中": "Cloudflare Tunnel に接続中",
  "外网入口未连接": "外部入口が接続されていません",
  "手机与 DSH 处于可互访的同一局域网时，建议选“局域网直连”。": "スマホと DSH が互いに到達できる同じ LAN にある場合は、「LAN 直接接続」がおすすめです。",
  "如果手机和 DSH 在同一局域网，先确认局域网入口已开启并监听成功。": "スマホと DSH が同じ LAN にある場合は、まず LAN 入口が有効で待ち受けできていることを確認してください。",
  "手机在外网时，建议使用已配置的公网服务器地址（“自动选择”）。": "スマホが外部ネットワークにある場合は、設定済みのパブリックサーバーアドレスの使用がおすすめです（「自動選択」）。",
  "手机在外网时，建议选“Cloudflare 外网”；当前命名 Tunnel 有固定域名。": "スマホが外部ネットワークにある場合は、「Cloudflare 外部」がおすすめです。現在の名前付き Tunnel には固定ドメインがあります。",
  "手机在外网临时使用时，建议选“Cloudflare 外网”；Quick 地址变化后需要重新确认。": "スマホを外部ネットワークで一時的に使う場合は、「Cloudflare 外部」がおすすめです。Quick アドレスが変わったら再確認が必要です。",
  "手机在外网时，无自有域名可开启 Quick Tunnel；有域名且需要固定地址可配置命名 Tunnel。": "スマホが外部ネットワークにあり、独自ドメインがなければ Quick Tunnel を有効化できます。ドメインがあり固定アドレスが必要な場合は名前付き Tunnel を設定してください。",
  "手机在外网时，若使用受支持的 Ubuntu/Debian 服务器且有固定公网 IPv4，可先配置“公网接入”，再选“自动选择”。": "スマホが外部ネットワークにあり、対応している Ubuntu/Debian サーバーで固定のパブリック IPv4 を使う場合は、先に「パブリックアクセス」を設定してから「自動選択」を選んでください。",
  "手机在外网时，需要一个可访问的 wss:// 地址；可在“手动输入地址”中填写。": "スマホが外部ネットワークにある場合は、到達できる wss:// アドレスが必要です。「アドレスを手動入力」に記入できます。",
  "在线": "オンライン",
  "离线": "オフライン",
  "最近连接：\u0000": "最終接続：\u0000",
  "尚未连接": "まだ接続されていません",
  "吊销 \u0000": "\u0000 を取り消す",
  "吊销中…": "取り消し中…",
  "吊销": "取り消し",
  "已刷新 · \u0000": "更新済み · \u0000",
  "当前浏览器不允许直接写入剪贴板，请选中文本后手动复制": "このブラウザではクリップボードへの直接書き込みができません。テキストを選択して手動でコピーしてください",
  "关闭设备鉴权后，任何能访问移动网关的人都可以控制 DSH。此选项仅限 Debug 阶段使用，确定继续吗？": "デバイス認証を無効にすると、モバイルゲートウェイに到達できる人は誰でも DSH を制御できてしまいます。このオプションは Debug 段階専用です。続行しますか？",
  "已吊销 \u0000": "\u0000 を取り消しました",
  "吊销失败：\u0000": "取り消しに失敗しました：\u0000",
  "设备配对二维码": "デバイスペアリング用 QR コード",
  "关闭配对窗口": "ペアリングウィンドウを閉じる",
  "使用移动客户端扫码": "モバイルクライアントでスキャン",
  "一次性设备配对二维码": "ワンタイムのデバイスペアリング用 QR コード",
  "Base64URL 配对字符串": "Base64URL ペアリング文字列",
  "✓ 已复制": "✓ コピーしました",
  "复制配对 Token": "ペアリング Token をコピー",
  "已复制到剪贴板": "クリップボードにコピーしました",
  "有效期至 \u0000；扫码成功后此二维码立即失效。": "有効期限は \u0000 までです。スキャンが成功すると、この QR コードは直ちに無効になります。",
  "移动设备管理": "モバイルデバイス管理",
  "移动设备": "モバイルデバイス",
  "正在加载网关状态…": "ゲートウェイの状態を読み込み中…",
  "移动网关已开启 · \u0000": "モバイルゲートウェイはオンです · \u0000",
  "设备鉴权已开启": "デバイス認証はオンです",
  "本机设备鉴权已关闭": "このマシンのデバイス認証はオフです",
  "移动网关已关闭 · 普通 WebUI 模式": "モバイルゲートウェイはオフです · 通常の WebUI モード",
  "关闭": "オフ",
  "移动网关设置分组": "モバイルゲートウェイ設定グループ",
  "通用设置": "一般設定",
  "连接与配对": "接続とペアリング",
  "可信设备": "信頼済みデバイス",
  "关闭重启提醒": "再起動リマインダーを閉じる",
  "关闭提醒": "リマインダーを閉じる",
  "若安装或更新后连接异常，请重启应用": "インストールや更新の後に接続がおかしい場合は、アプリを再起動してください",
  "完全退出并重启 APP／Desktop；Web UI 请重启 DSH Web 服务。": "APP／Desktop は完全に終了して再起動してください。Web UI の場合は DSH Web サービスを再起動してください。",
  "端口仍被占用时，请关闭其他 Harness 实例。": "ポートがまだ使用中の場合は、他の Harness インスタンスを閉じてください。",
  "网关运行模式": "ゲートウェイの動作モード",
  "重启后保持开启": "再起動後もオンのままにする",
  "等待可信设备连接，约 \u0000 分钟后自动关闭": "信頼済みデバイスの接続を待っています。約 \u0000 分後に自動でオフになります",
  "设备已连接过，本次运行保持开启；重启后重新计时": "デバイスが接続したことがあるため、今回はオンのままです。再起動後にタイマーはリセットされます",
  "不接受移动设备连接": "モバイルデバイスの接続を受け付けません",
  "临时开启": "一時的にオン",
  "常驻开启": "常時オン",
  "设备鉴权": "デバイス認証",
  "已开启，仅允许可信设备连接": "オン — 信頼済みデバイスのみ接続できます",
  "已关闭，仅影响本机 Debug 入口": "オフ — このマシンの Debug 入口にのみ影響します",
  "关闭设备鉴权": "デバイス認証を無効化",
  "开启设备鉴权": "デバイス認証を有効化",
  "Debug 模式：本机 DSH 入口将跳过设备凭证校验；独立局域网入口仍强制鉴权。": "Debug モード：このマシンの DSH 入口ではデバイス資格情報の検証をスキップします。独立した LAN 入口では引き続き認証が必須です。",
  "配对连接方式": "ペアリングの接続方法",
  "连接方式说明与场景建议": "接続方法の説明とシナリオ別のおすすめ",
  "怎么选连接方式": "接続方法の選び方",
  "局域网直连": "LAN 直接接続",
  "手机与 DSH 在同一个可互访的局域网，使用 ws:// 私有地址；离开该网络就无法直连。": "スマホと DSH が互いに到達できる同じ LAN にあり、プライベートな ws:// アドレスを使います。そのネットワークを離れると直接接続はできません。",
  "Cloudflare Channel（命名 Tunnel）": "Cloudflare Channel（名前付き Tunnel）",
  "PC 主动连接 Cloudflare，外网用固定域名的 wss://；需要 Cloudflare 账户和域名。": "PC から Cloudflare へ接続し、外部からは固定ドメインの wss:// を使います。Cloudflare アカウントとドメインが必要です。",
  "无需账户或域名，Cloudflare 分配临时 wss:// 地址；隧道重建后地址可能变化。": "アカウントやドメインは不要です。Cloudflare が一時的な wss:// アドレスを割り当てます。トンネルが再構築されるとアドレスが変わることがあります。",
  "公网服务器连接": "パブリックサーバー接続",
  "DSH 运行在有固定公网 IPv4 的 Linux 服务器上，配置公网入口后用 wss:// 公网 IP 连接。": "DSH が固定のパブリック IPv4 を持つ Linux サーバーで動いています。パブリック入口を設定した後、wss:// のパブリック IP で接続します。",
  "结合当前环境": "現在の環境に基づいて",
  "面板无法判断手机当前网络；请按手机所在位置选择，提示不会替你修改选择。": "パネルはスマホの現在のネットワークを判定できません。スマホの場所に合わせて選んでください。ヒントが選択を勝手に変えることはありません。",
  "自动选择 · 优先外网": "自動選択 · 外部を優先",
  "局域网直连 · 当前不可用": "LAN 直接接続 · 現在は利用できません",
  "Cloudflare 外网": "Cloudflare 外部",
  "手动输入地址": "アドレスを手動入力",
  "外网使用 Cloudflare Tunnel 进行连接，请在下方进行设置。": "外部からは Cloudflare Tunnel で接続します。下で設定してください。",
  "WebSocket 地址": "WebSocket アドレス",
  "局域网监听失败：\u0000": "LAN の待ち受けに失敗しました：\u0000",
  "局域网入口已开启\u0000": "LAN 入口はオンです\u0000",
  "，端口 \u0000": "、ポート \u0000",
  "局域网入口启动中…": "LAN 入口を起動中…",
  "正在生成…": "生成中…",
  "请先开启移动网关": "先にモバイルゲートウェイをオンにしてください",
  "等待连接地址": "接続アドレスを待っています",
  "生成配对二维码": "ペアリング用 QR コードを生成",
  "配对码仅可使用一次，5 分钟内有效。": "ペアリングコードは 1 回のみ使用でき、有効期限は 5 分間です。",
  "Cloudflare Tunnel · 外网接入": "Cloudflare Tunnel · 外部アクセス",
  "首次开启自动准备 Tunnel 组件。": "有効にすると Tunnel コンポーネントが自動で準備されます。",
  "接入方式": "アクセス方法",
  "Cloudflare 接入方式": "Cloudflare のアクセス方法",
  "Quick Tunnel · 无需域名": "Quick Tunnel · ドメイン不要",
  "命名 Tunnel · 固定域名": "名前付き Tunnel · 固定ドメイン",
  "临时地址可能变化，变化后需重新扫码。": "一時アドレスは変わることがあります。変わった場合は再度スキャンしてください。",
  "先在 Cloudflare 创建命名 Tunnel，把公开域名的 Service URL 设为 ": "まず Cloudflare で名前付き Tunnel を作成し、公開ホスト名の Service URL を次に設定してください：",
  "。Tunnel Token 仅授权连接，不能自动创建公开主机名或 DNS；还需确认域名存在指向 Tunnel UUID.cfargotunnel.com 的已代理 CNAME 记录。": "。Tunnel Token は接続の認可にのみ使われ、公開ホスト名や DNS を自動で作成することはできません。ドメインに、Tunnel UUID.cfargotunnel.com を指すプロキシ済み CNAME レコードがあることも確認してください。",
  "公开域名": "公開ドメイン",
  "已保存；留空则保持原 Token": "保存済み。空欄にすると現在の Token のままになります",
  "粘贴 eyJ… Token": "eyJ… Token を貼り付け",
  "正在处理…": "処理中…",
  "保存并连接": "保存して接続",
  "一键开启 Quick Tunnel": "Quick Tunnel をワンクリックで有効化",
  "开启命名 Tunnel": "名前付き Tunnel を有効化",
  "检测公网 DNS / TLS / WebSocket": "パブリック DNS / TLS / WebSocket を検出",
  "重启 Tunnel": "Tunnel を再起動",
  "关闭 Cloudflare Tunnel": "Cloudflare Tunnel を無効化",
  "重启会短暂断开连接。": "再起動すると接続が短時間切断されます。",
  "未开启": "オフ",
  "正在启动本机入口…": "このマシンの入口を起動中…",
  "正在准备 cloudflared（首次需下载）…": "cloudflared を準備中（初回はダウンロードが必要です）…",
  "正在连接 Cloudflare…": "Cloudflare に接続中…",
  "隧道传输已连接（不等于公网入口可达）": "トンネルの転送は接続されています（パブリック入口に到達できることとは別です）",
  "等待移动网关开启": "モバイルゲートウェイがオンになるのを待っています",
  "（检测时间：\u0000）": "（検出時刻：\u0000）",
  "公网接入": "パブリックアクセス",
  "正在检查系统组件…": "システムコンポーネントを確認中…",
  "端口需要更新：Nginx 当前为 \u0000，DSH 当前为 \u0000": "ポートの更新が必要です：Nginx は現在 \u0000、DSH は現在 \u0000",
  "已配置\u0000": "設定済み\u0000",
  "，Nginx 转发至 DSH 端口 \u0000": "、Nginx は DSH のポート \u0000 へ転送します",
  "Helper 已就绪，将自动使用当前 DSH 端口\u0000": "Helper の準備ができています。現在の DSH ポートを自動で使います\u0000",
  "服务器公网 IPv4": "サーバーのパブリック IPv4",
  "正在配置 Nginx 与证书…": "Nginx と証明書を設定中…",
  "更新公网配置": "パブリック設定を更新",
  "配置公网接入": "パブリックアクセスを設定",
  "尚未安装系统 Helper。请在服务器执行一次初始化：": "システム Helper がまだインストールされていません。サーバーで初期化を 1 回実行してください：",
  "刷新中…": "更新中…",
  "刷新": "更新",
  "加载中…": "読み込み中…",
  "暂无已配对设备。": "ペアリング済みのデバイスはまだありません。",
  "当前没有在线设备。": "現在オンラインのデバイスはありません。",
  "收起离线设备": "オフラインのデバイスを隠す",
  "展开其他已配对设备（\u0000）": "他のペアリング済みデバイスを表示（\u0000）",
  "插件版本 \u0000": "プラグインのバージョン \u0000",
  "运行中": "実行中",
  "已停止": "停止中",
  "连接中": "接続中",
  "异常": "エラー",
  "已开启": "オン",
  "已关闭": "オフ",
  "\u0000 台在线": "\u0000 台がオンライン"
}
    function tr(strings, ...values) {
      const dict = UI_LOCALE === 'en' ? EN_UI : UI_LOCALE === 'ja' ? JA_UI : undefined
      if (typeof strings === 'string') return dict ? (dict[strings] ?? strings) : strings
      const key = strings.raw.join('\u0000')
      const translated = dict ? dict[key] : undefined
      if (translated === undefined) {
        return strings.reduce((acc, part, index) => acc + part + (index < values.length ? String(values[index]) : ''), '')
      }
      let next = 0
      return translated.replace(/\u0000/g, () => {
        const value = values[next++]
        return value === undefined ? '' : String(value)
      })
    }

    // Language is a *runtime* value here, not a boot-time constant: DSH writes
    // the active language into `<html lang>` and may change it while we are
    // mounted (Settings → General → Language). We watch that attribute and
    // re-resolve, so the panel follows the host live instead of staying stuck on
    // whatever locale was current when the bundle first evaluated.
    //
    // A MutationObserver on `<html lang>` is used rather than injecting the host's
    // `locale` service: this bundle also ships to plain-Web and older hosts that
    // have no such service, and the attribute is the one contract all of them
    // share. It is also exactly the source we read in `readHostLocale()`.
    const localeListeners = new Set()
    const notifyLocale = () => {
      const next = resolveLocale()
      if (next === UI_LOCALE) return
      UI_LOCALE = next
      for (const listener of localeListeners) {
        try { listener() } catch { /* a broken listener must not stop the others */ }
      }
    }
    const subscribeLocale = (listener) => {
      localeListeners.add(listener)
      return () => { localeListeners.delete(listener) }
    }
    const getLocale = () => UI_LOCALE
    const watchHostLocale = () => {
      try {
        const observer = new MutationObserver(notifyLocale)
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] })
        return () => observer.disconnect()
      } catch { return () => {} }
    }

    // Shared Web UI / Desktop semantic tokens update with the host theme.
    const restartNoticeStorageKey = 'mobile-gateway-dismissed-restart-notice'
    let dismissedRestartInstance = null
    try { dismissedRestartInstance = window.localStorage.getItem(restartNoticeStorageKey) } catch { /* storage unavailable */ }

    const colors = {
      panel: 'var(--dsw-alias-bg-layer-2, var(--color-bg, Canvas))',
      card: 'var(--dsw-alias-bg-module-platform, var(--color-bg-elevated, Canvas))',
      text: 'var(--dsw-alias-label-primary, var(--color-text, CanvasText))',
      muted: 'var(--dsw-alias-label-secondary, var(--color-text-muted, GrayText))',
      border: 'var(--dsw-alias-border-l3, var(--color-border, rgba(127,127,127,.24)))',
      accent: 'var(--dsw-alias-button-primary-fill, var(--color-primary, #4f7cff))',
      accentText: 'var(--dsw-alias-label-primary-foreground, #fff)',
      danger: 'var(--dsw-alias-state-error-primary, #dc4c64)',
      success: 'var(--dsw-alias-state-success-primary, #2fb171)',
    }
    const styles = {
      backdrop: {
        position: 'fixed', inset: 0, zIndex: 1200, pointerEvents: 'auto',
        background: 'var(--dsw-alias-bg-mask-1, rgba(0,0,0,.32))', display: 'flex',
        justifyContent: 'center', alignItems: 'center',
        padding: 'max(16px, var(--dsh-frame-overlay-top, 16px)) 16px', boxSizing: 'border-box',
      },
      // 面板现在是 main pane 里的页面（portal drp-page 同构）：容器透明、随页滚动，
      // 弹窗观感只留给配对二维码 dialog（它在挂载点补回 panel 观感字段）。
      panel: {
        width: '100%', maxWidth: '1040px', flex: 1, minHeight: 0,
        display: 'flex', flexDirection: 'column',
        background: 'transparent', color: colors.text, border: 0, padding: 0,
        fontFamily: 'var(--dsw-font-family, system-ui, sans-serif)', fontSize: 13, boxSizing: 'border-box',
      },
      headerTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', minWidth: 0, marginBottom: 12 },
      subtitle: { margin: 0, fontSize: 12.5, lineHeight: 1.5, color: colors.muted, maxWidth: '74ch', marginBottom: 16 },
      card: { background: 'var(--dsw-alias-bg-layer-2, var(--color-bg-elevated, Canvas))', border: '1px solid var(--dsw-alias-border-l2, var(--color-border, rgba(127,127,127,.18)))', borderRadius: 12, padding: 16, marginBottom: 16, flexShrink: 0, minWidth: 0 },
      label: { display: 'block', color: colors.muted, fontSize: 12, marginBottom: 6 },
      input: { width: '100%', boxSizing: 'border-box', border: `1px solid ${colors.border}`, borderRadius: 10, padding: '8px 12px', marginBottom: 8, background: colors.card, color: 'inherit', outline: 'none' },
      pairingText: { width: '100%', minHeight: 86, boxSizing: 'border-box', resize: 'vertical', border: `1px solid ${colors.border}`, borderRadius: 8, padding: '9px 10px', margin: '10px 0', background: 'transparent', color: 'inherit', outline: 'none', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 11, lineHeight: 1.45, overflowWrap: 'anywhere' },
      button: { cursor: 'pointer', border: `1px solid ${colors.border}`, background: 'transparent', borderRadius: 8, padding: '7px 11px', color: 'inherit', font: 'inherit' },
      headerButton: { width: 34, height: 34, boxSizing: 'border-box', border: 0, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
      primary: { background: colors.accent, color: colors.accentText, borderColor: colors.accent, width: '100%' },
      muted: { color: colors.muted, fontSize: 12, lineHeight: 1.45 },
      row: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', columnGap: 12, alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${colors.border}` },
      badge: { display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, marginLeft: 8, color: colors.muted },
      dot: { width: 7, height: 7, borderRadius: 99, display: 'inline-block' },
      qr: { display: 'block', width: 220, height: 220, margin: '12px auto', background: '#fff', borderRadius: 10, padding: 8 },
      helpButton: { width: 20, height: 20, boxSizing: 'border-box', padding: 0, borderRadius: '50%', border: 0, background: 'var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,.1))', color: 'var(--dsw-alias-label-tertiary, #888)', cursor: 'help', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 600, lineHeight: 1 },
      helpBubble: { position: 'absolute', top: '100%', left: 0, zIndex: 20, width: 'min(300px, calc(100vw - 88px))', maxHeight: 'min(440px, calc(100vh - 160px))', overflowY: 'auto', boxSizing: 'border-box', padding: 12, borderRadius: 10, border: `1px solid ${colors.border}`, background: colors.panel, color: colors.text, boxShadow: '0 12px 28px rgba(0,0,0,.35)', fontSize: 12, lineHeight: 1.5 },
      switch: { position: 'relative', display: 'inline-flex', width: 42, height: 24, flexShrink: 0 },
      switchInput: { position: 'absolute', opacity: 0, width: 1, height: 1 },
      switchTrack: { position: 'absolute', inset: 0, borderRadius: 99, transition: 'background .18s ease', cursor: 'pointer' },
      switchKnob: { position: 'absolute', top: 3, width: 18, height: 18, borderRadius: 99, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.35)', transition: 'left .18s ease', pointerEvents: 'none' },
      version: { flexShrink: 0, marginTop: 'auto', padding: '18px 2px 0', color: colors.muted, fontSize: 11, lineHeight: 1.4, textAlign: 'right', letterSpacing: '.02em' },
    }

    const panelCss = `
      @keyframes mgw-pairing-enter {
        from { opacity: 0; transform: scale(.82); }
        to { opacity: 1; transform: scale(1); }
      }
      .mgw-pairing-dialog {
        transform-origin: center;
        animation: mgw-pairing-enter 240ms cubic-bezier(.2, .8, .2, 1);
      }
      @keyframes mgw-pairing-exit {
        from { opacity: 1; transform: scale(1); }
        to { opacity: 0; transform: scale(.82); }
      }
      .mgw-pairing-dialog[data-closing="true"] {
        animation: mgw-pairing-exit 180ms ease-in forwards;
        pointer-events: none;
      }
      @media (prefers-reduced-motion: reduce) {
        .mgw-pairing-dialog { animation: none; }
      }
      .mobile-gateway-panel, .mobile-gateway-panel *, .mgw-pairing-dialog, .mgw-pairing-dialog *, .mgw-select-menu {
        scrollbar-width: none !important;
        -ms-overflow-style: none;
      }
      .mobile-gateway-panel::-webkit-scrollbar, .mobile-gateway-panel *::-webkit-scrollbar,
      .mgw-pairing-dialog::-webkit-scrollbar, .mgw-pairing-dialog *::-webkit-scrollbar, .mgw-select-menu::-webkit-scrollbar {
        display: none !important;
        width: 0;
        height: 0;
      }
      /* portal drp-tabbar 同构：nav 是内容上方的水平 tab 条（下划线选中），
         不再是左栏竖排。窄屏 tab 条自身可横滚（不换行、不挤压），页面级不溢出。 */
      .mobile-gateway-panel .mgw-body { display: flex; flex-direction: column; flex: 1; min-height: 0; }
      .mobile-gateway-panel .mgw-nav { display: flex; flex-direction: row; flex-wrap: nowrap; align-items: flex-end; gap: 2px; margin: 0 0 16px; border-bottom: 1px solid var(--dsw-alias-border-l2, var(--color-border, rgba(127,127,127,.18))); overflow-x: auto; scrollbar-width: none; overscroll-behavior-x: contain; }
      .mobile-gateway-panel .mgw-nav::-webkit-scrollbar { display: none; }
      .mobile-gateway-panel .mgw-nav button { appearance: none; -webkit-appearance: none; background: none; border: 0; border-bottom: 2px solid transparent; margin: 0 0 -1px; padding: 9px 14px; font: inherit; font-size: 13.5px; line-height: 20px; color: var(--dsw-alias-label-secondary, var(--color-text-muted, GrayText)); cursor: pointer; white-space: nowrap; display: inline-flex; align-items: center; gap: 7px; flex-shrink: 0; transition: color .15s ease, border-color .15s ease; }
      .mobile-gateway-panel .mgw-nav button[aria-current="page"] { color: var(--dsw-alias-link, #4176e6); border-bottom-color: var(--dsw-alias-link, #4176e6); font-weight: 500; background: none; }
      .mobile-gateway-panel .mgw-nav button:hover { color: inherit; background: none; }
      .mobile-gateway-panel .mgw-nav button:focus-visible { outline: 2px solid var(--dsw-alias-link, #4176e6); outline-offset: -2px; border-radius: 6px; }
      .mobile-gateway-panel .mgw-content { min-width: 0; overflow-y: auto; scrollbar-width: none; padding-right: 4px; }
      .mobile-gateway-panel .mgw-content::-webkit-scrollbar { display: none; }
      .mobile-gateway-panel .mgw-content p { margin: 6px 0 10px; }
      .mobile-gateway-panel strong { font-weight: 550; }
      /* portal（dsh-remote-portal）视觉规格：卡片化区块 + 状态 pill + chip。 */
      /* portal drp-page 同构：main pane 里的页面容器 */
      .mgw-page { height: 100%; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: none; }
      .mgw-page::-webkit-scrollbar { display: none; }
      .mgw-page-inner { max-width: 1040px; margin: 0 auto; padding: 20px 24px 32px; display: flex; flex-direction: column; gap: 12px; }
      .mgw-page-head { display: flex; flex-direction: column; gap: 4px; }
      .mgw-page-title { margin: 0; font-size: 17px; font-weight: 600; letter-spacing: -.01em; color: inherit; }
      @media (max-width: 640px) { .mgw-page-inner { padding: 14px 14px 24px; } }
      .mobile-gateway-panel .mgw-card-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
      .mobile-gateway-panel .mgw-card-title { margin: 0; font-size: 13.5px; font-weight: 600; line-height: 1.4; color: inherit; }
      .mobile-gateway-panel .mgw-card-note { margin: 0 0 12px; font-size: 12px; line-height: 1.5; color: var(--dsw-alias-label-tertiary, var(--color-text-muted, GrayText)); }
      .mobile-gateway-panel .mgw-chip { display: inline-flex; align-items: center; height: 22px; padding: 0 8px; border-radius: 999px; border: 1px solid var(--dsw-alias-border-l2, var(--color-border, rgba(127,127,127,.18))); font-size: 11.5px; line-height: 1; color: var(--dsw-alias-label-secondary, var(--color-text-muted, GrayText)); white-space: nowrap; flex: none; }
      .mobile-gateway-panel .mgw-chip[data-tone="ok"] { color: var(--dsw-alias-state-success-primary, #2fb171); border-color: color-mix(in srgb, var(--dsw-alias-state-success-primary, #2fb171) 35%, transparent); }
      .mobile-gateway-panel .mgw-chip[data-tone="warn"] { color: var(--dsw-alias-state-error-primary, #dc4c64); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #dc4c64) 35%, transparent); }
      .mobile-gateway-panel .mgw-pill { display: inline-flex; align-items: center; gap: 6px; height: 26px; padding: 0 10px; border-radius: 999px; border: 1px solid var(--dsw-alias-border-l2, var(--color-border, rgba(127,127,127,.18))); font-size: 12px; font-weight: 500; white-space: nowrap; color: var(--dsw-alias-label-secondary, var(--color-text-muted, GrayText)); flex: none; }
      .mobile-gateway-panel .mgw-pill-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; flex: none; }
      .mobile-gateway-panel .mgw-pill[data-state="running"] { color: var(--dsw-alias-state-success-primary, #2fb171); }
      .mobile-gateway-panel .mgw-pill[data-state="running"] .mgw-pill-dot { box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-state-success-primary, #2fb171) 16%, transparent); }
      .mobile-gateway-panel .mgw-pill[data-state="error"] { color: var(--dsw-alias-state-error-primary, #dc4c64); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #dc4c64) 35%, transparent); }
      .mobile-gateway-panel .mgw-pill[data-state="loading"] .mgw-pill-dot { animation: mgw-pill-pulse 1.4s ease-in-out infinite; }
      @keyframes mgw-pill-pulse { 0%, 100% { opacity: .35; } 50% { opacity: 1; } }
      .mobile-gateway-panel .mgw-alert { display: flex; align-items: flex-start; gap: 8px; padding: 9px 12px; border-radius: 10px; border: 1px solid var(--dsw-alias-border-l2, var(--color-border, rgba(127,127,127,.18))); background: var(--dsw-alias-bg-layer-1, transparent); font-size: 12.5px; line-height: 1.5; color: var(--dsw-alias-label-secondary, var(--color-text-muted, GrayText)); margin-bottom: 12px; min-width: 0; }
      .mobile-gateway-panel .mgw-alert[data-tone="error"] { color: var(--dsw-alias-state-error-primary, #dc4c64); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #dc4c64) 35%, transparent); background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #dc4c64) 7%, transparent); }
      .mobile-gateway-panel .mgw-setting-row { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; margin-bottom: 12px; }
      .mobile-gateway-panel .mgw-setting-row select { width: auto !important; max-width: 100%; min-width: 150px; margin-bottom: 0 !important; flex-shrink: 1; }
      .mobile-gateway-panel .mgw-cloudflare-block input, .mobile-gateway-panel .mgw-cloudflare-block .mgw-select-trigger { background: var(--dsw-alias-bg-layer-2, Canvas) !important; }
      .mobile-gateway-panel .mgw-setting-label { font-size: 14px; font-weight: 550; color: inherit; }

      .mobile-gateway-panel input:focus-visible, .mobile-gateway-panel select:focus-visible, .mobile-gateway-panel button:focus-visible { outline: 2px solid var(--dsw-alias-label-primary, currentColor); outline-offset: 2px; }
      /* 窄屏：tab 条不换行、自身可横滚（见 .mgw-nav 的 overflow-x:auto），无降级双栏规则。 */
    `

    function GatewaySelect({ style, children, value, onChange, disabled, ...props }) {
      const options = React.Children.toArray(children).filter((child) => React.isValidElement(child))
      const [menu, setMenu] = React.useState(null)
      const [active, setActive] = React.useState(0)
      const buttonRef = React.useRef(null)
      const menuRef = React.useRef(null)
      const menuId = React.useId()
      const selected = options.find((option) => option.props.value === value)
      const enabled = options.map((option, index) => option.props.disabled ? -1 : index).filter((index) => index >= 0)
      const close = (restoreFocus = false) => {
        setMenu(null)
        if (restoreFocus) buttonRef.current?.focus()
      }
      const openMenu = () => {
        if (disabled) return
        const rect = buttonRef.current.getBoundingClientRect()
        const computed = window.getComputedStyle(buttonRef.current)
        const fontSize = parseFloat(computed.fontSize) || 14
        const lineHeight = parseFloat(computed.lineHeight) || fontSize * 1.5
        const measure = document.createElement('canvas').getContext('2d')
        if (measure) measure.font = computed.font || `${fontSize}px sans-serif`
        const longest = Math.max(...options.map((option) => measure
          ? measure.measureText(String(option.props.children)).width : String(option.props.children).length * fontSize))
        const height = Math.min(options.length * Math.max(40, lineHeight + 16) + 14, window.innerHeight - 24)
        const width = Math.min(Math.max(rect.width, longest + 72, 200), window.innerWidth - 24)
        setActive(Math.max(0, options.findIndex((option) => option.props.value === value && !option.props.disabled)))
        setMenu({ left: Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)),
          top: Math.max(12, rect.bottom + height + 6 <= window.innerHeight - 12 ? rect.bottom + 6 : rect.top - height - 6), width, maxHeight: window.innerHeight - 24 })
      }
      const choose = (index) => {
        const option = options[index]
        if (!option || option.props.disabled) return
        onChange?.({ target: { value: option.props.value } })
        close(true)
      }
      React.useEffect(() => {
        if (!menu) return
        menuRef.current?.focus()
        const outside = (event) => {
          if (!buttonRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) close()
        }
        const scrolled = (event) => { if (!menuRef.current?.contains(event.target)) close() }
        const resized = () => close()
        document.addEventListener('pointerdown', outside)
        document.addEventListener('scroll', scrolled, true)
        window.addEventListener('resize', resized)
        return () => {
          document.removeEventListener('pointerdown', outside)
          document.removeEventListener('scroll', scrolled, true)
          window.removeEventListener('resize', resized)
        }
      }, [menu])
      React.useEffect(() => {
        if (menu) document.getElementById(`${menuId}-${active}`)?.scrollIntoView({ block: 'nearest' })
      }, [active, menu])
      return React.createElement('span', { style: { display: 'inline-flex', maxWidth: '100%', minWidth: 0 } },
        React.createElement('button', { ...props, className: 'mgw-select-trigger', ref: buttonRef, type: 'button', disabled,
          'aria-haspopup': 'listbox', 'aria-expanded': !!menu, 'aria-controls': menu ? menuId : undefined,
          onClick: () => menu ? close() : openMenu(),
          onKeyDown: (event) => {
            if (['ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); openMenu() }
          },
          style: { ...style, width: 'auto', maxWidth: '100%', marginBottom: 0, border: 0, borderRadius: 12,
            padding: '10px 16px', background: colors.card, color: colors.text, font: 'inherit', cursor: disabled ? 'default' : 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 18, opacity: disabled ? .5 : 1 } },
          React.createElement('span', { style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, selected?.props.children || value),
          React.createElement('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
            strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, style: { flexShrink: 0 } },
            React.createElement('path', { d: 'M6 9l6 6 6-6' }))),
        menu ? React.createElement('div', { className: 'mgw-select-menu', ref: menuRef, id: menuId, role: 'listbox', tabIndex: -1,
          'aria-label': props['aria-label'], 'aria-activedescendant': `${menuId}-${active}`,
          style: { ...menu, position: 'fixed', zIndex: 1250, boxSizing: 'border-box', overflowY: 'auto', padding: 6,
            background: colors.panel, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: 14,
            boxShadow: 'var(--dsw-elevation-prominent, 0 8px 28px rgba(0,0,0,.12))', outline: 'none' },
          onKeyDown: (event) => {
            if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(true) }
            else if (event.key === 'Tab') close()
            else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(active) }
            else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
              event.preventDefault()
              const index = enabled.indexOf(active)
              setActive(event.key === 'Home' ? enabled[0] : event.key === 'End' ? enabled[enabled.length - 1]
                : enabled[(index + (event.key === 'ArrowDown' ? 1 : -1) + enabled.length) % enabled.length])
            }
          } }, options.map((option, index) => React.createElement('div', { key: option.props.value,
            id: `${menuId}-${index}`, role: 'option', 'aria-selected': option.props.value === value, 'aria-disabled': !!option.props.disabled,
            onPointerMove: () => { if (!option.props.disabled) setActive(index) }, onClick: () => choose(index),
            style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, minHeight: 40, whiteSpace: 'nowrap',
              boxSizing: 'border-box', padding: '8px 12px', borderRadius: 8, cursor: option.props.disabled ? 'default' : 'pointer',
              opacity: option.props.disabled ? .4 : 1, background: active === index ? 'var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,.08))' : 'transparent' } },
            React.createElement('span', { style: { minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }, title: String(option.props.children) }, option.props.children), option.props.value === value ? React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24',
              fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, style: { flexShrink: 0 } },
              React.createElement('path', { d: 'M5 12l4 4L19 6' })) : null))) : null)
    }

    async function request(path, options) {
      const response = await fetch(path, { credentials: 'same-origin', ...options })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.message || body.error || `HTTP ${response.status}`)
      return body
    }

    function inferredUrl(wsPath) {
      const scheme = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      return `${scheme}//${window.location.host}${wsPath || '/ws/mobile'}`
    }

    function lanPairingUrl(status) {
      const urls = status?.lan?.listening && Array.isArray(status.lan.urls) ? status.lan.urls : []
      return urls.find((url) => !/^ws:\/\/169\.254\./.test(url)) || urls[0] || ''
    }

    function pairingUrlFor(route, status) {
      const lanUrl = lanPairingUrl(status)
      const tunnelUrl = status.cloudflare?.enabled ? status.cloudflare.publicUrl || '' : ''
      if (route === 'lan') return lanUrl
      if (route === 'cloudflare') return tunnelUrl
      if (status.cloudflare?.enabled && status.cloudflare.mode === 'quick') return tunnelUrl
      return tunnelUrl || status.publicUrl || lanUrl || inferredUrl(status.wsPath)
    }

    function connectionAdvice(status, publicSetup) {
      if (!status) return { detected: tr('正在读取网关环境…'), local: '', remote: '' }
      const system = status.platform === 'darwin' ? tr('macOS 电脑') : status.platform === 'win32' ? tr('Windows 电脑') : status.platform === 'linux' ? tr('Linux 服务器') : tr('当前设备')
      const lanReady = !!lanPairingUrl(status)
      const tunnel = status.cloudflare
      const tunnelReady = !!(tunnel?.enabled && tunnel.publicReady === true && tunnel.publicUrl)
      const serverReady = status.platform === 'linux' && !!(
        (publicSetup?.configured && publicSetup.publicUrl) || /^wss:\/\//.test(status.publicUrl || ''))
      const detected = tr`当前检测：${system}；局域网入口${lanReady ? tr('已就绪') : tr('未就绪')}；${serverReady ? tr('公网服务器入口已配置') : tunnelReady ? tr`${tunnel.mode === 'quick' ? 'Quick' : tr('命名')} Tunnel 已连接` : tunnel?.enabled ? (tunnel.state === 'online' ? tr('隧道已连接，公网入口未验证或检测失败') : tr('Cloudflare Tunnel 连接中')) : tr('外网入口未连接')}。`
      const local = lanReady
        ? tr('手机与 DSH 处于可互访的同一局域网时，建议选“局域网直连”。')
        : tr('如果手机和 DSH 在同一局域网，先确认局域网入口已开启并监听成功。')
      let remote
      if (serverReady) remote = tr('手机在外网时，建议使用已配置的公网服务器地址（“自动选择”）。')
      else if (tunnelReady && tunnel.mode === 'named') remote = tr('手机在外网时，建议选“Cloudflare 外网”；当前命名 Tunnel 有固定域名。')
      else if (tunnelReady) remote = tr('手机在外网临时使用时，建议选“Cloudflare 外网”；Quick 地址变化后需要重新确认。')
      else if (status.platform === 'darwin' || status.platform === 'win32') remote = tr('手机在外网时，无自有域名可开启 Quick Tunnel；有域名且需要固定地址可配置命名 Tunnel。')
      else if (status.platform === 'linux') remote = tr('手机在外网时，若使用受支持的 Ubuntu/Debian 服务器且有固定公网 IPv4，可先配置“公网接入”，再选“自动选择”。')
      else remote = tr('手机在外网时，需要一个可访问的 wss:// 地址；可在“手动输入地址”中填写。')
      return { detected, local, remote }
    }

    function DeviceRow({ device, onRevoke, revoking }) {
      const triggerRevoke = (event) => {
        event.preventDefault()
        event.stopPropagation()
        if (!revoking) onRevoke(device)
      }
      return React.createElement('div', { style: styles.row },
        React.createElement('div', { style: { minWidth: 0, overflow: 'hidden' } },
          React.createElement('div', { style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } },
            device.displayName || device.name,
            React.createElement('span', { style: styles.badge },
              React.createElement('span', { style: { ...styles.dot, background: device.online ? colors.success : colors.muted } }),
              device.online ? tr('在线') : tr('离线'))),
          React.createElement('div', { style: { ...styles.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 3 } },
            device.lastSeenAt ? tr`最近连接：${new Date(device.lastSeenAt).toLocaleString()}` : tr('尚未连接'))),
        React.createElement('button', {
          type: 'button',
          disabled: revoking,
          style: {
            ...styles.button,
            color: colors.danger,
            background: 'transparent',
            borderColor: 'rgba(220,76,100,.55)',
            flexShrink: 0,
            minWidth: 54,
            opacity: revoking ? .6 : 1,
          },
          title: tr`吊销 ${device.displayName || device.name}`,
          // Pointer-up is more reliable than click inside the shell overlay on
          // touch devices. The click handler remains for keyboard activation.
          onPointerUp: triggerRevoke,
          onClick: (event) => {
            if (event.detail === 0) triggerRevoke(event)
          },
        }, revoking ? tr('吊销中…') : tr('吊销')))
    }

    function DevicePanel() {
      const [activeSection, setActiveSection] = React.useState('general')
      const [devices, setDevices] = React.useState(null)
      const [showAllDevices, setShowAllDevices] = React.useState(false)
      const [status, setStatus] = React.useState(null)
      const [dismissedNotice, setDismissedNotice] = React.useState(() => dismissedRestartInstance)
      const [publicUrl, setPublicUrl] = React.useState('')
      const [pairingRoute, setPairingRoute] = React.useState('auto')
      const [connectionHelpOpen, setConnectionHelpOpen] = React.useState(false)
      const [publicIp, setPublicIp] = React.useState('')
      const [publicSetup, setPublicSetup] = React.useState(null)
      const [publicSetupBusy, setPublicSetupBusy] = React.useState(false)
      const [cloudflareHost, setCloudflareHost] = React.useState('')
      const [cloudflareToken, setCloudflareToken] = React.useState('')
      const [cloudflareMode, setCloudflareMode] = React.useState('quick')
      const [cloudflareBusy, setCloudflareBusy] = React.useState(false)
      const [qr, setQr] = React.useState(null)
      const pairingDialogRef = React.useRef(null)
      const [pairingClosing, setPairingClosing] = React.useState(false)
      const pairingCloseTimer = React.useRef(null)
      const closePairingDialog = () => {
        if (pairingCloseTimer.current !== null) return
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          setQr(null)
          return
        }
        setPairingClosing(true)
        pairingCloseTimer.current = window.setTimeout(() => {
          pairingCloseTimer.current = null
          setQr(null)
          setPairingClosing(false)
        }, 180)
      }
      React.useEffect(() => {
        setPairingClosing(false)
        return () => {
          if (pairingCloseTimer.current !== null) {
            window.clearTimeout(pairingCloseTimer.current)
            pairingCloseTimer.current = null
          }
        }
      }, [qr])
      const [error, setError] = React.useState(null)
      const [busy, setBusy] = React.useState(false)
      const [refreshing, setRefreshing] = React.useState(false)
      const [refreshNotice, setRefreshNotice] = React.useState(null)
      const [pairingTokenCopied, setPairingTokenCopied] = React.useState(false)
      const [deviceNotice, setDeviceNotice] = React.useState(null)
      const [deviceNoticeError, setDeviceNoticeError] = React.useState(false)
      const [revokingIds, setRevokingIds] = React.useState(() => new Set())
      const revokingIdsRef = React.useRef(new Set())
      const automaticUrlRef = React.useRef('')
      const pairingRouteRef = React.useRef('auto')
      const cloudflareModeLoadedRef = React.useRef(false)

      const refresh = React.useCallback(async () => {
        try {
          const [deviceData, statusData] = await Promise.all([
            request('/mgw/devices'),
            request('/mgw/status'),
          ])
          const nextDevices = deviceData.devices || []
          // Keep existing DOM rows alive when polling returns identical data.
          // Replacing them every three seconds can swallow a pointer/click that
          // started on the old button and ended after React replaced the row.
          if (revokingIdsRef.current.size === 0) {
            setDevices((current) => JSON.stringify(current) === JSON.stringify(nextDevices) ? current : nextDevices)
          }
          setStatus((current) => JSON.stringify(current) === JSON.stringify(statusData) ? current : statusData)
          if (statusData.cloudflare && statusData.cloudflare.hostname) {
            setCloudflareHost((current) => current || statusData.cloudflare.hostname)
          }
          if (statusData.cloudflare && !cloudflareModeLoadedRef.current) {
            cloudflareModeLoadedRef.current = true
            setCloudflareMode(statusData.cloudflare.mode || 'quick')
          }
          if (pairingRouteRef.current === 'cloudflare' && !statusData.cloudflare?.enabled) {
            pairingRouteRef.current = 'auto'
            setPairingRoute('auto')
          }
          if (pairingRouteRef.current !== 'custom') {
            const preferredUrl = pairingUrlFor(pairingRouteRef.current, statusData)
            if (automaticUrlRef.current && preferredUrl !== automaticUrlRef.current) setQr(null)
            automaticUrlRef.current = preferredUrl
            setPublicUrl(preferredUrl)
          }
          return true
        } catch (cause) {
          setError(cause.message)
          return false
        }
      }, [])

      const manualRefresh = async () => {
        if (refreshing) return
        setRefreshing(true)
        setRefreshNotice(null)
        const succeeded = await refresh()
        setRefreshing(false)
        if (succeeded) {
          setError(null)
          setRefreshNotice(tr`已刷新 · ${new Date().toLocaleTimeString()}`)
          window.setTimeout(() => setRefreshNotice(null), 2200)
        }
      }

      React.useEffect(() => {
        let active = true
        refresh()
        request('/mgw/public-setup').then((data) => {
          if (!active) return
          setPublicSetup(data)
          if (data.publicUrl) {
            const match = /^wss:\/\/([^/]+)\/ws\/mobile$/.exec(data.publicUrl)
            if (match) setPublicIp(match[1])
          }
        }).catch((cause) => active && setPublicSetup({ installed: false, configured: false, error: cause.message }))
        const timer = window.setInterval(() => { refresh() }, 3000)
        return () => { active = false; window.clearInterval(timer) }
      }, [refresh])

      React.useEffect(() => {
        if (!qr) return
        const previousFocus = document.activeElement
        pairingDialogRef.current?.querySelector('button')?.focus()
        return () => previousFocus?.focus()
      }, [qr])

      const choosePairingRoute = (route) => {
        pairingRouteRef.current = route
        setPairingRoute(route)
        setQr(null)
        if (route === 'custom') {
          automaticUrlRef.current = ''
          return
        }
        if (status) {
          const nextUrl = pairingUrlFor(route, status)
          automaticUrlRef.current = nextUrl
          setPublicUrl(nextUrl)
        }
      }

      const configurePublicAccess = async () => {
        if (publicSetupBusy) return
        setPublicSetupBusy(true)
        setError(null)
        try {
          const data = await request('/mgw/public-setup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ publicIp }),
          })
          setPublicSetup(data)
          if (data.publicUrl && pairingRouteRef.current === 'auto') {
            automaticUrlRef.current = data.publicUrl
            setPublicUrl(data.publicUrl)
          }
        } catch (cause) {
          setError(cause.message)
        } finally {
          setPublicSetupBusy(false)
        }
      }

      const configureCloudflare = async (enabled, mode = cloudflareMode) => {
        if (cloudflareBusy) return
        setCloudflareBusy(true)
        setError(null)
        try {
          const data = await request('/mgw/cloudflare', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled, ...(enabled ? {
              mode,
              ...(mode === 'named' ? { hostname: cloudflareHost, token: cloudflareToken } : {}),
            } : {}) }),
          })
          setCloudflareToken('')
          setStatus((current) => ({ ...(current || {}), cloudflare: data, gatewayEnabled: data.gatewayEnabled, gatewayMode: data.gatewayMode, publicUrl: data.publicUrl || null }))
          if (!enabled && pairingRouteRef.current === 'cloudflare') {
            pairingRouteRef.current = 'auto'
            setPairingRoute('auto')
          }
          await refresh()
        } catch (cause) {
          setError(cause.message)
        } finally {
          setCloudflareBusy(false)
        }
      }

      const checkCloudflare = async () => {
        if (cloudflareBusy) return
        setCloudflareBusy(true)
        setError(null)
        try {
          const data = await request('/mgw/cloudflare/check', { method: 'POST' })
          setStatus((current) => ({ ...(current || {}), cloudflare: data }))
        } catch (cause) { setError(cause.message) }
        finally { setCloudflareBusy(false) }
      }

      const restartCloudflare = async () => {
        if (cloudflareBusy) return
        setCloudflareBusy(true)
        setError(null)
        try {
          const data = await request('/mgw/cloudflare/restart', { method: 'POST' })
          if (data.mode === 'quick') setQr(null)
          setStatus((current) => ({ ...(current || {}), cloudflare: data }))
          await refresh()
        } catch (cause) {
          setError(cause.message)
        } finally {
          setCloudflareBusy(false)
        }
      }

      const createPairing = async (endpoint) => request('/mgw/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicUrl: endpoint }),
      })

      const pair = async () => {
        setBusy(true)
        setError(null)
        setPairingTokenCopied(false)
        try {
          const data = await createPairing(publicUrl)
          setQr(data)
        } catch (cause) {
          setError(cause.message)
        } finally {
          setBusy(false)
        }
      }

      const copyPairingText = async () => {
        if (!qr || !qr.qrPayload) return
        try {
          if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
            throw new Error(tr('当前浏览器不允许直接写入剪贴板，请选中文本后手动复制'))
          }
          await navigator.clipboard.writeText(qr.qrPayload)
          setError(null)
          setPairingTokenCopied(true)
          window.setTimeout(() => setPairingTokenCopied(false), 2200)
        } catch (cause) {
          setPairingTokenCopied(false)
          setError(cause.message)
        }
      }

      const changeGatewayMode = async (mode) => {
        setBusy(true)
        setError(null)
        try {
          const data = await request('/mgw/gateway', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode }),
          })
          setStatus((current) => ({ ...(current || {}), ...data }))
          if (mode === 'disabled') setQr(null)
        } catch (cause) {
          setError(cause.message)
        } finally {
          setBusy(false)
        }
      }

      const toggleAuth = async () => {
        const enabled = !(status && status.requireAuth)
        if (!enabled && !window.confirm(tr('关闭设备鉴权后，任何能访问移动网关的人都可以控制 DSH。此选项仅限 Debug 阶段使用，确定继续吗？'))) return
        setBusy(true)
        setError(null)
        try {
          const data = await request('/mgw/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled }),
          })
          setStatus((current) => ({ ...(current || {}), requireAuth: data.requireAuth }))
        } catch (cause) {
          setError(cause.message)
        } finally {
          setBusy(false)
        }
      }

      const revoke = async (device) => {
        if (revokingIdsRef.current.has(device.id)) return
        setDeviceNotice(null)
        setDeviceNoticeError(false)
        setError(null)
        revokingIdsRef.current.add(device.id)
        setRevokingIds((current) => new Set(current).add(device.id))
        try {
          await request(`/mgw/devices/${encodeURIComponent(device.id)}/revoke`, { method: 'POST' })
          setDevices((current) => Array.isArray(current) ? current.filter((item) => item.id !== device.id) : current)
          setDeviceNotice(tr`已吊销 ${device.displayName || device.name}`)
          window.setTimeout(() => setDeviceNotice(null), 2200)
        } catch (cause) {
          setDeviceNoticeError(true)
          setDeviceNotice(tr`吊销失败：${cause.message}`)
          setError(cause.message)
        } finally {
          revokingIdsRef.current.delete(device.id)
          setRevokingIds((current) => {
            const next = new Set(current)
            next.delete(device.id)
            return next
          })
          await refresh()
        }
      }

      const restartNoticeInstance = status?.gatewayInstanceId || (status?.webPid ? String(status.webPid) : null)
      const dismissRestartNotice = () => {
        dismissedRestartInstance = restartNoticeInstance
        setDismissedNotice(restartNoticeInstance)
        try { window.localStorage.setItem(restartNoticeStorageKey, restartNoticeInstance) } catch { /* keep in-memory dismissal */ }
      }

      const onlineDevices = (devices || []).filter((device) => device.online)
      const offlineDevices = (devices || []).filter((device) => !device.online)
      const visibleDevices = showAllDevices ? [...onlineDevices, ...offlineDevices] : onlineDevices
      // portal 同款状态 pill：loading → running/off，拉取失败且无快照时 error。
      const pillState = !status ? (error ? 'error' : 'loading') : error ? 'loading' : status.gatewayEnabled ? 'running' : 'off'
      const pillText = pillState === 'loading' ? tr('连接中') : pillState === 'running' ? tr('运行中') : pillState === 'error' ? tr('异常') : tr('已停止')

      const advice = connectionAdvice(status, publicSetup)
      const helpLine = (name, description) => React.createElement('div', { style: { marginTop: 7 } },
        React.createElement('strong', null, name), '：', description)

      return React.createElement(React.Fragment, null,
        qr ? React.createElement('div', { style: { ...styles.backdrop, zIndex: 1201 },
          onMouseDown: (event) => { event.stopPropagation(); closePairingDialog() } },
          React.createElement('div', { className: 'mgw-pairing-dialog', 'data-closing': pairingClosing, ref: pairingDialogRef, role: 'dialog', 'aria-modal': true, 'aria-label': tr('设备配对二维码'), tabIndex: -1,
            style: { ...styles.panel, width: 'min(520px, 100%)', height: 'auto', overflowY: 'auto', scrollbarWidth: 'none',
            background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 'var(--dsw-radius-panel, 16px)',
            boxShadow: 'var(--dsw-elevation-prominent, 0 20px 60px rgba(0,0,0,.22))', padding: 24 },
            onMouseDown: (event) => event.stopPropagation(),
            onKeyDown: (event) => {
              if (event.key === 'Escape') { event.stopPropagation(); closePairingDialog() }
              if (event.key === 'Tab') {
                const items = [...event.currentTarget.querySelectorAll('button, textarea')]
                const first = items[0], last = items[items.length - 1]
                if (event.shiftKey && (document.activeElement === first || document.activeElement === event.currentTarget)) { event.preventDefault(); last?.focus() }
                else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
              }
            } },
            React.createElement('div', { style: { display: 'flex', justifyContent: 'flex-end' } },
              React.createElement('button', { type: 'button', style: { ...styles.button, ...styles.headerButton }, 'aria-label': tr('关闭配对窗口'), onClick: closePairingDialog }, '✕')),
          React.createElement('section', { style: { textAlign: 'center' } },
            React.createElement('strong', null, tr('使用移动客户端扫码')),
            React.createElement('img', { style: styles.qr, src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(qr.svg)}`, alt: tr('一次性设备配对二维码') }),
            React.createElement('label', { style: { ...styles.label, textAlign: 'left' } }, tr('Base64URL 配对字符串')),
            React.createElement('textarea', { style: styles.pairingText, value: qr.qrPayload, readOnly: true, spellCheck: false, onFocus: (event) => event.target.select() }),
            React.createElement('button', { style: { ...styles.button, width: '100%', marginBottom: 8, borderColor: pairingTokenCopied ? colors.success : colors.border, color: pairingTokenCopied ? colors.success : colors.text }, onClick: copyPairingText }, pairingTokenCopied ? tr('✓ 已复制') : tr('复制配对 Token')),
            pairingTokenCopied ? React.createElement('div', { style: { ...styles.muted, color: colors.success, marginBottom: 8 } }, tr('已复制到剪贴板')) : null,
            React.createElement('div', { style: styles.muted }, tr`有效期至 ${new Date(qr.pairing.expiresAt).toLocaleTimeString()}；扫码成功后此二维码立即失效。`)))) : null,
        React.createElement('aside', { className: 'mobile-gateway-panel', inert: qr ? true : undefined, 'aria-hidden': qr ? true : undefined, style: styles.panel, onMouseDown: (event) => { event.stopPropagation() }, role: 'region', 'aria-label': tr('移动设备管理') },
          React.createElement('div', { style: styles.headerTop },
            React.createElement('div', { className: 'mgw-pill', 'data-state': pillState, 'data-mgw-pill': '1' },
              React.createElement('span', { className: 'mgw-pill-dot' }), pillText)),
          React.createElement('div', { style: styles.subtitle, 'data-mgw-subtitle': '1' }, !status ? tr('正在加载网关状态…') : status.gatewayEnabled ? tr`移动网关已开启 · ${status.requireAuth ? tr('设备鉴权已开启') : tr('本机设备鉴权已关闭')}` : tr('移动网关已关闭 · 普通 WebUI 模式')),
          React.createElement('div', { className: 'mgw-body' },
            React.createElement('nav', { className: 'mgw-nav', 'aria-label': tr('移动网关设置分组') },
              [['general', tr('通用设置')], ['pairing', tr('连接与配对')], ['devices', tr('可信设备')]].map(([id, label]) =>
                React.createElement('button', { key: id, type: 'button', 'aria-current': activeSection === id ? 'page' : undefined,
                  onClick: () => { setActiveSection(id); setConnectionHelpOpen(false) } }, label))),
            React.createElement('div', { className: 'mgw-content', key: activeSection },
          restartNoticeInstance && dismissedNotice !== restartNoticeInstance ? React.createElement('section', { style: { ...styles.card, position: 'relative', padding: '10px 40px 10px 12px', background: 'var(--dsw-alias-state-warn-tertiary, #fff7df)', borderColor: 'color-mix(in srgb, #d99a16 35%, transparent)', fontSize: 12, lineHeight: 1.6, marginBottom: 12 }, className: 'mgw-restart-alert', role: 'note', 'data-mgw-alert': 'restart' },
            React.createElement('button', { type: 'button', 'aria-label': tr('关闭重启提醒'), title: tr('关闭提醒'),
              style: { ...styles.button, position: 'absolute', right: 8, top: 8, border: 0, width: 24, height: 24, padding: 0, color: colors.muted },
              onClick: dismissRestartNotice }, '✕'),
            React.createElement('strong', null, tr('若安装或更新后连接异常，请重启应用')),
            React.createElement('div', { style: { color: colors.muted, marginTop: 4 } },
              tr('完全退出并重启 APP／Desktop；Web UI 请重启 DSH Web 服务。')),
            React.createElement('div', { style: { color: colors.muted, marginTop: 4 } },
              tr('端口仍被占用时，请关闭其他 Harness 实例。'))) : null,
          error ? React.createElement('div', { className: 'mgw-alert', 'data-tone': 'error', 'data-mgw-alert': 'error' }, error) : null,
          React.createElement('div', { hidden: activeSection !== 'general' },
          React.createElement('section', { style: styles.card, 'data-mgw-card': 'mode' },
            React.createElement('div', { className: 'mgw-card-head' },
              React.createElement('h3', { className: 'mgw-card-title' }, tr('网关运行模式')),
              React.createElement('span', { className: 'mgw-chip', 'data-tone': status && status.gatewayEnabled ? 'ok' : undefined, 'data-mgw-chip': 'mode' },
                status && status.gatewayEnabled ? (status.gatewayMode === 'persistent' ? tr('常驻开启') : tr('临时开启')) : tr('关闭'))),
            React.createElement('div', { style: { ...styles.muted, margin: '0 0 12px' } }, status && status.gatewayEnabled
              ? status.gatewayMode === 'persistent'
                ? tr('重启后保持开启')
                : status.waitExpiresAt
                  ? tr`等待可信设备连接，约 ${Math.max(1, Math.ceil((status.waitExpiresAt - Date.now()) / 60000))} 分钟后自动关闭`
                  : tr('设备已连接过，本次运行保持开启；重启后重新计时')
              : tr('不接受移动设备连接')),
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' } },
              React.createElement('span', { style: { position: 'relative', display: 'inline-flex', flexShrink: 0 } },
                React.createElement(GatewaySelect, {
                  style: { ...styles.input, width: 'auto', marginBottom: 0, padding: '8px 40px 8px 12px', appearance: 'none', WebkitAppearance: 'none' },
                  'aria-label': tr('网关运行模式'),
                  value: status ? status.gatewayMode || (status.gatewayEnabled ? 'temporary' : 'disabled') : 'disabled',
                  disabled: busy || !status,
                  onChange: (event) => changeGatewayMode(event.target.value),
                },
                React.createElement('option', { value: 'disabled' }, tr('关闭')),
                React.createElement('option', { value: 'temporary' }, tr('临时开启')),
                React.createElement('option', { value: 'persistent' }, tr('常驻开启'))),
              )),
            status && status.gatewayId ? React.createElement('div', { style: { ...styles.muted, marginTop: 12, overflowWrap: 'anywhere' } },
              status.gatewayName) : null),
          React.createElement('section', { style: styles.card, 'data-mgw-card': 'auth' },
            React.createElement('div', { className: 'mgw-card-head' },
              React.createElement('h3', { className: 'mgw-card-title' }, tr('设备鉴权')),
              React.createElement('label', { style: { ...styles.switch, opacity: busy || !status ? .55 : 1 }, title: status && status.requireAuth ? tr('关闭设备鉴权') : tr('开启设备鉴权') },
                React.createElement('input', {
                  type: 'checkbox',
                  role: 'switch',
                  'aria-label': tr('设备鉴权'),
                  'aria-checked': !!(status && status.requireAuth),
                  checked: !!(status && status.requireAuth),
                  disabled: busy || !status,
                  onChange: toggleAuth,
                  style: styles.switchInput,
                }),
                React.createElement('span', { style: { ...styles.switchTrack, background: status && status.requireAuth ? colors.success : colors.danger } }),
                React.createElement('span', { style: { ...styles.switchKnob, left: status && status.requireAuth ? 21 : 3 } }))),
            React.createElement('div', { style: { ...styles.muted } }, status && status.requireAuth ? tr('已开启，仅允许可信设备连接') : tr('已关闭，仅影响本机 Debug 入口')),
            status && !status.requireAuth
              ? React.createElement('div', { className: 'mgw-alert', 'data-tone': 'error', style: { marginTop: 12 } }, tr('Debug 模式：本机 DSH 入口将跳过设备凭证校验；独立局域网入口仍强制鉴权。'))
              : null),
          ),
          React.createElement('div', { hidden: activeSection !== 'pairing' },
          React.createElement('section', { style: styles.card, 'data-mgw-card': 'pairing' },
            React.createElement('div', { className: 'mgw-card-head' },
            React.createElement('div', { style: { position: 'relative', display: 'flex', alignItems: 'center', gap: 6 }, onMouseLeave: () => setConnectionHelpOpen(false) },
              React.createElement('h3', { className: 'mgw-card-title' }, tr('配对连接方式')),
              React.createElement('button', {
                type: 'button',
                style: styles.helpButton,
                'aria-label': tr('连接方式说明与场景建议'),
                'aria-expanded': connectionHelpOpen,
                'aria-describedby': connectionHelpOpen ? 'mgw-route-help' : undefined,
                onMouseEnter: () => setConnectionHelpOpen(true),
                onFocus: () => setConnectionHelpOpen(true),
                onBlur: () => setConnectionHelpOpen(false),
                onClick: () => setConnectionHelpOpen(true),
                onKeyDown: (event) => { if (event.key === 'Escape') setConnectionHelpOpen(false) },
              }, '?'),
              connectionHelpOpen ? React.createElement('div', { id: 'mgw-route-help', role: 'tooltip', style: styles.helpBubble },
                React.createElement('strong', null, tr('怎么选连接方式')),
                helpLine(tr('局域网直连'), tr('手机与 DSH 在同一个可互访的局域网，使用 ws:// 私有地址；离开该网络就无法直连。')),
                helpLine(tr('Cloudflare Channel（命名 Tunnel）'), tr('PC 主动连接 Cloudflare，外网用固定域名的 wss://；需要 Cloudflare 账户和域名。')),
                helpLine('Quick Channel（Quick Tunnel）', tr('无需账户或域名，Cloudflare 分配临时 wss:// 地址；隧道重建后地址可能变化。')),
                helpLine(tr('公网服务器连接'), tr('DSH 运行在有固定公网 IPv4 的 Linux 服务器上，配置公网入口后用 wss:// 公网 IP 连接。')),
                React.createElement('div', { style: { borderTop: `1px solid ${colors.border}`, marginTop: 10, paddingTop: 8 } },
                  React.createElement('strong', null, tr('结合当前环境')),
                  React.createElement('div', { style: { color: colors.muted, marginTop: 4 } }, advice.detected),
                  React.createElement('div', { style: { marginTop: 6 } }, advice.local),
                  React.createElement('div', { style: { marginTop: 6 } }, advice.remote),
                  React.createElement('div', { style: { color: colors.muted, marginTop: 6 } }, tr('面板无法判断手机当前网络；请按手机所在位置选择，提示不会替你修改选择。'))))
                : null),
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px 14px', maxWidth: '100%' } },
            React.createElement(GatewaySelect, { style: styles.input, value: pairingRoute, onChange: (event) => choosePairingRoute(event.target.value), disabled: !status, 'aria-label': tr('配对连接方式') },
              React.createElement('option', { value: 'auto' }, tr('自动选择 · 优先外网')),
              lanPairingUrl(status) || pairingRoute === 'lan'
                ? React.createElement('option', { value: 'lan', disabled: !lanPairingUrl(status) }, lanPairingUrl(status)
                  ? tr('局域网直连')
                  : tr('局域网直连 · 当前不可用'))
                : null,
              status?.cloudflare?.enabled ? React.createElement('option', { value: 'cloudflare' }, tr('Cloudflare 外网')) : null,
              React.createElement('option', { value: 'custom' }, tr('手动输入地址'))),
              (pairingRoute === 'auto' || pairingRoute === 'cloudflare') && status?.cloudflare?.supported
                ? React.createElement('span', { style: { fontSize: 12, lineHeight: 1.5, fontWeight: 500,
                    color: 'var(--dsw-alias-link, #4176e6)' } }, tr('外网使用 Cloudflare Tunnel 进行连接，请在下方进行设置。')) : null)),
            React.createElement('label', { style: styles.label }, tr('WebSocket 地址')),
            React.createElement('input', { style: styles.input, value: publicUrl, onChange: (event) => { choosePairingRoute('custom'); setPublicUrl(event.target.value) }, placeholder: 'ws://192.168.1.10:3081/ws/mobile', spellCheck: false }),
            status && status.lan && status.lan.enabled
              ? React.createElement('div', { style: { ...styles.muted, margin: '-7px 0 10px', fontWeight: 500, color: status.lan.error ? colors.danger : status.lan.listening ? colors.success : 'var(--dsw-alias-link, #4176e6)' } },
                  status.lan.error
                    ? tr`局域网监听失败：${status.lan.error}`
                    : status.lan.listening
                      ? tr`局域网入口已开启${status.lan.urls && status.lan.urls.length ? `：${status.lan.urls.join('、')}` : tr`，端口 ${status.lan.port}`}`
                      : tr('局域网入口启动中…'))
              : null,
            React.createElement('button', {
              style: { ...styles.button, ...styles.primary, opacity: busy || !(status && status.gatewayEnabled) || !publicUrl.trim() ? .65 : 1 },
              disabled: busy || !(status && status.gatewayEnabled) || !publicUrl.trim(),
              onClick: pair,
            }, busy ? tr('正在生成…') : !(status && status.gatewayEnabled) ? tr('请先开启移动网关') : !publicUrl.trim() ? tr('等待连接地址') : tr('生成配对二维码')),
            React.createElement('p', { style: { ...styles.muted, margin: '10px 0 0' } }, tr('配对码仅可使用一次，5 分钟内有效。'))),
          (pairingRoute === 'auto' || pairingRoute === 'cloudflare') && status?.cloudflare?.supported
            ? React.createElement('section', { className: 'mgw-cloudflare-block', style: styles.card, 'data-mgw-card': 'cloudflare' },
                React.createElement('h3', { className: 'mgw-card-title' }, tr('Cloudflare Tunnel · 外网接入')),
                React.createElement('p', { style: styles.muted }, tr('首次开启自动准备 Tunnel 组件。')),
                React.createElement('div', { className: 'mgw-setting-row' },
                React.createElement('span', { className: 'mgw-setting-label' }, tr('接入方式')),
                React.createElement(GatewaySelect, { style: styles.input, value: cloudflareMode, 'aria-label': tr('Cloudflare 接入方式'), onChange: (event) => {
                    const mode = event.target.value
                    setCloudflareMode(mode)
                    if (status.cloudflare.enabled && mode !== status.cloudflare.mode &&
                        (mode === 'quick' || (status.cloudflare.configured && cloudflareHost === status.cloudflare.hostname && !cloudflareToken))) {
                      void configureCloudflare(true, mode)
                    }
                  }, disabled: cloudflareBusy },
                  React.createElement('option', { value: 'quick' }, tr('Quick Tunnel · 无需域名')),
                  React.createElement('option', { value: 'named' }, tr('命名 Tunnel · 固定域名')))),
                cloudflareMode === 'quick'
                  ? React.createElement('p', { style: styles.muted }, tr('临时地址可能变化，变化后需重新扫码。'))
                  : React.createElement(React.Fragment, null,
                      React.createElement('p', { style: styles.muted }, tr('先在 Cloudflare 创建命名 Tunnel，把公开域名的 Service URL 设为 '), React.createElement('code', null, `http://127.0.0.1:${status.cloudflare.port}`), tr('。Tunnel Token 仅授权连接，不能自动创建公开主机名或 DNS；还需确认域名存在指向 Tunnel UUID.cfargotunnel.com 的已代理 CNAME 记录。')),
                      React.createElement('label', { style: styles.label }, tr('公开域名')),
                      React.createElement('input', { style: styles.input, value: cloudflareHost, onChange: (event) => setCloudflareHost(event.target.value.trim()), placeholder: 'gateway.example.com', spellCheck: false }),
                      React.createElement('label', { style: styles.label }, 'Tunnel Token'),
                      React.createElement('input', { style: styles.input, type: 'password', value: cloudflareToken, onChange: (event) => setCloudflareToken(event.target.value.trim()), placeholder: status.cloudflare.configured ? tr('已保存；留空则保持原 Token') : tr('粘贴 eyJ… Token'), autoComplete: 'off', spellCheck: false })),
                (!status.cloudflare.enabled || (cloudflareMode === 'named' &&
                  (status.cloudflare.mode !== 'named' || cloudflareHost !== status.cloudflare.hostname || !!cloudflareToken)))
                  ? React.createElement('button', {
                  style: { ...styles.button, ...styles.primary, opacity: cloudflareBusy || (cloudflareMode === 'named' && (!cloudflareHost || (!cloudflareToken && !status.cloudflare.configured))) ? .65 : 1 },
                  disabled: cloudflareBusy || (cloudflareMode === 'named' && (!cloudflareHost || (!cloudflareToken && !status.cloudflare.configured))),
                  onClick: () => configureCloudflare(true),
                }, cloudflareBusy ? tr('正在处理…') : status.cloudflare.enabled ? tr('保存并连接') : cloudflareMode === 'quick' ? tr('一键开启 Quick Tunnel') : tr('开启命名 Tunnel')) : null,
                status.cloudflare.enabled
                  ? React.createElement(React.Fragment, null,
                      React.createElement('button', { style: { ...styles.button, width: '100%', marginTop: 8 }, disabled: cloudflareBusy || status.cloudflare.state !== 'online', onClick: checkCloudflare }, tr('检测公网 DNS / TLS / WebSocket')),
                      React.createElement('button', { style: { ...styles.button, width: '100%', marginTop: 8 }, disabled: cloudflareBusy || !status.gatewayEnabled, onClick: restartCloudflare }, tr('重启 Tunnel')),
                      React.createElement('button', { style: { ...styles.button, width: '100%', marginTop: 8 }, disabled: cloudflareBusy, onClick: () => configureCloudflare(false) }, tr('关闭 Cloudflare Tunnel')),
                      React.createElement('p', { style: styles.muted }, tr('重启会短暂断开连接。')))
                  : null,
                React.createElement('div', { style: { ...styles.muted, marginTop: 9, overflowWrap: 'anywhere', fontWeight: 500, color: status.cloudflare.error ? colors.danger : status.cloudflare.state === 'online' ? colors.success : ['starting', 'preparing', 'connecting'].includes(status.cloudflare.state) ? 'var(--dsw-alias-link, #4176e6)' : colors.muted } },
                  status.cloudflare.error || ({ disabled: tr('未开启'), starting: tr('正在启动本机入口…'), preparing: tr('正在准备 cloudflared（首次需下载）…'), connecting: tr('正在连接 Cloudflare…'), online: tr('隧道传输已连接（不等于公网入口可达）'), 'waiting-for-gateway': tr('等待移动网关开启') }[status.cloudflare.state] || status.cloudflare.state),
                  status.cloudflare.publicUrl ? ` · ${status.cloudflare.publicUrl}` : ''),
                 status.cloudflare.enabled && status.cloudflare.endpointHealth
                   ? React.createElement('p', { style: { ...styles.muted, overflowWrap: 'anywhere', fontWeight: 500, color: status.cloudflare.endpointHealth.state === 'reachable' ? colors.success : status.cloudflare.endpointHealth.state === 'checking' ? 'var(--dsw-alias-link, #4176e6)' : status.cloudflare.endpointHealth.state === 'unchecked' ? colors.muted : colors.danger } },
                       status.cloudflare.endpointHealth.message,
                       status.cloudflare.endpointHealth.checkedAt ? tr`（检测时间：${status.cloudflare.endpointHealth.checkedAt}）` : '')
                   : null)
              : null,
          status && status.platform === 'linux' ? React.createElement('section', { style: styles.card },
            React.createElement('h3', { className: 'mgw-card-title' }, tr('公网接入')),
            publicSetup === null
              ? React.createElement('p', { style: styles.muted }, tr('正在检查系统组件…'))
              : publicSetup.installed
                ? React.createElement(React.Fragment, null,
                    React.createElement('div', { style: { ...styles.muted, margin: '5px 0 12px' } }, publicSetup.configured
                      ? publicSetup.backendPort && status && status.webPort && publicSetup.backendPort !== status.webPort
                        ? tr`端口需要更新：Nginx 当前为 ${publicSetup.backendPort}，DSH 当前为 ${status.webPort}`
                        : tr`已配置${publicSetup.backendPort ? tr`，Nginx 转发至 DSH 端口 ${publicSetup.backendPort}` : ''}`
                      : tr`Helper 已就绪，将自动使用当前 DSH 端口${status && status.webPort ? ` ${status.webPort}` : ''}`),
                    React.createElement('label', { style: styles.label }, tr('服务器公网 IPv4')),
                    React.createElement('input', {
                      style: styles.input,
                      value: publicIp,
                      onChange: (event) => setPublicIp(event.target.value.trim()),
                      placeholder: '203.0.113.10',
                      inputMode: 'decimal',
                      spellCheck: false,
                    }),
                    React.createElement('button', {
                      style: { ...styles.button, ...styles.primary, opacity: publicSetupBusy || !publicIp ? .65 : 1 },
                      disabled: publicSetupBusy || !publicIp,
                      onClick: configurePublicAccess,
                    }, publicSetupBusy ? tr('正在配置 Nginx 与证书…') : publicSetup.configured ? tr('更新公网配置') : tr('配置公网接入')),
                    publicSetup.publicUrl
                      ? React.createElement('div', { style: { ...styles.muted, marginTop: 9, overflowWrap: 'anywhere' } }, publicSetup.publicUrl)
                      : null)
                : React.createElement(React.Fragment, null,
                    React.createElement('p', { style: { ...styles.muted, marginBottom: 8 } }, tr('尚未安装系统 Helper。请在服务器执行一次初始化：')),
                    React.createElement('code', { style: { display: 'block', fontSize: 10, lineHeight: 1.5, overflowWrap: 'anywhere', userSelect: 'all' } }, 'npx --yes github:johnhom1024/dsh-host-gateway init'))) : null,

          ),
          React.createElement('div', { hidden: activeSection !== 'devices' },
          React.createElement('section', { style: styles.card, 'data-mgw-card': 'devices' },
            React.createElement('div', { className: 'mgw-card-head' },
              React.createElement('h3', { className: 'mgw-card-title' }, tr('可信设备')),
              React.createElement('span', { className: 'mgw-chip', 'data-mgw-chip': 'devices-online' }, tr`${onlineDevices.length} 台在线`),
              React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 10 } },
                deviceNotice || refreshNotice ? React.createElement('span', {
                  style: { ...styles.muted, color: deviceNoticeError ? colors.danger : colors.success },
                }, deviceNotice || refreshNotice) : null,
                React.createElement('button', {
                  style: { ...styles.button, opacity: refreshing ? .6 : 1 },
                  disabled: refreshing,
                  onClick: manualRefresh,
                }, refreshing ? tr('刷新中…') : tr('刷新')))),
            devices === null
              ? React.createElement('p', { style: styles.muted }, tr('加载中…'))
              : devices.length === 0
                ? React.createElement('p', { style: styles.muted }, tr('暂无已配对设备。'))
                : React.createElement(React.Fragment, null,
                  visibleDevices.length === 0 ? React.createElement('p', { style: styles.muted }, tr('当前没有在线设备。')) : null,
                  visibleDevices.map((device) => React.createElement(DeviceRow, {
                    key: device.id,
                    device,
                    onRevoke: revoke,
                    revoking: revokingIds.has(device.id),
                  })),
                  offlineDevices.length > 0 ? React.createElement('button', {
                    type: 'button',
                    style: { ...styles.button, marginTop: 10, color: colors.muted },
                    'aria-expanded': showAllDevices,
                    onClick: () => setShowAllDevices((value) => !value),
                  }, showAllDevices ? tr('收起离线设备') : tr`展开其他已配对设备（${offlineDevices.length}）`) : null)),
          )),
          ),
          status && status.version
            ? React.createElement('div', { style: styles.version, 'aria-label': tr`插件版本 ${status.version}` }, `v${status.version}`)
            : null))
    }

    // portal（dsh-remote-portal）三 slot 同构拓扑：
    //   sidebar.panellist —— 入口（壳包按钮壳，组件只出 icon）；
    //   main             —— 面板主内容页；panellist id 与 main key 同值，
    //                       壳据此配成 page switch（选会话/别的面板时自己收起）；
    //   shell.overlay    —— portal 只承载特殊浮层（目录 picker）。我们的浮层类
    //                       内容只有配对二维码，照 portal 的 QR-in-panel 语义留在
    //                       面板内部（fixed 浮层），因此不注册 overlay。
    const PANEL_ID = 'dsh-host-gateway'
    function PanelListButton(props) {
      // 跟随宿主语言：DSH 改 `<html lang>` 时重渲染（见 subscribeLocale 注释）。
      React.useSyncExternalStore(subscribeLocale, getLocale)
      const iconSize = (props && props.size) || 18
      return React.createElement('svg', {
        width: iconSize,
        height: iconSize,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.8,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': true,
      },
      React.createElement('rect', { x: 6, y: 2, width: 12, height: 20, rx: 2.5 }),
      React.createElement('path', { d: 'M10 18h4' }))
    }

    function PanelPage() {
      React.useSyncExternalStore(subscribeLocale, getLocale)
      return React.createElement('div', { className: 'mgw-page' },
        React.createElement('div', { className: 'mgw-page-inner' },
          React.createElement('header', { className: 'mgw-page-head' },
            React.createElement('h1', { className: 'mgw-page-title' }, tr('移动设备'))),
          React.createElement(DevicePanel)))
    }

    const inject = ['slots']
    function apply(ctx) {
      ctx.effect(() => {
        const style = document.createElement('style')
        style.textContent = panelCss
        document.head.appendChild(style)
        return () => style.remove()
      }, 'mobile-gateway: panel styles')
      // Follow the host language for the whole lifetime of this plugin, not just
      // at boot: DSH rewrites `<html lang>` when the user changes language.
      ctx.effect(() => watchHostLocale(), 'mobile-gateway: host locale tracking')
      // 入口：DSH 侧栏面板列表（portal 同款注册模式）。
      ctx.slots.inject('sidebar.panellist', () => ctx.slots.register(
        { name: 'sidebar.panellist', id: PANEL_ID, order: 90, label: () => tr('移动设备') },
        (props) => React.createElement(PanelListButton, props),
      ))
      // 主内容页：key 与 panellist id 同值，壳据此配成 page switch。
      ctx.slots.inject('main', () => ctx.slots.register(
        { name: 'main', key: PANEL_ID },
        () => React.createElement(PanelPage),
      ))
    }

    exports.apply = apply
    exports.inject = inject
    return module.exports
  },
})
