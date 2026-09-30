"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  CalendarDays,
  Clock,
  Loader2,
  Save,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AiFeedback } from "@/components/interview/AiFeedback";
import { apiSend } from "@/lib/client";
import { MOOD, INTERVIEW_ROUNDS } from "@/lib/constants";
import { toDateInput } from "@/lib/utils";
import type { AnalysisDTO, InterviewDTO, JobDTO } from "@/lib/types";

interface AnalyzeResponse {
  analysis: AnalysisDTO;
  engine: string;
  notice?: string;
}

export function InterviewDetailClient({
  interview,
  job,
  initialAnalysis,
  initialEngine,
}: {
  interview: InterviewDTO;
  job: Pick<JobDTO, "id" | "company" | "position">;
  initialAnalysis: AnalysisDTO | null;
  initialEngine: string | null;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    round: interview.round,
    date: toDateInput(interview.date),
    duration: interview.duration ? String(interview.duration) : "",
    interviewer: interview.interviewer ?? "",
    mood: interview.mood ?? "normal",
    actualQuestions: interview.actualQuestions ?? "",
    notes: interview.notes ?? "",
  });
  const [analysis, setAnalysis] = useState<AnalysisDTO | null>(initialAnalysis);
  const [engine, setEngine] = useState<string | null>(initialEngine);
  const [notice, setNotice] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSave() {
    setSaving(true);
    try {
      await apiSend(`/api/interviews/${interview.id}`, "PATCH", {
        round: form.round,
        date: form.date,
        duration: form.duration ? Number(form.duration) : null,
        interviewer: form.interviewer || null,
        mood: form.mood,
        actualQuestions: form.actualQuestions || null,
        notes: form.notes || null,
      });
      toast.success("复盘已保存");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function handleAnalyze() {
    if (!form.actualQuestions.trim() && !form.notes.trim()) {
      toast.error("请先填写「实际被问到的问题」或「复盘笔记」", {
        description: "AI 需要素材才能给出有针对性的分析。",
      });
      return;
    }
    setAnalyzing(true);
    setNotice(null);
    try {
      // 先把当前编辑内容落库，保证 AI 分析的是最新内容
      await apiSend(`/api/interviews/${interview.id}`, "PATCH", {
        round: form.round,
        date: form.date,
        duration: form.duration ? Number(form.duration) : null,
        interviewer: form.interviewer || null,
        mood: form.mood,
        actualQuestions: form.actualQuestions || null,
        notes: form.notes || null,
      });

      const res = await apiSend<AnalyzeResponse>("/api/ai/analyze-interview", "POST", {
        interviewId: interview.id,
        actualQuestions: form.actualQuestions,
        notes: form.notes,
      });
      setAnalysis(res.analysis);
      setEngine(res.engine);
      setNotice(res.notice ?? null);
      toast.success("AI 复盘分析完成");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "分析失败");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleDelete() {
    setDeleteOpen(false);
    try {
      await apiSend(`/api/interviews/${interview.id}`, "DELETE");
      toast.success("面试记录已删除");
      router.push(`/jobs/${job.id}`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "删除失败");
    }
  }

  return (
    <div className="mx-auto max-w-[900px] space-y-4">
      <Link
        href={`/jobs/${job.id}`}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-brand"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        返回岗位详情
      </Link>

      {/* 头部 */}
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              面试复盘 — {job.company} {interview.round}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {form.date || "未设置日期"}
              </span>
              {form.duration && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {form.duration} 分钟
                </span>
              )}
              <span>{job.position}</span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-danger hover:bg-red-50 hover:text-danger"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            删除记录
          </Button>
        </CardContent>
      </Card>

      {/* 表单 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>基本信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>轮次</Label>
              <Select value={form.round} onValueChange={(v) => set("round", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTERVIEW_ROUNDS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>面试日期</Label>
              <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>时长（分钟）</Label>
              <Input
                type="number"
                min={1}
                value={form.duration}
                onChange={(e) => set("duration", e.target.value)}
                placeholder="45"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                面试官
              </Label>
              <Input
                value={form.interviewer}
                onChange={(e) => set("interviewer", e.target.value)}
                placeholder="可选"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>本次感受</Label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(MOOD).map(([key, m]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => set("mood", key)}
                  className={`flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm transition-colors ${
                    form.mood === key
                      ? "border-brand bg-brand-50 text-brand-700"
                      : "border-border bg-white text-slate-600 hover:border-brand-200"
                  }`}
                >
                  <span className="text-base">{m.emoji}</span>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>实际被问到的问题（每行一个）</Label>
            <Textarea
              value={form.actualQuestions}
              onChange={(e) => set("actualQuestions", e.target.value)}
              placeholder={"1. React Fiber 架构是什么\n2. 项目中遇到的最大技术挑战\n3. 如何优化首屏加载速度"}
              className="min-h-[130px] font-mono text-[13px]"
            />
          </div>

          <div className="space-y-1.5">
            <Label>复盘笔记</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="哪些答得好？哪些需要改进？整体感受如何？"
              className="min-h-[110px]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
            <Button onClick={handleSave} disabled={saving} variant="outline">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              保存复盘
            </Button>
            <Button onClick={handleAnalyze} disabled={analyzing}>
              {analyzing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {analyzing ? "AI 正在分析…" : analysis ? "重新 AI 分析" : "AI 分析我的表现"}
            </Button>
            <span className="text-xs text-muted-foreground">
              分析会读取实际问题、复盘笔记与该岗位的 JD
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 分析中骨架 */}
      {analyzing && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-brand-700">
              <Bot className="h-4 w-4" />
              正在生成复盘分析…
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              分析维度：答得好的地方 / 需要改进的地方 / 后续练习建议 / JD 中提到但没被问到的重点
            </p>
            <div className="mt-3 space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 分析结果 */}
      {analysis && !analyzing && (
        <Card>
          <CardContent className="p-5">
            <AiFeedback analysis={analysis} engine={engine} />
            {notice && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-[11px] leading-relaxed text-amber-800">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{notice}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除这条面试记录？</AlertDialogTitle>
            <AlertDialogDescription>
              删除后该轮次的问题记录与 AI 复盘分析都会丢失，且无法恢复。岗位本身不会被删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-danger text-white hover:brightness-95"
              onClick={handleDelete}
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
