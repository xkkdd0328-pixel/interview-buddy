import { cn } from "@/lib/utils";

/**
 * 数据指标卡片
 * 用于 Dashboard 顶部与数据分析页的汇总数字展示。
 */
export function StatCard({
  label,
  value,
  hint,
  icon,
  accent = "#4361ee",
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ReactNode;
  accent?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover",
        className
      )}
    >
      <div
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ background: `linear-gradient(90deg, ${accent}, ${accent}22)` }}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-medium text-muted-foreground">{label}</div>
          <div className="mt-1.5 text-3xl font-semibold tracking-tight" style={{ color: accent }}>
            {value}
          </div>
          {hint && <div className="mt-1 truncate text-xs text-muted-foreground">{hint}</div>}
        </div>
        {icon && (
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${accent}14`, color: accent }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
