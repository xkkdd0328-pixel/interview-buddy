/** AI 能力的统一类型定义 */

export type AiEngine = "workbuddy-cloud" | "local-rule";

export interface GeneratedQuestion {
  content: string;
  type: "tech" | "behavior" | "scene" | "ask_back";
  difficulty: "easy" | "medium" | "hard";
  answer: string;
  /** 知识点讲解（PRD 模块 3 要求：每题附带知识点讲解） */
  knowledge?: string;
}

export interface GenerateQuestionsInput {
  company: string;
  position: string;
  jd: string;
  /** 期望题量，默认 15-20 */
  count?: number;
}

export interface GenerateQuestionsResult {
  questions: GeneratedQuestion[];
  engine: AiEngine;
  /** 命中的技能关键词，用于 UI 展示"已识别关键技能" */
  skills: string[];
  /** 识别出的业务方向 */
  domain?: string;
  /** 降级说明，engine 为 local-rule 时给出 */
  notice?: string;
}

export interface InterviewAnalysis {
  /** 回答得好的点 */
  strengths: string[];
  /** 需要改进的点 */
  improvements: string[];
  /** 后续练习建议 */
  suggestions: string[];
  /** JD 中提到但面试没问到的重点（下轮可能考） */
  missingTopics: string[];
  /** 总体评价 */
  overall?: string;
}

export interface AnalyzeInterviewInput {
  company: string;
  position: string;
  jd: string;
  round: string;
  actualQuestions: string;
  notes: string;
  /** 该岗位已生成的题目，用于对比 */
  knownQuestions?: string[];
}

export interface AnalyzeInterviewResult {
  analysis: InterviewAnalysis;
  engine: AiEngine;
  notice?: string;
}
