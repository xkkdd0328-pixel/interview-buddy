import prisma from "@/lib/db";
import {
  FUNNEL_STAGES,
  JOB_STATUS,
  JOB_STATUS_KEYS,
  KANBAN_COLUMNS,
  SKILL_DIMENSIONS,
  type JobStatus,
} from "@/lib/constants";

/** 判断某状态是否"达到"了某个漏斗阶段 */
function reaches(status: string, reachedBy: JobStatus[]) {
  return reachedBy.includes(status as JobStatus);
}

function startOfWeek(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = (x.getDay() + 6) % 7; // 以周一为一周起点
  x.setDate(x.getDate() - day);
  return x;
}

function isoDate(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${m}-${day}`;
}

/** 汇总首页与数据分析面板所需的全部指标 */
export async function computeStats() {
  const [jobs, questions, interviews] = await Promise.all([
    prisma.job.findMany({
      select: {
        id: true,
        company: true,
        position: true,
        status: true,
        channel: true,
        priority: true,
        salary: true,
        location: true,
        appliedAt: true,
        updatedAt: true,
      },
      orderBy: { appliedAt: "desc" },
    }),
    prisma.question.findMany({
      select: {
        id: true,
        jobId: true,
        type: true,
        content: true,
        rating: true,
        isWeak: true,
        isFavorite: true,
      },
    }),
    prisma.interview.findMany({
      select: { id: true, jobId: true, round: true, date: true, mood: true, aiFeedback: true },
      orderBy: { date: "desc" },
    }),
  ]);

  /* ---------- 1. 顶部指标卡 ---------- */
  const total = jobs.length;
  const active = jobs.filter((j) => !JOB_STATUS[j.status as JobStatus]?.terminal).length;
  const offer = jobs.filter((j) => j.status === "OFFER").length;
  const rejected = jobs.filter((j) => j.status === "REJECTED").length;

  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekInterviews = interviews.filter((i) => {
    const d = new Date(i.date);
    return d >= weekStart && d < weekEnd;
  }).length;

  const upcomingInterviews = interviews
    .filter((i) => new Date(i.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5)
    .map((i) => {
      const job = jobs.find((j) => j.id === i.jobId);
      return {
        id: i.id,
        jobId: i.jobId,
        company: job?.company ?? "未知公司",
        position: job?.position ?? "",
        round: i.round,
        date: i.date.toISOString(),
        mood: i.mood,
        hasFeedback: Boolean(i.aiFeedback),
      };
    });

  /* ---------- 2. 转化漏斗 ---------- */
  const funnel = FUNNEL_STAGES.map((stage, idx, arr) => {
    const value = jobs.filter((j) => reaches(j.status, stage.reachedBy)).length;
    const prev =
      idx === 0 ? value : jobs.filter((j) => reaches(j.status, arr[idx - 1].reachedBy)).length;
    return {
      stage: stage.label,
      key: stage.key,
      value,
      rate: idx === 0 ? 100 : prev ? Math.round((value / prev) * 1000) / 10 : 0,
      overallRate: total ? Math.round((value / total) * 1000) / 10 : 0,
    };
  });

  /* ---------- 3. 状态分布 ---------- */
  const statusDistribution = JOB_STATUS_KEYS.map((k) => ({
    status: k,
    label: JOB_STATUS[k].label,
    value: jobs.filter((j) => j.status === k).length,
    color: JOB_STATUS[k].color,
  })).filter((x) => x.value > 0);

  /* ---------- 4. 看板分组 ---------- */
  const kanban = KANBAN_COLUMNS.map((col) => ({
    key: col.key,
    label: col.label,
    color: col.color,
    count: jobs.filter((j) => col.statuses.includes(j.status as JobStatus)).length,
  }));

  /* ---------- 5. 投递时间线（按周） ---------- */
  const weekMap = new Map<string, { label: string; value: number; ts: number }>();
  for (const job of jobs) {
    const ws = startOfWeek(new Date(job.appliedAt));
    const key = ws.toISOString().slice(0, 10);
    if (!weekMap.has(key)) weekMap.set(key, { label: isoDate(ws), value: 0, ts: ws.getTime() });
    weekMap.get(key)!.value += 1;
  }
  const timeline = Array.from(weekMap.values())
    .sort((a, b) => a.ts - b.ts)
    .map(({ label, value }) => ({ label, value }));

  /* ---------- 6. 渠道分布 ---------- */
  const channelMap = new Map<string, number>();
  for (const job of jobs) {
    const ch = job.channel || "未填写";
    channelMap.set(ch, (channelMap.get(ch) ?? 0) + 1);
  }
  const channels = Array.from(channelMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  /* ---------- 7. 技能雷达图 ---------- */
  const rated = questions.filter((q) => typeof q.rating === "number");
  const radar = SKILL_DIMENSIONS.map((dim) => {
    const hit = rated.filter((q) => {
      const text = q.content.toLowerCase();
      return dim.keywords.some((k) => text.includes(k.toLowerCase()));
    });
    const avg = hit.length ? hit.reduce((s, q) => s + (q.rating ?? 0), 0) / hit.length : 0;
    return { dimension: dim.name, score: Math.round(avg * 10) / 10, samples: hit.length };
  });

  /* ---------- 8. 面试能力成长曲线 ---------- */
  const growth = interviews
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((iv) => {
      const jobQ = rated.filter((q) => q.jobId === iv.jobId);
      const avg = jobQ.length ? jobQ.reduce((s, q) => s + (q.rating ?? 0), 0) / jobQ.length : 0;
      const job = jobs.find((j) => j.id === iv.jobId);
      return {
        date: isoDate(new Date(iv.date)),
        fullDate: new Date(iv.date).toISOString().slice(0, 10),
        company: job?.company ?? "",
        round: iv.round,
        score: Math.round(avg * 10) / 10,
        samples: jobQ.length,
      };
    })
    .filter((g) => g.samples > 0);

  /* ---------- 9. 练习概览 ---------- */
  const practice = {
    totalQuestions: questions.length,
    answered: rated.length,
    weak: questions.filter((q) => q.isWeak).length,
    favorite: questions.filter((q) => q.isFavorite).length,
    avgRating: rated.length
      ? Math.round((rated.reduce((s, q) => s + (q.rating ?? 0), 0) / rated.length) * 10) / 10
      : 0,
  };

  /* ---------- 10. 最近投递 Top5 ---------- */
  const recentJobs = jobs.slice(0, 5).map((j) => ({
    id: j.id,
    company: j.company,
    position: j.position,
    status: j.status,
    salary: j.salary,
    location: j.location,
    channel: j.channel,
    priority: j.priority,
    appliedAt: j.appliedAt.toISOString(),
  }));

  return {
    cards: { total, active, weekInterviews, offer, rejected },
    funnel,
    statusDistribution,
    kanban,
    timeline,
    channels,
    radar,
    growth,
    practice,
    upcomingInterviews,
    recentJobs,
    interviewCount: interviews.length,
    analyzableInterviews: interviews.filter((i) => i.aiFeedback).length,
  };
}

export type StatsPayload = Awaited<ReturnType<typeof computeStats>>;
