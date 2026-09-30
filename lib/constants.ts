/**
 * 全局常量与字典
 * 对应 PRD 第四节「状态定义」与第五节各模块的枚举值
 */

export type JobStatus =
  | "APPLIED"
  | "VIEWED"
  | "WRITTEN"
  | "INTERVIEW1"
  | "INTERVIEW2"
  | "INTERVIEW3"
  | "HR"
  | "OFFER"
  | "REJECTED"
  | "GAVE_UP";

export type QuestionType = "tech" | "behavior" | "scene" | "ask_back";
export type Difficulty = "easy" | "medium" | "hard";
export type Mood = "good" | "normal" | "bad";

/** 十种岗位状态：中文名、颜色、是否终态 */
export const JOB_STATUS: Record<
  JobStatus,
  { label: string; short: string; color: string; bg: string; text: string; terminal: boolean }
> = {
  APPLIED: {
    label: "已投递",
    short: "已投递",
    color: "#4361ee",
    bg: "bg-brand-50",
    text: "text-brand-700",
    terminal: false,
  },
  VIEWED: {
    label: "已被查看",
    short: "已查看",
    color: "#7b8ff5",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    terminal: false,
  },
  WRITTEN: {
    label: "笔试中",
    short: "笔试中",
    color: "#e9c46a",
    bg: "bg-amber-50",
    text: "text-amber-700",
    terminal: false,
  },
  INTERVIEW1: {
    label: "一面",
    short: "一面",
    color: "#3a0ca3",
    bg: "bg-violet-50",
    text: "text-violet-700",
    terminal: false,
  },
  INTERVIEW2: {
    label: "二面",
    short: "二面",
    color: "#5f27cd",
    bg: "bg-purple-50",
    text: "text-purple-700",
    terminal: false,
  },
  INTERVIEW3: {
    label: "三面+",
    short: "三面+",
    color: "#7209b7",
    bg: "bg-fuchsia-50",
    text: "text-fuchsia-700",
    terminal: false,
  },
  HR: {
    label: "HR 面",
    short: "HR面",
    color: "#f72585",
    bg: "bg-pink-50",
    text: "text-pink-700",
    terminal: false,
  },
  OFFER: {
    label: "已拿 Offer",
    short: "Offer",
    color: "#2a9d8f",
    bg: "bg-teal-50",
    text: "text-teal-700",
    terminal: true,
  },
  REJECTED: {
    label: "已拒绝",
    short: "已拒绝",
    color: "#e63946",
    bg: "bg-red-50",
    text: "text-red-700",
    terminal: true,
  },
  GAVE_UP: {
    label: "已放弃",
    short: "已放弃",
    color: "#94a3b8",
    bg: "bg-slate-100",
    text: "text-slate-600",
    terminal: true,
  },
};

export const JOB_STATUS_KEYS = Object.keys(JOB_STATUS) as JobStatus[];

/** 看板五列：把十种状态归组成 5 个泳道 */
export const KANBAN_COLUMNS: {
  key: string;
  label: string;
  color: string;
  statuses: JobStatus[];
}[] = [
  { key: "applied", label: "已投递", color: "#4361ee", statuses: ["APPLIED", "VIEWED"] },
  { key: "written", label: "笔试中", color: "#e9c46a", statuses: ["WRITTEN"] },
  {
    key: "interview",
    label: "面试中",
    color: "#3a0ca3",
    statuses: ["INTERVIEW1", "INTERVIEW2", "INTERVIEW3", "HR"],
  },
  { key: "offer", label: "Offer", color: "#2a9d8f", statuses: ["OFFER"] },
  { key: "closed", label: "已结束", color: "#94a3b8", statuses: ["REJECTED", "GAVE_UP"] },
];

export function kanbanColumnOf(status: string) {
  const col = KANBAN_COLUMNS.find((c) => c.statuses.includes(status as JobStatus));
  return col?.key ?? "applied";
}

/** 拖到某列时默认落到该列的第一个状态 */
export function defaultStatusOfColumn(columnKey: string): JobStatus {
  const col = KANBAN_COLUMNS.find((c) => c.key === columnKey);
  return (col?.statuses[0] as JobStatus) ?? "APPLIED";
}

/** 进行中 = 非终态 */
export function isActive(status: string) {
  return !JOB_STATUS[status as JobStatus]?.terminal;
}

export const QUESTION_TYPE: Record<
  QuestionType,
  { label: string; color: string; bg: string; text: string }
> = {
  tech: { label: "技术题", color: "#4361ee", bg: "bg-brand-50", text: "text-brand-700" },
  scene: { label: "场景题", color: "#3a0ca3", bg: "bg-violet-50", text: "text-violet-700" },
  behavior: { label: "行为题", color: "#2a9d8f", bg: "bg-teal-50", text: "text-teal-700" },
  ask_back: { label: "反问题", color: "#e9c46a", bg: "bg-amber-50", text: "text-amber-700" },
};

export const QUESTION_TYPE_KEYS = Object.keys(QUESTION_TYPE) as QuestionType[];

/** 题目的展示顺序：技术 → 场景 → 行为 → 反问 */
export const QUESTION_TYPE_ORDER: Record<string, number> = {
  tech: 0,
  scene: 1,
  behavior: 2,
  ask_back: 3,
};

/** 按「技术→场景→行为→反问」稳定排序题目 */
export function sortQuestions<T extends { type: string; createdAt?: string | Date }>(
  list: T[]
): T[] {
  return list.slice().sort((a, b) => {
    const ra = QUESTION_TYPE_ORDER[a.type] ?? 9;
    const rb = QUESTION_TYPE_ORDER[b.type] ?? 9;
    if (ra !== rb) return ra - rb;
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return ta - tb;
  });
}

export const DIFFICULTY: Record<Difficulty, { label: string; stars: number; text: string }> = {
  easy: { label: "简单", stars: 1, text: "text-teal-600" },
  medium: { label: "中等", stars: 2, text: "text-amber-600" },
  hard: { label: "困难", stars: 3, text: "text-red-600" },
};

export const CHANNELS = ["Boss直聘", "拉勾", "官网", "内推", "猎聘", "智联招聘", "其他"];

export const PRIORITY: Record<number, { label: string; color: string; stars: number }> = {
  0: { label: "普通", color: "#94a3b8", stars: 0 },
  1: { label: "感兴趣", color: "#e9c46a", stars: 1 },
  2: { label: "非常想进", color: "#e63946", stars: 2 },
};

export const INTERVIEW_ROUNDS = ["笔试", "一面", "二面", "三面", "HR面", "终面"];

export const MOOD: Record<Mood, { label: string; emoji: string; color: string }> = {
  good: { label: "还不错", emoji: "😊", color: "#2a9d8f" },
  normal: { label: "一般", emoji: "😐", color: "#e9c46a" },
  bad: { label: "不太好", emoji: "😰", color: "#e63946" },
};

/** 转化漏斗的五个阶段（对应状态推进顺序） */
export const FUNNEL_STAGES: {
  key: string;
  label: string;
  /** 达到该阶段（含之后阶段）的状态集合 */
  reachedBy: JobStatus[];
}[] = [
  {
    key: "applied",
    label: "已投递",
    reachedBy: JOB_STATUS_KEYS,
  },
  {
    key: "viewed",
    label: "已查看",
    reachedBy: [
      "VIEWED",
      "WRITTEN",
      "INTERVIEW1",
      "INTERVIEW2",
      "INTERVIEW3",
      "HR",
      "OFFER",
      "REJECTED",
    ],
  },
  {
    key: "written",
    label: "笔试",
    reachedBy: ["WRITTEN", "INTERVIEW1", "INTERVIEW2", "INTERVIEW3", "HR", "OFFER"],
  },
  {
    key: "interview",
    label: "面试",
    reachedBy: ["INTERVIEW1", "INTERVIEW2", "INTERVIEW3", "HR", "OFFER"],
  },
  { key: "offer", label: "Offer", reachedBy: ["OFFER"] },
];

/** 技能雷达图的归类关键词（用于把题目内容归到技术方向） */
export const SKILL_DIMENSIONS: { name: string; keywords: string[] }[] = [
  {
    name: "前端基础",
    keywords: ["html", "css", "javascript", "js", "浏览器", "dom", "渲染", "事件循环", "原型"],
  },
  {
    name: "React / 框架",
    keywords: ["react", "vue", "next", "hooks", "组件", "fiber", "状态管理", "redux", "虚拟dom"],
  },
  {
    name: "工程化",
    keywords: ["webpack", "vite", "构建", "工程化", "monorepo", "ci", "部署", "打包", "babel"],
  },
  {
    name: "性能优化",
    keywords: ["性能", "优化", "首屏", "加载", "缓存", "lighthouse", "白屏", "渲染性能"],
  },
  {
    name: "算法 / 数据结构",
    keywords: ["算法", "数据结构", "复杂度", "数组", "链表", "树", "动态规划", "排序", "哈希"],
  },
  {
    name: "网络 / 后端",
    keywords: ["http", "tcp", "网络", "node", "数据库", "sql", "接口", "服务端", "并发", "缓存策略"],
  },
  {
    name: "系统设计",
    keywords: ["架构", "系统设计", "设计一个", "方案设计", "高可用", "扩展性", "微服务"],
  },
  {
    name: "软素质 / 行为",
    keywords: ["团队", "沟通", "冲突", "协作", "规划", "压力", "复盘", "成长", "为什么"],
  },
];
