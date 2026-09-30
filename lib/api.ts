import { NextResponse } from "next/server";

/** 统一成功响应 */
export function ok<T>(data: T, init?: number) {
  return NextResponse.json({ ok: true, data }, { status: init ?? 200 });
}

/** 统一失败响应 */
export function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

/** 未找到 */
export function notFound(message = "记录不存在") {
  return fail(message, 404);
}

/** 安全解析 JSON body */
export async function readJson<T = Record<string, unknown>>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

/** 取字符串，空串归一为 null */
export function str(v: unknown, maxLen = 20000): string | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  if (!s) return null;
  return s.slice(0, maxLen);
}

/** 取必填字符串 */
export function requiredStr(v: unknown, field: string, maxLen = 20000): string {
  const s = str(v, maxLen);
  if (!s) throw new ValidationError(`${field} 不能为空`);
  return s;
}

/** 取整数 */
export function int(v: unknown, fallback: number | null = null): number | null {
  if (v === undefined || v === null || v === "") return fallback;
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.trunc(n);
}

/** 取布尔 */
export function bool(v: unknown, fallback = false): boolean {
  if (typeof v === "boolean") return v;
  if (v === "true") return true;
  if (v === "false") return false;
  return fallback;
}

/** 取日期 */
export function date(v: unknown, fallback: Date | null = null): Date | null {
  if (!v) return fallback;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? fallback : d;
}

export class ValidationError extends Error {}

/** 包装路由处理器，统一捕获异常 */
export function handler<A extends unknown[]>(
  fn: (...args: A) => Promise<Response>
): (...args: A) => Promise<Response> {
  return async (...args: A) => {
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof ValidationError) return fail(e.message, 400);
      const msg = e instanceof Error ? e.message : "服务器内部错误";
      console.error("[api]", msg);
      return fail(`服务器内部错误：${msg}`, 500);
    }
  };
}
