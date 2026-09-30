/**
 * InterviewBuddy — 示例数据 Seed
 *
 * 用法：npm run db:seed
 * 说明：会先清空全部业务数据（Job / JobTag / Question / Interview），再写入一套演示数据。
 */

import "./load-env";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type SeedQuestion = {
  type: "tech" | "scene" | "behavior" | "ask_back";
  difficulty: "easy" | "medium" | "hard";
  content: string;
  answer?: string;
  rating?: number;
  isWeak?: boolean;
  isFavorite?: boolean;
};

type SeedJob = {
  company: string;
  position: string;
  jd: string;
  salary?: string;
  location?: string;
  channel?: string;
  status: string;
  appliedAt: string; // YYYY-MM-DD
  priority?: number;
  notes?: string;
  tags?: string[];
  questions?: SeedQuestion[];
  interviews?: {
    round: string;
    date: string;
    duration?: number;
    interviewer?: string;
    mood?: "good" | "normal" | "bad";
    actualQuestions?: string;
    notes?: string;
  }[];
};

const JOBS: SeedJob[] = [
  {
    company: "字节跳动",
    position: "前端开发工程师",
    jd: `字节跳动 前端开发工程师（北京）
薪资：30-50K·15薪
岗位职责：
1. 负责短视频业务的前端架构设计与开发，使用 React 18 + TypeScript；
2. 参与前端性能优化，保障首屏加载速度与交互流畅度；
3. 与后端协作完成 Node.js BFF 层的接口设计与联调；
4. 参与前端工程化建设，优化 Webpack / Vite 构建流程。
任职要求：
1. 熟练掌握 JavaScript / TypeScript，理解浏览器渲染原理与事件循环；
2. 熟悉 React 生态，了解 Fiber 架构与 Hooks 原理，有性能优化经验；
3. 熟悉 MySQL 与 Redis 的基本使用，理解 HTTP 缓存机制；
4. 有良好的沟通协作能力，能主动推动跨团队项目落地。
来源：Boss直聘`,
    salary: "30-50K·15薪",
    location: "北京",
    channel: "Boss直聘",
    status: "INTERVIEW1",
    appliedAt: "2026-09-15",
    priority: 2,
    notes: "一面反馈不错，重点准备了性能优化与 Fiber 原理。",
    tags: ["前端", "大厂", "React"],
    questions: [
      {
        type: "tech",
        difficulty: "medium",
        content: "说说 React Fiber 架构解决了什么问题？时间切片是怎么实现的？",
        answer:
          "要点：① React 15 的栈调和是同步递归，长任务阻塞主线程导致掉帧；② Fiber 把渲染拆成可中断的工作单元，用链表结构（child/sibling/return）替代递归栈；③ 借助 requestIdleCallback/Scheduler 做时间切片，把任务切成 5ms 左右的小片；④ 双缓存树（current / workInProgress）保证可随时中断并复用进度；⑤ 优先级调度：事件优先级 → Lane 模型 → 可打断低优先级更新。",
        rating: 4,
      },
      {
        type: "tech",
        difficulty: "hard",
        content: "首屏加载如何从 3s 优化到 1s 以内？请给出可执行的完整方案。",
        answer:
          "思路：先量化（Lighthouse / WebPageTest 拆解 TTFB、FCP、LCP）。优化手段分层：① 网络层：CDN、HTTP/2、Brotli、DNS 预解析、preconnect；② 资源层：路由级代码分割 + 动态 import、按需加载组件、图片 WebP/AVIF + 懒加载 + 响应式尺寸；③ 渲染层：SSR/SSG 首屏直出、关键 CSS 内联、字体 font-display: swap；④ 缓存层：强缓存 + 内容哈希、Service Worker 预缓存；⑤ 运行时：减少主线程长任务、虚拟列表。最后灰度对比指标验证。",
        rating: 3,
        isWeak: true,
      },
      {
        type: "tech",
        difficulty: "medium",
        content: "useEffect 的依赖数组为空、不写、写具体依赖，三者执行时机有什么区别？",
        answer:
          "① 不写依赖：每次渲染后都执行，容易死循环；② 空数组 []：仅挂载后执行一次、卸载前清理一次；③ 写依赖 [a]：挂载后执行 + a 变化后执行。底层是浅比较依赖数组，React 会保存上一次依赖做 diff。注意闭包陷阱：依赖缺失会读到旧值，需用函数式更新或 useRef 兜底。",
        rating: 5,
      },
      {
        type: "tech",
        difficulty: "easy",
        content: "HTTP 缓存中强缓存与协商缓存的区别？分别涉及哪些响应头？",
        answer:
          "强缓存：命中则不发请求，直接读本地缓存，响应头 Cache-Control(max-age / immutable) / Expires；协商缓存：发请求带校验字段，服务端比对后返回 304 或 200，响应头 ETag/If-None-Match（内容哈希，精度高）、Last-Modified/If-Modified-Since（秒级，精度低）。实际策略：HTML 用 no-cache + 协商缓存，带哈希的静态资源用 max-age=31536000, immutable。",
        rating: 4,
      },
      {
        type: "scene",
        difficulty: "medium",
        content: "线上突然出现大量「白屏」告警，你如何定位和止损？",
        answer:
          "止损优先：① 确认影响范围（版本 / 机型 / 地域），必要时回滚上一次发布；② 看监控：JS 错误率、资源加载失败率、CDN 状态；③ 常见原因排查：新版本 JS 资源 404（CDN 未同步 / 缓存击穿）、接口 500 导致首屏数据缺失、CSS 加载失败。根因治理：加 ErrorBoundary 兜底 UI、Sentry 捕获 sourcemap、静态资源版本校验、灰度发布 + 自动回滚。",
        rating: 3,
      },
      {
        type: "behavior",
        difficulty: "medium",
        content: "讲一个你主动推动、跨团队协作落地的项目，遇到的最大阻力是什么？",
        answer:
          "用 STAR 回答：S 背景（业务痛点 + 量化损失）、T 目标（你承担的角色与非你不可的原因）、A 行动（如何拉齐各方诉求：先找关键决策人、用数据说话、拆解成小步可交付、定期同步进度）、R 结果（用数字说话，如构建耗时下降 60%）。结尾补一句复盘：如果重来会怎么做。",
        rating: 4,
      },
      {
        type: "ask_back",
        difficulty: "easy",
        content: "这个岗位所在的团队目前的技术栈和下一步规划是什么？",
        answer:
          "反问要点：① 团队规模与分工；② 技术栈现状与演进方向；③ 团队当前最大的技术挑战；④ 新人前 3 个月的预期产出。目的是展示技术关注度，同时判断岗位匹配度。",
      },
    ],
    interviews: [
      {
        round: "一面",
        date: "2026-09-20",
        duration: 60,
        interviewer: "前端 Leader",
        mood: "good",
        actualQuestions:
          "1. React Fiber 与时间切片\n2. 首屏性能优化实战\n3. useEffect 依赖与闭包陷阱\n4. 项目中最难的技术问题",
        notes:
          "整体顺利，性能优化部分答得比较细。Fiber 的 Lane 优先级模型说得不够深入，需要补。",
      },
    ],
  },
  {
    company: "腾讯",
    position: "后端开发工程师",
    jd: `腾讯 后端开发工程师（深圳）25-40K
岗位职责：负责微信支付后台服务的设计与开发，使用 Java / Spring Boot / MySQL / Redis。
任职要求：
1. 熟悉 Java 并发编程与 JVM 调优；
2. 熟悉 MySQL 索引优化与事务隔离级别；
3. 了解 Redis 缓存穿透/击穿/雪崩的应对方案；
4. 有高并发系统经验者优先。`,
    salary: "25-40K",
    location: "深圳",
    channel: "拉勾",
    status: "WRITTEN",
    appliedAt: "2026-09-12",
    priority: 2,
    tags: ["后端", "大厂", "Java"],
    questions: [
      {
        type: "tech",
        difficulty: "medium",
        content: "MySQL InnoDB 的四种事务隔离级别分别解决了什么问题？",
        answer:
          "① READ UNCOMMITTED：脏读、不可重复读、幻读都可能；② READ COMMITTED：解决脏读（每次快照读生成新 ReadView）；③ REPEATABLE READ（InnoDB 默认）：解决脏读 + 不可重复读，通过 MVCC + Next-Key Lock 在很大程度上避免幻读；④ SERIALIZABLE：全部串行，性能最差。",
        rating: 3,
      },
      {
        type: "tech",
        difficulty: "medium",
        content: "缓存穿透、击穿、雪崩分别是什么？各自的解决方案？",
        answer:
          "穿透：查不存在的数据绕过缓存打到 DB → 布隆过滤器 / 空值缓存（短 TTL）；击穿：热点 key 过期瞬间大量请求打 DB → 互斥锁重建 / 逻辑过期不设 TTL；雪崩：大量 key 同时过期或 Redis 宕机 → TTL 加随机抖动 / 多级缓存 / 熔断降级 / 集群高可用。",
        rating: 2,
        isWeak: true,
      },
    ],
    interviews: [],
  },
  {
    company: "小红书",
    position: "全栈开发工程师",
    jd: `小红书 全栈开发工程师（上海）28-45K
岗位职责：社区内容业务的前后端一体化开发，Node.js + React。
任职要求：熟悉 TypeScript，了解 SSR 与 Node 服务端开发，有全栈项目经验。`,
    salary: "28-45K",
    location: "上海",
    channel: "官网",
    status: "APPLIED",
    appliedAt: "2026-09-22",
    priority: 1,
    tags: ["全栈", "Node", "React"],
  },
  {
    company: "美团",
    position: "前端开发工程师",
    jd: `美团 前端开发工程师（北京）25-40K
岗位职责：到店业务 C 端页面开发，React + 小程序。
任职要求：扎实的 JS 基础，熟悉小程序开发，有 To C 性能优化经验。`,
    salary: "25-40K",
    location: "北京",
    channel: "内推",
    status: "REJECTED",
    appliedAt: "2026-09-05",
    priority: 1,
    notes: "简历未通过筛选，反馈是缺少小程序项目经验。",
    tags: ["前端", "小程序"],
    interviews: [],
  },
  {
    company: "百度",
    position: "算法工程师",
    jd: `百度 算法工程师（北京）35-60K
岗位职责：搜索排序算法研发，大规模机器学习与深度学习。
任职要求：熟悉 PyTorch，有推荐/搜索/NLP 相关项目经验，硕士及以上。`,
    salary: "35-60K",
    location: "北京",
    channel: "Boss直聘",
    status: "OFFER",
    appliedAt: "2026-08-28",
    priority: 2,
    notes: "已拿 Offer，薪资谈判中，下周给答复。",
    tags: ["算法", "大厂", "NLP"],
    interviews: [
      {
        round: "一面",
        date: "2026-09-02",
        duration: 45,
        mood: "normal",
        actualQuestions: "1. 项目经历追问\n2. 排序模型选型\n3. 过拟合怎么处理",
        notes: "面试官偏工程，对模型落地细节问得比较细。",
      },
      {
        round: "HR面",
        date: "2026-09-18",
        duration: 30,
        mood: "good",
        actualQuestions: "1. 职业规划\n2. 期望薪资\n3. 为什么选择百度",
        notes: "沟通顺畅，HR 明确表示会尽快发 Offer。",
      },
    ],
  },
  {
    company: "某电商创业公司",
    position: "Node.js 后端工程师",
    jd: `某电商创业公司 Node.js 后端工程师（杭州）18-28K
岗位职责：负责订单与库存系统开发，NestJS + MySQL + Redis。
任职要求：熟悉 Node.js 生态，了解分布式事务，能独立负责模块。`,
    salary: "18-28K",
    location: "杭州",
    channel: "Boss直聘",
    status: "VIEWED",
    appliedAt: "2026-09-19",
    priority: 0,
    tags: ["后端", "Node"],
  },
];

async function main() {
  console.log("🧹 清空旧数据 ...");
  await prisma.question.deleteMany();
  await prisma.interview.deleteMany();
  await prisma.jobTag.deleteMany();
  await prisma.job.deleteMany();

  console.log("🌱 写入示例数据 ...");
  let jobCount = 0;
  let questionCount = 0;
  let interviewCount = 0;

  for (const j of JOBS) {
    const job = await prisma.job.create({
      data: {
        company: j.company,
        position: j.position,
        jd: j.jd,
        salary: j.salary ?? null,
        location: j.location ?? null,
        channel: j.channel ?? null,
        status: j.status,
        appliedAt: new Date(`${j.appliedAt}T00:00:00.000Z`),
        priority: j.priority ?? 0,
        notes: j.notes ?? null,
        tags: j.tags?.length
          ? { create: j.tags.map((tag) => ({ tag })) }
          : undefined,
        questions: j.questions?.length
          ? {
              create: j.questions.map((q) => ({
                type: q.type,
                difficulty: q.difficulty,
                content: q.content,
                answer: q.answer ?? null,
                rating: q.rating ?? null,
                isWeak: q.isWeak ?? false,
                isFavorite: q.isFavorite ?? false,
              })),
            }
          : undefined,
        interviews: j.interviews?.length
          ? {
              create: j.interviews.map((it) => ({
                round: it.round,
                date: new Date(`${it.date}T00:00:00.000Z`),
                duration: it.duration ?? null,
                interviewer: it.interviewer ?? null,
                mood: it.mood ?? null,
                actualQuestions: it.actualQuestions ?? null,
                notes: it.notes ?? null,
              })),
            }
          : undefined,
      },
    });
    jobCount += 1;
    questionCount += j.questions?.length ?? 0;
    interviewCount += j.interviews?.length ?? 0;
    console.log(`  ✓ ${job.company} · ${job.position}`);
  }

  console.log(
    `\n✅ 完成：${jobCount} 个岗位 / ${questionCount} 道题目 / ${interviewCount} 条面试记录`
  );
}

main()
  .catch((e) => {
    console.error("❌ Seed 失败：", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
