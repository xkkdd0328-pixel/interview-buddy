"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { StatsDTO } from "@/lib/types";

/** 面试能力成长曲线：按面试日期的平均自评分趋势 */
export function GrowthChart({ data }: { data: StatsDTO["growth"] }) {
  if (!data.length) {
    return (
      <div className="flex h-[240px] items-center justify-center text-xs text-muted-foreground">
        还没有「已评分题目 + 面试记录」的组合数据，去练习模式给题目打分后这里就会出图
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: -22, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef1f6" vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: "#64748b" }}
        />
        <YAxis
          domain={[0, 5]}
          tickCount={6}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: "#64748b" }}
        />
        <ReferenceLine y={3} stroke="#e9c46a" strokeDasharray="4 4" />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0].payload as StatsDTO["growth"][number];
            return (
              <div className="rounded-lg border border-border bg-white px-3 py-2 text-xs shadow-lg">
                <div className="font-semibold text-foreground">
                  {d.company} · {d.round}
                </div>
                <div className="mt-1 text-muted-foreground">
                  {d.fullDate} · 平均 {d.score} 分（{d.samples} 道题）
                </div>
              </div>
            );
          }}
        />
        <Line
          type="monotone"
          dataKey="score"
          stroke="#2a9d8f"
          strokeWidth={2.5}
          dot={{ r: 4, fill: "#2a9d8f", strokeWidth: 0 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
