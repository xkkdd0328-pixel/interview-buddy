"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardPaste, Loader2, Save, Sparkles, Wand2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiSend } from "@/lib/client";
import { CHANNELS, JOB_STATUS, JOB_STATUS_KEYS, PRIORITY } from "@/lib/constants";
import { toDateInput } from "@/lib/utils";
import type { JobDTO } from "@/lib/types";

interface FormState {
  company: string;
  position: string;
  jd: string;
  salary: string;
  location: string;
  url: string;
  channel: string;
  status: string;
  priority: string;
  appliedAt: string;
  notes: string;
  tags: string[];
}

const EMPTY: FormState = {
  company: "",
  position: "",
  jd: "",
  salary: "",
  location: "",
  url: "",
  channel: "Boss直聘",
  status: "APPLIED",
  priority: "0",
  appliedAt: toDateInput(new Date()),
  notes: "",
  tags: [],
};

export function JobForm({ job }: { job?: JobDTO }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [pasteText, setPasteText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (!job) return;
    setForm({
      company: job.company,
      position: job.position,
      jd: job.jd,
      salary: job.salary ?? "",
      location: job.location ?? "",
      url: job.url ?? "",
      channel: job.channel ?? "Boss直聘",
      status: job.status,
      priority: String(job.priority ?? 0),
      appliedAt: toDateInput(job.appliedAt),
      notes: job.notes ?? "",
      tags: job.tags?.map((t) => t.tag) ?? [],
    });
  }, [job]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  /** AI 智能拆解 */
  async function handleParse() {
    const text = pasteText.trim();
    if (text.length < 10) {
      toast.error("请先粘贴招聘信息原文（至少 10 个字）");
      return;
    }
    setParsing(true);
    try {
      const res = await apiSend<{
        jd: string;
        company: string;
        position: string;
        salary: string;
        location: string;
        channel: string;
        keywords: string[];
        engine: string;
      }>("/api/ai/parse-jd", "POST", { text });

      setForm((f) => ({
        ...f,
        jd: res.jd,
        company: res.company || f.company,
        position: res.position || f.position,
        salary: res.salary || f.salary,
        location: res.location || f.location,
        channel: res.channel || f.channel,
      }));
      setKeywords(res.keywords ?? []);

      const filled = [res.company, res.position, res.salary, res.location, res.channel].filter(
        Boolean
      ).length;
      if (filled === 0) {
        toast.warning("未能自动识别出字段，请手动填写表单", {
          description: "原始 JD 已填入下方文本框，不会丢失。",
        });
      } else {
        toast.success(`已自动填充 ${filled} 个字段`, {
          description:
            res.engine === "workbuddy-cloud"
              ? "由 WorkBuddy 内置模型拆解，请在下方核对后保存。"
              : "由本地规则引擎拆解，请在下方核对后保存。",
        });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "拆解失败");
    } finally {
      setParsing(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.company.trim()) return toast.error("请填写公司名称");
    if (!form.position.trim()) return toast.error("请填写岗位名称");
    if (!form.jd.trim()) return toast.error("请填写职位描述（JD）");

    setSaving(true);
    try {
      const payload = {
        company: form.company.trim(),
        position: form.position.trim(),
        jd: form.jd.trim(),
        salary: form.salary.trim() || null,
        location: form.location.trim() || null,
        url: form.url.trim() || null,
        channel: form.channel || null,
        status: form.status,
        priority: Number(form.priority),
        appliedAt: form.appliedAt,
        notes: form.notes.trim() || null,
        tags: form.tags,
      };

      if (job) {
        await apiSend(`/api/jobs/${job.id}`, "PATCH", payload);
        toast.success("岗位已更新");
        router.push(`/jobs/${job.id}`);
      } else {
        const created = await apiSend<JobDTO>("/api/jobs", "POST", payload);
        toast.success("岗位已保存", { description: "下一步可以生成定制面试题库" });
        router.push(`/jobs/${created.id}`);
      }
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  const detected = useMemo(
    () =>
      [
        form.company && { label: "公司", value: form.company },
        form.position && { label: "岗位", value: form.position },
        form.salary && { label: "薪资", value: form.salary },
        form.location && { label: "地点", value: form.location },
        form.channel && { label: "渠道", value: form.channel },
      ].filter(Boolean) as { label: string; value: string }[],
    [form.company, form.position, form.salary, form.location, form.channel]
  );

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-[1100px] space-y-5">
      {/* ---------- 第一步：智能粘贴 ---------- */}
      <section className="rounded-xl border border-brand-100 bg-gradient-to-br from-brand-50/70 to-white p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white">
            1
          </span>
          <h2 className="text-sm font-semibold">粘贴招聘信息，让 AI 先打草稿</h2>
          <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-medium text-brand">
            可选 · 强烈推荐
          </span>
        </div>
        <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
          从 Boss 直聘 / 拉勾 / 官网复制<strong className="text-slate-600">整段</strong>
          招聘信息（排版混乱也没关系），粘贴到下面的框里，点一下按钮，系统会自动把公司、岗位、薪资、地点、渠道分类填好。
          <strong className="text-slate-600">机器打草稿，你来把关。</strong>
        </p>

        <Textarea
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          placeholder={"例如：\n字节跳动 前端开发工程师（北京）30-50K·15薪\n岗位职责：\n1. 负责短视频业务的前端架构设计...\n任职要求：\n1. 熟练掌握 React / TypeScript..."}
          className="min-h-[160px] bg-white font-mono text-[13px] leading-relaxed"
        />

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button type="button" onClick={handleParse} disabled={parsing} size="sm">
            {parsing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4" />
            )}
            {parsing ? "正在拆解…" : "AI 智能拆解"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                const t = await navigator.clipboard.readText();
                if (t) {
                  setPasteText(t);
                  toast.success("已读取剪贴板内容");
                } else {
                  toast.error("剪贴板为空");
                }
              } catch {
                toast.error("浏览器拒绝了剪贴板访问，请手动粘贴（Ctrl+V）");
              }
            }}
          >
            <ClipboardPaste className="h-4 w-4" />
            读取剪贴板
          </Button>
          {pasteText && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setPasteText("");
                setKeywords([]);
              }}
            >
              清空
            </Button>
          )}
        </div>

        {keywords.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-brand-100 pt-3">
            <span className="flex items-center gap-1 text-xs font-medium text-brand-700">
              <Sparkles className="h-3.5 w-3.5" />
              已识别关键技能
            </span>
            {keywords.map((k) => (
              <span
                key={k}
                className="rounded-md border border-brand-200 bg-white px-2 py-0.5 text-xs text-brand-700"
              >
                {k}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* ---------- 第二步：核对表单 ---------- */}
      <section className="rounded-xl border border-border bg-white p-5 shadow-card">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-700 text-[11px] font-bold text-white">
            2
          </span>
          <h2 className="text-sm font-semibold">核对并补充信息</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="公司名称" required>
            <Input
              value={form.company}
              onChange={(e) => set("company", e.target.value)}
              placeholder="如：字节跳动"
            />
          </Field>
          <Field label="岗位名称" required>
            <Input
              value={form.position}
              onChange={(e) => set("position", e.target.value)}
              placeholder="如：前端开发工程师"
            />
          </Field>
          <Field label="薪资范围">
            <Input
              value={form.salary}
              onChange={(e) => set("salary", e.target.value)}
              placeholder="如：30-50K·15薪"
            />
          </Field>
          <Field label="工作地点">
            <Input
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="如：北京"
            />
          </Field>
          <Field label="投递渠道">
            <Select value={form.channel} onValueChange={(v) => set("channel", v)}>
              <SelectTrigger>
                <SelectValue placeholder="选择渠道" />
              </SelectTrigger>
              <SelectContent>
                {CHANNELS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="投递链接">
            <Input
              value={form.url}
              onChange={(e) => set("url", e.target.value)}
              placeholder="https://..."
            />
          </Field>
          <Field label="当前状态">
            <Select value={form.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {JOB_STATUS_KEYS.map((k) => (
                  <SelectItem key={k} value={k}>
                    {JOB_STATUS[k].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="优先级">
            <Select value={form.priority} onValueChange={(v) => set("priority", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PRIORITY).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="投递日期">
            <Input
              type="date"
              value={form.appliedAt}
              onChange={(e) => set("appliedAt", e.target.value)}
            />
          </Field>
          <Field label="标签（回车添加）">
            <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-input bg-white px-2 py-1.5 min-h-10">
              {form.tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-0.5 text-xs text-brand-700"
                >
                  {t}
                  <button
                    type="button"
                    onClick={() => set("tags", form.tags.filter((x) => x !== t))}
                    className="text-brand-400 hover:text-brand-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    const v = tagInput.trim();
                    if (v && !form.tags.includes(v)) set("tags", [...form.tags, v]);
                    setTagInput("");
                  }
                }}
                placeholder={form.tags.length ? "" : "如：前端、大厂、远程"}
                className="min-w-[100px] flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          </Field>
        </div>

        <div className="mt-4">
          <Field label="职位描述（JD）" required>
            <Textarea
              value={form.jd}
              onChange={(e) => set("jd", e.target.value)}
              placeholder="粘贴或输入完整的职位描述，AI 生成面试题时会读取这里的内容"
              className="min-h-[220px] font-mono text-[13px] leading-relaxed"
            />
          </Field>
        </div>

        <div className="mt-4">
          <Field label="备注">
            <Textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="如：HR 说一周内回复 / 朋友内推，优先级高"
              className="min-h-[80px]"
            />
          </Field>
        </div>

        {detected.length > 0 && (
          <div className="mt-4 rounded-lg bg-muted/60 px-3 py-2.5 text-xs text-muted-foreground">
            <span className="font-medium text-slate-600">当前表单内容：</span>
            {detected.map((d) => (
              <span key={d.label} className="ml-2">
                <span className="text-slate-400">{d.label}</span> {d.value}
              </span>
            ))}
          </div>
        )}

        <div className="mt-5 flex items-center gap-3 border-t border-border pt-4">
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {job ? "保存修改" : "保存岗位"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            取消
          </Button>
          <span className="text-xs text-muted-foreground">
            保存后可在岗位详情页一键生成定制面试题库
          </span>
        </div>
      </section>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </Label>
      {children}
    </div>
  );
}
