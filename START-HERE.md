# 先看这里（3 步跑起来）

前置：装个 **Node.js 18.17+**（推荐 20 LTS）就行，**不用装数据库**。

```bash
npm install      # 国内网络慢的话加一下：--registry=https://registry.npmmirror.com
npm run dev
```

打开 http://localhost:3000 即可。数据库就是项目里的 `prisma/dev.db` 一个文件，**已经带了示例数据**
（6 个岗位 / 21 道题 / 4 场面试），打开就有东西看，不用初始化。

## 两个容易踩的坑

**1. `.env` 丢了？** 它是隐藏文件，有些传输方式和解压工具会把它弄丢。从模板复制一份即可：

```bash
cp .env.example .env
```

模板里的默认值就是能直接跑的配置，不用改。

**2. 端口被占？** `npm run dev -- -p 3001` 换个端口。

## 想改哪里

| 想改的东西 | 去哪 |
| --- | --- |
| 页面 | `app/`（Next.js App Router，一个文件夹一个路由） |
| 组件 | `components/`（`ui/` 是基础件，`jobs/ questions/ interview/ charts/` 是业务件） |
| 接口 | `app/api/`（REST，统一走 `lib/api.ts` 的 `ok()/fail()` 封装） |
| 状态、枚举、配色 | `lib/constants.ts` |
| 数据表结构 | `prisma/schema.prisma` → 改完跑 `npm run db:push` |
| 示例数据 | `prisma/seed.ts` → 改完跑 `npm run db:seed` |
| AI 生成题库 / 复盘逻辑 | `lib/ai/local-engine.ts`（规则引擎）、`lib/ai/knowledge-base.ts`（知识库） |
| JD 智能拆解 | `lib/parse-jd.ts` |

## 改完自测

```bash
npm run typecheck    # 类型检查
npm run lint         # 代码规范
npm run build        # 生产构建（会额外跑 ESLint，比 dev 严格）
npm run e2e          # 端到端验收，34 项断言（需要应用已启动）
```

> 注意：`npm run build` 和 `npm run dev` 会抢 `.next` 目录。build 完再起 dev 若卡在启动阶段，
> 删掉 `.next` 重新 `npm run dev` 即可。

## 数据相关

- 备份：应用内「设置 → 导出」，或直接拷走 `prisma/dev.db`
- 重置成示例数据：`npm run db:seed`
- 清空：应用内「设置 → 清空数据」
- 可视化查看数据：`npm run db:studio`

## 功能与完整说明

详见 `README.md`。
