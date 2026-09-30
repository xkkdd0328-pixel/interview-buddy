import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * 从 DATABASE_URL 解析出数据库类型与位置，供设置页展示。
 * 支持 SQLite（file:）与 MySQL（mysql://）两种形态。
 */
export function describeDatabase(): {
  provider: string;
  host: string;
  name: string;
} {
  const url = process.env.DATABASE_URL || "";
  const fallback = { provider: "未配置", host: "未配置", name: "未配置" };
  if (!url) return fallback;

  // SQLite：file:./dev.db
  if (url.startsWith("file:")) {
    const raw = url.slice("file:".length);
    const name = raw.split(/[\\/]/).filter(Boolean).pop() || raw;
    return { provider: "SQLite", host: "本地文件（随项目目录）", name };
  }

  // MySQL 等网络型数据库：mysql://user:pass@host:port/dbname
  try {
    const u = new URL(url.replace(/^mysql:\/\//, "http://"));
    const scheme = url.split(":")[0];
    return {
      provider: scheme === "mysql" ? "MySQL" : scheme,
      host: u.host || "未配置",
      name: u.pathname.replace(/^\//, "") || "未配置",
    };
  } catch {
    return fallback;
  }
}

export default prisma;
