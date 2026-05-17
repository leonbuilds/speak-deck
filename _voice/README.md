# 声音克隆使用说明

## 一次性准备：克隆你的声音

### 1. 录一段干净的人声样本

要求：

- 时长：**30–60 秒**（最佳 45 秒）
- 内容：朗读 + 自由说话各一半，覆盖你常用的语气和停顿
- 环境：安静、无回声、无背景音乐
- 设备：普通耳麦或手机麦都行，**不要用 AirPods**（噪声压制会破坏音色）
- 采样率：≥ 22kHz（手机录音 44.1kHz 即可）
- 格式：wav 或 mp3 都行

保存为：`_voice/sample-clean.wav`

> **推荐朗读文本**（覆盖常用音）：
>
> "大家好，我是 Leon。今天想和大家聊一个很具体的问题。我们都用过 AI 工具，但用得最多的还是写代码、改文案。其实它还能帮你做一件事，就是——准备一场演讲。从写稿、做 PPT、到练习口播，它能全程参与。我自己做了十几年广告培训，做过五百多份方案。最近这一两年用 AI 之后，整个节奏完全变了。"

### 2. 配置 MiniMax 凭据

```bash
cp _env/.env.example _env/.env
# 编辑 _env/.env，填入你的 MINIMAX_API_KEY 和 MINIMAX_GROUP_ID
# 在 https://platform.minimaxi.com/ 注册账号后可以拿到
```

### 3. 跑克隆脚本

```bash
node scripts/clone-voice.mjs
```

脚本会：
1. 上传 `_voice/sample-clean.wav` 到 MiniMax
2. 触发声音克隆
3. 把返回的 `voice_id` 写到 `_voice/voice-id.txt`

之后所有 TTS 都会自动用这个 voice_id。

---

## 每次使用：用克隆的声音生成口播

不需要你手动操作——Claude Code 在工作流的 TTS 步骤会自动调用：

```bash
node scripts/tts.mjs talks/<本次>/output
```

---

## 常见问题

**Q: 我可以克隆多个声音吗（比如不同场合用不同音色）？**
A: 可以。每次跑 `clone-voice.mjs` 会生成新的 voice_id，你可以重命名 `voice-id.txt` 为 `voice-id.formal.txt` / `voice-id.casual.txt`，然后在 `_env/.env` 里设 `VOICE_ID=formal` 之类。

**Q: 克隆效果不好怎么办？**
A: 重录样本，确保：
- 没有"嗯""啊"等口头禅在样本里
- 语速接近你的真实演讲语速（不要太慢）
- 录制时坐直、嘴离麦克风一拳

**Q: 我想用普通播音腔，不要克隆？**
A: 在 `_voice/voice-id.txt` 里手动填 MiniMax 系统音色 id（如 `male-qn-qingse`），跳过克隆步骤。
