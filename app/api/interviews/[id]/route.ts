import { NextRequest } from "next/server";

import prisma from "@/lib/db";
import { ok, fail, notFound, readJson, str, int, date, handler } from "@/lib/api";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

/** GET /api/interviews/:id */
export const GET = handler(async (_req: NextRequest, { params }: Ctx) => {
  const interview = await prisma.interview.findUnique({
    where: { id: params.id },
    include: {
      job: { select: { id: true, company: true, position: true, jd: true, status: true } },
    },
  });
  if (!interview) return notFound("面试记录不存在");
  return ok(interview);
});

/** PATCH /api/interviews/:id */
export const PATCH = handler(async (req: NextRequest, { params }: Ctx) => {
  const body = await readJson(req);
  if (!body) return fail("请求体格式错误");

  const exists = await prisma.interview.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (!exists) return notFound("面试记录不存在");

  const data: Record<string, unknown> = {};
  if (body.round !== undefined) data.round = str(body.round, 30) ?? "一面";
  if (body.date !== undefined) {
    const d = date(body.date);
    if (d) data.date = d;
  }
  if (body.duration !== undefined) data.duration = int(body.duration, null);
  if (body.interviewer !== undefined) data.interviewer = str(body.interviewer, 100);
  if (body.mood !== undefined) data.mood = str(body.mood, 20);
  if (body.actualQuestions !== undefined) data.actualQuestions = str(body.actualQuestions, 20000);
  if (body.notes !== undefined) data.notes = str(body.notes, 20000);
  if (body.aiFeedback !== undefined) data.aiFeedback = str(body.aiFeedback, 60000);

  const updated = await prisma.interview.update({ where: { id: params.id }, data });
  return ok(updated);
});

/** DELETE /api/interviews/:id */
export const DELETE = handler(async (_req: NextRequest, { params }: Ctx) => {
  const exists = await prisma.interview.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (!exists) return notFound("面试记录不存在");
  await prisma.interview.delete({ where: { id: params.id } });
  return ok({ id: params.id });
});
