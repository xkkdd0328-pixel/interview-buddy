"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Database,
  Download,
  FileJson,
  FileSpreadsheet,
  Trash2,
  Upload,
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
import { apiSend } from "@/lib/client";
import type { SettingsDTO } from "@/lib/types";

export function SettingsClient({ settings }: { settings: SettingsDTO }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const { counts, database, ai } = settings;

  /** 导出 */
  function handleExport(format: "csv" | "json", type: "all" | "jobs" | "questions" = "all") {
    window.location.href = `/api/settings/export?format=${format}&type=${type}`;
    toast.success(`正在导出 ${format.toUpperCase()} 文件…`);
  }

  /** 导入 */
  async function handleImport(file: File) {
    setImporting(true);
    try {
      const text = await file.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        toast.error("文件不是合法的 JSON，请选择由本应用导出的备份文件");
        return;
      }
      const res = await apiSend<{ jobs: number; questions: number; interviews: number }>(
        "/api/settings/import",
        "POST",
        { data: parsed, mode: "merge" }
      );
      toast.success("导入完成", {
        description: `新增 ${res.jobs} 个岗位、${res.questions} 道题目、${res.interviews} 条面试记录`,
      });
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "导入失败");
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  /** 清空 */
  async function handleClear() {
    setClearing(true);
    try {
      await apiSend("/api/settings/clear", "POST", { confirm: "DELETE_ALL" });
      toast.success("已清空全部数据");
      setClearOpen(false);
      setConfirmText("");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "清空失败");
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="mx-auto max-w-[900px] space-y-4">
      {/* ---------- AI 通道 ---------- */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-brand" />
            AI 能力
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ${
                ai.enabled ? "bg-teal-50 text-teal-700" : "bg-amber-50 text-amber-700"
              }`}
            >
              {ai.enabled ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
              当前引擎：{ai.engineLabel}
            </span>
            {ai.endpointHost && (
              <span className="text-xs text-muted-foreground">通道：{ai.endpointHost}</span>
            )}
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">
            {ai.enabled ? (
              "面试题生成、复盘分析与 JD 智能拆解均由 WorkBuddy 内置大模型完成，无需配置任何外部 API Key。"
            ) : (
              <>
                InterviewBuddy 的 AI 能力设计为<strong className="text-slate-600">由 WorkBuddy 内置大模型</strong>
                提供——不需要你去申请任何外部 API Key。当前内置模型通道尚未启用，系统已自动回退到
                <strong className="text-slate-600">本地规则引擎</strong>
                ，所有功能（题库生成、复盘分析、JD 智能拆解）依然可用，只是定制化程度略低。
                <br />
                <br />
                启用方式：在对话中让 Assistant 为你开通云服务的 AI 能力，确认后把返回的通道配置写入项目
                <code className="mx-1 rounded bg-muted px-1 py-0.5 font-mono text-[11px]">.env</code>
                的
                <code className="mx-1 rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
                  WORKBUDDY_CLOUD_ENDPOINT / WORKBUDDY_CLOUD_KEY / WORKBUDDY_CLOUD_MODEL
                </code>
                三项即可自动切换，无需改动任何业务代码。
              </>
            )}
          </p>

          <div className="rounded-lg border border-border bg-background p-3">
            <div className="text-xs font-medium text-slate-600">引擎分工说明（诚实声明）</div>
            <ul className="mt-1.5 space-y-1 text-[11px] leading-relaxed text-muted-foreground">
              <li>· 内置模型通道可用时：由大模型完成 JD 拆解、出题与复盘分析，内容为语义级理解结果。</li>
              <li>· 通道不可用时：本地规则引擎按关键词匹配与模板生成，内容经过人工整理、可直接使用。</li>
              <li>· 无论哪种引擎，生成结果都会在界面上明确标注来源，不会混淆。</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* ---------- 数据库 ---------- */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Database className="h-4 w-4 text-brand" />
            数据存储
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="岗位" value={counts.jobs} />
            <Stat label="面试题" value={counts.questions} />
            <Stat label="面试记录" value={counts.interviews} />
            <Stat label="标签" value={counts.tags} />
          </div>
          <div className="rounded-lg border border-border bg-background p-3 text-xs">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5">
              <span className="text-muted-foreground">
                数据库类型：<strong className="text-slate-700">{database.provider}</strong>
              </span>
              <span className="text-muted-foreground">
                地址：<strong className="text-slate-700">{database.host}</strong>
              </span>
              <span className="text-muted-foreground">
                库名：<strong className="text-slate-700">{database.name}</strong>
              </span>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              {database.provider === "SQLite"
                ? "全部数据保存在项目目录内的 SQLite 文件中，不经过任何第三方服务器；拷贝项目目录即可带走全部数据，换电脑无需安装数据库。本应用为单机单用户设计，无登录系统。"
                : `全部数据保存在本机 ${database.provider} 中，不经过任何第三方服务器；本应用为单机单用户设计，无登录系统。`}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ---------- 导出 ---------- */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Download className="h-4 w-4 text-brand" />
            数据导出
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            导出的文件可作为备份，也可以在换电脑后通过下方「数据导入」恢复。
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport("csv", "all")}>
              <FileSpreadsheet className="h-4 w-4" />
              导出 CSV（Excel 可直接打开）
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport("json", "all")}>
              <FileJson className="h-4 w-4" />
              导出 JSON（完整备份）
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            CSV 的 BOM 已处理，用 Excel 打开中文不会乱码；岗位表与题库表在同一份文件里分段存放。
          </p>
        </CardContent>
      </Card>

      {/* ---------- 导入 ---------- */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-brand" />
            数据导入
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            选择由本应用导出的 JSON 备份文件。导入采用「合并」模式，不会覆盖你现有的数据。
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImport(f);
            }}
          />
          <Button
            variant="outline"
            size="sm"
            disabled={importing}
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            {importing ? "正在导入…" : "选择 JSON 文件"}
          </Button>
        </CardContent>
      </Card>

      {/* ---------- 危险操作 ---------- */}
      <Card className="border-danger/25">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-danger">
            <AlertTriangle className="h-4 w-4" />
            危险操作
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs leading-relaxed text-muted-foreground">
            清空所有数据会删除全部岗位、面试题、面试记录与标签。
            <strong className="text-danger">此操作不可撤销</strong>
            ，建议先导出一份备份。
          </p>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              setConfirmText("");
              setClearOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4" />
            清除所有数据
          </Button>
        </CardContent>
      </Card>

      {/* ---------- 二次确认 ---------- */}
      <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-danger">
              <AlertTriangle className="h-5 w-5" />
              确认清空全部数据？
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>即将删除以下全部数据，且无法恢复：</p>
                <ul className="list-inside list-disc space-y-0.5 text-foreground">
                  <li>{counts.jobs} 个岗位投递记录</li>
                  <li>{counts.questions} 道面试题（含自评与我的回答）</li>
                  <li>{counts.interviews} 条面试记录（含 AI 复盘分析）</li>
                  <li>{counts.tags} 个岗位标签</li>
                </ul>
                <p className="text-xs">
                  请在下方输入{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] font-semibold">
                    DELETE
                  </code>{" "}
                  以确认操作。
                </p>
                <input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="输入 DELETE"
                  className="h-9 w-full rounded-lg border border-input px-3 text-sm outline-none focus:border-danger focus:ring-2 focus:ring-danger/25"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              disabled={confirmText !== "DELETE" || clearing}
              className="bg-danger text-white hover:brightness-95 disabled:opacity-40"
              onClick={(e) => {
                if (confirmText !== "DELETE") {
                  e.preventDefault();
                  return;
                }
                handleClear();
              }}
            >
              {clearing ? "正在清空…" : "确认清空全部数据"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2.5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-xl font-semibold text-foreground">{value}</div>
    </div>
  );
}
