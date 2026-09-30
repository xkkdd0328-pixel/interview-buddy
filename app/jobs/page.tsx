import { JobsView } from "@/components/jobs/JobsView";
import prisma from "@/lib/db";
import { serializeJobs } from "@/lib/serialize";

export const dynamic = "force-dynamic";
export const metadata = { title: "岗位管理 · InterviewBuddy" };

export default async function JobsPage() {
  const jobs = await prisma.job.findMany({
    orderBy: { appliedAt: "desc" },
    include: {
      tags: true,
      _count: { select: { questions: true, interviews: true } },
    },
  });

  return <JobsView initialJobs={serializeJobs(jobs)} />;
}
