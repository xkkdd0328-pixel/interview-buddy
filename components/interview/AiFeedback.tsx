"use client";

import { AlertTriangle, HelpCircle, Lightbulb, Target, ThumbsUp } from "lucide-react";

import { cn } from "@/lib/utils";
import type { AnalysisDTO } from "@/lib/types";

const BLOCKS: {
  key: keyof Omit<AnalysisDTO, "overall">;
  title: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
}[] = [
  {
    key: "strengths",
    title: "答得好的地方",
    icon: ThumbsUp,
    color: "text-teal-700",
    bg: "bg-teal-50/70",
    border: "border-teal-200",
  },
  {
    key: "improvements",
    title: "需要改进的地方",
    icon: AlertTriangle,
    color: "text-amber-700",
    bg: "bg-amber-50/70",
    border: "border-amber-200",
  },
  {
    key: "suggestions",
    title: "后续练习建议",
    icon: Lightbulb,
    color: "text-brand-700",
    bg: "bg-brand-50/70",
    border: "border-brand-200",
  },
  {
    key: "missingTopics",
    title: "JD 提到但没被问到（下轮可能考）",
    icon: HelpCircle,
    color: "text-violet-700",
    bg: "bg-violet-50/70",
    border: "border-violet-200",
  },
];

/** AI 复盘分析结果展示 */
export function AiFeedback({
  analysis,
  engine,
}: {
  analysis: AnalysisDTO;
  engine?: string | null;
}) {
  const isEmpty =
    !analysis.strengths.length &&
    !analysis.improvements.length &&
    !analysis.suggestions.length &&
    !analysis.missingTopics.length;

  if (isEmpty) return null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-sm font-semibold">
          <Target className="h-4 w-4 text-brand" />
          AI 复盘分析
        </span>
        {engine && (
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-[10px] font-medium",
              engine === "workbuddy-cloud"
                ? "bg-teal-50 text-teal-700"
                : "bg-amber-50 text-amber-700"
            )}
          >
            {engine === "workbuddy-cloud" ? "WorkBuddy 内置模型" : "本地规则引擎"}
          </span>
        )}
      </div>

      {analysis.overall && (
        <div className="rounded-lg border border-border bg-muted/50 p-3.5 text-[13px] leading-relaxed text-slate-700">
          {analysis.overall}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {BLOCKS.map((block) => {
          const items = analysis[block.key] as string[];
          if (!items?.length) return null;
          const Icon = block.icon;
          return (
            <div
              key={block.key}
              className={cn("rounded-xl border p-3.5", block.bg, block.border)}
            >
              <div className={cn("mb-2 flex items-center gap-1.5 text-xs font-semibold", block.color)}>
                <Icon className="h-3.5 w-3.5" />
                {block.title}
                <span className="font-normal opacity-70">({items.length})</span>
              </div>
              <ul className="space-y-1.5">
                {items.map((it, i) => (
                  <li key={i} className="flex gap-1.5 text-[13px] leading-relaxed text-slate-700">
                    <span className={cn("mt-[7px] h-1 w-1 shrink-0 rounded-full", block.color.replace("text-", "bg-"))} />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
