import { NextRequest } from "next/server";

import { ok, fail, readJson, requiredStr, handler } from "@/lib/api";
import { parseJd } from "@/lib/ai/provider";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/ai/parse-jd
 * body: { text }
 * 把整段招聘信息拆解成结构化字段（AI 打草稿，用户再核对修改）。
 */
export const POST = handler(async (req: NextRequest) => {
  const body = await readJson(req);
  if (!body) return fail("请求体格式错误");

  const text = requiredStr(body.text, "待拆解文本", 60000);
  const result = await parseJd(text);

  return ok({
    // jd 始终保存原始全文，避免解析失误造成信息丢失
    jd: text,
    company: result.company ?? "",
    position: result.position ?? "",
    salary: result.salary ?? "",
    location: result.location ?? "",
    channel: result.channel ?? "",
    keywords: result.keywords,
    engine: result.engine,
  });
});
