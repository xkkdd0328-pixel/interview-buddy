import { notFound } from "next/navigation";

import { PracticeClient } from "@/components/practice/PracticeClient";
import prisma from "@/lib/db";
import { serializeQuestions } from "@/lib/serialize";

export const dynamic = "force-dynamic";

type FilterKey = "all" | "unanswered" | "weak" | "favorite";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const job = await prisma.job.findUnique({
    where: { id: params.id },
    select: { company: true, position: true },
  });
  return {
    title: job ? `练习：${job.company} · ${job.position}` : "练习模式 · InterviewBuddy",
  };
}

export default async function PracticePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { filter?: string };
}) {
  const job = await prisma.job.findUnique({
    where: { id: params.id },
    select: { id: true, company: true, position: true },
  });
  if (!job) notFound();

  const questions = await prisma.question.findMany({ where: { jobId: job.id } });

  const allowed: FilterKey[] = ["all", "unanswered", "weak", "favorite"];
  const filter = allowed.includes(searchParams.filter as FilterKey)
    ? (searchParams.filter as FilterKey)
    : "all";

  return (
    <PracticeClient
      job={job}
      initialQuestions={serializeQuestions(questions)}
      initialFilter={filter}
    />
  );
}
