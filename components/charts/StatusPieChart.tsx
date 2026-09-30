"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import type { StatsDTO } from "@/lib/types";

/** 状态分布饼图 */
export function StatusPieChart({ data }: { data: StatsDTO["statusDistribution"] }) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="label"
          innerRadius={52}
          outerRadius={82}
          paddingAngle={2}
          stroke="#fff"
          strokeWidth={2}
        >
          {data.map((d) => (
            <Cell key={d.status} fill={d.color} />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0].payload as StatsDTO["statusDistribution"][number];
            const pct = total ? Math.round((d.value / total) * 1000) / 10 : 0;
            return (
              <div className="rounded-lg border border-border bg-white px-3 py-2 text-xs shadow-lg">
                <div className="font-semibold text-foreground">{d.label}</div>
                <div className="mt-1 text-muted-foreground">
                  {d.value} 个 · 占比 {pct}%
                </div>
              </div>
            );
          }}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span style={{ fontSize: 12, color: "#475569" }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
