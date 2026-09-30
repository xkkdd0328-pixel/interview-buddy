"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart as RechartsRadar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import type { StatsDTO } from "@/lib/types";

/** 技能雷达图：按题目内容归类后，展示各技术方向的平均自评分（5 分制） */
export function SkillRadarChart({ data }: { data: StatsDTO["radar"] }) {
  const rows = data.map((d) => ({
    dimension: d.dimension,
    score: d.score,
    samples: d.samples,
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <RechartsRadar data={rows} outerRadius="72%">
        <PolarGrid stroke="#e6eaf2" />
        <PolarAngleAxis
          dataKey="dimension"
          tick={{ fontSize: 11, fill: "#475569" }}
        />
        <PolarRadiusAxis
          domain={[0, 5]}
          tickCount={6}
          angle={90}
          tick={{ fontSize: 10, fill: "#94a3b8" }}
          stroke="#e6eaf2"
        />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0].payload as (typeof rows)[number];
            return (
              <div className="rounded-lg border border-border bg-white px-3 py-2 text-xs shadow-lg">
                <div className="font-semibold text-foreground">{d.dimension}</div>
                <div className="mt-1 text-muted-foreground">
                  {d.samples > 0 ? `平均 ${d.score} 分 · 基于 ${d.samples} 道题` : "暂无已评分题目"}
                </div>
              </div>
            );
          }}
        />
        <Radar
          dataKey="score"
          stroke="#4361ee"
          strokeWidth={2}
          fill="#4361ee"
          fillOpacity={0.22}
        />
      </RechartsRadar>
    </ResponsiveContainer>
  );
}
