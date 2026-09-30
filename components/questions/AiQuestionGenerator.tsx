"use client";

import { useState } from "react";
import { AlertTriangle, Bot, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { apiSend } from "@/lib/client";
import type { QuestionDTO } from "@/lib/types";

interface GenerateResponse {
  engine: "workbuddy-cloud" | "local-rule";
  skills: string[];
  domain?: string;
  notice?: string;
  inserted: number;
  questions: QuestionDTO[];
}

/** 岗位详情页的「AI 面试题生成」区块 */
export function AiQuestionGenerator({
  jobId,
  hasQuestions,
  onGenerated,
}: {
  jobId: string;
  hasQuestions: boolean;
  onGenerated: (questions: QuestionDTO[]) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateResponse | null>(null);

  async function handleGenerate() {
    setLoading(true);
    try {
      const res = await apiSend<GenerateResponse>("/api/ai/generate-questions", "POST", {
        jobId,
        mode: "replace",
      });
      setResult(res);
      onGenerated(res.questions);
      toast.success(`已生成 ${res.inserted} 道面试题`, {
        description:
          res.engine === "workbuddy-cloud"
            ? "由 WorkBuddy 内置大模型完成 JD 拆解与出题。"
            : "本次由本地规则引擎生成（内置模型通道未启用）。",
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "生成失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-brand-100 bg-gradient-to-br from-brand-50/60 to-white p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-white">
          <Bot className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm font-semibold">
            AI 面试题生成
            <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-medium text-brand">
              技术5 · 场景3 · 行为3 · 反问3
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            读取下方这份 JD，识别技术栈与业务方向，生成一套针对该岗位的定制题库（每题含参考答案与知识点讲解）。
          </p>
        </div>
        <Button onClick={handleGenerate} disabled={loading} size="sm">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : hasQuestions ? (
            <RefreshCw className="h-4 w-4" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {loading ? "正在分析 JD…" : hasQuestions ? "重新生成" : "生成本岗位题库"}
        </Button>
      </div>

      {loading && (
        <div className="mt-3 space-y-1.5 rounded-lg bg-white/80 p-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 font-medium text-brand-700">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            正在分析 JD…
          </div>
          <div className="text-[11px] leading-relaxed">
            步骤：提取岗位关键技术栈 → 识别业务方向 → 按四类维度出题 → 为每题生成参考思路与知识点。
          </div>
        </div>
      )}

      {result && !loading && (
        <div className="mt-3 space-y-2">
          <div className="rounded-lg bg-white/80 p-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                  result.engine === "workbuddy-cloud"
                    ? "bg-teal-50 text-teal-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {result.engine === "workbuddy-cloud" ? "WorkBuddy 内置模型" : "本地规则引擎"}
              </span>
              {result.domain && (
                <span className="text-muted-foreground">
                  已识别业务方向：<strong className="text-slate-700">{result.domain}</strong>
                </span>
              )}
            </div>
            {result.skills.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-muted-foreground">已识别关键技能：</span>
                {result.skills.map((s) => (
                  <span
                    key={s}
                    className="rounded border border-brand-200 bg-white px-1.5 py-0.5 text-[11px] text-brand-700"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>

          {result.notice && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/70 p-2.5 text-[11px] leading-relaxed text-amber-800">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{result.notice}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
