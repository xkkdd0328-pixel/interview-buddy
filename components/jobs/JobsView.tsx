"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KanbanSquare, List, Plus, Search, Trash2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/common/EmptyState";
import { KanbanBoard } from "@/components/jobs/KanbanBoard";
import { JobList } from "@/components/jobs/JobList";
import { JOB_STATUS, JOB_STATUS_KEYS, KANBAN_COLUMNS, type JobStatus } from "@/lib/constants";
import { apiSend } from "@/lib/client";
import { cn } from "@/lib/utils";
import type { JobDTO } from "@/lib/types";

type ViewMode = "kanban" | "list";

export function JobsView({ initialJobs }: { initialJobs: JobDTO[] }) {
  const router = useRouter();
  const [jobs, setJobs] = useState(initialJobs);
  const [view, setView] = useState<ViewMode>("kanban");
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sort, setSort] = useState("appliedAt");
  const [pendingDelete, setPendingDelete] = useState<JobDTO | null>(null);

  /** 本地筛选与排序 */
  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    let list = jobs.filter((j) => {
      if (statusFilter !== "ALL") {
        const col = KANBAN_COLUMNS.find((c) => c.key === statusFilter);
        if (col) {
          if (!col.statuses.includes(j.status as never)) return false;
        } else if (j.status !== statusFilter) {
          return false;
        }
      }
      if (kw) {
        const hay = `${j.company} ${j.position} ${j.location ?? ""} ${j.channel ?? ""}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });

    list = list.slice().sort((a, b) => {
      if (sort === "priority") return b.priority - a.priority;
      if (sort === "company") return a.company.localeCompare(b.company, "zh-CN");
      return new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime();
    });
    return list;
  }, [jobs, keyword, statusFilter, sort]);

  /** 拖拽改状态 */
  async function handleStatusChange(jobId: string, status: string) {
    const prev = jobs;
    setJobs((list) => list.map((j) => (j.id === jobId ? { ...j, status } : j)));
    try {
      await apiSend(`/api/jobs/${jobId}`, "PATCH", { status });
      toast.success(`已改为「${JOB_STATUS[status as JobStatus]?.label ?? status}」`, {
        duration: 1500,
      });
      router.refresh();
    } catch (e) {
      setJobs(prev);
      toast.error(e instanceof Error ? e.message : "更新失败");
      throw e;
    }
  }

  /** 删除 */
  async function confirmDelete() {
    const job = pendingDelete;
    setPendingDelete(null);
    if (!job) return;
    const prev = jobs;
    setJobs((list) => list.filter((j) => j.id !== job.id));
    try {
      await apiSend(`/api/jobs/${job.id}`, "DELETE");
      toast.success(`已删除「${job.company} · ${job.position}」`);
      router.refresh();
    } catch (e) {
      setJobs(prev);
      toast.error(e instanceof Error ? e.message : "删除失败");
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-4">
      {/* ---------- 工具栏 ---------- */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索公司 / 岗位 / 地点"
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="全部状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">全部状态</SelectItem>
            {KANBAN_COLUMNS.map((c) => (
              <SelectItem key={c.key} value={c.key}>
                {c.label}
              </SelectItem>
            ))}
            {JOB_STATUS_KEYS.filter((k) => !KANBAN_COLUMNS.some((c) => c.statuses.includes(k))).map(
              (k) => (
                <SelectItem key={k} value={k}>
                  {JOB_STATUS[k].label}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>

        {view === "list" && (
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="appliedAt">按投递日期</SelectItem>
              <SelectItem value="priority">按优先级</SelectItem>
              <SelectItem value="company">按公司名</SelectItem>
            </SelectContent>
          </Select>
        )}

        {/* 视图切换 */}
        <div className="flex items-center rounded-lg border border-border bg-white p-0.5 shadow-sm">
          <button
            type="button"
            onClick={() => setView("kanban")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              view === "kanban" ? "bg-brand text-white" : "text-slate-500 hover:bg-muted"
            )}
          >
            <KanbanSquare className="h-3.5 w-3.5" />
            看板视图
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              view === "list" ? "bg-brand text-white" : "text-slate-500 hover:bg-muted"
            )}
          >
            <List className="h-3.5 w-3.5" />
            列表视图
          </button>
        </div>

        <Button asChild size="sm" className="h-10">
          <Link href="/jobs/new">
            <Plus className="h-4 w-4" />
            添加岗位
          </Link>
        </Button>
      </div>

      {/* ---------- 统计条 ---------- */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>
          共 <strong className="text-foreground">{jobs.length}</strong> 个岗位
        </span>
        {filtered.length !== jobs.length && (
          <span>
            筛选后 <strong className="text-brand">{filtered.length}</strong> 个
          </span>
        )}
        <span className="hidden sm:inline">· 拖拽卡片即可改变状态</span>
      </div>

      {/* ---------- 主视图 ---------- */}
      {jobs.length === 0 ? (
        <EmptyState
          title="还没有任何岗位记录"
          description="从招聘网站复制一段 JD，粘贴进来点一下「AI 智能拆解」，20 秒完成录入。"
          action={
            <Button asChild>
              <Link href="/jobs/new">
                <Plus className="h-4 w-4" />
                添加第一个岗位
              </Link>
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState title="没有符合条件的岗位" description="试着换个关键词，或把状态筛选改回「全部状态」。" />
      ) : view === "kanban" ? (
        <KanbanBoard jobs={filtered} onStatusChange={handleStatusChange} />
      ) : (
        <JobList jobs={filtered} onDelete={setPendingDelete} />
      )}

      {/* ---------- 删除确认 ---------- */}
      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-danger" />
              删除岗位
            </AlertDialogTitle>
            <AlertDialogDescription>
              即将删除「
              <strong className="text-foreground">
                {pendingDelete?.company} · {pendingDelete?.position}
              </strong>
              」，该岗位下的
              <strong className="text-danger">
                {pendingDelete?._count?.questions ?? 0} 道面试题
              </strong>
              与
              <strong className="text-danger">
                {pendingDelete?._count?.interviews ?? 0} 条面试记录
              </strong>
              会一并删除，且无法恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-danger text-white hover:brightness-95"
              onClick={confirmDelete}
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
