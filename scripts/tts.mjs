// 多 provider TTS：fish (Fish Audio) | qwen (阿里云千问TTS)
// 用法：node scripts/tts.mjs <output目录> [--provider fish|qwen] [--voice <id>] [--style "..."] [--force]
//
// Fish Audio 代理：在 _env/.env 设 HTTPS_PROXY=http://127.0.0.1:7890（你的 VPN 本地端口）
// Qwen 情感控制：--style "演讲风格，强调重点" 或 QWEN_TTS_STYLE env 变量
//   不传 --style 时默认用内置演讲风格；传 --style plain 则纯读文本（无风格注入）

import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";
import { pack } from "msgpackr";

config({ path: new URL("../_env/.env", import.meta.url) });

// ── 参数解析 ─────────────────────────────────────────────
const argv = process.argv.slice(2);
const outDir = argv.find((a) => !a.startsWith("--"));
const flag = (name) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : null;
};
const has = (name) => argv.includes(`--${name}`);

if (!outDir) {
  console.error("用法: node scripts/tts.mjs <output目录> [--provider fish|qwen] [--voice <id>] [--style \"...\"] [--force]");
  process.exit(1);
}

const provider  = flag("provider") || process.env.TTS_PROVIDER || "fish";

// Qwen instruct 演讲风格（需保持短小，≤600 字节限制）
const DEFAULT_STYLE = "充满感染力的演讲风格，重要观点处停顿加重，语速中等偏快，有力量感。";

// CosyVoice 情感风格指令（通过 instruct 字段传入，不会被读出来）
const COSYVOICE_STYLE =
  "充满感染力的演讲风格，在破折号和句号处自然停顿，重点词语语气加重，整体节奏活泼有力量感";
const voiceOverride = flag("voice");
const styleArg  = flag("style");   // "plain" = 不注入风格；其他字符串 = 自定义风格；undefined = 默认演讲风格
const force     = has("force");

if (!["fish", "qwen"].includes(provider)) {
  console.error(`✗ 不支持的 provider: ${provider}，可选 fish | qwen`);
  process.exit(1);
}

// ── 读 script.json ────────────────────────────────────────
const scriptJson = path.join(outDir, "script.json");
if (!fs.existsSync(scriptJson)) {
  console.error(`✗ 找不到 ${scriptJson}`);
  process.exit(1);
}
const pages = JSON.parse(fs.readFileSync(scriptJson, "utf8"));
const audioDir = path.join(outDir, "audio");
fs.mkdirSync(audioDir, { recursive: true });

const styleLabel = styleArg === "plain" ? "无风格" : "演讲风格";
console.log(`→ provider=${provider}  风格=${styleLabel}  共 ${pages.length} 页`);

// ── 主循环 ───────────────────────────────────────────────
let ok = 0, skip = 0, fail = 0;

for (const p of pages) {
  const fname = `p${String(p.page).padStart(2, "0")}.mp3`;
  const fpath = path.join(audioDir, fname);

  if (!p.text?.trim()) {
    console.log(`  跳过 ${fname}（空文本）`);
    skip++;
    continue;
  }
  if (fs.existsSync(fpath) && !force) {
    console.log(`  跳过 ${fname}（已存在；加 --force 覆盖）`);
    skip++;
    continue;
  }

  try {
    const buf = provider === "fish"
      ? await ttsWithFish(p.text, voiceOverride)
      : await ttsWithQwen(p.text, voiceOverride, styleArg);
    fs.writeFileSync(fpath, buf);
    console.log(`✓ ${fname}  (${p.text.length} 字)`);
    ok++;
  } catch (err) {
    console.error(`✗ ${fname}:`, err.message);
    fail++;
  }
  // 避免频率限制
  await new Promise(r => setTimeout(r, 800));
}

console.log(`\n完成：成功 ${ok} · 跳过 ${skip} · 失败 ${fail}`);
process.exit(fail > 0 ? 2 : 0);

// ── Fish Audio ────────────────────────────────────────────
async function ttsWithFish(text, voiceOverride) {
  const KEY = process.env.FISH_AUDIO_API_KEY;
  if (!KEY) throw new Error("缺少 FISH_AUDIO_API_KEY（填 _env/.env）");

  const voiceId = voiceOverride || readFile("_voice/voice-id.txt");
  if (!voiceId) throw new Error("缺少 Fish Audio voice ID，请把 reference_id 写入 _voice/voice-id.txt");

  const body = pack({
    text,
    reference_id: voiceId,
    format: "mp3",
    mp3_bitrate: 128,
    chunk_length: 200,
    normalize: true,
    latency: "normal",
  });

  // 支持 HTTPS_PROXY 环境变量（VPN 本地代理）
  const fetchOpts = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/msgpack",
      model: "s2-pro",
    },
    body,
  };

  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  if (proxy) {
    const { ProxyAgent } = await import("undici");
    fetchOpts.dispatcher = new ProxyAgent(proxy);
  }

  const res = await fetch("https://api.fish.audio/v1/tts", fetchOpts);

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`Fish Audio HTTP ${res.status}: ${msg.slice(0, 200)}`);
  }

  return Buffer.from(await res.arrayBuffer());
}

// ── 阿里云千问TTS ─────────────────────────────────────────

async function ttsWithQwen(text, voiceOverride, styleArg) {
  const KEY = process.env.DASHSCOPE_API_KEY;
  if (!KEY) throw new Error("缺少 DASHSCOPE_API_KEY（填 _env/.env）");

  // 音色优先级：--voice > voice-id.qwen.txt > QWEN_TTS_VOICE env > "Cherry"
  const voice = voiceOverride
    || readFile("_voice/voice-id.qwen.txt")
    || process.env.QWEN_TTS_VOICE
    || "Cherry";

  // 确定风格指令
  let style = null;
  if (styleArg === "plain") {
    style = null;                          // 纯读文本
  } else if (styleArg) {
    style = styleArg;                      // 自定义风格
  } else {
    style = process.env.QWEN_TTS_STYLE || DEFAULT_STYLE;
  }

  // 判断是否是自定义克隆音色
  const isCustomVoice = voice.length > 20 && !/^[A-Z][a-z]+$/.test(voice);

  // CosyVoice 克隆音色（voice ID 含 "cosyvoice-"）用专属端点和模型
  if (voice.startsWith("cosyvoice-")) {
    return ttsWithCosyVoice(text, voice);
  }

  // 其他克隆音色用 vc 模型；instruct 模型限制 600 字节，超长时退回 flash
  let model;
  let finalText = text;
  if (isCustomVoice) {
    model = "qwen3-tts-vc-2026-01-22";
  } else if (style) {
    const prefix = `[speaking style: ${style}]\n`;
    const totalBytes = Buffer.byteLength(prefix + text, "utf8");
    if (totalBytes <= 580) {
      model = "qwen3-tts-instruct-flash";
      finalText = prefix + text;
    } else {
      model = "qwen3-tts-flash";   // 文本太长，退回普通模型
    }
  } else {
    model = "qwen3-tts-flash";
  }

  const res = await fetch(
    "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        input: { text: finalText, voice, language_type: "Chinese" },
      }),
    }
  );

  const j = await res.json().catch(() => ({}));
  if (!res.ok || (j.status_code && j.status_code >= 400)) {
    throw new Error(`Qwen TTS HTTP ${res.status}: ${JSON.stringify(j).slice(0, 300)}`);
  }

  const audio = j.output?.audio;
  if (!audio) throw new Error(`Qwen TTS 响应缺少 audio 字段: ${JSON.stringify(j).slice(0, 200)}`);

  if (audio.data) return Buffer.from(audio.data, "base64");
  if (audio.url) {
    const dl = await fetch(audio.url);
    if (!dl.ok) throw new Error(`Qwen TTS 下载音频失败 HTTP ${dl.status}`);
    return Buffer.from(await dl.arrayBuffer());
  }

  throw new Error(`Qwen TTS: audio 字段既无 data 也无 url: ${JSON.stringify(audio)}`);
}

// ── CosyVoice 克隆音色（专属端点）────────────────────────
async function ttsWithCosyVoice(text, voice) {
  const KEY = process.env.DASHSCOPE_API_KEY;
  if (!KEY) throw new Error("缺少 DASHSCOPE_API_KEY");

  const res = await fetch(
    "https://dashscope.aliyuncs.com/api/v1/services/audio/tts/SpeechSynthesizer",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "cosyvoice-v3.5-plus",
        input: { text, voice, instruct: COSYVOICE_STYLE, format: "mp3", sample_rate: 24000 },
      }),
    }
  );

  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`CosyVoice HTTP ${res.status}: ${j.message || j.code || ""}`);

  const audio = j.output?.audio;
  if (!audio) throw new Error(`CosyVoice 响应缺少 audio: ${JSON.stringify(j).slice(0, 200)}`);
  if (audio.data) return Buffer.from(audio.data, "base64");
  if (audio.url) {
    const dl = await fetch(audio.url);
    if (!dl.ok) throw new Error(`CosyVoice 下载失败 HTTP ${dl.status}`);
    return Buffer.from(await dl.arrayBuffer());
  }
  throw new Error("CosyVoice: 既无 data 也无 url");
}

// ── 工具 ─────────────────────────────────────────────────
function readFile(p) {
  return fs.existsSync(p) ? fs.readFileSync(p, "utf8").trim() : null;
}
