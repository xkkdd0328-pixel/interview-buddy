import { NextRequest } from "next/server";

import prisma from "@/lib/db";
import { ok, fail, readJson, str, requiredStr, handler } from "@/lib/api";
import { sortQuestions } from "@/lib/constants";
import { generateQuestions } from "@/lib/ai/provider";

export const dynamic = "force-dynamic";
export const maxDuration = 180;

/**
 * POST /api/ai/generate-questions
 * body: { jobId, mode?: "replace" | "append", jd?, company?, position? }
 * 生成面试题并写入题库表，返回题目列表与生成引擎标识。
 */
export const POST = handler(async (req: NextRequest) => {
  const body = await readJson(req);
  if (!body) return fail("请求体格式错误");

  const jobId = requiredStr(body.jobId, "jobId", 50);
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { id: true, company: true, position: true, jd: true },
  });
  if (!job) return fail("岗位不存在", 404);

  const company = str(body.company, 200) ?? job.company;
  const position = str(body.position, 200) ?? job.position;
  const jd = str(body.jd, 60000) ?? job.jd;
  const mode = body.mode === "append" ? "append" : "replace";

  const result = await generateQuestions({ company, position, jd });

  if (!result.questions.length) {
    return fail("题目生成失败，请稍后重试", 502);
  }

  const rows = result.questions.map((q) => ({
    jobId,
    content: q.content,
    type: q.type,
    difficulty: q.difficulty,
    answer: [q.answer, q.knowledge ? `\n\n【知识点】${q.knowledge}` : ""].filter(Boolean).join(""),
  }));

  if (mode === "replace") {
    await prisma.question.deleteMany({ where: { jobId } });
  }
  await prisma.question.createMany({ data: rows });

  const questions = await prisma.question.findMany({ where: { jobId } });

  return ok(
    {
      engine: result.engine,
      skills: result.skills,
      domain: result.domain,
      notice: result.notice,
      inserted: rows.length,
      questions: sortQuestions(questions),
    },
    201
  );
});
