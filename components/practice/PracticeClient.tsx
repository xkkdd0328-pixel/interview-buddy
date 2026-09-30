"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, ListChecks, Shuffle } from "lucide-react";
import { toast } from "sonner";

import { FlashCard } from "@/components/questions/FlashCard";
import { Button } from "@/components/ui/button";
import { apiSend } from "@/lib/client";
import { sortQuestions } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { JobDTO, QuestionDTO } from "@/lib/types";

type FilterKey = "all" | "unanswered" | "weak" | "favorite";

const FILTERS: { key: FilterKey; label: string; hint: string }[] = [
  { key: "all", label: "全部", hint: "本岗位所有题目" },
  { key: "unanswered", label: "未答", hint: "还没自评过的题" },
  { key: "weak", label: "薄弱", hint: "标记为薄弱点的题（错题重练）" },
  { key: "favorite", label: "收藏", hint: "你收藏的重点题" },
];

export function PracticeClient({
  job,
  initialQuestions,
  initialFilter,
}: {
  job: Pick<JobDTO, "id" | "company" | "position">;
  initialQuestions: QuestionDTO[];
  initialFilter?: FilterKey;
}) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [filter, setFilter] = useState<FilterKey>(initialFilter ?? "all");
  const [cursor, setCursor] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [shuffleSeed, setShuffleSeed] = useState(0);

  /** 按筛选条件得到练习队列 */
  const queue = useMemo(() => {
    let list = questions.filter((q) => {
      if (filter === "unanswered") return q.rating === null;
      if (filter === "weak") return q.isWeak;
      if (filter === "favorite") return q.isFavorite;
      return true;
    });
    list = sortQuestions(list);
    if (shuffle) {
      // 用固定 seed 做伪随机，保证同一次练习顺序稳定
      list = list
        .map((q, i) => ({ q, k: pseudoRandom(q.id + shuffleSeed + i) }))
        .sort((a, b) => a.k - b.k)
        .map((x) => x.q);
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, filter, shuffle, shuffleSeed]);

  // 筛选变化时重置游标
  useEffect(() => {
    setCursor(0);
  }, [filter, shuffle, shuffleSeed]);

  const current = queue[Math.min(cursor, Math.max(queue.length - 1, 0))];
  const progress = queue.length ? ((cursor + 1) / queue.length) * 100 : 0;

  const counts = useMemo(
    () => ({
      all: questions.length,
      unanswered: questions.filter((q) => q.rating === null).length,
      weak: questions.filter((q) => q.isWeak).length,
      favorite: questions.filter((q) => q.isFavorite).length,
    }),
    [questions]
  );

  const updateQuestion = useCallback(
    async (id: string, patch: Partial<QuestionDTO>) => {
      const prev = questions;
      setQuestions((list) => list.map((q) => (q.id === id ? { ...q, ...patch } : q)));
      try {
        await apiSend(`/api/questions/${id}`, "PATCH", patch);
        if (patch.isWeak === false) toast.success("已从薄弱点中毕业 🎉", { duration: 1400 });
      } catch (e) {
        setQuestions(prev);
        toast.error(e instanceof Error ? e.message : "保存失败");
      }
    },
    [questions]
  );

  const next = useCallback(() => {
    setCursor((c) => (queue.length ? (c + 1) % queue.length : 0));
  }, [queue.length]);

  const prev = useCallback(() => {
    setCursor((c) => (queue.length ? (c - 1 + queue.length) % queue.length : 0));
  }, [queue.length]);

  // 键盘快捷键：← → 切题，空格翻面由组件内部处理
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  return (
    <div className="mx-auto max-w-[880px] space-y-4">
      {/* 顶部条 */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`/jobs/${job.id}`}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-brand"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          返回岗位详情
        </Link>
        <span className="text-xs text-muted-foreground">
          {job.company} · {job.position}
        </span>
      </div>

      {/* 筛选与进度 */}
      <div className="rounded-xl border border-border bg-white p-4 shadow-card">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                title={f.hint}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                  filter === f.key
                    ? "border-brand bg-brand text-white"
                    : "border-border bg-white text-slate-500 hover:border-brand-200 hover:text-brand"
                )}
              >
                {f.label}
                <span
                  className={cn(
                    "ml-1.5 text-[10px]",
                    filter === f.key ? "text-white/70" : "text-slate-400"
                  )}
                >
                  {counts[f.key]}
                </span>
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant={shuffle ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setShuffle((s) => !s);
                setShuffleSeed((n) => n + 1);
              }}
            >
              <Shuffle className="h-3.5 w-3.5" />
              {shuffle ? "乱序中" : "随机顺序"}
            </Button>
          </div>
        </div>

        {/* 进度条 */}
        <div className="mt-3.5">
          <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <ListChecks className="h-3.5 w-3.5" />
              进度：{queue.length ? cursor + 1 : 0} / {queue.length}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-brand transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* 闪卡区 */}
      {queue.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-white/60 py-20 text-center">
          <ListChecks className="mb-3 h-8 w-8 text-slate-300" />
          <div className="text-sm font-medium text-slate-600">
            {filter === "all"
              ? "这个岗位还没有题目"
              : `「${FILTERS.find((f) => f.key === filter)?.label}」里暂时没有题目`}
          </div>
          <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
            {filter === "all"
              ? "回到岗位详情页，点「生成本岗位题库」让 AI 读完 JD 后为你出题。"
              : "换个筛选条件，或者先去「全部」里刷几道题把薄弱点标记出来。"}
          </p>
          <Button asChild size="sm" className="mt-4" variant="outline">
            <Link href={`/jobs/${job.id}`}>返回岗位详情</Link>
          </Button>
        </div>
      ) : (
        <>
          <FlashCard
            key={current.id}
            question={current}
            index={cursor}
            total={queue.length}
            onUpdate={updateQuestion}
            onNext={next}
          />

          {/* 上下题导航 */}
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={prev} disabled={queue.length <= 1}>
              <ChevronLeft className="h-4 w-4" />
              上一题
            </Button>
            <span className="text-xs text-muted-foreground">
              提示：键盘 ← → 可快速切题
            </span>
            <Button variant="outline" onClick={next} disabled={queue.length <= 1}>
              下一题
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

/** 稳定的伪随机函数（同一个 key 永远得到同一个值） */
function pseudoRandom(key: string) {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}
