#

Anime 与 Galgame / Visual Novel 私人收藏数据库。公共作品资料可由 Bangumi、AniList 与 VNDB 提供；评分、状态、进度、标签、Route 和笔记保存在 `DATABASE_URL` 指向的数据库，并按登录账号严格隔离。

## 已实现

- 中文搜索：Bangumi 中文检索，Anime 可由 AniList 补充详情，Galgame 可由 VNDB 补充详情
- 搜索结果使用统一媒体结构、中文优先展示、自定义相关性排序、跨源去重和外部 ID 合并；全部搜索并行覆盖 Anime 与 Galgame
- Better Auth 邮箱密码注册、登录与数据库会话
- 新账号空收藏库；搜索本身不会创建作品或收藏
- `Media` 公共作品与 `UserEntry` 私人记录分离，同一作品可供多个账号独立收藏
- 中文标题、原始标题、英文/罗马字与别名的本地检索
- Anime 状态：想看、正在看、看过；Galgame 状态：想玩、正在玩、玩过
- 封面网格 Library、Dashboard、详情编辑、手动添加、JSON 导入导出
- 无损 SQL migration；不会通过启动脚本 seed 示例作品或示例用户

## 本地运行

环境要求：Node.js 22 或更高版本、pnpm 10 或更高版本。

```powershell
pnpm install
Copy-Item .env.example .env
# 本地开发可将 DATABASE_URL 改为：file:../prisma/dev.db
pnpm db:generate
pnpm db:migrate
pnpm dev
```

首次配置时，请把部署环境中的 `BETTER_AUTH_SECRET` 替换为至少 32 字符的高熵随机值，再通过部署域名注册账号。新账号的 Library 一定为空。

开发环境可以将 `DATABASE_URL` 设置为 SQLite `file:` URL；生产环境请使用 PostgreSQL/Supabase URL。迁移脚本根据 `DATABASE_URL` 选择 SQLite 迁移或 PostgreSQL Prisma migration，不删除数据库、不清空数据、也不运行 seed。

## 外部资料源

- Bangumi：中文搜索与中文标题；官方要求配置能标识个人和应用的 `BANGUMI_USER_AGENT`。
- AniList：Anime 详细资料补充，无 Token 也可读取公开数据。
- VNDB Kana：Visual Novel 详细资料补充，公开查询无需 Token。

可选 Token 只写入本机 `.env`，不要提交到 Git。某个详情源匹配不可靠时会保留为空，不会伪造数据。

## 数据与备份

“我的收藏”页面支持导出及导入 JSON。重复导入按外部引用合并公共作品，并按 `(userId, mediaId)` 更新当前账号的私人记录。生产环境请使用数据库平台备份，并定期导出收藏 JSON。

## 常用命令

```powershell
pnpm dev
pnpm build
pnpm start
pnpm test
pnpm lint
pnpm typecheck
pnpm db:migrate
pnpm db:studio
```

## Vercel 部署

仓库根目录的 `vercel.json` 固定使用 Next.js Framework Preset、`pnpm vercel-build` 和 Next.js 默认输出目录。生产构建会在完成后检查 `.next` 清单，确认 `/api/auth/[...all]` 已生成 App Route、动态路由和 Server Function；缺少任意一项时部署会直接失败。

Vercel 项目的 Root Directory 应保持为仓库根目录。部署完成后可访问 `/api/auth/get-session` 验证认证路由；未登录时正常响应为 `200` 和 `null`，而不是 `404`。

## 数据模型

- `Media`：共享作品资料，包含 `titleCn` 与多标题 JSON。
- `ExternalMetadata`：主要同步来源及原始响应。
- `ExternalReference`：同一作品的 Bangumi/AniList/VNDB ID，全局唯一，用于跨源去重。
- `User` / `Session` / `Account`：Better Auth 身份与会话。
- `UserEntry`：`(userId, mediaId)` 唯一；所有评分、状态、进度、日期与笔记都在这里。
- `Tag` / `UserEntryTag`：标签归属于用户。
- `RouteProgress`：归属于某一条用户收藏记录。

所有私人读取与写入都从服务端会话取得 `userId`，不会接受客户端传来的用户 ID，也不会回退到固定用户。
