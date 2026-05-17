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

// 响应式修复 CSS：解决不同屏幕尺寸下内容溢出/裁剪问题
const responsiveCSS = `
/* SpeakDeck 响应式修复 */
/* 允许内容超出视口高度时自然撑开，不裁剪 */
.deck-slide {
  height: auto !important;
  min-height: 100vh !important;
  overflow: visible !important;
}
/* 滚动吸附改为宽松模式，配合可变高度 */
body {
  scroll-snap-type: y proximity !important;
}
/* 大字号：小屏缩放 */
@media (max-width: 1200px) {
  [id^="p"] h1 { font-size: clamp(32px, 5vw, 72px) !important; }
  [id^="p"] h2 { font-size: clamp(24px, 3.5vw, 48px) !important; }
  [id^="p"] .subtitle, [id^="p"] .lede { font-size: clamp(16px, 2vw, 26px) !important; }
  [id^="p"] .stat .num, [id^="p"] .bignum { font-size: clamp(40px, 6vw, 120px) !important; }
  [id^="p"] .quote-mark { font-size: clamp(80px, 12vw, 200px) !important; }
  [id^="p"] .step .snum { font-size: clamp(40px, 6vw, 78px) !important; }
}
/* 窄屏：多列降为单列 */
@media (max-width: 900px) {
  [id^="p"] .flow,
  [id^="p"] .compare,
  [id^="p"] .grid,
  [id^="p"] .hero,
  [id^="p"] .concepts,
  [id^="p"] .chain { grid-template-columns: 1fr !important; }
  [id^="p"] .arrow,
  [id^="p"] .midarrow { display: none !important; }
  [id^="p"] .slide { padding: 32px 24px !important; }
}
/* 超窄屏/手机：进一步压缩 */
@media (max-width: 600px) {
  [id^="p"] h1 { font-size: clamp(24px, 7vw, 48px) !important; }
  [id^="p"] .slide { padding: 24px 16px !important; }
  #speaker { max-width: calc(100vw - 32px) !important; right: 16px !important; }
}`;

const alreadyHasResponsive = /SpeakDeck 响应式修复/.test(html);
if (!alreadyHasResponsive || args.force) {
  $("head").append(`\n<style>\n${responsiveCSS}\n</style>\n`);
  console.log("✓ 已注入响应式修复 CSS");
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
