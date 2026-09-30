import type { Metadata } from "next";
import "./globals.css";

import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "InterviewBuddy · 面试伙伴",
  description:
    "AI 驱动的求职管理工具 —— 记录岗位投递、生成针对性面试题、进行面试复盘和能力追踪。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <div className="flex min-h-screen bg-background">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <Header />
            <main className="flex-1 px-6 py-6">{children}</main>
          </div>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
