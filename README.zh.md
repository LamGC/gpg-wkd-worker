# 🔐 Cloudflare WKD Server

[English](./README.md) | 中文

基于 Cloudflare Workers & Assets 的 **Web Key Directory (WKD)** 自动化分发方案。只需将 PGP 公钥存入仓库，即可自动部署全球分发的公钥查询服务。  

[什么是 WKD?](https://www.webkeydirectory.com/what-is-wkd) | 自动化 z-base-32 哈希映射 | 零成本维护

---

## ✨ 为什么选择本项目？

- **自动化构建**：无需手动计算复杂的 WKD 哈希。GitHub Actions 会自动解析目录并生成映射。
- **全球加速**：利用 Cloudflare 边缘网络，在全球范围内提供极速的公钥检索响应。
- **强兼容性**：同时支持 **Advanced** 和 **Direct** 两种 WKD 查询模式。
- **GitOps 流程**：像管理代码一样管理你的公钥。新增用户只需 `git push`。

---

## 🚀 快速开始 (Quick Start)

### 1. 创建你的仓库
点击仓库顶部的 **Fork** 按钮，创建一个新的私有或公开仓库。

> **注意**: 通过 Fork 创建的仓库，GitHub 默认会禁用 Actions。请前往仓库的 **Actions** 标签页，点击 **"I understand my workflows, go ahead and enable them"** 按钮。

### 2. 清理并添加你的密钥
为了防止部署示例数据，请先清理目录：

1. **清理目录**：删除 `keys/` 文件夹下所有现有的子文件夹（即删除我的域名和密钥）。
2. **导出密钥**：导出你的二进制公钥（必须包含你要托管的 Email）：
   ```bash
   # 导出公钥，建议剥离他人签名以减小体积 (推荐)
   # 如果你的邮箱是 alice@example.com, 那么你的文件名必须是 alice.gpg，就像这样
   gpg --export --export-options export-clean alice@example.com > alice.gpg

   # 如果你想公开所有他人对你的签名, 则不需要增加 --export-options export-clean。
   gpg --export alice@example.com > alice.gpg
   ```
3. **按结构存放**：将导出的 `.gpg` 文件放入对应域名的文件夹中：
   - 路径格式：`keys/{域名}/{用户名}.gpg`
   - 示例：`keys/example.com/alice.gpg`

### 3. 配置部署密钥
在 GitHub 仓库的 `Settings -> Secrets and variables -> Actions` 中添加以下 **Repository Secrets**：
- `CLOUDFLARE_API_KEY`: 你的 Cloudflare API 令牌（需具备 Workers 部署权限，可以选择“编辑 Worker”模板）。
- `CLOUDFLARE_ACCOUNT_ID`: 你的 Cloudflare 账户 ID。

### 4. 自动化部署
只需执行 Git 推送，GitHub Actions 就会自动计算哈希并部署：
```bash
git add .
git commit -m "feat: setup my wkd keys"
git push origin main
```

### 5. 设置 Worker 路由
待 Github Actions 完成部署后，转到 [Cloudflare Dashboard](https://dash.cloudflare.com/?to=/:account/workers-and-pages)，
找到 `gpg-wkd-worker` Worker，在**设置**、**域和路由**中，将你的邮箱域名添加到 Worker 中：
 - 支持 `openpgpkey.<email-domain>` 或 `<email-domain>` 两种形式，可同时使用。

---

## 💻 本地部署 (Manual Deployment)

如果你想在本地进行开发，或者更喜欢手动通过 CLI 部署，请按以下步骤操作。由于 `key-manifest.json` 是动态生成的，你需要手动运行生成脚本。

### 1. 环境准备
确保已安装 Node.js（要求 Node.js v22+），并登录 Wrangler：
```bash
npm install
npx wrangler login
```

### 2. 生成清单文件
在部署之前，**必须**先将密钥正确放在 `keys/` 目录中，并运行脚本生成 `src/key-manifest.json`：
```bash
# 运行生成脚本 (请确保你在项目根目录下)
node generate-manifest.mjs
```
*运行成功后，你应该能在终端看到生成的 Key 数量提示。*

### 3. 部署到 Cloudflare
```bash
npx wrangler deploy
```

### 4. 设置 Worker 路由
待 Github Actions 完成部署后，转到 [Cloudflare Dashboard](https://dash.cloudflare.com/?to=/:account/workers-and-pages)，
找到 `gpg-wkd-worker` Worker，在**设置**、**域和路由**中，将你的邮箱域名添加到 Worker 中，支持 `openpgpkey.<email-domain>` 或 `<email-domain>` 两种形式，可同时使用。

---

## ✅ 如何验证？

部署完成后，你可以通过以下两种方式验证服务是否正常：

**方式一：命令行验证 (GnuPG)**

```bash
# 使用 GnuPG 直接定位外部密钥
gpg --locate-external-keys --auto-key-locate wkd your-email@example.com
```
如果成功，你应该能看到公钥被自动导入的提示。

**方式二：在线工具验证**

访问 [Web Key Directory Validator](https://www.webkeydirectory.com/)，输入你的 Email 地址进行检测。

---
