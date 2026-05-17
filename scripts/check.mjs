// 交付前自检：字数 / 音频文件 / HTML 完整性 / 时长估算
// 用法：node scripts/check.mjs talks/<本次>
import fs from "node:fs";
import path from "node:path";

const talkDir = process.argv[2];
if (!talkDir) {
  console.error("用法: node scripts/check.mjs talks/<本次>");
  process.exit(1);
}

const out = path.join(talkDir, "output");
const briefPath = path.join(talkDir, "brief.md");
const scriptJson = path.join(out, "script.json");
const slidesHtml = path.join(out, "slides.html");
const audioDir = path.join(out, "audio");

const issues = [];
const ok = (msg) => console.log(`✓ ${msg}`);
const warn = (msg) => { console.log(`⚠ ${msg}`); issues.push(msg); };
const fail = (msg) => { console.log(`✗ ${msg}`); issues.push("ERROR: " + msg); };

// 1. brief 中提取目标时长
let targetMinutes = null;
if (fs.existsSync(briefPath)) {
  const m = fs.readFileSync(briefPath, "utf8").match(/时长.*?(\d+)\s*分钟/);
  if (m) { targetMinutes = parseInt(m[1], 10); ok(`brief 目标时长 ${targetMinutes} 分钟`); }
  else warn("brief 里没找到「时长 N 分钟」的字样");
} else warn("没有 brief.md");

// 2. script.json
if (!fs.existsSync(scriptJson)) { fail("缺 output/script.json"); process.exit(1); }
const pages = JSON.parse(fs.readFileSync(scriptJson, "utf8"));
ok(`script.json 包含 ${pages.length} 页`);

const totalChars = pages.reduce((s, p) => s + (p.text?.length || 0), 0);
const estMinutes = (totalChars / 200).toFixed(1);
ok(`总字数 ${totalChars}，按 200 字/分估算 ${estMinutes} 分钟`);

if (targetMinutes) {
  const deviation = Math.abs(estMinutes - targetMinutes) / targetMinutes;
  if (deviation > 0.15) warn(`时长偏差 ${(deviation * 100).toFixed(0)}% 超过 ±15%（目标 ${targetMinutes} 分钟，实际 ${estMinutes} 分钟）`);
  else ok(`时长偏差 ${(deviation * 100).toFixed(0)}% 在 ±15% 内`);
}

// 3. 每页字数检查
pages.forEach((p) => {
  const n = (p.text || "").length;
  if (n === 0) warn(`page ${p.page} 逐字稿为空`);
  else if (n < 20) warn(`page ${p.page} 字数偏少（${n}）`);
  else if (n > 400) warn(`page ${p.page} 字数偏多（${n}），考虑拆页`);
});

// 4. 音频文件
if (!fs.existsSync(audioDir)) { fail("缺 output/audio 目录"); }
else {
  let missing = 0;
  pages.forEach((p) => {
    if (!p.text) return;
    const f = path.join(audioDir, `p${String(p.page).padStart(2, "0")}.mp3`);
    if (!fs.existsSync(f)) { missing++; warn(`缺音频 ${path.basename(f)}`); }
  });
  if (missing === 0) ok("所有页面的音频都存在");
}

// 5. HTML
if (!fs.existsSync(slidesHtml)) fail("缺 output/slides.html");
else {
  const html = fs.readFileSync(slidesHtml, "utf8");
  if (!/IntersectionObserver/.test(html)) warn("slides.html 似乎没有翻页/播音逻辑");
  if (!/data-audio/.test(html)) warn("slides.html 里没有 data-audio 属性");
  else ok("slides.html 含播放逻辑 + data-audio");
}

// 6. 套话检查
const banned = ["首先", "其次", "最后", "众所周知", "今天非常荣幸", "在开始之前"];
const allText = pages.map(p => p.text || "").join("\n");
const hits = banned.filter(w => allText.includes(w));
if (hits.length) warn(`含套话：${hits.join("、")}`);
else ok("无套话开头");

// 总结
console.log("");
if (issues.length === 0) {
  console.log("✅ 自检通过，可以交付");
  process.exit(0);
} else {
  console.log(`⚠ 共 ${issues.length} 个提醒：`);
  issues.forEach(i => console.log("  -", i));
  process.exit(issues.some(i => i.startsWith("ERROR")) ? 2 : 1);
}
