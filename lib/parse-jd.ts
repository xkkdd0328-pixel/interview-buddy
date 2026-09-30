/**
 * JD 智能拆解（本地解析器）
 *
 * 用途：把用户从招聘网站整段复制来的混乱文本，拆成结构化字段。
 * 策略：正则 + 关键词 + 位置启发式；不依赖网络，结果稳定可预期。
 * 定位：AI 只负责"打草稿"，最终由用户在表单里核对修改后保存。
 *
 * 当 WorkBuddy 内置模型通道可用时，provider 会优先用大模型拆解，
 * 本解析器作为失败兜底与本地默认实现。
 */

import { hasWord } from "./text-match";

export interface ParsedJob {
  company?: string;
  position?: string;
  salary?: string;
  location?: string;
  channel?: string;
  jd: string;
}

/** 主要城市（用于地点识别） */
const CITIES = [
  "北京", "上海", "深圳", "广州", "杭州", "成都", "武汉", "南京", "西安", "苏州",
  "天津", "重庆", "长沙", "郑州", "青岛", "合肥", "福州", "厦门", "济南", "大连",
  "宁波", "无锡", "佛山", "东莞", "珠海", "中山", "昆明", "南昌", "贵阳", "南宁",
  "哈尔滨", "长春", "沈阳", "石家庄", "太原", "兰州", "乌鲁木齐", "海口", "三亚",
  "香港", "澳门", "台北",
];

/** 招聘渠道识别 */
const CHANNEL_RULES: { name: string; keywords: string[] }[] = [
  { name: "Boss直聘", keywords: ["boss直聘", "boss", "直聘"] },
  { name: "拉勾", keywords: ["拉勾", "lagou"] },
  { name: "猎聘", keywords: ["猎聘", "liepin"] },
  { name: "智联招聘", keywords: ["智联", "zhaopin"] },
  { name: "前程无忧", keywords: ["前程无忧", "51job"] },
  { name: "内推", keywords: ["内推", "referral"] },
  { name: "官网", keywords: ["官网", "官方招聘", "校招官网"] },
];

/** 岗位名称的常见后缀（按长度优先，避免"前端开发工程师"被截成"前端开发"） */
const POSITION_SUFFIX =
  "(?:工程师|架构师|设计师|分析师|管理培训生|产品经理|项目经理|技术专家|运营专员|专家|主管|经理|总监|专员|助理|顾问|运营|实习生|实习|管培生)";

function cleanupLine(line: string) {
  return line
    .replace(/^[\s\-•·*※>#|]+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** 提取薪资 */
function extractSalary(text: string): string | undefined {
  // 30-50K / 30k-50k / 30~50K·13薪 / 15-25万 / 8千-1.2万
  const patterns = [
    /\d+(?:\.\d+)?\s*[-~至到]\s*\d+(?:\.\d+)?\s*[KkＫ](?:\s*[·*x×]?\s*\d+\s*薪)?/,
    /\d+(?:\.\d+)?\s*[-~至到]\s*\d+(?:\.\d+)?\s*万(?:\s*[·*x×]?\s*\d+\s*薪)?/,
    /\d+(?:\.\d+)?\s*[KkＫ]\s*[-~至到]\s*\d+(?:\.\d+)?\s*[KkＫ]/,
    /\d+(?:\.\d+)?\s*[-~至到]\s*\d+(?:\.\d+)?\s*[元]\s*\/?\s*[天日月]/,
    /\d+(?:\.\d+)?\s*[-~至到]\s*\d+(?:\.\d+)?\s*[KkＫ]?\s*[元]\s*\/\s*月/,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) return m[0].replace(/\s+/g, "");
  }
  // 单独一行只有薪资的情况
  const lineMatch = text.match(/^[^\n]{0,24}?(薪资|待遇|月薪|年薪)[：:]\s*([^\n]{1,30})$/m);
  if (lineMatch) return lineMatch[2].trim();
  return undefined;
}

/** 提取城市 */
function extractLocation(text: string): string | undefined {
  const explicit = text.match(/(?:工作地点|办公地点|所在城市|地点|城市|base|Base)[：:\s]*([^\n，,。；;]{1,24})/);
  if (explicit) {
    const val = explicit[1].trim();
    const city = CITIES.find((c) => val.includes(c));
    return city ?? val.slice(0, 20);
  }
  // 出现在前 3 行的城市名优先
  const headLines = text.split(/\r?\n/).slice(0, 4).join(" ");
  const headCity = CITIES.find((c) => headLines.includes(c));
  if (headCity) return headCity;
  const anyCity = CITIES.find((c) => text.includes(c));
  return anyCity;
}

/** 提取渠道 */
function extractChannel(text: string): string | undefined {
  const lower = text.toLowerCase();
  for (const rule of CHANNEL_RULES) {
    if (rule.keywords.some((k) => lower.includes(k))) return rule.name;
  }
  return undefined;
}

/** 去掉公司名两端的括号、书名号等噪声 */
function stripCompanyDecor(s: string) {
  return s.replace(/^[【\[（(<《\s]+/, "").replace(/[】\]）)>》\s]+$/, "").trim();
}

/** 提取公司名称 */
function extractCompany(text: string, position?: string): string | undefined {
  const lines = text.split(/\r?\n/).map(cleanupLine).filter(Boolean);

  // 1) 显式标注
  const explicit = text.match(/(?:公司名称|公司|企业名称|所属公司)[：:]\s*([^\n，,。；;]{2,30})/);
  if (explicit) return stripCompanyDecor(explicit[1]);

  // 2) 带工商后缀的完整名称（优先，能拿到"XX有限公司"这种全称）
  const LEGAL_RE =
    /([\u4e00-\u9fa5A-Za-z0-9（）()·]{2,24}?(?:有限公司|股份有限公司|有限责任公司|集团有限公司|集团|公司))/;
  for (const line of lines.slice(0, 6)) {
    const m = line.match(LEGAL_RE);
    if (m) return stripCompanyDecor(m[1]);
  }
  const legalAny = text.match(LEGAL_RE);
  if (legalAny) return stripCompanyDecor(legalAny[1]);

  // 3) 带行业词的简称（如"某某科技""某某网络"）
  const INDUSTRY_RE =
    /([\u4e00-\u9fa5A-Za-z0-9（）()·]{2,20}?(?:科技|网络|信息技术|软件|电子商务|文化传媒|数据科技|智能科技|实业|工作室|事务所))/;
  for (const line of lines.slice(0, 6)) {
    const m = line.match(INDUSTRY_RE);
    if (m) return stripCompanyDecor(m[1]);
  }

  // 4) 兜底：前 3 行里，位于岗位名称之前的那一段通常就是公司名
  if (position) {
    for (const line of lines.slice(0, 3)) {
      const idx = line.indexOf(position);
      if (idx > 0) {
        const before = cleanupLine(line.slice(0, idx));
        const cleaned = stripCompanyDecor(
          before.replace(/(招聘|急招|高薪|诚聘|内推|岗位|职位)[:：]?/g, "")
        );
        if (cleaned.length >= 2 && cleaned.length <= 20 && !/\d/.test(cleaned)) return cleaned;
      }
    }
  }

  // 5) 再兜底：第一行是短文本且不含常见噪声词，就当作公司名
  const first = lines[0];
  if (
    first &&
    first.length >= 2 &&
    first.length <= 20 &&
    !/\d/.test(first) &&
    !/(招聘|岗位职责|任职要求|薪资|待遇|来源|职位描述)/.test(first)
  ) {
    return stripCompanyDecor(first);
  }
  return undefined;
}

/** 提取岗位名称 */
function extractPosition(text: string): string | undefined {
  const lines = text.split(/\r?\n/).map(cleanupLine).filter(Boolean);

  const explicit = text.match(
    /(?:岗位名称|职位名称|招聘职位|岗位|职位|应聘职位)[：:]\s*([^\n，,。；;]{2,30})/
  );
  if (explicit) return explicit[1].trim();

  const POS_RE = new RegExp(`([\\u4e00-\\u9fa5A-Za-z0-9+./]{2,20}?${POSITION_SUFFIX})`);

  // 前几行里最像岗位名的
  for (const line of lines.slice(0, 6)) {
    if (line.length > 40) continue;
    const m = line.match(POS_RE);
    if (m) return m[1];
  }
  const any = text.match(POS_RE);
  return any?.[1];
}

/**
 * 智能拆解 JD 文本。
 * 说明：`jd` 始终为原始全文（不做裁剪），保证信息不丢。
 */
export function parseJobText(raw: string): ParsedJob {
  const text = (raw || "").replace(/\r\n/g, "\n").trim();
  if (!text) return { jd: "" };

  const position = extractPosition(text);
  return {
    company: extractCompany(text, position),
    position,
    salary: extractSalary(text),
    location: extractLocation(text),
    channel: extractChannel(text),
    jd: text,
  };
}

/** 生成拆解结果的字段级高亮信息，供 UI 展示 */
export function describeParsed(parsed: ParsedJob) {
  const fields: { label: string; value: string }[] = [];
  if (parsed.company) fields.push({ label: "公司名称", value: parsed.company });
  if (parsed.position) fields.push({ label: "岗位名称", value: parsed.position });
  if (parsed.salary) fields.push({ label: "薪资范围", value: parsed.salary });
  if (parsed.location) fields.push({ label: "工作地点", value: parsed.location });
  if (parsed.channel) fields.push({ label: "投递渠道", value: parsed.channel });
  return fields;
}

/** 从 JD 中粗略抽取技能关键词，用于在 UI 上展示"已识别关键技能" */
export function extractJdKeywords(jd: string, limit = 10): string[] {
  const KNOWN = [
    "React", "Vue", "Angular", "TypeScript", "JavaScript", "Next.js", "Nuxt", "Svelte",
    "Node.js", "Java", "Go", "Python", "C++", "Rust", "PHP", "Spring", "Spring Boot",
    "Django", "Flask", "NestJS", "Express", "Koa",
    "MySQL", "PostgreSQL", "MongoDB", "Redis", "Elasticsearch", "Kafka", "RabbitMQ",
    "Docker", "Kubernetes", "K8s", "Nginx", "Linux", "Git", "Webpack", "Vite", "Rollup",
    "Tailwind CSS", "Sass", "LESS", "GraphQL", "RESTful", "gRPC", "微服务",
    "AWS", "阿里云", "腾讯云", "Prometheus", "Grafana", "Jenkins", "CI/CD",
    "小程序", "Flutter", "React Native", "Android", "iOS", "Swift", "Kotlin",
    "机器学习", "深度学习", "大模型", "NLP", "推荐算法", "数据分析", "SQL",
    "HTML", "CSS", "WebGL", "Three.js", "Echarts", "D3.js",
  ];
  const lower = jd.toLowerCase();

  // 用「词边界」匹配，避免 Java 命中 JavaScript、SQL 命中 MySQL 之类的子串误判
  const hit = KNOWN.filter((k) => hasWord(lower, k));

  // 去重：同义重复（K8s / Kubernetes）与「长词已覆盖短词」（React Native → React）
  const unique: string[] = [];
  for (const k of hit) {
    const kl = k.toLowerCase();
    if (unique.some((u) => u.toLowerCase() === kl)) continue;
    if (unique.some((u) => u.length > k.length && u.toLowerCase().startsWith(kl))) continue;
    for (let i = unique.length - 1; i >= 0; i -= 1) {
      const u = unique[i];
      if (k.length > u.length && kl.startsWith(u.toLowerCase())) unique.splice(i, 1);
    }
    unique.push(k);
  }
  return unique.slice(0, limit);
}
