import Link from "next/link";
import { ArrowRight, Flag, Lightbulb, PlayCircle, Star } from "lucide-react";

import { EmptyState, SectionTitle } from "@/components/common/EmptyState";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "练习中心 · InterviewBuddy" };

export default async function PracticeCenterPage() {
  const [jobs, allQuestions] = await Promise.all([
    prisma.job.findMany({
      orderBy: { appliedAt: "desc" },
      select: {
        id: true,
        company: true,
        position: true,
        status: true,
        questions: { select: { id: true, rating: true, isWeak: true, isFavorite: true } },
      },
    }),
    prisma.question.findMany({ select: { rating: true, isWeak: true, isFavorite: true } }),
  ]);

  const withQuestions = jobs.filter((j) => j.questions.length > 0);
  const totalQuestions = allQuestions.length;
  const answered = allQuestions.filter((q) => q.rating !== null).length;
  const weak = allQuestions.filter((q) => q.isWeak).length;
  const favorite = allQuestions.filter((q) => q.isFavorite).length;

  return (
    <div className="mx-auto max-w-[1100px] space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="题库总题数"
          value={totalQuestions}
          hint={`覆盖 ${withQuestions.length} 个岗位`}
          icon={<Lightbulb className="h-5 w-5" />}
          accent="#4361ee"
        />
        <StatCard
          label="已自评"
          value={answered}
          hint={totalQuestions ? `完成率 ${Math.round((answered / totalQuestions) * 100)}%` : "—"}
          icon={<PlayCircle className="h-5 w-5" />}
          accent="#2a9d8f"
        />
        <StatCard
          label="薄弱点"
          value={weak}
          hint="答到 4 星以上会自动毕业"
          icon={<Flag className="h-5 w-5" />}
          accent="#e63946"
        />
        <StatCard
          label="收藏题"
          value={favorite}
          hint="重点复习的题目"
          icon={<Star className="h-5 w-5" />}
          accent="#e9c46a"
        />
      </div>

      {weak > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/20 bg-red-50/60 p-4">
          <div>
            <div className="text-sm font-semibold text-danger">你有 {weak} 道薄弱题待攻克</div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              建议用「薄弱」筛选做专项练习——答到 4 星以上就会自动摘掉标记。
            </p>
          </div>
          {withQuestions[0] && (
            <Button asChild size="sm" variant="destructive">
              <Link href={`/jobs/${withQuestions[0].id}/practice?filter=weak`}>
                <Flag className="h-4 w-4" />
                立即刷薄弱题
              </Link>
            </Button>
          )}
        </div>
      )}

      <div>
        <SectionTitle
          title="按岗位练习"
          description="每个岗位一套定制题库，点进去开始闪卡练习"
        />

        {withQuestions.length === 0 ? (
          <EmptyState
            icon={<Lightbulb className="h-5 w-5" />}
            title="还没有可练习的题库"
            description="先去岗位详情页点「生成本岗位题库」，AI 会读完这份 JD 后为你定制面试题。"
            action={
              <Button asChild size="sm">
                <Link href="/jobs">去岗位管理</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {withQuestions.map((job) => {
              const total = job.questions.length;
              const done = job.questions.filter((q) => q.rating !== null).length;
              const jobWeak = job.questions.filter((q) => q.isWeak).length;
              const percent = total ? Math.round((done / total) * 100) : 0;
              return (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}/practice`}
                  className="group rounded-xl border border-border bg-white p-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{job.company}</div>
                      <div className="truncate text-xs text-muted-foreground">{job.position}</div>
                    </div>
                    <StatusBadge status={job.status} short />
                  </div>

                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{total} 道题</span>
                    <span>已练 {done}</span>
                    {jobWeak > 0 && <span className="font-medium text-danger">薄弱 {jobWeak}</span>}
                  </div>

                  <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-brand transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5">
                    <span className="text-xs text-muted-foreground">完成度 {percent}%</span>
                    <span className="flex items-center gap-1 text-xs font-medium text-brand">
                      开始练习
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
