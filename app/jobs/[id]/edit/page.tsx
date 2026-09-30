import { notFound } from "next/navigation";

import { JobForm } from "@/components/jobs/JobForm";
import prisma from "@/lib/db";
import { serializeJob } from "@/lib/serialize";

export const dynamic = "force-dynamic";
export const metadata = { title: "编辑岗位 · InterviewBuddy" };

export default async function EditJobPage({ params }: { params: { id: string } }) {
  const job = await prisma.job.findUnique({
    where: { id: params.id },
    include: { tags: true, _count: { select: { questions: true, interviews: true } } },
  });
  if (!job) notFound();

  return <JobForm job={serializeJob(job)} />;
}
