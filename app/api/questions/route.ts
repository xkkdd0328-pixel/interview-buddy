import { NextRequest } from "next/server";

import prisma from "@/lib/db";
import { sortQuestions } from "@/lib/constants";
import { ok, fail, readJson, str, requiredStr, handler } from "@/lib/api";

export const dynamic = "force-dynamic";

/** GET /api/questions —— 题库查询 */
export const GET = handler(async (req: NextRequest) => {
  const sp = req.nextUrl.searchParams;
  const jobId = sp.get("jobId");
  const type = sp.get("type");
  const filter = sp.get("filter"); // all | unanswered | weak | favorite

  const where: Record<string, unknown> = {};
  if (jobId) where.jobId = jobId;
  if (type && type !== "ALL") where.type = type;
  if (filter === "weak") where.isWeak = true;
  else if (filter === "favorite") where.isFavorite = true;
  else if (filter === "unanswered") where.rating = null;

  const questions = await prisma.question.findMany({
    where,
    include: { job: { select: { company: true, position: true } } },
  });

  return ok(sortQuestions(questions));
});

const VALID_TYPES = ["tech", "scene", "behavior", "ask_back"];
const VALID_DIFFICULTY = ["easy", "medium", "hard"];

/** POST /api/questions —— 新增单题 */
export const POST = handler(async (req: NextRequest) => {
  const body = await readJson(req);
  if (!body) return fail("请求体格式错误");

  const jobId = requiredStr(body.jobId, "jobId", 50);
  const content = requiredStr(body.content, "题目内容", 5000);
  const type = VALID_TYPES.includes(String(body.type)) ? String(body.type) : "tech";
  const difficulty = VALID_DIFFICULTY.includes(String(body.difficulty))
    ? String(body.difficulty)
    : "medium";

  const created = await prisma.question.create({
    data: {
      jobId,
      content,
      type,
      difficulty,
      answer: str(body.answer, 20000),
    },
  });
  return ok(created, 201);
});
