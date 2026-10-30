# 从 `dsh-plugin-mobile-gateway` 迁移到 `dsh-host-gateway`

本仓库是上游的 fork，**协议没变**（仍是 `dsh-mobile-v1` / `hello.protocol = 3`），
变的只有 npm 包名与 bundle 名。迁移是一次「换包」操作，不需要重新配对设备。

> 影响面一览
>
> | 项 | 变不变 |
> |---|---|
> | npm 包名 `dsh-plugin-mobile-gateway` → `dsh-host-gateway` | **变** |
> | `dsh.profile.bundles` 里的包名 | **变**（必须同步改，否则 bundle 不生效） |
> | profile 补丁行 `- id: mobile-gateway` | 不变 |
> | 配置键（`gatewayEnabled` / `lanPort` / `requireAuth` / `hostApiPaths` / `deviceFile` …） | 不变 |
> | `deviceFile` 路径与设备表内容 | 不变（已配对设备继续有效） |
> | 网关实例状态文件（`gatewayStateFile`）、`gatewayId` | 不变 |
> | WS 端点 `/ws/mobile`、协议版本、能力位名 | 不变 |
> | 浏览器客户端模块 id（`lib/client.js` 里的 `dsh-host-gateway`） | **变**（1.0.1 起与包名一致；1.0.0 的旧 id 会与旧包撞名，见 §7） |

## 1. 取包

三种方式任选：

```bash
# A. 直接按仓库装（推荐，git 依赖）
dsh plugin --profile web add github:johnhom1024/dsh-host-gateway

# B. 克隆后打 tgz（可复现，离线可用）
git clone https://github.com/johnhom1024/dsh-host-gateway.git
cd dsh-host-gateway && npm pack
# → dsh-host-gateway-1.0.0.tgz

# C. 从 tgz 装
dsh plugin --profile web add /absolute/path/to/dsh-host-gateway-1.0.0.tgz
```

## 2. 换掉 profile 里的 bundle 名

profile 的 `package.json`（例如 `~/.dsh/profiles/web/package.json`）里：

```jsonc
// 迁移前
"dsh": {
  "profile": {
    "bundles": [
      "@deepseek-ai/dsh-base",
      "@deepseek-ai/dsh-web-app",
      "dsh-plugin-mobile-gateway"      // ← 这一条整条替换掉
    ]
  }
}

// 迁移后
"dsh": {
  "profile": {
    "bundles": [
      "@deepseek-ai/dsh-base",
      "@deepseek-ai/dsh-web-app",
      "dsh-host-gateway"
    ]
  }
}
```

**顺序**不用动（网关仍排在 dsh-base / dsh-web-app 之后），旧的包名条目整条替换，**不要两条并存**。

## 3. 卸掉旧包

```bash
dsh plugin --profile web remove dsh-plugin-mobile-gateway
```

如果 profile 依赖里还残留 `file:/tmp/….tgz` 这类已失效的引用，先把它改成一个真实来源
（registry 或本地 tgz），否则后续任何 `dsh plugin add/remove` 都会因为解析不到该引用而失败。

## 4. 不需要改的东西

- profile 补丁里那一行 **`- id: mobile-gateway`**：补丁按 **行 id** 寻址，不按包名。保持原样即可。
- `deviceFile` 指向的设备表文件：**内容与路径都不用动**，已配对设备继续可用；不需要重新扫码。
- 网关实例状态文件（`gatewayStateFile`）：不动，`gatewayId` 因此保持不变。
- 所有配置键：语义与默认值都没变（`gatewayEnabled` 默认 `false`，`requireAuth` 默认 `true`，
  `hostApiPaths` 默认 `[]` 表示该能力不存在）。

## 5. 重启并核对

```bash
# 让宿主重新加载 profile（按你的部署方式：重启 dsh web / 重建容器 / 重启进程）
dsh --profile web --no-open

# 版本核对（容器场景把 <profile> 换成容器内路径）
node -e "console.log(require('<profile>/node_modules/dsh-host-gateway/package.json').version)"
# 期望：1.0.0
```

启动日志里应能看到 bundle 已应用，且**不再出现** `dsh-plugin-mobile-gateway`。

验收清单：

1. `hello` 回包正常，`hello.protocol` 仍是 `3`，`gatewayId` 与迁移前一致。
2. 已配对设备能直接连上（**不需要重新扫码**）；设备面板里设备列表与迁移前相同。
3. 会话历史、实时事件、问答/审批照旧。
4. 如果配了 `hostApiPaths`，`hello.capabilities` 里仍有 `host-api-proxy-v1`。
5. 实时帧里 `job/registered` 带 `jobId` / `toolCall`（网关 ≥ 0.12.2 / 本仓库 1.0.0 起）。

## 6. 回滚

```bash
dsh plugin --profile web remove dsh-host-gateway
dsh plugin --profile web add dsh-plugin-mobile-gateway@0.12.2   # 或原来的本地 tgz
# 把 profile bundles 里的名字改回去，重启宿主
```

设备表与状态文件不受影响，回滚后无需重新配对。

## 7. 浏览器客户端模块 id（1.0.1 起与包名一致）

`lib/client.js` 的模块 `id` 在 **1.0.1** 起改为 `dsh-host-gateway`，与包名一致。

1.0.0 保留了上游的 `dsh-plugin-mobile-gateway`，这是个真实事故：新旧两个包同时存在于客户端模块图里时，
web boot 会直接中止并报

```
client-modules: duplicate factory registration for "dsh-plugin-mobile-gateway"
(bundle executed twice without invalidate?)
```

所以升级到 1.0.1 的正确顺序是：**先卸掉旧包**（`dsh plugin --profile web remove <旧包名>`），
再装 `dsh-host-gateway`，然后重启 `dsh web`（重启会重建客户端模块图）。如果启动日志里仍出现
`duplicate factory registration`，说明还有旧包残留，先把它找出来删掉，不要靠重装新包硬顶。

## 8. 版本号约定

- 本仓库从 `1.0.0` 起（协议 3 + `host-api` 白名单代理 + `job/registered` / `job/settled` 结构化字段）。
- 之后按语义化版本自增：协议、配置语义、能力位的变化才算 minor/major，内部重构与文档走 patch。
- 从上游 cherry-pick 的改动记进 `NOTICE`，不跟随上游的 `0.x` 版本号。
