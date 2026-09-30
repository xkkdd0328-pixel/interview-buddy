/**
 * 本地规则引擎
 *
 * 定位：当 WorkBuddy 内置大模型通道不可用（未开通云服务 / 网络异常 / 模型限流）时，
 *       由本引擎基于 JD 关键词匹配生成一套可用的面试题库，保证功能不中断。
 * 说明：产出结果会在界面上明确标注「本地规则引擎」，不会冒充大模型输出。
 */

import {
  ASK_BACK_QUESTIONS,
  BEHAVIOR_QUESTIONS,
  SKILL_KB,
  type QuestionTemplate,
  type SkillEntry,
} from "./knowledge-base";
import type {
  GeneratedQuestion,
  GenerateQuestionsInput,
  GenerateQuestionsResult,
  AnalyzeInterviewInput,
  AnalyzeInterviewResult,
} from "./types";
import { hasWord, matchTerms } from "../text-match";

/** 业务方向识别词表 */
const DOMAIN_KEYWORDS: { name: string; keywords: string[] }[] = [
  { name: "短视频 / 内容平台", keywords: ["短视频", "视频", "直播", "内容", "推荐", "feed", "创作者"] },
  { name: "电商 / 交易", keywords: ["电商", "交易", "订单", "商品", "支付", "履约", "库存", "供应链"] },
  { name: "社交 / 社区", keywords: ["社交", "社区", "关系链", "私信", "动态", "评论"] },
  { name: "金融 / 支付", keywords: ["金融", "支付", "风控", "信贷", "保险", "证券", "银行", "清算"] },
  { name: "企业服务 / SaaS", keywords: ["saas", "b端", "企业", "中台", "后台管理系统", "低代码", "工作流"] },
  { name: "教育", keywords: ["教育", "课程", "在线学习", "题库", "培训"] },
  { name: "本地生活 / O2O", keywords: ["本地生活", "外卖", "到店", "团购", "出行", "打车", "地图"] },
  { name: "游戏 / 娱乐", keywords: ["游戏", "手游", "引擎", "关卡", "数值"] },
  { name: "人工智能 / 大模型", keywords: ["ai", "大模型", "算法工程", "机器学习", "深度学习", "llm", "智能"] },
  { name: "物流 / 供应链", keywords: ["物流", "仓储", "配送", "运输"] },
  { name: "医疗健康", keywords: ["医疗", "健康", "问诊", "病历", "医药"] },
  { name: "云计算 / 基础设施", keywords: ["云", "基础设施", "容器", "k8s", "kubernetes", "中间件", "运维"] },
];

/** 兜底的通用技术题（当 JD 里识别不到明确技术栈时使用） */
const GENERIC_TECH: QuestionTemplate[] = [
  {
    q: "请介绍一个你最有代表性的项目，说明它的技术选型理由和你承担的部分。",
    a: "回答结构：项目背景与目标 → 为什么选这套技术（对比过哪些方案、关键约束是什么）→ 你负责的模块与具体产出 → 量化的结果（性能提升、成本下降、用户量）。技术选型要能说出「为什么不是另一个」，体现你的判断依据；个人贡献要具体到模块与难点，避免全程用「我们」。",
    knowledge:
      "这是所有技术面试的开场题，也是面试官判断你项目真伪的关键。建议准备 2 个不同侧重的项目（一个偏业务复杂度、一个偏技术深度），并准备好被追问细节。",
  },
  {
    q: "你如何定位和排查一个线上问题？请描述你完整的方法论。",
    a: "①先止血：评估影响面，必要时回滚或降级，把用户影响降到最低；②再定位：看监控与日志（错误率、RT、资源水位），用 traceId 串联链路，缩小到具体服务与代码路径；③后复盘：找到根因（可以用五问法），区分直接原因与系统性原因；④补机制：加监控告警、补测试用例、改流程规范，避免同类问题复发。整个过程要让相关方同步进展。",
    knowledge:
      "考察工程素养与责任心。加分点在于「先止血再定位」的优先级判断，以及「补机制」而非「只修 bug」的闭环意识。",
  },
  {
    q: "请说明你对代码质量的理解，你在项目中如何保证代码质量？",
    a: "质量是多层的：可读性（命名、结构、注释说明为什么而非是什么）、可测试性（纯函数、依赖注入）、健壮性（边界与异常处理）、可维护性（模块边界清晰、低耦合）。落地手段：Code Review 制度化、静态检查与格式化工具（ESLint / Prettier）接入 CI、单元测试覆盖关键逻辑、小步提交便于回滚。核心观点是「质量靠机制而不是靠自觉」。",
    knowledge:
      "面试官关心你是否会写出让别人难以维护的代码。可以顺带讲一个你通过重构改善可维护性的具体例子。",
  },
  {
    q: "如果让你从零设计一个中等规模的前后端系统，你会如何划分模块和确定技术选型？",
    a: "先明确约束：用户量级、读写比例、一致性的要求、团队规模与交付时间。再分层设计：接入层（网关、鉴权、限流）、业务层（按领域划分服务边界，先单体后拆分）、数据层（关系库主存 + 缓存热点 + 对象存储放文件）、支撑层（日志、监控、配置、CI/CD）。选型原则是「用团队熟悉且社区活跃的方案」，避免为炫技引入不必要的复杂度。",
    knowledge:
      "这题考察架构思维而非具体技术。回答时要体现「先看约束再谈方案」的习惯，并主动说明方案的取舍与演进路径。",
  },
  {
    q: "你平时如何做技术选型？举一个你评估新技术的例子。",
    a: "评估维度：是否解决当前真实痛点（而不是为了新技术而技术）、社区活跃度与长期维护性（GitHub 提交频率、issue 响应、是否有大厂背书）、学习与迁移成本、性能与稳定性、生态完善度（文档、周边工具）。做法通常是先做一个最小可用的验证 Demo，在非核心模块试点，用数据验证收益后再推广。",
    knowledge:
      "面试官想听你的判断标准是否成熟，而不是你会用多少工具。切忌把「我学过」当作选型理由。",
  },
];

/** 场景题补充池 */
const GENERIC_SCENE: QuestionTemplate[] = [
  {
    q: "线上突然出现大量用户反馈页面卡顿，你接到这个反馈后会怎么处理？",
    a: "①确认范围：是全域还是特定机型 / 版本 / 地区，用监控和埋点确认影响面；②收集证据：前端性能监控（LCP、FPS、长任务）、错误日志、后端接口 RT，判断是前端渲染问题还是接口慢；③快速缓解：必要时回滚最近一次发布或关闭可疑功能开关；④定位根因并修复：常见原因包括某接口返回数据量激增、内存泄漏、第三方脚本阻塞、缓存失效导致回源风暴；⑤补监控与预案。",
    knowledge:
      "考察故障处理的结构化思维。回答框架「确认范围 → 收集证据 → 快速缓解 → 根因修复 → 补机制」几乎适用于所有线上故障题。",
  },
  {
    q: "如果产品经理提出一个技术上很难实现的需求，你会怎么沟通？",
    a: "先对齐目标而不是直接说「做不到」：问清楚这个需求要解决的用户问题、期望的效果与上线时间。然后给出技术上的分层方案——完整版（成本高、周期长）、可用版（满足核心场景、快速上线）、临时方案（运营手段绕过）。把三者的成本、收益、风险摆出来让产品做选择，把「能不能做」的技术争论转化为「先做哪个」的优先级讨论。",
    knowledge:
      "考察沟通与协作能力。核心是把技术语言翻译成业务语言，并主动提供选项而非只说困难。",
  },
  {
    q: "从 0 到 1 上线一个新功能，你会关注哪些非功能性要求？",
    a: "①性能与容量：预估峰值 QPS 与数据增长，确认是否需要压测与扩容；②稳定性：超时、重试、熔断、降级策略，关键路径是否有兜底；③安全与合规：权限校验、越权防护、敏感数据加密、日志脱敏；④可观测性：埋点、监控指标、告警阈值与值班预案；⑤可回滚：灰度发布、功能开关、数据兼容与回退方案。",
    knowledge:
      "很多候选人只关注功能实现，能主动谈非功能需求的往往是被优先录用的那批。建议背下这五类并各配一个自己的实例。",
  },
];

/** 归一化文本，便于关键词匹配 */
function normalize(text: string) {
  return (text || "").toLowerCase();
}

/** 从 JD 中识别技能 */
export function extractSkills(jd: string, position: string) {
  const haystack = normalize(`${jd} ${position}`);
  const matched: SkillEntry[] = [];
  const labels: string[] = [];

  for (const entry of SKILL_KB) {
    const hit = entry.keywords.some((k) => hasWord(haystack, k));
    if (hit) {
      matched.push(entry);
      labels.push(entry.label);
    }
  }

  // 补充识别 JD 里出现但知识库未单独成项的技术名词，用于展示"已识别关键技能"
  const EXTRA_TERMS = [
    "TypeScript", "JavaScript", "React", "Vue", "Angular", "Next.js", "Nuxt", "Svelte",
    "Node.js", "Java", "Go", "Python", "C++", "Rust", "Spring", "Django", "Flask",
    "MySQL", "PostgreSQL", "MongoDB", "Redis", "Elasticsearch", "Kafka", "RabbitMQ",
    "Docker", "Kubernetes", "Nginx", "Linux", "Git", "Webpack", "Vite", "Tailwind CSS",
    "GraphQL", "RESTful", "Microservice", "AWS", "Prometheus", "Grafana", "Jenkins",
  ];
  for (const term of matchTerms(haystack, EXTRA_TERMS)) {
    if (!labels.some((l) => l.toLowerCase() === term.toLowerCase())) labels.push(term);
  }

  return { matched, labels: Array.from(new Set(labels)) };
}

/** 识别业务方向 */
export function extractDomain(jd: string, company: string) {
  const haystack = normalize(`${jd} ${company}`);
  let best: { name: string; score: number } | null = null;
  for (const d of DOMAIN_KEYWORDS) {
    const score = d.keywords.reduce((n, k) => (haystack.includes(k) ? n + 1 : n), 0);
    if (score > 0 && (!best || score > best.score)) best = { name: d.name, score };
  }
  return best?.name;
}

/** 根据 JD 与岗位名推断难度分布 */
function pickDifficulty(index: number, total: number): "easy" | "medium" | "hard" {
  const ratio = index / Math.max(total - 1, 1);
  if (ratio < 0.25) return "easy";
  if (ratio < 0.75) return "medium";
  return "hard";
}

/** 去重：按题干前 20 个字符判重 */
function dedupe(list: QuestionTemplate[]) {
  const seen = new Set<string>();
  const out: QuestionTemplate[] = [];
  for (const item of list) {
    const key = item.q.replace(/\s/g, "").slice(0, 20);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

/** 生成面试题（本地规则引擎） */
export function generateQuestionsLocal(
  input: GenerateQuestionsInput
): GenerateQuestionsResult {
  const { company, position, jd } = input;
  const { matched, labels } = extractSkills(jd, position);
  const domain = extractDomain(jd, company);

  // ---- 技术题：按命中技能各取题，不足则用通用题补齐至 5 道 ----
  const techPool: QuestionTemplate[] = [];
  const maxPerSkill = matched.length > 0 ? Math.max(1, Math.ceil(5 / matched.length)) : 0;
  for (const skill of matched) {
    for (const t of skill.tech.slice(0, maxPerSkill)) techPool.push(t);
  }
  const tech = dedupe([...techPool, ...GENERIC_TECH]).slice(0, 5);

  // ---- 场景题：优先用命中技能的场景题，再补通用场景题 ----
  const scenePool: QuestionTemplate[] = [];
  for (const skill of matched) {
    for (const s of skill.scene ?? []) scenePool.push(s);
  }
  const scene = dedupe([...scenePool, ...GENERIC_SCENE]).slice(0, 3);

  // ---- 行为题：固定 3 道 ----
  const behavior = dedupe(BEHAVIOR_QUESTIONS).slice(0, 3);

  // ---- 反问题：固定 3 道 ----
  const askBack = dedupe(ASK_BACK_QUESTIONS).slice(0, 3);

  const build = (
    list: QuestionTemplate[],
    type: GeneratedQuestion["type"]
  ): GeneratedQuestion[] =>
    list.map((t, i) => ({
      content: t.q,
      type,
      difficulty: pickDifficulty(i, list.length),
      answer: t.a,
      knowledge: t.knowledge,
    }));

  const questions: GeneratedQuestion[] = [
    ...build(tech, "tech"),
    ...build(scene, "scene"),
    ...build(behavior, "behavior"),
    ...build(askBack, "ask_back"),
  ];

  return {
    questions,
    engine: "local-rule",
    skills: labels.slice(0, 12),
    domain,
    notice:
      "当前结果由「本地规则引擎」依据 JD 关键词生成（WorkBuddy 内置模型通道暂不可用）。题目与思路经过人工整理，可直接使用；如需更强的定制化出题，请检查 AI 通道状态。",
  };
}

/** 面试复盘分析（本地规则引擎） */
export function analyzeInterviewLocal(input: AnalyzeInterviewInput): AnalyzeInterviewResult {
  const { actualQuestions, notes, jd, knownQuestions = [], company, position } = input;

  const actualLines = (actualQuestions || "")
    .split(/\r?\n/)
    .map((l) => l.replace(/^[\s\d.、)）]*/, "").trim())
    .filter((l) => l.length > 1);

  const strengths: string[] = [];
  const improvements: string[] = [];
  const suggestions: string[] = [];
  const missingTopics: string[] = [];

  // ---- 1. 基于复盘笔记中的正向/负向词做粗粒度判断 ----
  const notesText = notes || "";
  const POSITIVE = ["顺利", "答上来", "不错", "熟悉", "做得好", "很有把握", "对答如流", "清晰", "完整"];
  const NEGATIVE = ["没答上", "答不上", "卡住", "不会", "紧张", "答错", "模糊", "没准备", "磕巴", "不清楚"];

  const hitPositive = POSITIVE.filter((w) => notesText.includes(w));
  const hitNegative = NEGATIVE.filter((w) => notesText.includes(w));

  if (actualLines.length > 0) {
    strengths.push(
      `本次${input.round}共记录到 ${actualLines.length} 个实际被问到的问题（如「${actualLines[0]}」等），问题记录完整，这是复盘能被有效分析的前提。`
    );
  } else {
    improvements.push(
      "本次没有记录实际被问到的问题。建议面试后立刻凭记忆补记（每行一个问题），这是后续针对性提升最重要的原始材料。"
    );
  }

  if (hitPositive.length > 0) {
    strengths.push(
      `从你的复盘笔记中可以看出，你对「${hitPositive.slice(0, 3).join("、")}」的环节比较有把握，说明这部分知识掌握扎实，可以继续保持。`
    );
  }

  if (hitNegative.length > 0) {
    improvements.push(
      `笔记中出现了「${hitNegative.slice(0, 3).join("、")}」等描述，建议把对应问题逐个拆开：是「完全不知道」还是「知道但表达不出来」——前者补知识，后者练表达，解决路径完全不同。`
    );
  }

  if (hitPositive.length === 0 && hitNegative.length === 0) {
    improvements.push(
      "复盘笔记偏概括，缺少具体的「哪一问答得好、哪一问答砸了」。建议下次按「问题 → 我的回答 → 面试官反应 → 更好的答法」四栏记录，复盘价值会大幅提升。"
    );
  }

  // ---- 2. 用 JD 与实际问题做覆盖度比对，找出"JD 提到但没被问到"的重点 ----
  const { matched } = extractSkills(jd, position);
  const actualText = normalize(actualQuestions);
  for (const skill of matched) {
    const asked = skill.keywords.some((k) => actualText.includes(k.toLowerCase()));
    const skillAsked = actualText.includes(skill.label.toLowerCase());
    if (!asked && !skillAsked) missingTopics.push(skill.label);
  }

  if (missingTopics.length > 0) {
    improvements.push(
      `JD 中重点提到、但本轮面试尚未被问到的方向有：${missingTopics.slice(0, 6).join("、")}。这些大概率会在后续轮次出现，建议优先准备。`
    );
  }

  // ---- 3. 练习建议 ----
  suggestions.push(
    "把本轮被问到但答得不理想的问题，回到「练习模式」标记为薄弱点，用闪卡反复过一遍，自评到 4 星以上再摘掉标记。"
  );
  if (missingTopics.length > 0) {
    suggestions.push(
      `针对 ${missingTopics.slice(0, 3).join("、")} 各准备一个「30 秒讲清楚」的答案，并配一个自己项目里的例子。`
    );
  }
  suggestions.push(
    "用 STAR 法则把本轮的行为类问题重写一遍答案（情境-任务-行动-结果），重点补上量化的结果数据。"
  );
  suggestions.push(
    "下次面试前，提前准备 3-5 个反问面试官的问题，并在面试结束前问出来——这是最容易被忽视的加分项。"
  );

  // ---- 4. 与已生成题库做对照，提示"锚点题"命中情况 ----
  if (knownQuestions.length > 0 && actualLines.length > 0) {
    const norm = (s: string) => s.replace(/[\s，。？?！!、,.]/g, "");
    const hits = actualLines.filter((line) =>
      knownQuestions.some((kq) => {
        const a = norm(line);
        const b = norm(kq);
        if (!a || !b) return false;
        // 取实际问题前 8 个字与题库题目做包含判断
        const head = a.slice(0, 8);
        return head.length >= 4 && b.includes(head);
      })
    );
    if (hits.length > 0) {
      strengths.push(
        `本轮有 ${hits.length} 道题命中了你提前生成的题库（如「${hits[0]}」），说明「JD 拆解 + 定制题库」的准备方式是有效的。`
      );
    } else {
      suggestions.push(
        "本轮实际问题与你题库的命中率不高，可以回到岗位详情页点击「重新生成」补齐题库，让押题范围更贴近这家公司的问法。"
      );
    }
  }

  return {
    analysis: {
      strengths,
      improvements,
      suggestions,
      missingTopics,
      overall: `这是 ${company} ${position} 的${input.round}复盘。${
        actualLines.length >= 5
          ? "本轮问题记录较完整，复盘材料质量不错。"
          : "问题记录偏少，建议下次面试后第一时间补全。"
      }建议优先处理「需改进」中的第一条，它通常对应你当前最大的提升空间。`,
    },
    engine: "local-rule",
    notice:
      "当前分析由「本地规则引擎」基于关键词与覆盖度比对生成（WorkBuddy 内置模型通道暂不可用），结论偏结构化提醒，不含语义级点评。",
  };
}
