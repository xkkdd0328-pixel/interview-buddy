import { ok, handler } from "@/lib/api";
import prisma, { describeDatabase } from "@/lib/db";
import { getAiChannelStatus } from "@/lib/ai/provider";

export const dynamic = "force-dynamic";

/** GET /api/settings —— 应用与数据概览 */
export const GET = handler(async () => {
  const [jobs, questions, interviews, tags] = await Promise.all([
    prisma.job.count(),
    prisma.question.count(),
    prisma.interview.count(),
    prisma.jobTag.count(),
  ]);

  const ai = getAiChannelStatus();

  return ok({
    counts: { jobs, questions, interviews, tags },
    database: describeDatabase(),
    ai: {
      ...ai,
      engineLabel: ai.enabled ? `WorkBuddy 内置模型（${ai.model}）` : "本地规则引擎（离线兜底）",
    },
  });
});
