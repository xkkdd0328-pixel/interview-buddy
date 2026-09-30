import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  Inbox,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { StatCard } from "@/components/common/StatCard";
import { EmptyState, SectionTitle } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { FunnelChart } from "@/components/charts/FunnelChart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { computeStats } from "@/lib/stats";
import { MOOD, PRIORITY, type Mood } from "@/lib/constants";
import { daysFromNow, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const stats = await computeStats();
  const { cards, funnel, upcomingInterviews, recentJobs, practice } = stats;

  return (
    <div className="mx-auto max-w-[1240px] space-y-6">
      {/* ---------- 指标卡片 ---------- */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="总投递数"
          value={cards.total}
          hint={`其中已结束 ${cards.rejected} 个`}
          icon={<Briefcase className="h-5 w-5" />}
          accent="#4361ee"
        />
        <StatCard
          label="进行中"
          value={cards.active}
          hint="非终态岗位（仍在推进）"
          icon={<TrendingUp className="h-5 w-5" />}
          accent="#3a0ca3"
        />
        <StatCard
          label="本周面试"
          value={cards.weekInterviews}
          hint={`累计面试记录 ${stats.interviewCount} 场`}
          icon={<CalendarClock className="h-5 w-5" />}
          accent="#e9c46a"
        />
        <StatCard
          label="已拿 Offer"
          value={cards.offer}
          hint={
            cards.total ? `占总投递 ${Math.round((cards.offer / cards.total) * 1000) / 10}%` : "—"
          }
          icon={<CheckCircle2 className="h-5 w-5" />}
          accent="#2a9d8f"
        />
      </div>

      {/* ---------- 漏斗 + 日程 ---------- */}
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="flex flex-wrap items-center gap-2">
              投递转化漏斗
              <span className="text-xs font-normal text-muted-foreground">
                已投递 → 已查看 → 笔试 → 面试 → Offer
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cards.total === 0 ? (
              <EmptyState
                className="border-0 bg-transparent py-8"
                icon={<Inbox className="h-5 w-5" />}
                title="还没有投递数据"
                description="添加第一个岗位后，这里会自动画出你的转化漏斗。"
                action={
                  <Button asChild size="sm">
                    <Link href="/jobs/new">添加岗位</Link>
                  </Button>
                }
              />
            ) : (
              <FunnelChart data={funnel} />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <span>近期面试日程</span>
              <Link href="/jobs" className="text-xs font-normal text-brand hover:underline">
                查看全部
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingInterviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CalendarClock className="mb-2 h-8 w-8 text-slate-300" />
                <div className="text-sm font-medium text-slate-600">暂无即将到来的面试</div>
                <p className="mt-1 max-w-[220px] text-xs text-muted-foreground">
                  在岗位详情页添加面试记录，首页就会自动提醒你。
                </p>
              </div>
            ) : (
              upcomingInterviews.map((iv) => {
                const days = daysFromNow(iv.date);
                const mood = iv.mood ? MOOD[iv.mood as Mood] : null;
                return (
                  <Link
                    key={iv.id}
                    href={`/interview/${iv.id}`}
                    className="flex items-center gap-3 rounded-lg border border-border bg-white px-3 py-2.5 transition-colors hover:border-brand-200 hover:bg-brand-50/50"
                  >
                    <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-brand-50 text-brand">
                      <span className="text-[13px] font-bold leading-none">
                        {new Date(iv.date).getDate()}
                      </span>
                      <span className="text-[10px] leading-none">
                        {new Date(iv.date).getMonth() + 1}月
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {iv.company}
                        <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                          {iv.round}
                        </span>
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {iv.position}
                        {mood && <span className="ml-1">{mood.emoji}</span>}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-xs font-medium text-brand">
                        {days === 0 ? "今天" : days === 1 ? "明天" : `${days} 天后`}
                      </div>
                      {iv.hasFeedback && <div className="text-[10px] text-teal-600">已有复盘</div>}
                    </div>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* ---------- 练习进度 ---------- */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand" />
              练习进度
            </span>
            <Link href="/practice" className="text-xs font-normal text-brand hover:underline">
              去练习
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniStat label="题库总题数" value={practice.totalQuestions} />
            <MiniStat label="已自评" value={practice.answered} />
            <MiniStat
              label="平均自评"
              value={practice.avgRating ? `${practice.avgRating} 分` : "—"}
            />
            <MiniStat label="薄弱点" value={practice.weak} tone="danger" />
          </div>
        </CardContent>
      </Card>

      {/* ---------- 最近投递 ---------- */}
      <div>
        <SectionTitle
          title="最近投递的岗位"
          description="按投递日期倒序，取最近 5 条"
          right={
            <Button asChild variant="outline" size="sm">
              <Link href="/jobs">
                全部岗位
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          }
        />
        {recentJobs.length === 0 ? (
          <EmptyState
            icon={<Briefcase className="h-5 w-5" />}
            title="还没有岗位记录"
            description="从招聘网站复制一段 JD，粘贴进来点一下「AI 智能拆解」，20 秒完成录入。"
            action={
              <Button asChild size="sm">
                <Link href="/jobs/new">添加第一个岗位</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {recentJobs.map((job) => {
              const priority = PRIORITY[job.priority];
              return (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="group rounded-xl border border-border bg-white p-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{job.company}</div>
                      <div className="truncate text-xs text-muted-foreground">{job.position}</div>
                    </div>
                    <StatusBadge status={job.status} short />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {job.salary && <span className="font-medium text-slate-600">{job.salary}</span>}
                    {job.location && <span>{job.location}</span>}
                    {job.channel && <span>{job.channel}</span>}
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5 text-xs">
                    <span className="text-muted-foreground">{formatDate(job.appliedAt)}</span>
                    {priority.stars > 0 && (
                      <span style={{ color: priority.color }}>
                        {"★".repeat(priority.stars)} {priority.label}
                      </span>
                    )}
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

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  tone?: "danger";
}) {
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2.5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={`mt-0.5 text-xl font-semibold ${
          tone === "danger" ? "text-danger" : "text-foreground"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
