"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Lightbulb, PlayCircle } from "lucide-react";

import { QuestionCard } from "@/components/questions/QuestionCard";
import { Button } from "@/components/ui/button";
import { QUESTION_TYPE, QUESTION_TYPE_KEYS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { QuestionDTO } from "@/lib/types";

type FilterKey = "all" | "unanswered" | "weak" | "favorite";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "unanswered", label: "未答" },
  { key: "weak", label: "薄弱" },
  { key: "favorite", label: "收藏" },
];

export function QuestionList({
  jobId,
  questions,
  onUpdate,
  onDelete,
}: {
  jobId: string;
  questions: QuestionDTO[];
  onUpdate: (id: string, patch: Partial<QuestionDTO>) => Promise<void>;
  onDelete: (q: QuestionDTO) => void;
}) {
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [stateFilter, setStateFilter] = useState<FilterKey>("all");

  const counts = useMemo(() => {
    return {
      all: questions.length,
      unanswered: questions.filter((q) => q.rating === null).length,
      weak: questions.filter((q) => q.isWeak).length,
      favorite: questions.filter((q) => q.isFavorite).length,
    };
  }, [questions]);

  const filtered = useMemo(
    () =>
      questions.filter((q) => {
        if (typeFilter !== "ALL" && q.type !== typeFilter) return false;
        if (stateFilter === "unanswered" && q.rating !== null) return false;
        if (stateFilter === "weak" && !q.isWeak) return false;
        if (stateFilter === "favorite" && !q.isFavorite) return false;
        return true;
      }),
    [questions, typeFilter, stateFilter]
  );

  const practiceHref = `/jobs/${jobId}/practice${
    stateFilter === "all" ? "" : `?filter=${stateFilter}`
  }`;

  return (
    <div className="space-y-3">
      {/* 筛选栏 */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-1">
          <FilterChip active={typeFilter === "ALL"} onClick={() => setTypeFilter("ALL")}>
            全部类型
          </FilterChip>
          {QUESTION_TYPE_KEYS.map((k) => (
            <FilterChip key={k} active={typeFilter === k} onClick={() => setTypeFilter(k)}>
              {QUESTION_TYPE[k].label}
            </FilterChip>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg bg-muted p-0.5">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setStateFilter(f.key)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  stateFilter === f.key
                    ? "bg-white text-brand shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                {f.label}
                <span className="ml-1 text-[10px] text-slate-400">{counts[f.key]}</span>
              </button>
            ))}
          </div>

          <Button asChild size="sm" variant={questions.length ? "default" : "outline"}>
            <Link href={practiceHref}>
              <PlayCircle className="h-4 w-4" />
              开始练习
            </Link>
          </Button>
        </div>
      </div>

      {/* 列表 */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-white/60 py-12 text-center">
          <Lightbulb className="mb-2 h-7 w-7 text-slate-300" />
          <div className="text-sm font-medium text-slate-600">
            {questions.length === 0 ? "还没有面试题" : "当前筛选条件下没有题目"}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {questions.length === 0
              ? "点上方「AI 生成面试题」，系统会读完这份 JD 后为你定制题库。"
              : "换一个筛选条件试试。"}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((q, i) => (
            <QuestionCard
              key={q.id}
              question={q}
              index={i + 1}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
        active
          ? "border-brand bg-brand text-white"
          : "border-border bg-white text-slate-500 hover:border-brand-200 hover:text-brand"
      )}
    >
      {children}
    </button>
  );
}
