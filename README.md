# InterviewBuddy

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

AI 驱动的求职管理工具。把「投递进度管理 → 面试题库准备 → 闪卡练习 → 面试复盘」串成一条闭环。

**零外部依赖**：数据库用 SQLite，就是项目里的一个文件。装了 Node 就能跑，不需要安装任何数据库服务。

## 技术栈

| 层 | 选型 |
| --- | --- |
| 框架 | Next.js 14（App Router）+ TypeScript |
| 样式 | Tailwind CSS + 手写 shadcn/ui 风格组件（基于 Radix UI） |
| 数据库 | **SQLite**（Prisma 5 管理，数据文件 `prisma/dev.db`） |
| 图表 | Recharts |
| 拖拽 | @dnd-kit/core |
| AI | WorkBuddy 内置大模型（优先）→ 本地规则引擎（离线兜底） |

## 快速开始

前置：**Node.js 18.17+**（推荐 20 LTS）。除此之外不需要任何东西——不用装数据库。

```bash
npm install
npm run dev
```

打开 http://localhost:3000 即可。**没有任何数据库安装步骤**——`prisma/dev.db` 已随项目提供，含示例数据。

> 国内网络下 `npm install` 可能很慢或超时，可换镜像源：
> ```bash
> npm install --registry=https://registry.npmmirror.com
> ```

如果 `prisma/dev.db` 不存在（例如首次从 Git 克隆），执行一次：

```bash
npm run db:push && npm run db:seed
```

### 拿到压缩包后 `.env` 不见了？

`.env` 是隐藏文件，部分传输方式（微信/企业微信直传、某些邮件网关、部分解压工具）会把它丢掉。
它只装了两项无敏感信息的配置，从模板复制即可：

```bash
cp .env.example .env        # macOS / Linux / Git Bash
copy .env.example .env      # Windows CMD
```

`.env.example` 里的默认值就是可直接运行的 SQLite 配置，复制完不用改任何内容。

## 换电脑 / 迁移到别的机器

这是本项目的设计目标，只有三步：

1. 在新机器上安装 **Node.js 20+**（唯一的前置依赖）
2. 把整个项目目录拷过去（**可以排除 `node_modules`，它有 600MB 且换机器要重装**；
   **务必保留 `prisma/dev.db`**，那是你的全部数据）
3. 执行：

```bash
npm install
npm run dev
```

数据和配置全都跟着走，代码一行都不用改。AI 部分当前是本地规则引擎，所以也不需要配任何 API Key。

> 建议用压缩包传输，并跳过 `node_modules` 和 `.next` 两个目录——它们占 600MB+ 且都可重建。

## 可用脚本

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 生产构建（含 ESLint + 类型检查） |
| `npm run start` | 运行生产构建产物 |
| `npm run db:push` | 把 Prisma schema 同步到数据库（建表） |
| `npm run db:seed` | 写入示例数据（6 岗位 / 21 题 / 4 场面试） |
| `npm run db:restore` | 从 `.migration/mysql-backup.json` 还原一份数据备份（备份仅存在于维护者本地，公开仓库不含） |
| `npm run db:studio` | 打开 Prisma Studio 可视化查看数据 |
| `npm run typecheck` | 仅做 TypeScript 类型检查 |
| `npm run lint` | 运行 ESLint |
| `npm run e2e` | 端到端验收（需应用已启动，覆盖 34 项断言，自动清理测试数据） |

## 功能地图

| 页面 | 路径 | 说明 |
| --- | --- | --- |
| 工作台 | `/` | 关键指标卡片、待办面试、最近投递、练习进度 |
| 岗位管理 | `/jobs` | 列表 / 看板双视图，看板支持拖拽改状态 |
| 新建岗位 | `/jobs/new` | 粘贴 JD 一键智能拆解（公司 / 岗位 / 薪资 / 地点 / 渠道 / 关键词） |
| 岗位详情 | `/jobs/[id]` | JD 全文、题库管理、面试记录、AI 生成题库 |
| 闪卡练习 | `/jobs/[id]/practice`、`/practice` | 翻卡自测、1–5 星自评、标记薄弱点 |
| 面试复盘 | `/interview/[id]` | 记录实际被问问题，AI 生成复盘分析 |
| 数据分析 | `/analyze` | 投递漏斗、状态分布、时间线、技能雷达、渠道对比、成长曲线 |
| 设置 | `/settings` | AI 通道状态、数据导出（JSON/CSV）、导入、清空 |

## AI 能力说明

**开箱即用，不需要任何 API Key。** `lib/ai/provider.ts` 采用双通道设计：

- **本地规则引擎（默认）**：基于内置知识库做关键词匹配，生成题库与面试复盘结论。
  完全离线运行，界面上会明确标注「本地规则引擎」，不冒充大模型输出。
- **大模型通道（可选增强）**：在 `.env` 中填入以下三项即自动切换，支持 OpenAI 兼容接口
  （WorkBuddy 内置模型或其他任意兼容服务均可）：
  ```
  WORKBUDDY_CLOUD_ENDPOINT=""
  WORKBUDDY_CLOUD_KEY=""
  WORKBUDDY_CLOUD_MODEL=""
  ```

在 `/settings` 页面可以实时看到当前生效的通道。

## 关于数据库（SQLite）

- 数据库文件：`prisma/dev.db`，随项目目录一起走
- 想重置数据：`npm run db:seed`（会先清空全部业务数据）
- 想清空但保留空库：应用内「设置 → 清空数据」，或 `npm run db:push -- --force-reset`
- 备份数据：应用内「设置 → 导出 JSON」，或用 `db:restore` 反向还原

### 想切回 MySQL？

改三处即可：`prisma/schema.prisma` 的 `provider` 改回 `mysql`、长文本字段补上 `@db.Text` 标注、
`.env` 的 `DATABASE_URL` 换成 MySQL 连接串，然后 `npm run db:push` 建表。

## 目录结构

```
app/
  api/            # 各资源 REST 接口（jobs / questions / interviews / ai / stats / settings）
  (pages)/        # 页面
components/
  ui/             # 基础组件（button / card / dialog / select ...）
  layout/         # 侧边栏、页头
  common/         # StatusBadge / StatCard / EmptyState / Stars
  charts/         # 六个图表组件
  jobs/ questions/ interview/ practice/ settings/
lib/
  ai/             # knowledge-base / local-engine / provider
  constants.ts    # 状态、枚举、配色、排序规则
  parse-jd.ts     # JD 智能拆解
  text-match.ts   # 关键词边界匹配工具
  stats.ts        # 指标聚合
  db.ts api.ts client.ts types.ts utils.ts
prisma/
  schema.prisma   # Job / JobTag / Question / Interview / Setting
  dev.db          # SQLite 数据库（含全部数据）
  seed.ts         # 示例数据
scripts/
  e2e.mjs         # 端到端验收脚本（npm run e2e）
.migration/       # 迁移前的 MySQL 材料与数据备份（可回退）
```

## 环境要求

- Node.js 20+
- 无需数据库服务
