"use client";

import Link from "next/link";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, MapPin, MessageSquareText, Wallet } from "lucide-react";

import { StatusBadge } from "@/components/common/StatusBadge";
import { PRIORITY } from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";
import type { JobDTO } from "@/lib/types";

/** 看板卡片：可拖拽，点击进入详情 */
export function JobCard({ job, dragging }: { job: JobDTO; dragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: job.id,
    data: { job },
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
  };

  const priority = PRIORITY[job.priority] ?? PRIORITY[0];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative rounded-lg border border-border bg-white p-3 shadow-card transition-shadow",
        (isDragging || dragging) && "z-50 opacity-40 shadow-lg ring-2 ring-brand/30",
        !isDragging && "hover:border-brand-200 hover:shadow-card-hover"
      )}
    >
      <div className="flex items-start gap-2">
        {/* 拖拽把手 */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="拖拽改变状态"
          className="mt-0.5 cursor-grab rounded p-0.5 text-slate-300 opacity-0 transition-opacity hover:text-slate-500 group-hover:opacity-100 active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <Link href={`/jobs/${job.id}`} className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-[13px] font-semibold leading-snug">{job.company}</div>
              <div className="truncate text-xs text-muted-foreground">{job.position}</div>
            </div>
            {priority.stars > 0 && (
              <span
                className="shrink-0 text-[10px] font-medium"
                style={{ color: priority.color }}
                title={priority.label}
              >
                {"★".repeat(priority.stars)}
              </span>
            )}
          </div>

          <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
            {job.salary && (
              <div className="flex items-center gap-1">
                <Wallet className="h-3 w-3" />
                <span className="font-medium text-slate-600">{job.salary}</span>
              </div>
            )}
            {job.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {job.location}
              </div>
            )}
          </div>

          <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-border pt-2">
            <span className="text-[10px] text-slate-400">{formatDate(job.appliedAt)}</span>
            <div className="flex items-center gap-2">
              {job._count?.questions ? (
                <span
                  className="flex items-center gap-0.5 text-[10px] text-slate-400"
                  title={`${job._count.questions} 道面试题`}
                >
                  <MessageSquareText className="h-3 w-3" />
                  {job._count.questions}
                </span>
              ) : null}
              <StatusBadge status={job.status} short className="!px-1.5 !py-0 !text-[10px]" />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

/** 拖拽时跟随指针的浮层 */
export function JobCardOverlay({ job }: { job: JobDTO }) {
  const priority = PRIORITY[job.priority] ?? PRIORITY[0];
  return (
    <div className="w-[248px] rotate-2 rounded-lg border border-brand-200 bg-white p-3 shadow-2xl ring-2 ring-brand/20">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-[13px] font-semibold">{job.company}</div>
          <div className="truncate text-xs text-muted-foreground">{job.position}</div>
        </div>
        {priority.stars > 0 && (
          <span className="shrink-0 text-[10px]" style={{ color: priority.color }}>
            {"★".repeat(priority.stars)}
          </span>
        )}
      </div>
      <div className="mt-2 text-[11px] text-muted-foreground">
        {job.salary || job.location || "—"}
      </div>
    </div>
  );
}
