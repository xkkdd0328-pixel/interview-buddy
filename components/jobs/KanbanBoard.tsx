"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Inbox } from "lucide-react";

import { JobCard, JobCardOverlay } from "@/components/jobs/JobCard";
import { KANBAN_COLUMNS, defaultStatusOfColumn, kanbanColumnOf } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { JobDTO } from "@/lib/types";

function Column({
  column,
  jobs,
  activeId,
}: {
  column: (typeof KANBAN_COLUMNS)[number];
  jobs: JobDTO[];
  activeId: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.key,
    data: { column: column.key },
  });

  return (
    <div className="flex min-w-[236px] flex-1 flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: column.color }} />
          <span className="text-[13px] font-semibold">{column.label}</span>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            {jobs.length}
          </span>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 space-y-2 rounded-xl border border-dashed p-2 transition-colors",
          isOver && activeId
            ? "border-brand bg-brand-50/70"
            : "border-slate-200 bg-slate-50/60"
        )}
      >
        {jobs.length === 0 ? (
          <div className="flex h-24 items-center justify-center rounded-lg text-[11px] text-slate-400">
            {isOver && activeId ? "放到这里" : "暂无岗位"}
          </div>
        ) : (
          jobs.map((job) => <JobCard key={job.id} job={job} />)
        )}
      </div>
    </div>
  );
}

export function KanbanBoard({
  jobs,
  onStatusChange,
}: {
  jobs: JobDTO[];
  onStatusChange: (jobId: string, status: string) => Promise<void>;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  /** 合并本地乐观状态 */
  const merged = useMemo(
    () => jobs.map((j) => (overrides[j.id] ? { ...j, status: overrides[j.id] } : j)),
    [jobs, overrides]
  );

  const grouped = useMemo(() => {
    const map: Record<string, JobDTO[]> = {};
    for (const col of KANBAN_COLUMNS) map[col.key] = [];
    for (const job of merged) {
      const key = kanbanColumnOf(job.status);
      (map[key] ??= []).push(job);
    }
    return map;
  }, [merged]);

  const activeJob = activeId ? merged.find((j) => j.id === activeId) ?? null : null;

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  async function handleDragEnd(e: DragEndEvent) {
    const jobId = String(e.active.id);
    setActiveId(null);

    const overId = e.over?.id ? String(e.over.id) : null;
    if (!overId) return;

    // 落点可能是列（列 key），也可能是另一张卡片（需要反查它所在列）
    let targetColumn = KANBAN_COLUMNS.find((c) => c.key === overId)?.key;
    if (!targetColumn) {
      const overJob = merged.find((j) => j.id === overId);
      if (overJob) targetColumn = kanbanColumnOf(overJob.status);
    }
    if (!targetColumn) return;

    const job = merged.find((j) => j.id === jobId);
    if (!job) return;
    if (kanbanColumnOf(job.status) === targetColumn) return; // 没跨列，忽略

    const nextStatus = defaultStatusOfColumn(targetColumn);

    // 乐观更新
    setOverrides((o) => ({ ...o, [jobId]: nextStatus }));
    try {
      await onStatusChange(jobId, nextStatus);
    } catch {
      // 失败则回滚
      setOverrides((o) => {
        const next = { ...o };
        delete next[jobId];
        return next;
      });
      throw new Error("状态更新失败，已回滚");
    } finally {
      // 服务端数据刷新后清掉本地覆盖
      setTimeout(() => {
        setOverrides((o) => {
          const next = { ...o };
          delete next[jobId];
          return next;
        });
      }, 600);
    }
  }

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-white/60 py-16 text-center">
        <Inbox className="mb-2 h-7 w-7 text-slate-300" />
        <div className="text-sm font-medium text-slate-600">看板还是空的</div>
        <p className="mt-1 text-xs text-muted-foreground">
          添加岗位后，卡片会按状态自动落入对应泳道，拖拽即可改状态。
        </p>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {KANBAN_COLUMNS.map((col) => (
          <Column
            key={col.key}
            column={col}
            jobs={grouped[col.key] ?? []}
            activeId={activeId}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.18,0.67,0.6,1.22)" }}>
        {activeJob ? <JobCardOverlay job={activeJob} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
