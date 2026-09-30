import { NextRequest } from "next/server";

import prisma from "@/lib/db";
import { ok, fail, readJson, requiredStr, handler } from "@/lib/api";
import { analyzeInterview } from "@/lib/ai/provider";

export const dynamic = "force-dynamic";
export const maxDuration = 180;

/**
 * POST /api/ai/analyze-interview
 * body: { interviewId, actualQuestions?, notes?, round? }
 * 生成复盘分析并写入 Interview.aiFeedback（JSON 字符串）。
 */
export const POST = handler(async (req: NextRequest) => {
  const body = await readJson(req);
  if (!body) return fail("请求体格式错误");

  const interviewId = requiredStr(body.interviewId, "interviewId", 50);
  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: {
      job: { select: { id: true, company: true, position: true, jd: true } },
    },
  });
  if (!interview) return fail("面试记录不存在", 404);

  const known = await prisma.question.findMany({
    where: { jobId: interview.jobId },
    select: { content: true },
    take: 30,
  });

  const result = await analyzeInterview({
    company: interview.job.company,
    position: interview.job.position,
    jd: interview.job.jd,
    round: interview.round,
    actualQuestions: String(body.actualQuestions ?? interview.actualQuestions ?? ""),
    notes: String(body.notes ?? interview.notes ?? ""),
    knownQuestions: known.map((q) => q.content),
  });

  const saved = await prisma.interview.update({
    where: { id: interviewId },
    data: { aiFeedback: JSON.stringify({ ...result.analysis, _engine: result.engine }) },
  });

  return ok({ analysis: result.analysis, engine: result.engine, notice: result.notice, saved });
});
