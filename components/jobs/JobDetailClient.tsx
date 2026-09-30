"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  MapPin,
  MessageSquareText,
  Pencil,
  Trash2,
  Wallet,
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
import { AiQuestionGenerator } from "@/components/questions/AiQuestionGenerator";
import { QuestionList } from "@/components/questions/QuestionList";
import { InterviewForm } from "@/components/interview/InterviewForm";
import { StatusBadge } from "@/components/common/StatusBadge";
import { apiSend } from "@/lib/client";
import { MOOD, PRIORITY, type Mood } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { InterviewDTO, JobDTO, QuestionDTO } from "@/lib/types";

export function JobDetailClient({
  job,
  initialQuestions,
  initialInterviews,
}: {
  job: JobDTO;
  initialQuestions: QuestionDTO[];
  initialInterviews: InterviewDTO[];
}) {
  const router = useRouter();
  const [questions, setQuestions] = useState(initialQuestions);
  const [interviews, setInterviews] = useState(initialInterviews);
  const [jdOpen, setJdOpen] = useState(false);
  const [deleteQuestion, setDeleteQuestion] = useState<QuestionDTO | null>(null);
  const [deleteJobOpen, setDeleteJobOpen] = useState(false);

  const priority = PRIORITY[job.priority] ?? PRIORITY[0];

  /** 更新题目 */
  async function updateQuestion(id: string, patch: Partial<QuestionDTO>) {
    const prev = questions;
    setQuestions((list) => list.map((q) => (q.id === id ? { ...q, ...patch } : q)));
    try {
      await apiSend(`/api/questions/${id}`, "PATCH", patch);
    } catch (e) {
      setQuestions(prev);
      toast.error(e instanceof Error ? e.message : "更新失败");
    }
  }

  /** 删除题目 */
  async function confirmDeleteQuestion() {
    const q = deleteQuestion;
    setDeleteQuestion(null);
    if (!q) return;
    const prev = questions;
    setQuestions((list) => list.filter((x) => x.id !== q.id));
    try {
      await apiSend(`/api/questions/${q.id}`, "DELETE");
      toast.success("题目已删除");
    } catch (e) {
      setQuestions(prev);
      toast.error(e instanceof Error ? e.message : "删除失败");
    }
  }

  /** 删除岗位 */
  async function confirmDeleteJob() {
    setDeleteJobOpen(false);
    try {
      await apiSend(`/api/jobs/${job.id}`, "DELETE");
      toast.success("岗位已删除");
      router.push("/jobs");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "删除失败");
    }
  }

  return (
    <div className="mx-auto max-w-[1100px] space-y-4">
      {/* ---------- 返回 ---------- */}
      <Link
        href="/jobs"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-brand"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        返回岗位列表
      </Link>

      {/* ---------- 顶部信息 ---------- */}
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-semibold tracking-tight">{job.company}</h1>
                <StatusBadge status={job.status} />
                {priority.stars > 0 && (
                  <span className="text-xs font-medium" style={{ color: priority.color }}>
                    {"★".repeat(priority.stars)} {priority.label}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-600">{job.position}</p>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                {job.salary && (
                  <span className="flex items-center gap-1">
                    <Wallet className="h-3.5 w-3.5" />
                    <strong className="text-slate-700">{job.salary}</strong>
                  </span>
                )}
                {job.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {job.location}
                  </span>
                )}
                {job.channel && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" />
                    {job.channel}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  投递于 {formatDate(job.appliedAt)}
                </span>
                {job.url && (
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-brand hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    投递链接
                  </a>
                )}
              </div>

              {job.tags && job.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {job.tags.map((t) => (
                    <span
                      key={t.id}
                      className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                    >
                      #{t.tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/jobs/${job.id}/edit`}>
                  <Pencil className="h-4 w-4" />
                  编辑
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-danger hover:bg-red-50 hover:text-danger"
                onClick={() => setDeleteJobOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                删除
              </Button>
            </div>
          </div>

          {/* JD 折叠区 */}
          <div className="mt-4 border-t border-border pt-3">
            <button
              type="button"
              onClick={() => setJdOpen((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-medium text-brand hover:underline"
            >
              {jdOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {jdOpen ? "收起职位描述" : "查看完整职位描述（JD）"}
            </button>
            {jdOpen && (
              <pre className="mt-2.5 max-h-[420px] overflow-auto whitespace-pre-wrap rounded-lg bg-muted/60 p-3.5 font-mono text-[12.5px] leading-relaxed text-slate-700">
                {job.jd}
              </pre>
            )}
          </div>

          {job.notes && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/60 p-3">
              <div className="text-xs font-semibold text-amber-700">备注</div>
              <p className="mt-1 whitespace-pre-wrap text-[13px] text-slate-700">{job.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---------- AI 题库 ---------- */}
      <AiQuestionGenerator
        jobId={job.id}
        hasQuestions={questions.length > 0}
        onGenerated={setQuestions}
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <MessageSquareText className="h-4 w-4 text-brand" />
            本岗位题库
            <span className="text-xs font-normal text-muted-foreground">
              共 {questions.length} 道
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <QuestionList
            jobId={job.id}
            questions={questions}
            onUpdate={updateQuestion}
            onDelete={setDeleteQuestion}
          />
        </CardContent>
      </Card>

      {/* ---------- 面试记录 ---------- */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-brand" />
            面试记录
            <span className="text-xs font-normal text-muted-foreground">
              共 {interviews.length} 场
            </span>
          </CardTitle>
          <InterviewForm jobId={job.id} onCreated={(iv) => setInterviews((l) => [iv, ...l])} />
        </CardHeader>
        <CardContent>
          {interviews.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border py-8 text-center text-xs text-muted-foreground">
              还没有面试记录。面完试后回来填一笔，AI 会帮你复盘。
            </div>
          ) : (
            <div className="space-y-2">
              {interviews.map((iv) => {
                const mood = iv.mood ? MOOD[iv.mood as Mood] : null;
                const hasFeedback = Boolean(iv.aiFeedback);
                return (
                  <Link
                    key={iv.id}
                    href={`/interview/${iv.id}`}
                    className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-white px-3.5 py-3 transition-colors hover:border-brand-200 hover:bg-brand-50/40"
                  >
                    <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                      {iv.round}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatDate(iv.date)}</span>
                    {iv.duration ? (
                      <span className="text-xs text-muted-foreground">{iv.duration} 分钟</span>
                    ) : null}
                    {mood && (
                      <span className="text-xs text-muted-foreground">
                        {mood.emoji} {mood.label}
                      </span>
                    )}
                    {iv.interviewer && (
                      <span className="text-xs text-muted-foreground">
                        面试官：{iv.interviewer}
                      </span>
                    )}
                    <span className="ml-auto flex items-center gap-2">
                      {hasFeedback ? (
                        <span className="rounded bg-teal-50 px-1.5 py-0.5 text-[10px] font-medium text-teal-700">
                          已有 AI 复盘
                        </span>
                      ) : (
                        <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                          待复盘
                        </span>
                      )}
                      <span className="text-xs text-brand">查看复盘 →</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---------- 删除确认 ---------- */}
      <AlertDialog
        open={Boolean(deleteQuestion)}
        onOpenChange={(o) => !o && setDeleteQuestion(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除这道题？</AlertDialogTitle>
            <AlertDialogDescription>
              删除后无法恢复，你的自评与回答也会一起丢失。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-danger text-white hover:brightness-95"
              onClick={confirmDeleteQuestion}
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteJobOpen} onOpenChange={setDeleteJobOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-danger" />
              删除岗位
            </AlertDialogTitle>
            <AlertDialogDescription>
              即将删除「
              <strong className="text-foreground">
                {job.company} · {job.position}
              </strong>
              」，连同
              <strong className="text-danger">{questions.length} 道面试题</strong>与
              <strong className="text-danger">{interviews.length} 条面试记录</strong>
              一并删除，且无法恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-danger text-white hover:brightness-95"
              onClick={confirmDeleteJob}
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
