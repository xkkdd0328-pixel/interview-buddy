"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Briefcase, LayoutDashboard, Lightbulb, Plus, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MOBILE_NAV = [
  { href: "/", label: "总览", icon: LayoutDashboard, exact: true },
  { href: "/jobs", label: "岗位", icon: Briefcase },
  { href: "/practice", label: "练习", icon: Lightbulb },
  { href: "/analyze", label: "分析", icon: BarChart3 },
  { href: "/settings", label: "设置", icon: Settings },
];

function resolveTitle(pathname: string) {
  if (pathname === "/") return { title: "数据总览", desc: "你的求职进度一目了然" };
  if (pathname === "/jobs") return { title: "岗位管理", desc: "投递进度与看板拖拽" };
  if (pathname === "/jobs/new") return { title: "添加岗位", desc: "录入一份新的岗位投递" };
  if (/^\/jobs\/[^/]+\/practice$/.test(pathname))
    return { title: "练习模式", desc: "闪卡自评 · 错题重练" };
  if (/^\/jobs\/[^/]+$/.test(pathname)) return { title: "岗位详情", desc: "JD 拆解与定制题库" };
  if (/^\/interview\/[^/]+$/.test(pathname)) return { title: "面试复盘", desc: "AI 帮你找到改进点" };
  if (pathname === "/practice") return { title: "练习中心", desc: "挑一个岗位开始刷题" };
  if (pathname === "/analyze") return { title: "数据分析", desc: "用数据看你的求职效率" };
  if (pathname === "/settings") return { title: "设置", desc: "数据导入导出与清理" };
  return { title: "InterviewBuddy", desc: "" };
}

export function Header() {
  const pathname = usePathname();
  const { title, desc } = resolveTitle(pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-white/85 backdrop-blur">
      <div className="flex h-16 items-center gap-4 px-6">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[17px] font-semibold tracking-tight">{title}</h1>
          {desc && <p className="truncate text-xs text-muted-foreground">{desc}</p>}
        </div>

        <Button asChild size="sm" className="h-9">
          <Link href="/jobs/new">
            <Plus className="h-4 w-4" />
            添加岗位
          </Link>
        </Button>
      </div>

      {/* 移动端导航 */}
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-border px-3 py-2 no-scrollbar md:hidden">
        {MOBILE_NAV.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium",
                active ? "bg-brand-50 text-brand-700" : "text-slate-500"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
