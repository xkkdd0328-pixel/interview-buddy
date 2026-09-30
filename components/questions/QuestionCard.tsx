"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Flag,
  Lightbulb,
  MessageSquareQuote,
  Star,
  Trash2,
} from "lucide-react";

import { DifficultyLabel, QuestionTypeBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { QuestionDTO } from "@/lib/types";

/** 题库中的单道题卡片：可展开参考答案、编辑我的回答、收藏、标记薄弱点 */
export function QuestionCard({
  question,
  index,
  onUpdate,
  onDelete,
}: {
  question: QuestionDTO;
  index: number;
  onUpdate: (id: string, patch: Partial<QuestionDTO>) => Promise<void>;
  onDelete?: (q: QuestionDTO) => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  /** answer 里可能含 "\n\n【知识点】..." 分段，这里拆开展示 */
  const [answerText, knowledgeText] = splitAnswer(question.answer);

  return (
    <div
      className={cn(
        "rounded-xl border bg-white p-4 shadow-card transition-colors",
        question.isWeak ? "border-danger/30 bg-red-50/30" : "border-border"
      )}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-[11px] font-bold text-slate-500">
          Q{index}
        </span>

        <div className="min-w-0 flex-1">
          <div className="text-sm leading-relaxed text-foreground">{question.content}</div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            <QuestionTypeBadge type={question.type} />
            <DifficultyLabel difficulty={question.difficulty} />
            {question.rating !== null && (
              <span className="text-xs text-amber-600">
                我的自评：{"★".repeat(question.rating)}
                <span className="text-slate-300">{"★".repeat(5 - question.rating)}</span>
              </span>
            )}
            {question.isWeak && (
              <span className="flex items-center gap-0.5 text-xs font-medium text-danger">
                <Flag className="h-3 w-3" />
                薄弱点
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            title={question.isFavorite ? "取消收藏" : "收藏"}
            className={question.isFavorite ? "text-amber-500" : "text-slate-400"}
            onClick={() => onUpdate(question.id, { isFavorite: !question.isFavorite })}
          >
            <Star className={cn("h-4 w-4", question.isFavorite && "fill-amber-400")} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title={question.isWeak ? "取消薄弱点标记" : "标记为薄弱点"}
            className={question.isWeak ? "text-danger" : "text-slate-400"}
            onClick={() => onUpdate(question.id, { isWeak: !question.isWeak })}
          >
            <Flag className="h-4 w-4" />
          </Button>
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              title="删除题目"
              className="text-slate-400 hover:bg-red-50 hover:text-danger"
              onClick={() => onDelete(question)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            title={open ? "收起" : "展开参考答案"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* ---------- 参考答案 ---------- */}
      {open && (
        <div className="mt-3 space-y-2 border-t border-border pt-3">
          {answerText ? (
            <div className="rounded-lg bg-brand-50/60 p-3">
              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-brand-700">
                <MessageSquareQuote className="h-3.5 w-3.5" />
                参考答案思路
              </div>
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-slate-700">
                {answerText}
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">这道题还没有参考答案。</p>
          )}

          {knowledgeText && (
            <div className="rounded-lg bg-amber-50/70 p-3">
              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                <Lightbulb className="h-3.5 w-3.5" />
                知识点讲解
              </div>
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-slate-700">
                {knowledgeText}
              </p>
            </div>
          )}

          {/* 我的回答 */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">我的回答</span>
              {!editing ? (
                <button
                  type="button"
                  className="text-xs text-brand hover:underline"
                  onClick={() => {
                    setDraft(question.myAnswer ?? "");
                    setEditing(true);
                  }}
                >
                  {question.myAnswer ? "编辑" : "写一写"}
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:underline"
                    onClick={() => setEditing(false)}
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    className="text-xs font-medium text-brand hover:underline"
                    onClick={async () => {
                      await onUpdate(question.id, { myAnswer: draft });
                      setEditing(false);
                    }}
                  >
                    保存
                  </button>
                </div>
              )}
            </div>
            {editing ? (
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="先自己写一遍答案，再对照参考思路——主动回忆比直接看答案记得更牢。"
                className="min-h-[90px] text-[13px]"
                autoFocus
              />
            ) : (
              <p className="whitespace-pre-wrap rounded-lg bg-muted/60 p-3 text-[13px] leading-relaxed text-slate-600">
                {question.myAnswer || "（还没写）"}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** 把 answer 字段拆成「参考答案」与「知识点」两段 */
export function splitAnswer(answer: string | null): [string, string] {
  if (!answer) return ["", ""];
  const marker = "\n\n【知识点】";
  const idx = answer.indexOf(marker);
  if (idx === -1) return [answer.trim(), ""];
  return [answer.slice(0, idx).trim(), answer.slice(idx + marker.length).trim()];
}
