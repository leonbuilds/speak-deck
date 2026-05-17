// 一次性：把 _voice/sample-clean.wav 克隆成专属 voice_id
// 用法：node scripts/clone-voice.mjs
import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";
config({ path: new URL("../_env/.env", import.meta.url) });

const KEY = process.env.MINIMAX_API_KEY;
const GROUP = process.env.MINIMAX_GROUP_ID;
const SAMPLE = "_voice/sample-clean.wav";
const OUT = "_voice/voice-id.txt";

if (!KEY || !GROUP) {
  console.error("✗ 缺少 MINIMAX_API_KEY 或 MINIMAX_GROUP_ID（看 _env/.env）");
  process.exit(1);
}
if (!fs.existsSync(SAMPLE)) {
  console.error(`✗ 找不到样本 ${SAMPLE}，请先录 30-60 秒人声`);
  process.exit(1);
}

console.log("→ 上传音频样本...");
const form = new FormData();
form.append("purpose", "voice_clone");
form.append(
  "file",
  new Blob([fs.readFileSync(SAMPLE)], { type: "audio/wav" }),
  path.basename(SAMPLE)
);

const uploadRes = await fetch(
  `https://api.minimax.chat/v1/files/upload?GroupId=${GROUP}`,
  { method: "POST", headers: { Authorization: `Bearer ${KEY}` }, body: form }
).then((r) => r.json());

if (!uploadRes?.file?.file_id) {
  console.error("✗ 上传失败：", JSON.stringify(uploadRes, null, 2));
  process.exit(1);
}
const fileId = uploadRes.file.file_id;
console.log(`✓ 上传完成 file_id=${fileId}`);

const voiceId = `leon_${Date.now()}`;
console.log(`→ 触发克隆 voice_id=${voiceId}...`);

const cloneRes = await fetch(
  `https://api.minimax.chat/v1/voice_clone?GroupId=${GROUP}`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ file_id: fileId, voice_id: voiceId }),
  }
).then((r) => r.json());

if (cloneRes?.base_resp?.status_code && cloneRes.base_resp.status_code !== 0) {
  console.error("✗ 克隆失败：", JSON.stringify(cloneRes, null, 2));
  process.exit(1);
}

fs.writeFileSync(OUT, voiceId);
console.log(`✓ 克隆完成。voice_id 已写入 ${OUT}`);
console.log(`  下次 TTS 会自动使用此声音。`);
