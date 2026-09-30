import { ok, handler } from "@/lib/api";
import { getAiChannelStatus } from "@/lib/ai/provider";

export const dynamic = "force-dynamic";

/** GET /api/ai/status —— AI 通道状态（供设置页展示） */
export const GET = handler(async () => {
  const status = getAiChannelStatus();
  return ok({
    ...status,
    /** 供界面展示的引擎名称 */
    engineLabel: status.enabled ? `WorkBuddy 内置模型（${status.model}）` : "本地规则引擎（离线兜底）",
    hint: status.enabled
      ? "面试题生成与复盘分析由内置大模型完成。"
      : "尚未接入内置模型通道，当前由本地规则引擎生成内容（功能可用，但定制化程度较低）。",
  });
});
