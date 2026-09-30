import { NextRequest } from "next/server";

import prisma from "@/lib/db";
import { ok, fail, notFound, readJson, str, int, date, handler } from "@/lib/api";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

/** GET /api/jobs/:id —— 岗位详情（含题库与面试记录） */
export const GET = handler(async (_req: NextRequest, { params }: Ctx) => {
  const job = await prisma.job.findUnique({
    where: { id: params.id },
    include: {
      tags: true,
      questions: { orderBy: [{ type: "asc" }, { createdAt: "asc" }] },
      interviews: { orderBy: { date: "desc" } },
    },
  });
  if (!job) return notFound("岗位不存在");
  return ok(job);
});

/** PATCH /api/jobs/:id —— 更新岗位（含看板拖拽改状态） */
export const PATCH = handler(async (req: NextRequest, { params }: Ctx) => {
  const body = await readJson(req);
  if (!body) return fail("请求体格式错误");

  const exists = await prisma.job.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!exists) return notFound("岗位不存在");

  const data: Record<string, unknown> = {};
  if (body.company !== undefined) data.company = str(body.company, 200) ?? undefined;
  if (body.position !== undefined) data.position = str(body.position, 200) ?? undefined;
  if (body.jd !== undefined) data.jd = str(body.jd, 60000) ?? undefined;
  if (body.salary !== undefined) data.salary = str(body.salary, 100);
  if (body.location !== undefined) data.location = str(body.location, 100);
  if (body.url !== undefined) data.url = str(body.url, 1000);
  if (body.channel !== undefined) data.channel = str(body.channel, 50);
  if (body.status !== undefined) data.status = str(body.status, 30) ?? "APPLIED";
  if (body.notes !== undefined) data.notes = str(body.notes, 60000);
  if (body.priority !== undefined)
    data.priority = Math.min(2, Math.max(0, int(body.priority, 0) ?? 0));
  if (body.appliedAt !== undefined) {
    const d = date(body.appliedAt);
    if (d) data.appliedAt = d;
  }

  // 标签整体替换
  if (Array.isArray(body.tags)) {
    const tags = (body.tags as unknown[])
      .map((t) => str(t, 30))
      .filter((t): t is string => Boolean(t));
    await prisma.jobTag.deleteMany({ where: { jobId: params.id } });
    if (tags.length) {
      await prisma.jobTag.createMany({
        data: tags.map((tag) => ({ jobId: params.id, tag })),
      });
    }
  }

  const updated = await prisma.job.update({
    where: { id: params.id },
    data,
    include: {
      tags: true,
      _count: { select: { questions: true, interviews: true } },
    },
  });
  return ok(updated);
});

/** DELETE /api/jobs/:id —— 删除岗位（级联删除题库与面试记录） */
export const DELETE = handler(async (_req: NextRequest, { params }: Ctx) => {
  const exists = await prisma.job.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!exists) return notFound("岗位不存在");
  await prisma.job.delete({ where: { id: params.id } });
  return ok({ id: params.id });
});
