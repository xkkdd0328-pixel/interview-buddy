import { NextRequest } from "next/server";

import prisma from "@/lib/db";
import { sortQuestions } from "@/lib/constants";
import { ok, fail, readJson, str, requiredStr, handler } from "@/lib/api";

export const dynamic = "force-dynamic";

const VALID_TYPES = ["tech", "scene", "behavior", "ask_back"];
const VALID_DIFFICULTY = ["easy", "medium", "hard"];

/**
 * POST /api/questions/bulk
 * 批量写入 AI 生成的题库。
 * body: { jobId, mode: "replace" | "append", questions: [{content,type,difficulty,answer,knowledge}] }
 */
export const POST = handler(async (req: NextRequest) => {
  const body = await readJson(req);
  if (!body) return fail("请求体格式错误");

  const jobId = requiredStr(body.jobId, "jobId", 50);
  const mode = body.mode === "append" ? "append" : "replace";
  const rawList = Array.isArray(body.questions) ? body.questions : [];
  if (!rawList.length) return fail("题目列表为空");

  const job = await prisma.job.findUnique({ where: { id: jobId }, select: { id: true } });
  if (!job) return fail("岗位不存在", 404);

  const data = rawList
    .map((item) => {
      const o = (item || {}) as Record<string, unknown>;
      const content = str(o.content, 5000);
      if (!content) return null;
      return {
        jobId,
        content,
        type: VALID_TYPES.includes(String(o.type)) ? String(o.type) : "tech",
        difficulty: VALID_DIFFICULTY.includes(String(o.difficulty))
          ? String(o.difficulty)
          : "medium",
        // knowledge 拼在 answer 末尾，便于在详情页一并展示
        answer: [str(o.answer, 20000), str(o.knowledge, 20000) ? `\n\n【知识点】${str(o.knowledge, 20000)}` : ""]
          .filter(Boolean)
          .join("") || null,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  if (!data.length) return fail("没有可写入的有效题目");

  if (mode === "replace") {
    await prisma.question.deleteMany({ where: { jobId } });
  }
  await prisma.question.createMany({ data });

  const questions = await prisma.question.findMany({ where: { jobId } });
  return ok({ inserted: data.length, mode, questions: sortQuestions(questions) }, 201);
});
