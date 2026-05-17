// Mode A：根据 working/pages.json + 模板 + injector 渲染最终 HTML
// 用法：node scripts/build-html.mjs talks/<本次>
import fs from "node:fs";
import path from "node:path";

const talkDir = process.argv[2];
if (!talkDir) {
  console.error("用法: node scripts/build-html.mjs talks/<本次>");
  process.exit(1);
}

const pagesPath = path.join(talkDir, "working", "pages.json");
const outDir = path.join(talkDir, "output");
const outPath = path.join(outDir, "slides.html");

if (!fs.existsSync(pagesPath)) {
  console.error(`✗ 找不到 ${pagesPath}`);
  process.exit(1);
}

const pages = JSON.parse(fs.readFileSync(pagesPath, "utf8"));
const tpl = fs.readFileSync("_knowledge/templates/tpl-html.html", "utf8");
const injector = fs.readFileSync("_knowledge/templates/injector.html.snippet", "utf8");

const title = pages[0]?.h1 || "演讲";
const slidesHtml = pages.map(renderSlide).join("\n");

const out = tpl
  .replace(/__TITLE__/g, esc(title))
  .replace("__SLIDES__", slidesHtml)
  .replace("__INJECTOR__", injector);

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, out);
console.log(`✓ 渲染完成 → ${outPath}（${pages.length} 页）`);

// --- 渲染单页 ---
function renderSlide(p) {
  const cls = `slide ${p.kind ? "kind-" + p.kind : ""}`.trim();
  const script = esc(p.note || p.text || "");
  const audio = `audio/p${String(p.page).padStart(2, "0")}.mp3`;
  const parts = [];
  if (p.h1) parts.push(`<h1>${esc(p.h1)}</h1>`);
  if (p.body) parts.push(`<p>${esc(p.body)}</p>`);
  if (Array.isArray(p.bullets) && p.bullets.length) {
    parts.push(`<ul>${p.bullets.map(b => `<li>${esc(b)}</li>`).join("")}</ul>`);
  }
  if (p.bignum) {
    parts.push(`<div class="bignum">${esc(p.bignum)}</div>`);
    if (p.bignum_note) parts.push(`<p class="note">${esc(p.bignum_note)}</p>`);
  }
  if (p.quote) parts.push(`<p class="quote">${esc(p.quote)}</p>`);
  if (p.note_visible) parts.push(`<p class="note">${esc(p.note_visible)}</p>`);
  return `<section class="${cls}" data-script="${script}" data-audio="${audio}">\n  ${parts.join("\n  ")}\n</section>`;
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}
