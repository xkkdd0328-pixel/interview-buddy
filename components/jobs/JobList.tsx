"use client";

import Link from "next/link";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";

import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { PRIORITY } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { JobDTO } from "@/lib/types";

export function JobList({
  jobs,
  onDelete,
}: {
  jobs: JobDTO[];
  onDelete: (job: JobDTO) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left text-xs font-medium text-muted-foreground">
              <th className="px-4 py-2.5">公司</th>
              <th className="px-4 py-2.5">岗位</th>
              <th className="px-4 py-2.5">薪资</th>
              <th className="px-4 py-2.5">地点</th>
              <th className="px-4 py-2.5">状态</th>
              <th className="px-4 py-2.5">投递日期</th>
              <th className="px-4 py-2.5">优先级</th>
              <th className="px-4 py-2.5">题/面</th>
              <th className="px-4 py-2.5 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => {
              const priority = PRIORITY[job.priority] ?? PRIORITY[0];
              return (
                <tr
                  key={job.id}
                  className="border-b border-border last:border-0 transition-colors hover:bg-brand-50/40"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/jobs/${job.id}`}
                      className="font-medium text-foreground hover:text-brand hover:underline"
                    >
                      {job.company}
                    </Link>
                    {job.channel && (
                      <div className="text-[11px] text-muted-foreground">{job.channel}</div>
                    )}
                  </td>
                  <td className="max-w-[220px] px-4 py-3">
                    <div className="truncate">{job.position}</div>
                    {job.tags && job.tags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {job.tags.slice(0, 3).map((t) => (
                          <span
                            key={t.id}
                            className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                          >
                            {t.tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {job.salary || <span className="text-slate-300">—</span>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {job.location || <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={job.status} short />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {formatDate(job.appliedAt)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {priority.stars > 0 ? (
                      <span style={{ color: priority.color }} className="text-xs font-medium">
                        {"★".repeat(priority.stars)} {priority.label}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">普通</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                    {job._count?.questions ?? 0} / {job._count?.interviews ?? 0}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button asChild variant="ghost" size="icon" title="查看详情">
                        <Link href={`/jobs/${job.id}`}>
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button asChild variant="ghost" size="icon" title="编辑">
                        <Link href={`/jobs/${job.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="删除"
                        className="text-danger hover:bg-red-50"
                        onClick={() => onDelete(job)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
