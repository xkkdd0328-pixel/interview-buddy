import { NextRequest } from "next/server";

import prisma from "@/lib/db";
import { ok, fail, readJson, handler } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * POST /api/settings/clear
 * body: { confirm: "DELETE_ALL" }
 * 危险操作：清空全部岗位 / 题库 / 面试记录。需要显式确认串。
 */
export const POST = handler(async (req: NextRequest) => {
  const body = await readJson(req);
  if (!body) return fail("请求体格式错误");
  if (body.confirm !== "DELETE_ALL") {
    return fail("缺少确认参数，操作已取消", 400);
  }

  const before = {
    jobs: await prisma.job.count(),
    questions: await prisma.question.count(),
    interviews: await prisma.interview.count(),
  };

  // 外键均为 onDelete: Cascade，删除岗位即级联清理题库与面试记录
  await prisma.interview.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.jobTag.deleteMany({});
  await prisma.job.deleteMany({});
  await prisma.setting.deleteMany({});

  return ok({ cleared: before });
});
