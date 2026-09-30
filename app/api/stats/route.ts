import { ok, handler } from "@/lib/api";
import { computeStats } from "@/lib/stats";

export const dynamic = "force-dynamic";

/** GET /api/stats —— 首页与数据分析面板所需的全部聚合数据 */
export const GET = handler(async () => {
  const data = await computeStats();
  return ok(data);
});
