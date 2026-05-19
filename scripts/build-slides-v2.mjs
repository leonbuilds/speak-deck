// 基于 V1 大改 → 生成 V2 slides
// 用法：node scripts/build-slides-v2.mjs
import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";

const SRC = "talks/2026-05-24_AI落地实践/input/slides.html";
const DST = "talks/2026-05-24_AI落地实践/input/slides-v2.html";

const html = fs.readFileSync(SRC, "utf8");
const $ = cheerio.load(html, { decodeEntities: false });

// 新页顺序：每项 = { src: 原 section ID 或 'NEW', titleSuffix, transforms }
const NEW_ORDER = [
  { src: "p01", pos: 1, eyebrow: "AI 落地实践 · YuzoAI Keynote · 2026.05" },
  { src: "p02", pos: 2, eyebrow: "Opening · 一句话定调" },
  { src: "p03", pos: 3, eyebrow: "03 · 共鸣 · I was stuck too",
    h1Replace: { from: /<h1[^>]*>[\s\S]*?<\/h1>/, to: `<h1 class="reveal r3">我当年也卡在<span class="italic">第 0 个</span>产品</h1>` } },
  { src: "p09", pos: 4, eyebrow: "04 · 第一个产品 · Build It Small",
    h1Replace: { from: /<h1[^>]*>[\s\S]*?<\/h1>/, to: `<h1>clip-shot：<span class="italic">把烦了一年的事</span>干掉</h1>` } },
  { src: "p04", pos: 5, eyebrow: "05 · 抽方法 · Intent → Spec → Build",
    h1Replace: { from: /<h1[^>]*>[\s\S]*?<\/h1>/, to: `<h1>我从这个小工具里<br>抽出的<span class="italic">方法</span></h1>` } },
  { src: "NEW_GIT", pos: 6 },
  { src: "p10", pos: 7, eyebrow: "07 · 项目长大 · 1 → N" },
  { src: "p06", pos: 8, eyebrow: "08 · 工具入口 · Pick Your Stack",
    h1Replace: { from: /<h1[^>]*>[\s\S]*?<\/h1>/, to: `<h1>挑<span class="italic">趁手</span>的工具</h1>` } },
  { src: "p08", pos: 9, eyebrow: "09 · 让 AI 动手 · Beyond Chat",
    h1Replace: { from: /<h1[^>]*>[\s\S]*?<\/h1>/, to: `<h1>让 AI 从"<span class="italic">会回答</span>"<br>变成"<span class="italic">能办事</span>"</h1>` } },
  { src: "p11", pos: 10, eyebrow: "10 · 进企业 · The Divide",
    // 删掉隔离句
    rawReplace: [
      { from: /<div style="display:inline-block;margin-top:14px;[^"]*"[^>]*>提示 · 本节主要讲给有开发经验的朋友，零基础听个轮廓即可<\/div>/,
        to: `<div style="display:inline-block;margin-top:14px;padding:7px 18px;border-radius:100px;border:1px solid rgba(110,255,227,0.35);background:rgba(110,255,227,0.08);font-size:12px;letter-spacing:0.05em;color:var(--cyan);">提示 · 项目越大，越要先整理背景</div>` }
    ] },
  { src: "p12", pos: 11, eyebrow: "11 · 企业解法 · SDD",
    h1Replace: { from: /<h1[^>]*>[\s\S]*?<\/h1>/,
      to: `<h1>SDD：给 AI 写一份<br><span class="italic">项目说明书</span></h1>` } },
  { src: "p13", pos: 12, eyebrow: "12 · 真实项目 · Real World" },
  { src: "p14", pos: 13, eyebrow: "13 · 复利 · Compounding" },
  { src: "p15", pos: 14, eyebrow: "14 · 行动 · Your Turn" },
  { src: "NEW_QR", pos: 15 },
];

const TOTAL = NEW_ORDER.length;

// ────── 新页：P06 Git/GitHub ──────
function newGitSection() {
  return `
<section id="p-git" class="deck-slide">
<div class="bg-mesh">
  <div class="blob blob-1"></div><div class="blob blob-2"></div>
  <div class="blob blob-3"></div><div class="blob blob-4"></div>
</div>
<div class="slide">
  <div class="topnav reveal r1">
    <div class="brand"><div class="orb"></div><span>YuzoAI</span></div>
    <div class="nav-pills"><span class="pill">2026 · KEYNOTE</span><span class="pill live">LIVE</span></div>
  </div>
  <div class="page-header reveal r2">
    <div class="eyebrow">06 · 安全网 · Version Control</div>
    <h1>AI 帮你<span class="italic">存档</span>，也帮你<span class="grad">回退</span></h1>
    <div class="dek">Git 不用你学 ——AI 自己会用。你只需要知道它<span style="color:var(--cyan)">存在</span>。</div>
  </div>
  <div class="git-cards">
    <div class="git-card g1 reveal r3">
      <div class="g-num">01</div>
      <div class="g-icon">📸</div>
      <h3>AI 自动存档</h3>
      <p>每改完一段功能，AI 自己 <span class="hl">commit</span> 一次。Git 就是给代码"拍照存档"，每一步都有记录。</p>
      <div class="g-foot">你说："这段做完了" → AI 自己保存</div>
    </div>
    <div class="git-card g2 reveal r4">
      <div class="g-num">02</div>
      <div class="g-icon">⏪</div>
      <h3>说一句就回退</h3>
      <p>AI 改飞了？说"<span class="hl">回到刚才那版</span>"，AI 自己 reset，一秒回到上一次存档，不用熬夜重写。</p>
      <div class="g-foot">坏了不可怕，回得去就行</div>
    </div>
    <div class="git-card g3 reveal r5">
      <div class="g-num">03</div>
      <div class="g-icon">🌿</div>
      <h3>试新想法不怕坏</h3>
      <p>想试个新方案？让 AI 开个<span class="hl">分支</span>，跑通了合并，跑不通直接丢。主代码全程不受影响。</p>
      <div class="g-foot">一个想法 = 一个分支 = 一次安全的实验</div>
    </div>
  </div>
  <div class="git-callout reveal r6">
    <span class="hi">敢让 AI 乱来</span>的底气，来自 Git 给你兜底。
  </div>
  <div class="bottom-bar reveal r7">
    <div>YuzoAI · WeChat · 小红书</div>
    <div class="progress-line">${dots(6)}</div>
    <div>06 / 15 — Safety Net</div>
  </div>
</div>
</section>`;
}

// ────── 新页：P15 谢谢 + QR ──────
function newQrSection() {
  return `
<section id="p-end" class="deck-slide">
<div class="bg-mesh">
  <div class="blob blob-1"></div><div class="blob blob-2"></div>
  <div class="blob blob-3"></div><div class="blob blob-4"></div>
</div>
<div class="slide">
  <div class="topnav reveal r1">
    <div class="brand"><div class="orb"></div><span>YuzoAI</span></div>
    <div class="nav-pills"><span class="pill">2026 · KEYNOTE</span><span class="pill live">LIVE</span></div>
  </div>
  <div class="end-hero">
    <div class="end-left">
      <div class="eyebrow reveal r2">15 · 谢谢大家 · Thank You</div>
      <h1 class="reveal r3">你不需要成为<br>更<span class="italic">好</span>的程序员<br>你需要成为更<span class="grad">清晰</span>的<span class="grad">判断者</span></h1>
      <div class="end-tag reveal r4">— 这场分享想留下的一句话</div>
    </div>
    <div class="end-right reveal r5">
      <div class="qr-box">
        <div class="qr-img">
          <!-- QR 占位：换成你的实际二维码图片即可 -->
          <div class="qr-placeholder">扫码<br>加微信</div>
        </div>
        <div class="qr-label">阿亮的微信</div>
        <div class="qr-sub">聊 AI · 聊产品 · 聊创业</div>
      </div>
    </div>
  </div>
  <div class="bottom-bar reveal r6">
    <div>YuzoAI · 智启无界，行向未来</div>
    <div class="progress-line">${dots(15)}</div>
    <div>15 / 15 — Fin</div>
  </div>
</div>
</section>`;
}

// 进度点：on 数 = 当前页位置
function dots(curr) {
  let s = "";
  for (let i = 1; i <= TOTAL; i++) s += `<span class="seg${i <= curr ? " on" : ""}"></span>`;
  return s;
}

// ────── 新页 CSS ──────
const NEW_CSS = `
/* ===== P-GIT · Git/GitHub 安全网 ===== */
#p-git .bg-mesh{position:absolute;inset:0;z-index:0;overflow:hidden}
#p-git .blob{position:absolute;border-radius:50%;filter:blur(80px);opacity:0.55;animation:float 20s ease-in-out infinite}
#p-git .blob-1{width:560px;height:560px;background:radial-gradient(circle,var(--cyan),transparent 70%);top:-180px;left:-100px}
#p-git .blob-2{width:620px;height:620px;background:radial-gradient(circle,var(--lavender),transparent 70%);bottom:-240px;right:-100px;animation-delay:-7s}
#p-git .blob-3{width:420px;height:420px;background:radial-gradient(circle,var(--peach),transparent 70%);top:30%;right:10%;opacity:0.35;animation-delay:-14s}
#p-git .blob-4{width:380px;height:380px;background:radial-gradient(circle,var(--coral),transparent 70%);bottom:14%;left:30%;opacity:0.4;animation-delay:-3s}
#p-git::after{content:'';position:absolute;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");opacity:0.15;mix-blend-mode:overlay;pointer-events:none;z-index:2}
#p-git .slide{position:relative;z-index:1;width:100vw;height:100vh;padding:44px 80px;display:grid;grid-template-rows:auto auto 1fr auto auto;gap:24px}
#p-git .topnav{display:flex;justify-content:space-between;align-items:center}
#p-git .brand{display:flex;align-items:center;gap:12px;font-size:14px;font-weight:500}
#p-git .brand .orb{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,var(--cyan),var(--lavender));box-shadow:0 0 24px rgba(110,255,227,0.55);position:relative}
#p-git .brand .orb::after{content:'';position:absolute;inset:4px;border-radius:50%;background:var(--bg-deep)}
#p-git .nav-pills{display:flex;gap:8px}
#p-git .pill{font-size:11px;letter-spacing:0.15em;text-transform:uppercase;padding:8px 16px;border-radius:100px;background:rgba(255,255,255,0.08);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.12);color:var(--text)}
#p-git .pill.live{background:linear-gradient(135deg,rgba(110,255,227,0.3),rgba(183,148,255,0.3));border-color:rgba(110,255,227,0.5)}
#p-git .pill.live::before{content:'●';color:var(--cyan);margin-right:6px;animation:blink 1.5s infinite}
#p-git .eyebrow{display:inline-flex;align-items:center;gap:10px;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:var(--cyan);font-weight:500;margin-bottom:10px}
#p-git .eyebrow::before{content:'';width:32px;height:1px;background:linear-gradient(90deg,var(--cyan),transparent)}
#p-git h1{font-family:'Noto Serif SC',serif;font-weight:900;font-size:54px;line-height:1.05;letter-spacing:-0.02em}
#p-git h1 .italic{font-family:'Instrument Serif',serif;font-style:italic;font-weight:400;color:var(--cyan)}
#p-git h1 .grad{background:linear-gradient(135deg,var(--coral),var(--peach),var(--lavender));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
#p-git .dek{margin-top:14px;font-family:'Instrument Serif',serif;font-style:italic;font-size:20px;color:var(--muted);max-width:720px;line-height:1.5}
#p-git .git-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;align-content:center}
#p-git .git-card{background:var(--glass-bg);backdrop-filter:blur(30px);border:1px solid var(--glass-border);border-radius:22px;padding:24px 22px;position:relative;overflow:hidden;display:flex;flex-direction:column;gap:12px;min-height:340px}
#p-git .git-card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)}
#p-git .g-num{font-family:'Instrument Serif',serif;font-style:italic;font-size:22px;color:var(--muted);letter-spacing:0.06em}
#p-git .g-icon{font-size:38px;line-height:1}
#p-git .git-card h3{font-family:'Noto Serif SC',serif;font-weight:700;font-size:22px;line-height:1.2}
#p-git .git-card p{font-size:14px;line-height:1.65;color:var(--text);flex-grow:1}
#p-git .git-card .hl{color:var(--cyan);font-weight:600}
#p-git .g-foot{padding-top:14px;border-top:1px solid var(--glass-border);font-size:12px;letter-spacing:0.04em;color:var(--muted);font-style:italic}
#p-git .git-card.g1 .g-num{color:var(--cyan)}
#p-git .git-card.g2 .g-num{color:var(--lavender)}
#p-git .git-card.g3 .g-num{color:var(--peach)}
#p-git .git-callout{font-family:'Instrument Serif',serif;font-style:italic;font-size:20px;text-align:center;color:var(--muted)}
#p-git .git-callout .hi{position:relative;color:var(--text);font-weight:500;font-style:normal;font-family:'Noto Serif SC',serif;padding:0 4px}
#p-git .git-callout .hi::after{content:'';position:absolute;left:-2px;right:-2px;bottom:1px;height:10px;z-index:-1;background:linear-gradient(120deg,transparent 30%,rgba(110,255,227,0.45) 30%)}
#p-git .bottom-bar{display:flex;justify-content:space-between;align-items:center;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:var(--muted)}
#p-git .progress-line{display:flex;gap:4px;align-items:center}
#p-git .progress-line .seg{width:24px;height:2px;background:rgba(255,255,255,0.15);border-radius:2px}
#p-git .progress-line .seg.on{background:linear-gradient(90deg,var(--cyan),var(--lavender))}

/* ===== P-END · 谢谢 + QR ===== */
#p-end .bg-mesh{position:absolute;inset:0;z-index:0;overflow:hidden}
#p-end .blob{position:absolute;border-radius:50%;filter:blur(80px);opacity:0.7;animation:float 20s ease-in-out infinite}
#p-end .blob-1{width:700px;height:700px;background:radial-gradient(circle,var(--coral),transparent 70%);top:-220px;left:-120px}
#p-end .blob-2{width:800px;height:800px;background:radial-gradient(circle,var(--lavender),transparent 70%);bottom:-260px;right:-160px;animation-delay:-7s}
#p-end .blob-3{width:520px;height:520px;background:radial-gradient(circle,var(--cyan),transparent 70%);top:30%;right:25%;opacity:0.35;animation-delay:-14s}
#p-end .blob-4{width:420px;height:420px;background:radial-gradient(circle,var(--peach),transparent 70%);bottom:20%;left:30%;opacity:0.45;animation-delay:-3s}
#p-end::after{content:'';position:absolute;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");opacity:0.15;mix-blend-mode:overlay;pointer-events:none;z-index:2}
#p-end .slide{position:relative;z-index:1;width:100vw;height:100vh;padding:56px 80px;display:grid;grid-template-rows:auto 1fr auto;gap:36px}
#p-end .topnav{display:flex;justify-content:space-between;align-items:center}
#p-end .brand{display:flex;align-items:center;gap:12px;font-size:14px;font-weight:500;letter-spacing:0.02em}
#p-end .brand .orb{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,var(--coral),var(--peach));box-shadow:0 0 24px rgba(255,94,126,0.6);position:relative}
#p-end .brand .orb::after{content:'';position:absolute;inset:4px;border-radius:50%;background:var(--bg-deep)}
#p-end .nav-pills{display:flex;gap:8px}
#p-end .pill{font-size:11px;letter-spacing:0.15em;text-transform:uppercase;padding:8px 16px;border-radius:100px;background:rgba(255,255,255,0.08);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.12);color:var(--text)}
#p-end .pill.live{background:linear-gradient(135deg,rgba(255,94,126,0.3),rgba(183,148,255,0.3));border-color:rgba(255,94,126,0.5)}
#p-end .pill.live::before{content:'●';color:var(--coral);margin-right:6px;animation:blink 1.5s infinite}
#p-end .end-hero{display:grid;grid-template-columns:1.5fr 1fr;gap:80px;align-items:center}
#p-end .end-left{display:flex;flex-direction:column;gap:24px}
#p-end .eyebrow{display:inline-flex;align-items:center;gap:10px;font-size:12px;letter-spacing:0.3em;text-transform:uppercase;color:var(--coral);font-weight:500;width:fit-content}
#p-end .eyebrow::before{content:'';width:32px;height:1px;background:linear-gradient(90deg,var(--coral),transparent)}
#p-end h1{font-family:'Noto Serif SC',serif;font-weight:900;font-size:64px;line-height:1.08;letter-spacing:-0.03em;color:var(--text)}
#p-end h1 .italic{font-family:'Instrument Serif',serif;font-style:italic;font-weight:400;color:var(--coral)}
#p-end h1 .grad{background:linear-gradient(135deg,var(--coral),var(--peach),var(--lavender));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
#p-end .end-tag{font-family:'Instrument Serif',serif;font-style:italic;font-size:20px;color:var(--muted)}
#p-end .end-right{display:flex;justify-content:center;align-items:center}
#p-end .qr-box{background:var(--glass-bg);backdrop-filter:blur(30px);border:1px solid var(--glass-border);border-radius:28px;padding:32px;display:flex;flex-direction:column;align-items:center;gap:14px;position:relative;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.45)}
#p-end .qr-box::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)}
#p-end .qr-img{width:240px;height:240px;border-radius:16px;background:#fff;display:flex;align-items:center;justify-content:center;overflow:hidden}
#p-end .qr-img img{width:100%;height:100%;object-fit:contain}
#p-end .qr-placeholder{font-size:22px;color:#0E1116;text-align:center;line-height:1.4;font-weight:700;background:repeating-linear-gradient(45deg,#0E1116 0 8px,transparent 8px 16px);background-size:24px 24px;width:100%;height:100%;display:flex;align-items:center;justify-content:center}
#p-end .qr-label{font-family:'Noto Serif SC',serif;font-weight:700;font-size:20px;margin-top:6px}
#p-end .qr-sub{font-size:13px;color:var(--muted);letter-spacing:0.05em}
#p-end .bottom-bar{display:flex;justify-content:space-between;align-items:center;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:var(--muted)}
#p-end .progress-line{display:flex;gap:4px;align-items:center}
#p-end .progress-line .seg{width:24px;height:2px;background:rgba(255,255,255,0.15);border-radius:2px}
#p-end .progress-line .seg.on{background:linear-gradient(90deg,var(--coral),var(--peach),var(--lavender))}
`;

// ────── 提取每个原 section 的 HTML ──────
function getSection(id) {
  const el = $(`#${id}`);
  if (!el.length) throw new Error(`找不到 section #${id}`);
  return $.html(el);
}

// ────── 对每个 section 应用变换 ──────
function transformSection(html, item) {
  let s = html;

  // 1. 替换 bottom-bar 的页码 + 进度点
  // 原 bottom-bar 格式：<div>YuzoAI · WeChat · 小红书</div><div class="progress-line">...</div><div>NN / 15 — Xxx</div>
  const bbReg = /<div class="bottom-bar[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?=<\/div>)/;
  s = s.replace(bbReg, (full, inner) => {
    // 更新页码段
    let newInner = inner.replace(
      /<div>\s*(\d{1,2})\s*\/\s*\d{1,2}\s*([—\-—][\s\S]*?)<\/div>/,
      `<div>${String(item.pos).padStart(2,"0")} / ${TOTAL} $2</div>`
    );
    // 替换进度点
    newInner = newInner.replace(
      /<div class="progress-line">[\s\S]*?<\/div>/,
      `<div class="progress-line">${dots(item.pos)}</div>`
    );
    return `<div class="bottom-bar reveal r5">${newInner}</div>`;
  });

  // 2. 替换 eyebrow
  if (item.eyebrow) {
    s = s.replace(
      /<div class="eyebrow[^"]*"[^>]*>([\s\S]*?)<\/div>/,
      (m, inner) => m.replace(inner.trim(), item.eyebrow)
    );
  }

  // 3. 替换 h1
  if (item.h1Replace) {
    s = s.replace(item.h1Replace.from, item.h1Replace.to);
  }

  // 4. 任意原始替换
  if (item.rawReplace) {
    for (const r of item.rawReplace) {
      s = s.replace(r.from, r.to);
    }
  }
  return s;
}

// ────── 组装新 HTML ──────
const sectionsHtml = NEW_ORDER.map(item => {
  if (item.src === "NEW_GIT") return newGitSection();
  if (item.src === "NEW_QR")  return newQrSection();
  return transformSection(getSection(item.src), item);
}).join("\n");

// 把所有原 sections 从 body 移除，把新 sections 拼进去
const $body = $("body");
$body.find(".deck-slide").remove();
// 移除原有的注入器 script（v2 由 inject-html.mjs 重新注入）
$body.find("script").remove();
$body.prepend(sectionsHtml);

// 必须保留：in-view 动画触发 + 键盘导航（原 v1 末尾的小 script）
const REVEAL_SCRIPT = `
<script>
(function(){
  var slides=[].slice.call(document.querySelectorAll('.deck-slide'));
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){
      e.target.classList.toggle('in-view',e.isIntersecting&&e.intersectionRatio>=0.4);
    });
  },{threshold:[0,0.25,0.4,0.5,0.75,1]});
  slides.forEach(function(s){io.observe(s);});
})();
</script>
`;
$body.append(REVEAL_SCRIPT);

// CSS：在 <style> 末尾追加新页样式
$("style").first().each((i, el) => {
  $(el).append(NEW_CSS);
});

// 标题改一下
$("title").text("AI 落地实践 · 用 Vibe Coding 打造你的第一个，也是第 N 个产品");

// 写出
fs.writeFileSync(DST, $.html());
console.log(`✓ V2 已生成 → ${DST}`);
console.log(`   ${TOTAL} 页 · 已删除原 P05/P07 · 新增 P06 Git + P15 QR`);
