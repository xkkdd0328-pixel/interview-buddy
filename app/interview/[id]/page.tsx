import { notFound } from "next/navigation";

import { InterviewDetailClient } from "@/components/interview/InterviewDetailClient";
import prisma from "@/lib/db";
import { serializeInterview } from "@/lib/serialize";
import type { AnalysisDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

/** 解析存库的 aiFeedback（JSON 字符串，可能带 _engine 字段） */
function parseFeedback(raw: string | null): { analysis: AnalysisDTO | null; engine: string | null } {
  if (!raw) return { analysis: null, engine: null };
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    const engine = typeof o._engine === "string" ? o._engine : null;
    const arr = (v: unknown) => (Array.isArray(v) ? (v as string[]) : []);
    return {
      analysis: {
        strengths: arr(o.strengths),
        improvements: arr(o.improvements),
        suggestions: arr(o.suggestions),
        missingTopics: arr(o.missingTopics),
        overall: typeof o.overall === "string" ? o.overall : undefined,
      },
      engine,
    };
  } catch {
    // 兼容早期纯文本格式
    return { analysis: { strengths: [], improvements: [raw], suggestions: [], missingTopics: [] }, engine: null };
  }
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const iv = await prisma.interview.findUnique({
    where: { id: params.id },
    include: { job: { select: { company: true } } },
  });
  return {
    title: iv ? `复盘：${iv.job.company} ${iv.round} · InterviewBuddy` : "面试复盘 · InterviewBuddy",
  };
}

export default async function InterviewPage({ params }: { params: { id: string } }) {
  const interview = await prisma.interview.findUnique({
    where: { id: params.id },
    include: {
      job: { select: { id: true, company: true, position: true } },
    },
  });
  if (!interview) notFound();

  const { job, ...rest } = interview;
  const { analysis, engine } = parseFeedback(interview.aiFeedback);

  return (
    <InterviewDetailClient
      interview={serializeInterview(rest)}
      job={job}
      initialAnalysis={analysis}
      initialEngine={engine}
    />
  );
}
