import { notFound } from "next/navigation";

import { JobDetailClient } from "@/components/jobs/JobDetailClient";
import prisma from "@/lib/db";
import { sortQuestions } from "@/lib/constants";
import { serializeInterviews, serializeJob, serializeQuestions } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const job = await prisma.job.findUnique({
    where: { id: params.id },
    select: { company: true, position: true },
  });
  return {
    title: job ? `${job.company} · ${job.position} · InterviewBuddy` : "岗位详情 · InterviewBuddy",
  };
}

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const job = await prisma.job.findUnique({
    where: { id: params.id },
    include: {
      tags: true,
      questions: { orderBy: [{ type: "asc" }, { createdAt: "asc" }] },
      interviews: { orderBy: { date: "desc" } },
      _count: { select: { questions: true, interviews: true } },
    },
  });
  if (!job) notFound();

  const { questions, interviews, ...rest } = job;

  return (
    <JobDetailClient
      job={serializeJob(rest)}
      initialQuestions={serializeQuestions(sortQuestions(questions))}
      initialInterviews={serializeInterviews(interviews)}
    />
  );
}
