"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { StatsDTO } from "@/lib/types";

const COLORS = ["#4361ee", "#3a0ca3", "#2a9d8f", "#e9c46a", "#e63946", "#7b8ff5", "#94a3b8"];

/** 渠道分布柱状图 */
export function ChannelBarChart({ data }: { data: StatsDTO["channels"] }) {
  if (!data.length) {
    return (
      <div className="flex h-[240px] items-center justify-center text-xs text-muted-foreground">
        还没有岗位数据
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 16, right: 16, left: -22, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef1f6" vertical={false} />
        <XAxis
          dataKey="name"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: "#64748b" }}
        />
        <YAxis
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: "#64748b" }}
        />
        <Tooltip
          cursor={{ fill: "rgba(67,97,238,0.06)" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0].payload as StatsDTO["channels"][number];
            return (
              <div className="rounded-lg border border-border bg-white px-3 py-2 text-xs shadow-lg">
                <div className="font-semibold text-foreground">{d.name}</div>
                <div className="mt-1 text-muted-foreground">{d.value} 个岗位</div>
              </div>
            );
          }}
        />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={34}>
          {data.map((d, i) => (
            <Cell key={d.name} fill={COLORS[i % COLORS.length]} />
          ))}
          <LabelList
            dataKey="value"
            position="top"
            style={{ fontSize: 11, fill: "#475569", fontWeight: 600 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
