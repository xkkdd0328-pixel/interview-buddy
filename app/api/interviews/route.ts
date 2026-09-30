import { NextRequest } from "next/server";

import prisma from "@/lib/db";
import { ok, fail, readJson, str, requiredStr, int, date, handler } from "@/lib/api";

export const dynamic = "force-dynamic";

/** GET /api/interviews —— 面试记录列表 */
export const GET = handler(async (req: NextRequest) => {
  const sp = req.nextUrl.searchParams;
  const jobId = sp.get("jobId");
  const upcoming = sp.get("upcoming") === "true";

  const where: Record<string, unknown> = {};
  if (jobId) where.jobId = jobId;
  if (upcoming) where.date = { gte: new Date() };

  const interviews = await prisma.interview.findMany({
    where,
    orderBy: { date: upcoming ? "asc" : "desc" },
    include: { job: { select: { id: true, company: true, position: true, status: true } } },
  });
  return ok(interviews);
});

/** POST /api/interviews —— 新增面试记录 */
export const POST = handler(async (req: NextRequest) => {
  const body = await readJson(req);
  if (!body) return fail("请求体格式错误");

  const jobId = requiredStr(body.jobId, "jobId", 50);
  const round = requiredStr(body.round, "面试轮次", 30);

  const job = await prisma.job.findUnique({ where: { id: jobId }, select: { id: true } });
  if (!job) return fail("岗位不存在", 404);

  const created = await prisma.interview.create({
    data: {
      jobId,
      round,
      date: date(body.date, new Date())!,
      duration: int(body.duration, null),
      interviewer: str(body.interviewer, 100),
      mood: str(body.mood, 20),
      actualQuestions: str(body.actualQuestions, 20000),
      notes: str(body.notes, 20000),
      aiFeedback: str(body.aiFeedback, 60000),
    },
    include: { job: { select: { id: true, company: true, position: true } } },
  });
  return ok(created, 201);
});
