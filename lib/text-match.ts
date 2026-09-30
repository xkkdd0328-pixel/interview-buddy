/**
 * 文本关键词匹配工具
 *
 * 背景：JD / 岗位名里常见「短词是长词前缀」的情况（Java ⊂ JavaScript、SQL ⊂ MySQL），
 * 直接用 includes 会产生大量误判。这里统一用「词边界」+「长词覆盖短词」两段规则处理。
 */

/** 判断是否属于 ASCII 单词字符（字母 / 数字） */
function isWordChar(ch: string): boolean {
  return /[a-z0-9]/.test(ch);
}

/**
 * 在文本中查找 needle（大小写不敏感），要求命中位置两侧不是字母或数字。
 * 对含中文/符号的词（如「微服务」「C++」）同样适用：只要两侧不是 ASCII 字母数字即可。
 */
export function hasWord(haystackLower: string, needle: string): boolean {
  const n = needle.toLowerCase();
  if (!n) return false;
  let from = 0;
  for (;;) {
    const idx = haystackLower.indexOf(n, from);
    if (idx === -1) return false;
    const before = idx > 0 ? haystackLower[idx - 1] : "";
    const after = haystackLower[idx + n.length] ?? "";
    if (!isWordChar(before) && !isWordChar(after)) return true;
    from = idx + 1;
  }
}

/**
 * 按 word 边界筛选候选词，再去掉被更长命中词覆盖的短词。
 * 例：同时命中 React Native 与 React 时只保留 React Native；命中 Java 与 JavaScript 时只保留 JavaScript。
 * @param haystack 原始文本（函数内部自行转小写）
 * @param candidates 候选词表，返回结果保持候选词表原有顺序
 */
export function matchTerms(haystack: string, candidates: readonly string[]): string[] {
  const lower = haystack.toLowerCase();
  const hit = candidates.filter((k) => hasWord(lower, k));

  const out: string[] = [];
  for (const k of hit) {
    const kl = k.toLowerCase();
    if (out.some((u) => u.toLowerCase() === kl)) continue;
    // 已被更长的已收录词覆盖 → 跳过
    if (out.some((u) => u.length > k.length && u.toLowerCase().startsWith(kl))) continue;
    // 比已收录词更长且以其开头 → 移除被覆盖的短词
    for (let i = out.length - 1; i >= 0; i -= 1) {
      const u = out[i];
      if (k.length > u.length && kl.startsWith(u.toLowerCase())) out.splice(i, 1);
    }
    out.push(k);
  }
  return out;
}
