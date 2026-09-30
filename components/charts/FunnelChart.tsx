"use client";

import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { StatsDTO } from "@/lib/types";

const COLORS = ["#4361ee", "#5a7bf0", "#7b8ff5", "#3a0ca3", "#2a9d8f"];

/** 投递转化漏斗：横向柱状图，每层显示人数与转化率 */
export function FunnelChart({ data }: { data: StatsDTO["funnel"] }) {
  const rows = data.map((d, i) => ({
    ...d,
    color: COLORS[i % COLORS.length],
    /** 用于 LabelList 展示的文案 */
    labelText: `${d.value} 人`,
  }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(180, rows.length * 46)}>
      <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 56, left: 8, bottom: 4 }}>
        <XAxis type="number" hide domain={[0, "dataMax"]} />
        <YAxis
          type="category"
          dataKey="stage"
          width={64}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12, fill: "#475569" }}
        />
        <Tooltip
          cursor={{ fill: "rgba(67,97,238,0.06)" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0].payload as (typeof rows)[number];
            return (
              <div className="rounded-lg border border-border bg-white px-3 py-2 text-xs shadow-lg">
                <div className="font-semibold text-foreground">{d.stage}</div>
                <div className="mt-1 text-muted-foreground">
                  {d.value} 个岗位 · 较上一层 {d.rate}% · 占总投递 {d.overallRate}%
                </div>
              </div>
            );
          }}
        />
        <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={22}>
          {rows.map((r) => (
            <Cell key={r.key} fill={r.color} />
          ))}
          <LabelList
            dataKey="labelText"
            position="right"
            style={{ fontSize: 12, fill: "#334155", fontWeight: 600 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
