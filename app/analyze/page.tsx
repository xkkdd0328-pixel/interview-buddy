import Link from "next/link";
import { BarChart3, Flag, Lightbulb, Percent, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FunnelChart } from "@/components/charts/FunnelChart";
import { StatusPieChart } from "@/components/charts/StatusPieChart";
import { TimelineChart } from "@/components/charts/TimelineChart";
import { SkillRadarChart } from "@/components/charts/SkillRadarChart";
import { GrowthChart } from "@/components/charts/GrowthChart";
import { ChannelBarChart } from "@/components/charts/ChannelBarChart";
import { computeStats } from "@/lib/stats";

export const dynamic = "force-dynamic";
export const metadata = { title: "数据分析 · InterviewBuddy" };

export default async function AnalyzePage() {
  const stats = await computeStats();
  const {
    cards,
    funnel,
    statusDistribution,
    timeline,
    channels,
    radar,
    growth,
    practice,
  } = stats;

  const hasData = cards.total > 0;
  const hasPractice = practice.answered > 0;

  const interviewStage = funnel.find((f) => f.key === "interview");
  const offerStage = funnel.find((f) => f.key === "offer");

  /** 找出最弱的技术方向 */
  const ranked = radar.filter((r) => r.samples > 0).sort((a, b) => a.score - b.score);
  const weakest = ranked.filter((r) => r.score < 3.5).slice(0, 3);
  const strongest = ranked.slice().reverse().filter((r) => r.score >= 3.5).slice(0, 3);

  return (
    <div className="mx-auto max-w-[1240px] space-y-5">
      {/* ---------- 结论卡 ---------- */}
      <div className="grid gap-4 md:grid-cols-3">
        <InsightCard
          icon={<Percent className="h-4 w-4" />}
          accent="#4361ee"
          title="我的简历转化率怎么样？"
          value={hasData ? `${interviewStage?.overallRate ?? 0}%` : "—"}
          hint={
            hasData
              ? `投递 ${cards.total} 个 → 进入面试 ${interviewStage?.value ?? 0} 个${offerStage?.value ? ` → 拿到 Offer ${offerStage.value} 个` : ""}`
              : "添加岗位后开始统计"
          }
        />
        <InsightCard
          icon={<Flag className="h-4 w-4" />}
          accent="#e63946"
          title="我的知识短板在哪？"
          value={
            weakest.length > 0
              ? weakest[0].dimension
              : hasPractice
                ? "暂无明显短板"
                : "—"
          }
          hint={
            weakest.length > 0
              ? `平均仅 ${weakest[0].score} 分，建议优先补：${weakest
                  .map((w) => w.dimension)
                  .join("、")}`
              : hasPractice
                ? "已评分的题目都在 3.5 分以上，保持住"
                : "去练习模式给题目自评后这里会出结论"
          }
        />
        <InsightCard
          icon={<TrendingUp className="h-4 w-4" />}
          accent="#2a9d8f"
          title="我有没有在进步？"
          value={
            growth.length >= 2
              ? (() => {
                  const diff =
                    Math.round((growth[growth.length - 1].score - growth[0].score) * 10) / 10;
                  if (diff > 0) return `较首次 +${diff} 分`;
                  if (diff < 0) return `较首次 ${diff} 分`;
                  return "与首次持平";
                })()
              : "—"
          }
          hint={
            growth.length >= 2
              ? `基于 ${growth.length} 场有评分数据的面试`
              : "至少需要 2 场带评分数据的面试才能看出趋势"
          }
        />
      </div>

      {/* ---------- 两个核心图表 ---------- */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="① 投递转化漏斗"
          description="已投递 → 已查看 → 笔试 → 面试 → Offer，每层显示人数与转化率"
        >
          {hasData ? (
            <FunnelChart data={funnel} />
          ) : (
            <ChartEmpty hint="还没有投递数据" />
          )}
        </ChartCard>

        <ChartCard title="② 状态分布" description="各状态下岗位数量的占比">
          {statusDistribution.length ? (
            <StatusPieChart data={statusDistribution} />
          ) : (
            <ChartEmpty hint="还没有岗位数据" />
          )}
        </ChartCard>

        <ChartCard title="③ 投递时间线" description="按周统计投递节奏，看你是否保持稳定输出">
          {timeline.length ? <TimelineChart data={timeline} /> : <ChartEmpty hint="还没有投递数据" />}
        </ChartCard>

        <ChartCard title="④ 渠道分布" description="按投递渠道统计岗位数量，找出你最有效的渠道">
          <ChannelBarChart data={channels} />
        </ChartCard>
      </div>

      {/* ---------- 能力类图表 ---------- */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="⑤ 技能雷达图"
          description="根据你在练习模式中的自评分，展示各技术方向的掌握程度（5 分制）"
          footer={
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {strongest.length > 0 && (
                <span className="text-teal-700">
                  强项：{strongest.map((s) => `${s.dimension}（${s.score}）`).join("、")}
                </span>
              )}
              {weakest.length > 0 && (
                <span className="text-danger">
                  弱项：{weakest.map((s) => `${s.dimension}（${s.score}）`).join("、")}
                </span>
              )}
              {weakest.length === 0 && strongest.length === 0 && (
                <span>还没有足量的已评分题目</span>
              )}
            </div>
          }
        >
          {hasPractice ? <SkillRadarChart data={radar} /> : <ChartEmpty hint="去练习模式给题目自评后才有数据" />}
        </ChartCard>

        <ChartCard
          title="⑥ 面试能力成长曲线"
          description="按面试日期的平均自评分趋势，虚线为 3 分参考线"
          footer={
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>基于 {growth.length} 场面试的自评数据</span>
              {practice.weak > 0 && (
                <Link
                  href="/practice"
                  className="flex items-center gap-1 text-danger hover:underline"
                >
                  <Flag className="h-3 w-3" />
                  还有 {practice.weak} 道薄弱题待攻克
                </Link>
              )}
            </div>
          }
        >
          <GrowthChart data={growth} />
        </ChartCard>
      </div>

      {/* ---------- 复盘入口 ---------- */}
      <Card className="border-brand-100 bg-gradient-to-br from-brand-50/60 to-white">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Lightbulb className="h-4 w-4 text-brand" />
              数据指出的方向，去练习模式落地
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              雷达图上的低分方向 + 薄弱题清单，就是接下来最该花时间的部分。
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/practice">
                <BarChart3 className="h-4 w-4" />
                去练习中心
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/jobs">管理岗位</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InsightCard({
  icon,
  accent,
  title,
  value,
  hint,
}: {
  icon: React.ReactNode;
  accent: string;
  title: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-white p-5 shadow-card">
      <div
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ background: `linear-gradient(90deg, ${accent}, ${accent}22)` }}
      />
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <span style={{ color: accent }}>{icon}</span>
        {title}
      </div>
      <div className="mt-2 text-xl font-semibold tracking-tight" style={{ color: accent }}>
        {value}
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{hint}</p>
    </div>
  );
}

function ChartCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        {children}
        {footer && <div className="mt-3 border-t border-border pt-3">{footer}</div>}
      </CardContent>
    </Card>
  );
}

function ChartEmpty({ hint }: { hint: string }) {
  return (
    <div className="flex h-[220px] flex-col items-center justify-center text-center">
      <BarChart3 className="mb-2 h-7 w-7 text-slate-300" />
      <div className="text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}
