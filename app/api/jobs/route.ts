import { NextRequest } from "next/server";

import prisma from "@/lib/db";
import { ok, fail, readJson, str, requiredStr, int, date, handler } from "@/lib/api";

export const dynamic = "force-dynamic";

/** GET /api/jobs —— 岗位列表（支持状态筛选、关键词搜索、排序） */
export const GET = handler(async (req: NextRequest) => {
  const sp = req.nextUrl.searchParams;
  const status = sp.get("status");
  const q = sp.get("q")?.trim();
  const sort = sp.get("sort") ?? "appliedAt";
  const order = sp.get("order") === "asc" ? "asc" : "desc";

  const where: Record<string, unknown> = {};
  if (status && status !== "ALL") {
    if (status.includes(",")) where.status = { in: status.split(",") };
    else where.status = status;
  }
  if (q) {
    where.OR = [{ company: { contains: q } }, { position: { contains: q } }, { jd: { contains: q } }];
  }

  const orderBy =
    sort === "priority"
      ? [{ priority: order as "asc" | "desc" }, { appliedAt: "desc" as const }]
      : sort === "company"
        ? [{ company: order as "asc" | "desc" }]
        : [{ appliedAt: order as "asc" | "desc" }];

  const jobs = await prisma.job.findMany({
    where,
    orderBy,
    include: {
      _count: { select: { questions: true, interviews: true } },
      tags: true,
    },
  });

  return ok(jobs);
});

/** POST /api/jobs —— 新建岗位 */
export const POST = handler(async (req: NextRequest) => {
  const body = await readJson(req);
  if (!body) return fail("请求体格式错误");

  const company = requiredStr(body.company, "公司名称", 200);
  const position = requiredStr(body.position, "岗位名称", 200);
  const jd = requiredStr(body.jd, "职位描述", 60000);

  const created = await prisma.job.create({
    data: {
      company,
      position,
      jd,
      salary: str(body.salary, 100),
      location: str(body.location, 100),
      url: str(body.url, 1000),
      channel: str(body.channel, 50),
      status: str(body.status, 30) ?? "APPLIED",
      notes: str(body.notes, 60000),
      priority: Math.min(2, Math.max(0, int(body.priority, 0) ?? 0)),
      appliedAt: date(body.appliedAt, new Date())!,
      tags: Array.isArray(body.tags)
        ? {
            create: (body.tags as unknown[])
              .map((t) => str(t, 30))
              .filter((t): t is string => Boolean(t))
              .map((tag) => ({ tag })),
          }
        : undefined,
    },
    include: { tags: true, _count: { select: { questions: true, interviews: true } } },
  });

  return ok(created, 201);
});
