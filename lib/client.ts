"use client";

/** 前端统一的后端调用封装 */

interface ApiEnvelope<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

async function parse<T>(res: Response): Promise<T> {
  let json: ApiEnvelope<T> | null = null;
  try {
    json = (await res.json()) as ApiEnvelope<T>;
  } catch {
    throw new Error(`服务返回了非预期内容（HTTP ${res.status}）`);
  }
  if (!res.ok || !json.ok) {
    throw new Error(json?.error || `请求失败（HTTP ${res.status}）`);
  }
  return json.data as T;
}

export async function apiGet<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { cache: "no-store", signal });
  return parse<T>(res);
}

export async function apiSend<T>(
  url: string,
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  body?: unknown
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return parse<T>(res);
}
