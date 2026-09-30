"use client";

import { useEffect, useState } from "react";
import { Flag, Lightbulb, MessageSquareQuote, RotateCcw, Star } from "lucide-react";

import { DifficultyLabel, QuestionTypeBadge } from "@/components/common/StatusBadge";
import { StarsInput } from "@/components/common/Stars";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { splitAnswer } from "@/components/questions/QuestionCard";
import { cn } from "@/lib/utils";
import type { QuestionDTO } from "@/lib/types";

/**
 * 闪卡组件
 * 交互：先自己作答 → 点击翻面查看参考思路 → 自评 1-5 星 → 可标记薄弱点/收藏
 */
export function FlashCard({
  question,
  index,
  total,
  onUpdate,
  onNext,
}: {
  question: QuestionDTO;
  index: number;
  total: number;
  onUpdate: (id: string, patch: Partial<QuestionDTO>) => Promise<void>;
  onNext: () => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const [draft, setDraft] = useState(question.myAnswer ?? "");
  const [savingDraft, setSavingDraft] = useState(false);

  // 切题时重置翻转状态与草稿
  useEffect(() => {
    setFlipped(false);
    setDraft(question.myAnswer ?? "");
  }, [question.id, question.myAnswer]);

  const [answerText, knowledgeText] = splitAnswer(question.answer);

  async function saveDraft() {
    setSavingDraft(true);
    try {
      await onUpdate(question.id, { myAnswer: draft });
    } finally {
      setSavingDraft(false);
    }
  }

  async function handleRate(n: number) {
    // PRD 亮点 3：自评达到 4 星以上自动摘掉薄弱标记（"答好才毕业"）
    const patch: Partial<QuestionDTO> = { rating: n };
    if (n >= 4 && question.isWeak) patch.isWeak = false;
    await onUpdate(question.id, patch);
    if (n >= 4 && question.isWeak) {
      // 稍作停顿让用户看到评分结果再翻下一页
      setTimeout(onNext, 320);
    } else {
      setTimeout(onNext, 260);
    }
  }

  return (
    <div className="flip-scene">
      <div className={cn("flip-inner", flipped && "is-flipped")}>
        {/* ---------- 正面：题干 ---------- */}
        <div
          className="flip-face relative flex min-h-[420px] cursor-pointer flex-col rounded-2xl border border-border bg-white p-6 shadow-card"
          onClick={() => setFlipped(true)}
        >
          <div className="flex items-center justify-between">
            <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-slate-500">
              第 {index + 1} / {total} 题
            </span>
            <div className="flex items-center gap-2">
              <QuestionTypeBadge type={question.type} />
              <DifficultyLabel difficulty={question.difficulty} />
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center py-8">
            <p className="max-w-2xl text-center text-[17px] font-medium leading-relaxed text-foreground">
              {question.content}
            </p>
          </div>

          <div className="space-y-2">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="先自己写一遍答案（主动回忆比直接看答案记得更牢）…"
              className="min-h-[92px] text-[13px]"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {draft.trim() ? "已填写，可点击卡片翻面查看参考答案" : "可跳过，直接翻面看参考答案"}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={savingDraft || !draft.trim()}
                onClick={(e) => {
                  e.stopPropagation();
                  saveDraft();
                }}
              >
                保存我的回答
              </Button>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-1.5 text-xs font-medium text-brand">
            <RotateCcw className="h-3.5 w-3.5" />
            点击卡片翻面
          </div>
        </div>

        {/* ---------- 背面：参考答案 + 自评 ---------- */}
        <div
          className="flip-back flip-face flex min-h-[420px] flex-col rounded-2xl border border-brand-200 bg-white p-6 shadow-card"
          onClick={() => setFlipped(false)}
        >
          <div className="flex items-center justify-between">
            <span className="rounded-md bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700">
              参考答案 · 第 {index + 1} / {total} 题
            </span>
            <div className="flex items-center gap-2">
              <QuestionTypeBadge type={question.type} />
              <DifficultyLabel difficulty={question.difficulty} />
            </div>
          </div>

          <div className="mt-4 flex-1 space-y-3 overflow-y-auto">
            <div className="rounded-lg bg-brand-50/60 p-3.5">
              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-brand-700">
                <MessageSquareQuote className="h-3.5 w-3.5" />
                参考答案思路
              </div>
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-slate-700">
                {answerText || "这道题还没有参考答案。"}
              </p>
            </div>

            {knowledgeText && (
              <div className="rounded-lg bg-amber-50/70 p-3.5">
                <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                  <Lightbulb className="h-3.5 w-3.5" />
                  知识点讲解
                </div>
                <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-slate-700">
                  {knowledgeText}
                </p>
              </div>
            )}

            {question.myAnswer && (
              <div className="rounded-lg bg-muted/60 p-3.5">
                <div className="mb-1.5 text-xs font-semibold text-slate-600">我的回答</div>
                <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-slate-600">
                  {question.myAnswer}
                </p>
              </div>
            )}
          </div>

          <div
            className="mt-4 border-t border-border pt-4"
            onClick={(e) => e.stopPropagation()}
          >
            <StarsInput
              value={question.rating}
              onChange={handleRate}
              className="mb-3"
            />

            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                variant={question.isWeak ? "destructive" : "outline"}
                size="sm"
                onClick={() => onUpdate(question.id, { isWeak: !question.isWeak })}
              >
                <Flag className="h-4 w-4" />
                {question.isWeak ? "已标记薄弱点" : "标记为薄弱点"}
              </Button>
              <Button
                variant={question.isFavorite ? "default" : "outline"}
                size="sm"
                onClick={() => onUpdate(question.id, { isFavorite: !question.isFavorite })}
              >
                <Star className={cn("h-4 w-4", question.isFavorite && "fill-white")} />
                {question.isFavorite ? "已收藏" : "收藏"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFlipped(false)}
                className="text-muted-foreground"
              >
                <RotateCcw className="h-4 w-4" />
                翻回正面
              </Button>
            </div>

            {question.rating !== null && (
              <p className="mt-2 text-center text-[11px] text-muted-foreground">
                已自评 {question.rating} 星
                {question.isWeak ? "（仍标记为薄弱点）" : "（≥4 星会自动从薄弱点中毕业）"}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
