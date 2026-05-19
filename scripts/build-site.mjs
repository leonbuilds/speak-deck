// 构建演讲库静态网站
// 扫描 talks/ 目录 → 生成 docs/ 下的首页和每个演讲的详情页
// 用法：node scripts/build-site.mjs
import fs from "node:fs";
import path from "node:path";
import { marked } from "marked";

const TALKS_DIR = "talks";
const OUT_DIR = "docs";

// ── 扫描所有 talks ─────────────────────────────────────────
function scanTalks() {
  const talks = [];
  const entries = fs.readdirSync(TALKS_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith("_") || entry.name.startsWith(".")) continue;
    const meta = parseTalkMeta(path.join(TALKS_DIR, entry.name), entry.name);
    if (meta) talks.push(meta);
  }
  return talks.sort((a, b) => b.date.localeCompare(a.date));
}

function parseTalkMeta(talkDir, folderName) {
  const match = folderName.match(/^(\d{4}-\d{2}-\d{2})_(.+)$/);
  if (!match) return null;
  const [, date, slug] = match;

  // 如果存在 output-v2，优先用 v2 作为对外发布版本
  const v2Dir = path.join(talkDir, "output-v2");
  const outputDirName = fs.existsSync(v2Dir) ? "output-v2" : "output";
  const briefName = fs.existsSync(path.join(talkDir, "brief-v2.md")) ? "brief-v2.md" : "brief.md";
  const brief = fs.existsSync(path.join(talkDir, briefName))
    ? fs.readFileSync(path.join(talkDir, briefName), "utf8") : "";

  const meta = {
    folderName, date, slug, title: slug, scenario: "", duration: "",
    audience: "", purpose: "", pageCount: 0,
    outputDir: outputDirName,
    hasSlides: fs.existsSync(path.join(talkDir, outputDirName, "slides.html")),
    hasScript: fs.existsSync(path.join(talkDir, outputDirName, "script.md")),
    hasAnnotated: fs.existsSync(path.join(talkDir, outputDirName, "script-annotated.md")),
    hasAudio: fs.existsSync(path.join(talkDir, outputDirName, "audio")),
  };

  const m = (re) => { const r = brief.match(re); return r ? r[1].trim() : ""; };
  meta.scenario = m(/\*\*场景\*\*:\s*([^\n]+)/);
  meta.duration = m(/\*\*时长\*\*:\s*([^\n]+)/);
  meta.audience = m(/\*\*对象\*\*:\s*([^\n]+)/);
  meta.purpose = m(/\*\*目的[^*]*\*\*:\s*([^\n]+)/);

  const scriptJsonPath = path.join(talkDir, outputDirName, "script.json");
  if (fs.existsSync(scriptJsonPath)) {
    try {
      const pages = JSON.parse(fs.readFileSync(scriptJsonPath, "utf8"));
      meta.pageCount = pages.length;
    } catch {}
  }
  return meta;
}

// ── 通用 HTML 模板 ─────────────────────────────────────────
function htmlShell(title, body, extraHead = "") {
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${esc(title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Noto+Serif+SC:wght@400;700;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${pathPrefix()}assets/style.css"/>
${extraHead}
</head>
<body>
${body}
</body>
</html>`;
}

let __depth = 0;
function pathPrefix() { return "../".repeat(__depth); }

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

// ── 首页 ────────────────────────────────────────────────
function renderHome(talks) {
  __depth = 0;
  const byYear = {};
  const scenarios = new Set();
  for (const t of talks) {
    const y = t.date.slice(0, 4);
    (byYear[y] = byYear[y] || []).push(t);
    if (t.scenario) scenarios.add(t.scenario);
  }

  const years = Object.keys(byYear).sort().reverse();

  const filterChips = `
    <div class="filters">
      <button class="chip active" data-scenario="">全部</button>
      ${[...scenarios].map(s => `<button class="chip" data-scenario="${esc(s)}">${esc(s)}</button>`).join("")}
    </div>
  `;

  const yearBlocks = years.map(year => `
    <section class="year-block">
      <h2 class="year-label">${year}</h2>
      <div class="talk-grid">
        ${byYear[year].map(renderCard).join("")}
      </div>
    </section>
  `).join("");

  const body = `
<div class="page">
  <header class="hero">
    <div class="brand">
      <div class="brand-orb"></div>
      <div>
        <div class="brand-title">YuzoAI · 演讲库</div>
        <div class="brand-sub">阿亮 · 十二年研发 · AI Agent 实战</div>
      </div>
    </div>
    <div class="hero-meta">${talks.length} 场演讲</div>
  </header>

  ${filterChips}

  <main>
    ${yearBlocks}
  </main>

  <footer class="footer">
    Built with SpeakDeck · ${new Date().toISOString().slice(0,10)}
  </footer>
</div>

<script>
  // 场景筛选
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const sc = chip.dataset.scenario;
      document.querySelectorAll('.chip').forEach(c => c.classList.toggle('active', c === chip));
      document.querySelectorAll('.talk-card').forEach(card => {
        const match = !sc || card.dataset.scenario === sc;
        card.style.display = match ? '' : 'none';
      });
      // 隐藏空年份
      document.querySelectorAll('.year-block').forEach(yb => {
        const visible = [...yb.querySelectorAll('.talk-card')].some(c => c.style.display !== 'none');
        yb.style.display = visible ? '' : 'none';
      });
    });
  });
</script>
`;
  return htmlShell("YuzoAI · 演讲库", body);
}

function renderCard(t) {
  const dateLabel = t.date.slice(5).replace("-", " · ");
  const slidesUrl = `talks/${encodeURIComponent(t.folderName)}/slides.html`;
  return `
    <a class="talk-card" href="${slidesUrl}" data-scenario="${esc(t.scenario)}">
      <div class="card-top">
        <span class="card-date">${dateLabel}</span>
        ${t.scenario ? `<span class="card-tag">${esc(t.scenario)}</span>` : ""}
      </div>
      <h3 class="card-title">${esc(t.title)}</h3>
      ${t.purpose ? `<p class="card-purpose">${esc(t.purpose)}</p>` : ""}
      <div class="card-meta">
        ${t.duration ? `<span>⏱ ${esc(t.duration)}</span>` : ""}
        ${t.pageCount ? `<span>📄 ${t.pageCount} 页</span>` : ""}
        ${t.hasAudio ? `<span>🎧 音频</span>` : ""}
      </div>
      <div class="card-cta">
        🎬 打开幻灯片 →
      </div>
    </a>
  `;
}

// ── 详情页 ────────────────────────────────────────────────
function renderDetail(talk, talkDir) {
  __depth = 2;
  const outDir = talk.outputDir || "output";
  const briefName = fs.existsSync(path.join(talkDir, "brief-v2.md")) ? "brief-v2.md" : "brief.md";
  const scriptMd = readSafe(path.join(talkDir, outDir, "script.md"));
  const annotatedMd = readSafe(path.join(talkDir, outDir, "script-annotated.md"));
  const briefMd = readSafe(path.join(talkDir, briefName));

  // 渲染 markdown
  const scriptHtml = scriptMd ? marked.parse(scriptMd) : "<p>暂无逐字稿</p>";
  const annotatedHtml = annotatedMd
    ? marked.parse(annotatedMd).replace(/【([^】]+)】/g, '<span class="cue">【$1】</span>')
    : "<p>暂无注释版</p>";
  const briefHtml = briefMd ? marked.parse(briefMd) : "";

  // 音频列表
  const audioList = listAudio(talkDir, outDir);

  const body = `
<div class="page detail">
  <header class="detail-header">
    <a class="back-link" href="../../">← 返回演讲库</a>
    <div class="detail-meta">
      <h1>${esc(talk.title)}</h1>
      <div class="detail-tags">
        <span>${esc(talk.date)}</span>
        ${talk.scenario ? `<span class="dot">·</span><span>${esc(talk.scenario)}</span>` : ""}
        ${talk.duration ? `<span class="dot">·</span><span>${esc(talk.duration)}</span>` : ""}
        ${talk.pageCount ? `<span class="dot">·</span><span>${talk.pageCount} 页</span>` : ""}
      </div>
      ${talk.purpose ? `<p class="detail-purpose">${esc(talk.purpose)}</p>` : ""}
    </div>
  </header>

  <nav class="tabs">
    ${talk.hasSlides ? `<button class="tab active" data-tab="slides">🎬 幻灯片</button>` : ""}
    ${talk.hasScript ? `<button class="tab" data-tab="script">📝 逐字稿</button>` : ""}
    ${talk.hasAnnotated ? `<button class="tab" data-tab="annotated">🎭 注释版</button>` : ""}
    ${audioList.length ? `<button class="tab" data-tab="audio">🎧 音频</button>` : ""}
    ${briefMd ? `<button class="tab" data-tab="brief">📋 Brief</button>` : ""}
  </nav>

  <main class="tab-content">
    ${talk.hasSlides ? `
    <section class="panel active" data-panel="slides">
      <div class="slide-toolbar">
        <a class="btn-primary" href="slides.html" target="_blank">🎬 全屏打开 →</a>
      </div>
      <div class="iframe-wrap">
        <iframe src="slides.html" loading="lazy"></iframe>
      </div>
    </section>` : ""}

    ${talk.hasScript ? `
    <section class="panel" data-panel="script">
      <div class="markdown">${scriptHtml}</div>
    </section>` : ""}

    ${talk.hasAnnotated ? `
    <section class="panel" data-panel="annotated">
      <div class="markdown annotated">${annotatedHtml}</div>
    </section>` : ""}

    ${audioList.length ? `
    <section class="panel" data-panel="audio">
      <div class="audio-list">
        ${audioList.map((a, i) => `
          <div class="audio-row">
            <span class="audio-idx">${String(i+1).padStart(2,'0')}</span>
            <span class="audio-name">${esc(a.name)}</span>
            <audio controls preload="none" src="audio/${esc(a.name)}"></audio>
          </div>
        `).join("")}
      </div>
    </section>` : ""}

    ${briefMd ? `
    <section class="panel" data-panel="brief">
      <div class="markdown">${briefHtml}</div>
    </section>` : ""}
  </main>
</div>

<script>
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const name = tab.dataset.tab;
      document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t === tab));
      document.querySelectorAll('.panel').forEach(p => p.classList.toggle('active', p.dataset.panel === name));
    });
  });
</script>
`;
  return htmlShell(talk.title + " · YuzoAI演讲库", body);
}

function readSafe(p) {
  return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
}

function listAudio(talkDir, outDir = "output") {
  const dir = path.join(talkDir, outDir, "audio");
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => /\.(mp3|wav|m4a)$/i.test(f))
    .sort()
    .map(name => ({ name }));
}

// ── CSS ────────────────────────────────────────────────
const CSS = `
:root {
  --bg-deep: #0b0420;
  --bg-mid: #1a0a3e;
  --coral: #ff5e7e;
  --peach: #ffb86c;
  --cyan: #6effe3;
  --lavender: #b794ff;
  --text: #f5f0ff;
  --muted: rgba(245,240,255,0.55);
  --glass-bg: rgba(255,255,255,0.05);
  --glass-border: rgba(255,255,255,0.1);
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body {
  background: var(--bg-deep);
  color: var(--text);
  font-family: "PingFang SC", "Noto Sans SC", system-ui, sans-serif;
  font-size: 15px;
  line-height: 1.6;
  min-height: 100vh;
}
body {
  background:
    radial-gradient(900px 600px at 10% -10%, rgba(255,94,126,0.18), transparent 60%),
    radial-gradient(900px 600px at 110% 10%, rgba(183,148,255,0.18), transparent 60%),
    radial-gradient(700px 500px at 50% 100%, rgba(110,255,227,0.10), transparent 60%),
    var(--bg-deep);
  background-attachment: fixed;
}
a { color: inherit; text-decoration: none; }

/* ── 容器 ── */
.page { max-width: 1100px; margin: 0 auto; padding: 60px 40px 80px; }

/* ── 首页 hero ── */
.hero {
  display: flex; justify-content: space-between; align-items: flex-end;
  margin-bottom: 36px; padding-bottom: 28px;
  border-bottom: 1px solid var(--glass-border);
}
.brand { display: flex; align-items: center; gap: 18px; }
.brand-orb {
  width: 56px; height: 56px; border-radius: 50%;
  background: linear-gradient(135deg, var(--coral), var(--peach), var(--lavender));
  box-shadow: 0 0 40px rgba(255,94,126,0.45);
  position: relative;
}
.brand-orb::after {
  content: ''; position: absolute; inset: 6px;
  border-radius: 50%; background: var(--bg-deep);
}
.brand-title {
  font-family: "Noto Serif SC", serif;
  font-weight: 900; font-size: 30px; line-height: 1.1; letter-spacing: -0.02em;
}
.brand-sub { font-size: 13px; color: var(--muted); margin-top: 6px; letter-spacing: 0.02em; }
.hero-meta { font-size: 12px; color: var(--muted); letter-spacing: 0.18em; text-transform: uppercase; }

/* ── 筛选 ── */
.filters { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 36px; }
.chip {
  border: 1px solid var(--glass-border);
  background: var(--glass-bg);
  color: var(--text);
  padding: 8px 16px;
  border-radius: 100px;
  font-size: 13px; cursor: pointer;
  transition: all .2s;
  font-family: inherit;
}
.chip:hover { border-color: rgba(255,94,126,0.5); }
.chip.active {
  background: linear-gradient(135deg, rgba(255,94,126,0.25), rgba(183,148,255,0.2));
  border-color: rgba(255,94,126,0.5);
}

/* ── 年份分组 ── */
.year-block { margin-bottom: 44px; }
.year-label {
  font-family: "Instrument Serif", serif;
  font-style: italic;
  font-size: 56px; font-weight: 400; line-height: 1;
  background: linear-gradient(135deg, var(--coral), var(--peach), var(--lavender));
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 20px;
}

/* ── 演讲卡片 ── */
.talk-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}
.talk-card {
  background: var(--glass-bg);
  backdrop-filter: blur(30px);
  border: 1px solid var(--glass-border);
  border-radius: 18px;
  padding: 22px 24px;
  position: relative;
  overflow: hidden;
  display: flex; flex-direction: column; gap: 10px;
  transition: transform .25s, border-color .25s, box-shadow .25s;
  cursor: pointer;
}
.talk-card::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent);
}
.talk-card:hover {
  transform: translateY(-2px);
  border-color: rgba(255,94,126,0.4);
  box-shadow: 0 16px 48px rgba(255,94,126,0.15);
}
.card-top {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 12px; color: var(--muted); letter-spacing: 0.05em;
}
.card-date {
  font-family: "Instrument Serif", serif;
  font-style: italic; font-size: 18px;
  color: var(--coral);
  letter-spacing: 0;
}
.card-tag {
  padding: 3px 10px;
  background: rgba(183,148,255,0.15);
  border: 1px solid rgba(183,148,255,0.3);
  border-radius: 100px;
  font-size: 11px;
  color: var(--lavender);
}
.card-title {
  font-family: "Noto Serif SC", serif;
  font-weight: 700; font-size: 20px; line-height: 1.3;
  letter-spacing: -0.01em;
}
.card-purpose {
  font-size: 13px; color: var(--muted); line-height: 1.5;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden;
}
.card-meta {
  display: flex; gap: 12px; flex-wrap: wrap;
  font-size: 12px; color: var(--muted);
  margin-top: auto; padding-top: 6px;
}
.card-cta {
  font-size: 12px; letter-spacing: 0.1em;
  color: var(--coral); font-weight: 600;
  padding-top: 8px; border-top: 1px solid var(--glass-border);
}

.footer {
  margin-top: 60px; padding-top: 24px;
  border-top: 1px solid var(--glass-border);
  font-size: 11px; color: var(--muted);
  text-align: center; letter-spacing: 0.1em;
}

/* ── 详情页 ── */
.detail-header { margin-bottom: 28px; }
.back-link {
  display: inline-block;
  font-size: 13px; color: var(--muted);
  margin-bottom: 24px;
  transition: color .2s;
}
.back-link:hover { color: var(--coral); }
.detail-meta h1 {
  font-family: "Noto Serif SC", serif;
  font-weight: 900; font-size: 42px; line-height: 1.15;
  letter-spacing: -0.02em; margin-bottom: 12px;
}
.detail-tags {
  display: flex; gap: 8px; flex-wrap: wrap; align-items: center;
  font-size: 13px; color: var(--muted);
}
.detail-tags .dot { opacity: 0.4; }
.detail-purpose {
  margin-top: 14px; font-size: 15px; color: var(--text);
  max-width: 720px; line-height: 1.6;
}

/* ── Tab 导航 ── */
.tabs {
  display: flex; gap: 4px; flex-wrap: wrap;
  margin-bottom: 24px;
  padding-bottom: 0;
  border-bottom: 1px solid var(--glass-border);
}
.tab {
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--muted);
  font-family: inherit;
  font-size: 14px;
  padding: 12px 18px;
  cursor: pointer;
  transition: all .2s;
  margin-bottom: -1px;
}
.tab:hover { color: var(--text); }
.tab.active {
  color: var(--coral);
  border-bottom-color: var(--coral);
}

.panel { display: none; }
.panel.active { display: block; }

/* ── 幻灯片 iframe ── */
.slide-toolbar { margin-bottom: 14px; }
.btn-primary {
  display: inline-block;
  padding: 8px 18px;
  background: linear-gradient(135deg, var(--coral), var(--peach));
  color: var(--bg-deep) !important;
  border-radius: 100px;
  font-size: 13px; font-weight: 700;
}
.btn-primary:hover { opacity: 0.92; }
.iframe-wrap {
  width: 100%; aspect-ratio: 16/9;
  border-radius: 12px; overflow: hidden;
  border: 1px solid var(--glass-border);
  background: var(--bg-deep);
}
.iframe-wrap iframe { width: 100%; height: 100%; border: none; }

/* ── Markdown 渲染样式 ── */
.markdown {
  max-width: 760px;
  font-size: 15px; line-height: 1.75;
}
.markdown h1 {
  font-family: "Noto Serif SC", serif;
  font-size: 30px; font-weight: 900; margin: 28px 0 14px;
  letter-spacing: -0.02em;
}
.markdown h2 {
  font-family: "Noto Serif SC", serif;
  font-size: 22px; font-weight: 700; margin: 32px 0 12px;
  padding-top: 18px;
  border-top: 1px solid var(--glass-border);
  color: var(--coral);
}
.markdown h2:first-child { padding-top: 0; border-top: none; }
.markdown h3 {
  font-size: 16px; font-weight: 700; margin: 18px 0 8px;
  color: var(--text);
}
.markdown p { margin: 10px 0; color: var(--text); }
.markdown ul, .markdown ol { margin: 12px 0; padding-left: 22px; }
.markdown li { margin: 4px 0; color: var(--text); }
.markdown strong { color: var(--text); font-weight: 700; }
.markdown em { color: var(--peach); font-style: italic; }
.markdown blockquote {
  border-left: 3px solid var(--coral);
  padding: 4px 16px;
  margin: 14px 0;
  color: var(--muted);
  font-style: italic;
}
.markdown table {
  width: 100%; border-collapse: collapse; margin: 14px 0;
  font-size: 14px;
}
.markdown th, .markdown td {
  padding: 8px 12px;
  border-bottom: 1px solid var(--glass-border);
  text-align: left;
}
.markdown th {
  color: var(--coral);
  font-weight: 700;
  background: rgba(255,255,255,0.02);
}
.markdown code {
  background: rgba(255,255,255,0.08);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
  color: var(--cyan);
}
.markdown hr {
  border: none;
  border-top: 1px solid var(--glass-border);
  margin: 24px 0;
}

/* 注释版的【...】高亮 */
.cue {
  display: inline-block;
  font-size: 12px;
  color: var(--lavender);
  background: rgba(183,148,255,0.12);
  border: 1px solid rgba(183,148,255,0.25);
  border-radius: 5px;
  padding: 1px 6px;
  margin: 0 2px;
  font-style: normal;
  font-family: "PingFang SC", system-ui;
  letter-spacing: 0;
  white-space: nowrap;
  vertical-align: 1px;
}

/* ── 音频列表 ── */
.audio-list {
  max-width: 760px;
  display: flex; flex-direction: column; gap: 8px;
}
.audio-row {
  display: grid;
  grid-template-columns: 50px 1fr 320px;
  align-items: center;
  gap: 16px;
  padding: 12px 18px;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
}
.audio-idx {
  font-family: "Instrument Serif", serif;
  font-style: italic; font-size: 22px;
  color: var(--coral);
}
.audio-name { font-size: 14px; color: var(--text); }
.audio-row audio { width: 100%; height: 32px; }

/* ── 响应式 ── */
@media (max-width: 720px) {
  .page { padding: 36px 20px 60px; }
  .hero { flex-direction: column; align-items: flex-start; gap: 12px; }
  .brand-title { font-size: 24px; }
  .year-label { font-size: 42px; }
  .detail-meta h1 { font-size: 30px; }
  .talk-grid { grid-template-columns: 1fr; }
  .audio-row { grid-template-columns: 1fr; }
}
`;

// ── 主流程 ────────────────────────────────────────────────
function build() {
  // 清空旧 docs（保留 .git 等隐藏文件）
  if (fs.existsSync(OUT_DIR)) {
    for (const f of fs.readdirSync(OUT_DIR)) {
      if (f.startsWith(".")) continue;
      fs.rmSync(path.join(OUT_DIR, f), { recursive: true, force: true });
    }
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(path.join(OUT_DIR, "assets"), { recursive: true });

  // 写公共 CSS
  fs.writeFileSync(path.join(OUT_DIR, "assets/style.css"), CSS);

  const talks = scanTalks();
  console.log(`→ 扫描到 ${talks.length} 场演讲`);

  // 首页
  fs.writeFileSync(path.join(OUT_DIR, "index.html"), renderHome(talks));
  console.log(`✓ docs/index.html`);

  // 每个 talk 的详情页 + 资源
  for (const t of talks) {
    const srcDir = path.join(TALKS_DIR, t.folderName);
    const dstDir = path.join(OUT_DIR, "talks", t.folderName);
    fs.mkdirSync(dstDir, { recursive: true });

    // 详情页
    fs.writeFileSync(path.join(dstDir, "index.html"), renderDetail(t, srcDir));

    // 复制资源（优先 output-v2）
    const outDir = t.outputDir || "output";
    copyIfExists(path.join(srcDir, outDir, "slides.html"), path.join(dstDir, "slides.html"));
    // 复制 input/ 里的图片资源（slides.html 可能引用）
    copyImages(path.join(srcDir, "input"), dstDir);
    // 也复制 output 同级的图片
    copyImages(path.join(srcDir, outDir), dstDir);
    // 音频
    const audioSrc = path.join(srcDir, outDir, "audio");
    if (fs.existsSync(audioSrc)) {
      const audioDst = path.join(dstDir, "audio");
      fs.mkdirSync(audioDst, { recursive: true });
      for (const f of fs.readdirSync(audioSrc)) {
        fs.copyFileSync(path.join(audioSrc, f), path.join(audioDst, f));
      }
    }

    console.log(`✓ docs/talks/${t.folderName}/  (${t.title})`);
  }

  console.log(`\n✅ 构建完成 → ${OUT_DIR}/`);
}

function copyIfExists(src, dst) {
  if (fs.existsSync(src)) fs.copyFileSync(src, dst);
}

function copyImages(srcDir, dstDir) {
  if (!fs.existsSync(srcDir)) return;
  for (const f of fs.readdirSync(srcDir)) {
    if (/\.(png|jpe?g|gif|webp|svg)$/i.test(f)) {
      fs.copyFileSync(path.join(srcDir, f), path.join(dstDir, f));
    }
  }
}

build();
