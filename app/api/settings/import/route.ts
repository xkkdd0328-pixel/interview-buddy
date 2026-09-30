import { NextRequest } from "next/server";

import prisma from "@/lib/db";
import { ok, fail, readJson, handler } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * POST /api/settings/import
 * body: { data: { jobs?, questions?, interviews? }, mode?: "merge" | "replace" }
 * 导入由「导出 JSON」生成的备份文件。
 */
export const POST = handler(async (req: NextRequest) => {
  const body = await readJson(req);
  if (!body) return fail("请求体格式错误");

  const payload = body.data as Record<string, unknown> | undefined;
  if (!payload || typeof payload !== "object") {
    return fail("导入内容格式不正确，请选择由本应用导出的 JSON 文件");
  }

  const jobs = Array.isArray(payload.jobs) ? payload.jobs : [];
  const questions = Array.isArray(payload.questions) ? payload.questions : [];
  const interviews = Array.isArray(payload.interviews) ? payload.interviews : [];

  if (!jobs.length) return fail("备份文件中没有岗位数据");

  const mode = body.mode === "replace" ? "replace" : "merge";

  if (mode === "replace") {
    await prisma.interview.deleteMany({});
    await prisma.question.deleteMany({});
    await prisma.jobTag.deleteMany({});
    await prisma.job.deleteMany({});
  }

  /** 旧 id -> 新 id 映射，保证关联关系不丢 */
  const idMap = new Map<string, string>();
  let jobCount = 0;
  let questionCount = 0;
  let interviewCount = 0;

  for (const raw of jobs) {
    const j = raw as Record<string, unknown>;
    if (!j.company || !j.position || !j.jd) continue;
    const created = await prisma.job.create({
      data: {
        company: String(j.company).slice(0, 200),
        position: String(j.position).slice(0, 200),
        jd: String(j.jd).slice(0, 60000),
        salary: j.salary ? String(j.salary).slice(0, 100) : null,
        location: j.location ? String(j.location).slice(0, 100) : null,
        url: j.url ? String(j.url).slice(0, 1000) : null,
        channel: j.channel ? String(j.channel).slice(0, 50) : null,
        status: j.status ? String(j.status).slice(0, 30) : "APPLIED",
        priority: typeof j.priority === "number" ? Math.min(2, Math.max(0, j.priority)) : 0,
        notes: j.notes ? String(j.notes).slice(0, 60000) : null,
        appliedAt: j.appliedAt ? new Date(String(j.appliedAt)) : new Date(),
        tags: Array.isArray(j.tags)
          ? {
              create: (j.tags as unknown[])
                .map((t) => {
                  const tag = typeof t === "string" ? t : (t as Record<string, unknown>)?.tag;
                  return tag ? { tag: String(tag).slice(0, 30) } : null;
                })
                .filter((x): x is { tag: string } => x !== null),
            }
          : undefined,
      },
    });
    if (typeof j.id === "string") idMap.set(j.id, created.id);
    jobCount++;
  }

  for (const raw of questions) {
    const q = raw as Record<string, unknown>;
    const newJobId = typeof q.jobId === "string" ? idMap.get(q.jobId) : undefined;
    if (!newJobId || !q.content) continue;
    await prisma.question.create({
      data: {
        jobId: newJobId,
        content: String(q.content).slice(0, 5000),
        type: q.type ? String(q.type) : "tech",
        difficulty: q.difficulty ? String(q.difficulty) : "medium",
        answer: q.answer ? String(q.answer).slice(0, 20000) : null,
        myAnswer: q.myAnswer ? String(q.myAnswer).slice(0, 20000) : null,
        rating: typeof q.rating === "number" ? Math.min(5, Math.max(1, q.rating)) : null,
        isFavorite: Boolean(q.isFavorite),
        isWeak: Boolean(q.isWeak),
      },
    });
    questionCount++;
  }

  for (const raw of interviews) {
    const iv = raw as Record<string, unknown>;
    const newJobId = typeof iv.jobId === "string" ? idMap.get(iv.jobId) : undefined;
    if (!newJobId || !iv.round) continue;
    await prisma.interview.create({
      data: {
        jobId: newJobId,
        round: String(iv.round).slice(0, 30),
        date: iv.date ? new Date(String(iv.date)) : new Date(),
        duration: typeof iv.duration === "number" ? iv.duration : null,
        interviewer: iv.interviewer ? String(iv.interviewer).slice(0, 100) : null,
        mood: iv.mood ? String(iv.mood).slice(0, 20) : null,
        actualQuestions: iv.actualQuestions ? String(iv.actualQuestions).slice(0, 20000) : null,
        notes: iv.notes ? String(iv.notes).slice(0, 20000) : null,
        aiFeedback: iv.aiFeedback ? String(iv.aiFeedback).slice(0, 60000) : null,
      },
    });
    interviewCount++;
  }

  return ok({ mode, jobs: jobCount, questions: questionCount, interviews: interviewCount });
});
