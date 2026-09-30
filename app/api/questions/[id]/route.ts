import { NextRequest } from "next/server";

import prisma from "@/lib/db";
import { ok, fail, notFound, readJson, str, int, bool, handler } from "@/lib/api";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

const VALID_TYPES = ["tech", "scene", "behavior", "ask_back"];
const VALID_DIFFICULTY = ["easy", "medium", "hard"];

/** PATCH /api/questions/:id —— 更新自评/薄弱点/收藏/我的回答 */
export const PATCH = handler(async (req: NextRequest, { params }: Ctx) => {
  const body = await readJson(req);
  if (!body) return fail("请求体格式错误");

  const exists = await prisma.question.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (!exists) return notFound("题目不存在");

  const data: Record<string, unknown> = {};
  if (body.content !== undefined) data.content = str(body.content, 5000) ?? undefined;
  if (body.answer !== undefined) data.answer = str(body.answer, 20000);
  if (body.myAnswer !== undefined) data.myAnswer = str(body.myAnswer, 20000);
  if (body.type !== undefined && VALID_TYPES.includes(String(body.type))) data.type = String(body.type);
  if (body.difficulty !== undefined && VALID_DIFFICULTY.includes(String(body.difficulty)))
    data.difficulty = String(body.difficulty);
  if (body.isFavorite !== undefined) data.isFavorite = bool(body.isFavorite);
  if (body.isWeak !== undefined) data.isWeak = bool(body.isWeak);
  if (body.rating !== undefined) {
    const r = int(body.rating, null);
    data.rating = r === null ? null : Math.min(5, Math.max(1, r));
  }

  const updated = await prisma.question.update({ where: { id: params.id }, data });
  return ok(updated);
});

/** DELETE /api/questions/:id */
export const DELETE = handler(async (_req: NextRequest, { params }: Ctx) => {
  const exists = await prisma.question.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (!exists) return notFound("题目不存在");
  await prisma.question.delete({ where: { id: params.id } });
  return ok({ id: params.id });
});
