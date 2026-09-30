/**
 * SQLite 版本端到端验收脚本（一次性）
 * 覆盖：建岗位 → AI 拆解 → AI 生成题库 → 题目评分 → 建面试 → AI 复盘 → 导出 → 清理
 */

const BASE = "http://localhost:3000";

let passed = 0;
let failed = 0;

async function req(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* 非 JSON（如导出文件） */
  }
  return { status: res.status, json, text };
}

function check(name, ok, extra = "") {
  if (ok) {
    passed += 1;
    console.log(`  ✓ ${name}${extra ? " — " + extra : ""}`);
  } else {
    failed += 1;
    console.log(`  ✗ ${name}${extra ? " — " + extra : ""}`);
  }
}

async function main() {
  console.log("\n【1】AI 拆解 JD");
  const jdText =
    "【字节跳动】招聘 高级前端开发工程师（上海）35-55K\n岗位职责：负责 TikTok 电商前端开发，React + TypeScript。\n任职要求：1. 精通 JavaScript；2. 熟悉 Webpack 工程化；3. 有性能优化经验。";
  const pj = await req("POST", "/api/ai/parse-jd", { text: jdText });
  check("接口返回 200", pj.status === 200);
  check("公司识别", pj.json?.data?.company === "字节跳动", pj.json?.data?.company);
  check("岗位识别", pj.json?.data?.position === "高级前端开发工程师", pj.json?.data?.position);
  check("薪资识别", pj.json?.data?.salary === "35-55K", pj.json?.data?.salary);
  check("地点识别", pj.json?.data?.location === "上海", pj.json?.data?.location);
  const kws = pj.json?.data?.keywords || [];
  check("关键词无 Java 误判", !kws.includes("Java"), kws.join(","));

  console.log("\n【2】创建岗位（SQLite 写入）");
  const cj = await req("POST", "/api/jobs", {
    company: "验收测试公司",
    position: "测试工程师",
    jd: jdText,
    status: "APPLIED",
    appliedAt: "2026-09-24",
    tags: ["验收", "临时"],
  });
  check("创建返回 201", cj.status === 201, `status=${cj.status}`);
  const jobId = cj.json?.data?.id;
  check("返回有效 id", !!jobId);

  console.log("\n【3】读取校验");
  const gj = await req("GET", `/api/jobs/${jobId}`);
  check("能读回岗位", gj.json?.data?.company === "验收测试公司");
  check("标签已写入", (gj.json?.data?.tags || []).length === 2, `tags=${(gj.json?.data?.tags || []).map((t) => t.tag).join("/")}`);

  console.log("\n【4】更新岗位（改状态 + 优先级）");
  const uj = await req("PATCH", `/api/jobs/${jobId}`, { status: "INTERVIEW1", priority: 2 });
  check("更新成功", uj.status === 200);
  const gj2 = await req("GET", `/api/jobs/${jobId}`);
  check("状态已持久化", gj2.json?.data?.status === "INTERVIEW1", gj2.json?.data?.status);
  check("优先级已持久化", gj2.json?.data?.priority === 2);

  console.log("\n【5】AI 生成题库");
  const gq = await req("POST", "/api/ai/generate-questions", { jobId });
  check("生成成功（201 Created）", gq.status === 201, `status=${gq.status}`);
  const questions = gq.json?.data?.questions || [];
  check("生成 14 题", questions.length === 14, `count=${questions.length}`);
  const types = questions.map((q) => q.type);
  check("题型顺序正确", types.slice(0, 5).every((t) => t === "tech") && types[types.length - 1] === "ask_back", types.join(","));

  console.log("\n【6】题目评分与薄弱点标记（SQLite 写入）");
  const gqList = await req("GET", `/api/questions?jobId=${jobId}`);
  const qList = gqList.json?.data || [];
  check("题库落库", qList.length === 14, `count=${qList.length}`);
  const q1 = qList[0]?.id;
  const pq = await req("PATCH", `/api/questions/${q1}`, { rating: 4, isWeak: true, myAnswer: "验收测试回答" });
  check("更新题目成功", pq.status === 200);
  const gq2 = await req("GET", `/api/questions?jobId=${jobId}`);
  const q1b = (gq2.json?.data || []).find((x) => x.id === q1);
  check("评分已持久化", q1b?.rating === 4, `rating=${q1b?.rating}`);
  check("薄弱标记已持久化", q1b?.isWeak === true);
  check("我的回答已持久化", q1b?.myAnswer === "验收测试回答");

  console.log("\n【7】创建面试记录");
  const ci = await req("POST", "/api/interviews", {
    jobId,
    round: "一面",
    date: "2026-09-24",
    duration: 45,
    mood: "good",
    actualQuestions: "1. React 性能优化怎么做\n2. Webpack 构建流程",
    notes: "验收测试用面试记录",
  });
  check("创建面试 201", ci.status === 201, `status=${ci.status}`);
  const ivId = ci.json?.data?.id;
  check("返回面试 id", !!ivId);

  console.log("\n【8】AI 面试复盘（写入 aiFeedback）");
  const an = await req("POST", "/api/ai/analyze-interview", { interviewId: ivId });
  check("复盘成功", an.status === 200);
  const analysis = an.json?.data?.analysis;
  check("返回分析结构", !!analysis && Array.isArray(analysis.suggestions), `suggestions=${analysis?.suggestions?.length}`);
  const gi = await req("GET", `/api/interviews/${ivId}`);
  check("复盘已落库", !!gi.json?.data?.aiFeedback);

  console.log("\n【9】统计聚合");
  const st = await req("GET", "/api/stats");
  check("统计接口正常", st.status === 200 && !!st.json?.data?.cards, JSON.stringify(st.json?.data?.cards));

  console.log("\n【10】导出");
  const ex = await req("GET", "/api/settings/export");
  check("JSON 导出 200", ex.status === 200);
  let bk = null;
  try {
    bk = JSON.parse(ex.text);
  } catch {
    /* ignore */
  }
  check("导出内容可解析", !!bk?.jobs);
  check("导出含新建岗位", (bk?.jobs || []).some((j) => j.company === "验收测试公司"));
  const csv = await req("GET", "/api/settings/export?format=csv");
  check("CSV 导出 200", csv.status === 200 && csv.text.includes("公司"), `bytes=${csv.text.length}`);

  console.log("\n【11】清理测试数据（级联删除）");
  const dj = await req("DELETE", `/api/jobs/${jobId}`);
  check("删除岗位成功", dj.status === 200);
  const gj3 = await req("GET", `/api/jobs/${jobId}`);
  check("岗位已不存在", gj3.status === 404, `status=${gj3.status}`);
  const oq = await req("GET", `/api/questions?jobId=${jobId}`);
  check("题目已级联删除", (oq.json?.data || []).length === 0, `count=${(oq.json?.data || []).length}`);

  console.log(`\n════════════════════════════════`);
  console.log(`  通过 ${passed} 项，失败 ${failed} 项`);
  console.log(`════════════════════════════════\n`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error("脚本异常：", e);
  process.exit(1);
});
