import { SettingsClient } from "@/components/settings/SettingsClient";
import prisma, { describeDatabase } from "@/lib/db";
import { getAiChannelStatus } from "@/lib/ai/provider";

export const dynamic = "force-dynamic";
export const metadata = { title: "设置 · InterviewBuddy" };

export default async function SettingsPage() {
  const [jobs, questions, interviews, tags] = await Promise.all([
    prisma.job.count(),
    prisma.question.count(),
    prisma.interview.count(),
    prisma.jobTag.count(),
  ]);

  const ai = getAiChannelStatus();

  return (
    <SettingsClient
      settings={{
        counts: { jobs, questions, interviews, tags },
        database: describeDatabase(),
        ai: {
          enabled: ai.enabled,
          model: ai.model,
          endpointHost: ai.endpointHost,
          engineLabel: ai.enabled
            ? `WorkBuddy 内置模型（${ai.model}）`
            : "本地规则引擎（离线兜底）",
        },
      }}
    />
  );
}
