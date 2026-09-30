"use client";

import { useState } from "react";
import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

/** 只读星级展示 */
export function StarsDisplay({
  value,
  max = 5,
  size = 14,
  className,
}: {
  value: number;
  max?: number;
  size?: number;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          className={cn(
            i < Math.round(value) ? "fill-amber-400 text-amber-400" : "text-slate-300"
          )}
        />
      ))}
    </span>
  );
}

/** 可交互自评星级（1-5） */
export function StarsInput({
  value,
  onChange,
  size = 30,
  disabled,
  className,
}: {
  value: number | null;
  onChange: (v: number) => void;
  size?: number;
  disabled?: boolean;
  className?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const active = hover ?? value ?? 0;
  const labels = ["", "完全不会", "思路模糊", "基本答上", "答得不错", "对答如流"];

  return (
    <div className={cn("flex flex-col items-center gap-1.5", className)}>
      <div className="flex items-center gap-1.5" onMouseLeave={() => setHover(null)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            disabled={disabled}
            onMouseEnter={() => setHover(n)}
            onClick={() => onChange(n)}
            aria-label={`自评 ${n} 星`}
            className={cn(
              "rounded-full p-1 transition-transform",
              !disabled && "hover:scale-110 active:scale-95",
              disabled && "cursor-not-allowed opacity-60"
            )}
          >
            <Star
              style={{ width: size, height: size }}
              className={cn(
                "transition-colors",
                n <= active ? "fill-amber-400 text-amber-400" : "text-slate-300"
              )}
            />
          </button>
        ))}
      </div>
      <div className="h-4 text-xs font-medium text-muted-foreground">
        {active > 0 ? labels[active] : "点击星星，为你的回答打分"}
      </div>
    </div>
  );
}
