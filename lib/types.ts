/** 前端使用的数据类型（日期在 JSON 中为字符串） */

export interface JobDTO {
  id: string;
  company: string;
  position: string;
  jd: string;
  salary: string | null;
  location: string | null;
  url: string | null;
  channel: string | null;
  status: string;
  appliedAt: string;
  updatedAt: string;
  notes: string | null;
  priority: number;
  tags?: { id: string; tag: string }[];
  _count?: { questions: number; interviews: number };
}

export interface QuestionDTO {
  id: string;
  jobId: string;
  type: string;
  difficulty: string;
  content: string;
  answer: string | null;
  myAnswer: string | null;
  rating: number | null;
  isFavorite: boolean;
  isWeak: boolean;
  createdAt: string;
  job?: { company: string; position: string };
}

export interface InterviewDTO {
  id: string;
  jobId: string;
  round: string;
  date: string;
  duration: number | null;
  interviewer: string | null;
  mood: string | null;
  actualQuestions: string | null;
  notes: string | null;
  aiFeedback: string | null;
  createdAt: string;
  job?: { id: string; company: string; position: string; status?: string };
}

export interface AnalysisDTO {
  strengths: string[];
  improvements: string[];
  suggestions: string[];
  missingTopics: string[];
  overall?: string;
}

export interface StatsDTO {
  cards: { total: number; active: number; weekInterviews: number; offer: number; rejected: number };
  funnel: { stage: string; key: string; value: number; rate: number; overallRate: number }[];
  statusDistribution: { status: string; label: string; value: number; color: string }[];
  kanban: { key: string; label: string; color: string; count: number }[];
  timeline: { label: string; value: number }[];
  channels: { name: string; value: number }[];
  radar: { dimension: string; score: number; samples: number }[];
  growth: {
    date: string;
    fullDate: string;
    company: string;
    round: string;
    score: number;
    samples: number;
  }[];
  practice: {
    totalQuestions: number;
    answered: number;
    weak: number;
    favorite: number;
    avgRating: number;
  };
  upcomingInterviews: {
    id: string;
    jobId: string;
    company: string;
    position: string;
    round: string;
    date: string;
    mood: string | null;
    hasFeedback: boolean;
  }[];
  recentJobs: {
    id: string;
    company: string;
    position: string;
    status: string;
    salary: string | null;
    location: string | null;
    channel: string | null;
    priority: number;
    appliedAt: string;
  }[];
  interviewCount: number;
  analyzableInterviews: number;
}

export interface AiStatusDTO {
  enabled: boolean;
  model: string | null;
  endpointHost: string | null;
  engineLabel: string;
  hint: string;
}

export interface SettingsDTO {
  counts: { jobs: number; questions: number; interviews: number; tags: number };
  database: { provider: string; host: string; name: string };
  ai: { enabled: boolean; model: string | null; endpointHost: string | null; engineLabel: string };
}
