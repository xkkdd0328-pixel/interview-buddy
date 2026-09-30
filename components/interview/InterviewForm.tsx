"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { apiSend } from "@/lib/client";
import { INTERVIEW_ROUNDS, MOOD } from "@/lib/constants";
import { toDateInput } from "@/lib/utils";
import type { InterviewDTO } from "@/lib/types";

export function InterviewForm({
  jobId,
  onCreated,
  trigger,
}: {
  jobId: string;
  onCreated: (iv: InterviewDTO) => void;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    round: "一面",
    date: toDateInput(new Date()),
    duration: "45",
    interviewer: "",
    mood: "normal",
    actualQuestions: "",
    notes: "",
  });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit() {
    setSaving(true);
    try {
      const created = await apiSend<InterviewDTO>("/api/interviews", "POST", {
        jobId,
        round: form.round,
        date: form.date,
        duration: form.duration ? Number(form.duration) : null,
        interviewer: form.interviewer || null,
        mood: form.mood,
        actualQuestions: form.actualQuestions || null,
        notes: form.notes || null,
      });
      onCreated(created);
      toast.success("面试记录已保存", { description: "可以点进详情做 AI 复盘分析。" });
      setOpen(false);
      setForm((f) => ({ ...f, actualQuestions: "", notes: "", interviewer: "" }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4" />
            添加面试记录
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>添加面试记录</DialogTitle>
          <DialogDescription>
            记录轮次、时长与实际问题。保存后可用 AI 分析本次表现，找出改进点。
          </DialogDescription>
        </DialogHeader>

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
            <Label>面试官（可选）</Label>
            <Input
              value={form.interviewer}
              onChange={(e) => set("interviewer", e.target.value)}
              placeholder="如：前端 leader / 张老师"
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
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                  form.mood === key
                    ? "border-brand bg-brand-50 text-brand-700"
                    : "border-border bg-white text-slate-600 hover:border-brand-200"
                }`}
              >
                <span>{m.emoji}</span>
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
            className="min-h-[110px] font-mono text-[13px]"
          />
        </div>

        <div className="space-y-1.5">
          <Label>复盘笔记</Label>
          <Textarea
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="哪些答得好？哪些需要改进？整体感受如何？"
            className="min-h-[90px]"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            保存记录
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
