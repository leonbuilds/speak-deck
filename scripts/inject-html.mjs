// Mode B：把 data-script + data-audio + 演讲模式 JS 最小入侵地注入原 HTML
// 用法：node scripts/inject-html.mjs --in <原> --pages <pages.json> --out <输出> [--force]
import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";

const args = parseArgs(process.argv.slice(2));
if (!args.in || !args.pages || !args.out) {
  console.error("用法: node scripts/inject-html.mjs --in <原> --pages <pages.json> --out <输出> [--force]");
  process.exit(1);
}

const html = fs.readFileSync(args.in, "utf8");
const pages = JSON.parse(fs.readFileSync(args.pages, "utf8"));
const injector = fs.readFileSync("_knowledge/templates/injector.html.snippet", "utf8");

const $ = cheerio.load(html, { decodeEntities: false });
let injected = 0, skipped = 0;

for (const p of pages) {
  const $el = $(p.selector).first();
  if (!$el.length) { console.warn(`⚠ 选择器未匹配 page ${p.page}: ${p.selector}`); skipped++; continue; }

  const hasScript = $el.attr("data-script");
  const hasAudio = $el.attr("data-audio");
  if ((hasScript || hasAudio) && !args.force) {
    console.log(`- page ${p.page} 已有 data-* 属性（用 --force 覆盖），跳过`); skipped++; continue;
  }

  $el.attr("data-script", p.text || p.note || "");
  $el.attr("data-audio", `audio/p${String(p.page).padStart(2, "0")}.mp3`);
  injected++;
}

// 检测是否已有播放逻辑，避免重复注入 JS
const alreadyHasLogic = /IntersectionObserver\s*\(/.test(html) && /data-audio/.test(html);
if (alreadyHasLogic && !args.force) {
  console.log("ℹ 原 HTML 似乎已有播放逻辑，仅注入 data-* 属性（用 --force 也注入 JS）");
} else {
  $("body").append(`\n<script>\n${injector}\n</script>\n`);
  console.log("✓ 已注入演讲模式 JS");
}

fs.mkdirSync(path.dirname(args.out), { recursive: true });
fs.writeFileSync(args.out, $.html());
console.log(`✓ 注入完成 → ${args.out}（${injected} 页注入，${skipped} 跳过）`);

// --- 工具 ---
function parseArgs(arr) {
  const o = {};
  for (let i = 0; i < arr.length; i++) {
    const v = arr[i];
    if (v === "--force") { o.force = true; continue; }
    if (v.startsWith("--")) { o[v.slice(2)] = arr[i + 1]; i++; }
  }
  return o;
}
