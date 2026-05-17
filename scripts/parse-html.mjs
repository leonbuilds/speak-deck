// Mode B：解析已有 HTML，抽出每页要素
// 用法：node scripts/parse-html.mjs <input/slides.html> <working目录>
import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";

const inPath = process.argv[2];
const workDir = process.argv[3];

if (!inPath || !workDir) {
  console.error("用法: node scripts/parse-html.mjs <input/slides.html> <working目录>");
  process.exit(1);
}
if (!fs.existsSync(inPath)) {
  console.error(`✗ 找不到 ${inPath}`);
  process.exit(1);
}

const html = fs.readFileSync(inPath, "utf8");
const $ = cheerio.load(html);

// 按优先级尝试各种分页选择器
const candidates = [
  "section.slide",
  ".slide",
  "[data-slide]",
  ".reveal section",
  ".impress .step",
  ".slidev-page",
  "section",
];

let nodes = $();
let usedSelector = "";
for (const sel of candidates) {
  const found = $(sel);
  if (found.length >= 2) { nodes = found; usedSelector = sel; break; }
}

if (nodes.length < 2) {
  console.error("✗ 未识别出 ≥2 页结构，请检查 HTML 是否使用了常见的幻灯片框架");
  process.exit(1);
}

console.log(`→ 用选择器 "${usedSelector}" 识别到 ${nodes.length} 页`);

const pages = [];
nodes.each((i, el) => {
  const $el = $(el);
  const sel = uniqueSelector($, el);
  pages.push({
    page: i + 1,
    selector: sel,
    h1: ($el.find("h1").first().text() || $el.find("h2").first().text() || "").trim(),
    body: $el.find("p").map((_, p) => $(p).text().trim()).get().join(" ").slice(0, 600),
    bullets: $el.find("li").map((_, li) => $(li).text().trim()).get().slice(0, 12),
    images: $el.find("img").map((_, img) => $(img).attr("alt") || $(img).attr("src") || "").get(),
    has_table: $el.find("table").length > 0,
    has_code: $el.find("pre,code").length > 0,
    note: "",
    text: "",
    speed: 1.0,
  });
});

fs.mkdirSync(workDir, { recursive: true });
const outPath = path.join(workDir, "pages.json");
fs.writeFileSync(outPath, JSON.stringify(pages, null, 2));
console.log(`✓ 解析完成 → ${outPath}（${pages.length} 页）`);

// --- 工具函数 ---
function uniqueSelector($, el) {
  if (el.attribs?.id) return `#${cssEscape(el.attribs.id)}`;
  // 用 nth-of-type 路径
  const parts = [];
  let cur = el;
  while (cur && cur.tagName && cur.tagName !== "html") {
    const $cur = $(cur);
    const parent = $cur.parent();
    const tag = cur.tagName;
    if (cur.attribs?.id) { parts.unshift(`#${cssEscape(cur.attribs.id)}`); break; }
    const idx = parent.children(tag).index(cur) + 1;
    parts.unshift(`${tag}:nth-of-type(${idx})`);
    cur = parent[0];
  }
  return parts.join(" > ");
}
function cssEscape(s) { return String(s).replace(/[^a-zA-Z0-9_-]/g, (c) => `\\${c}`); }
