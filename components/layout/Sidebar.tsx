"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Briefcase,
  LayoutDashboard,
  Lightbulb,
  Settings,
  Sparkles,
  Target,
} from "lucide-react";

import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "总览", icon: LayoutDashboard, exact: true },
  { href: "/jobs", label: "岗位管理", icon: Briefcase },
  { href: "/practice", label: "练习中心", icon: Lightbulb },
  { href: "/analyze", label: "数据分析", icon: BarChart3 },
  { href: "/settings", label: "设置", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside className="sticky top-0 hidden h-screen w-[236px] shrink-0 flex-col border-r border-border bg-white md:flex">
      <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white shadow-sm">
          <Target className="h-[18px] w-[18px]" />
        </div>
        <div className="leading-tight">
          <div className="text-[15px] font-semibold tracking-tight">InterviewBuddy</div>
          <div className="text-[11px] text-muted-foreground">面试伙伴</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV.map((item) => {
          const active = isActive(item.href, item.exact);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-[18px] w-[18px] transition-colors",
                  active ? "text-brand" : "text-slate-400 group-hover:text-slate-600"
                )}
              />
              {item.label}
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-3">
        <div className="rounded-xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-3.5">
          <div className="flex items-center gap-1.5 text-[13px] font-semibold text-brand-700">
            <Sparkles className="h-3.5 w-3.5" />
            AI 能力已就绪
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            由 WorkBuddy 内置大模型驱动，无需配置 API Key。
          </p>
        </div>
      </div>
    </aside>
  );
}
