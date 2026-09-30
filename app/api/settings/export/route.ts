import { NextRequest } from "next/server";

import prisma from "@/lib/db";
import { handler } from "@/lib/api";
import { JOB_STATUS, QUESTION_TYPE, type JobStatus, type QuestionType } from "@/lib/constants";

export const dynamic = "force-dynamic";

/** CSV 字段转义 */
function csvCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v).replace(/\r?\n/g, " ").replace(/"/g, '""');
  return `"${s}"`;
}

/**
 * GET /api/settings/export?format=json|csv&type=all|jobs|questions|interviews
 * 导出全部数据，作为文件下载。
 */
export const GET = handler(async (req: NextRequest) => {
  const sp = req.nextUrl.searchParams;
  const format = sp.get("format") === "csv" ? "csv" : "json";
  const type = sp.get("type") ?? "all";

  const [jobs, questions, interviews] = await Promise.all([
    prisma.job.findMany({ include: { tags: true }, orderBy: { appliedAt: "desc" } }),
    prisma.question.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.interview.findMany({ orderBy: { date: "desc" } }),
  ]);

  const stamp = new Date().toISOString().slice(0, 10);

  if (format === "json") {
    const payload = {
      app: "InterviewBuddy",
      exportedAt: new Date().toISOString(),
      counts: { jobs: jobs.length, questions: questions.length, interviews: interviews.length },
      ...(type === "jobs"
        ? { jobs }
        : type === "questions"
          ? { questions }
          : type === "interviews"
            ? { interviews }
            : { jobs, questions, interviews }),
    };
    return new Response(JSON.stringify(payload, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="interviewbuddy-${stamp}.json"`,
      },
    });
  }

  // CSV：导出岗位为主表（最常用）
  const header = [
    "公司",
    "岗位",
    "状态",
    "薪资",
    "地点",
    "渠道",
    "优先级",
    "投递日期",
    "标签",
    "题目数",
    "已评分题数",
    "薄弱题数",
    "面试场次",
    "备注",
  ];

  const lines = [header.map(csvCell).join(",")];
  for (const job of jobs) {
    const jq = questions.filter((q) => q.jobId === job.id);
    const ji = interviews.filter((i) => i.jobId === job.id);
    lines.push(
      [
        job.company,
        job.position,
        JOB_STATUS[job.status as JobStatus]?.label ?? job.status,
        job.salary,
        job.location,
        job.channel,
        ["普通", "感兴趣", "非常想进"][job.priority] ?? "普通",
        new Date(job.appliedAt).toISOString().slice(0, 10),
        job.tags.map((t) => t.tag).join(" / "),
        jq.length,
        jq.filter((q) => q.rating !== null).length,
        jq.filter((q) => q.isWeak).length,
        ji.length,
        job.notes,
      ]
        .map(csvCell)
        .join(",")
    );
  }

  // 追加题库分段，保证 CSV 也能承载题目信息
  if (type === "all" || type === "questions") {
    lines.push("");
    lines.push(["【面试题库】"].map(csvCell).join(","));
    lines.push(
      ["所属公司", "所属岗位", "类型", "难度", "题目", "参考答案思路", "我的回答", "自评分", "收藏", "薄弱点"]
        .map(csvCell)
        .join(",")
    );
    for (const q of questions) {
      const job = jobs.find((j) => j.id === q.jobId);
      lines.push(
        [
          job?.company ?? "",
          job?.position ?? "",
          QUESTION_TYPE[q.type as QuestionType]?.label ?? q.type,
          q.difficulty,
          q.content,
          q.answer,
          q.myAnswer,
          q.rating ?? "",
          q.isFavorite ? "是" : "否",
          q.isWeak ? "是" : "否",
        ]
          .map(csvCell)
          .join(",")
      );
    }
  }

  // BOM 让 Excel 正确识别 UTF-8
  const csv = `\uFEFF${lines.join("\r\n")}`;
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="interviewbuddy-${stamp}.csv"`,
    },
  });
});
