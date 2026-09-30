/**
 * 轻量 .env 加载器
 * tsx 直接运行脚本时不会自动加载 .env，这里手动读取项目根目录的 .env 并注入 process.env。
 * 已存在的环境变量不会被覆盖。
 */

import fs from "node:fs";
import path from "node:path";

const envPath = path.resolve(__dirname, "../.env");

if (fs.existsSync(envPath)) {
  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    if (/^\s*#/.test(line) || !line.trim()) continue;
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2];
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}
