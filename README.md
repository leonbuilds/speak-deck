# SpeakDeck

> **Speak**（口播音频）+ **Deck**（演讲 PPT） —— 用 Claude Code 一站式准备演讲。

一个 Claude Code 驱动的演讲准备工作流：把你的笔记 / 历史方案 / 会议录音 / 自己的声音整合起来，一次产出 HTML 演讲网页 + 自己声音的口播音频。

## 两种模式

| 模式 | 入口 | 产出 |
|---|---|---|
| **Mode A 从零开始** | `talks/<name>/brief.md` | HTML + 逐字稿 + 音频（全生成） |
| **Mode B 基于已有 HTML** | `talks/<name>/input/slides.html` | 原 HTML + 注入 `data-script` & `data-audio` + 音频 |

## 5 分钟启动

```bash
# 1. 装依赖
npm install

# 2. 配 MiniMax 凭据
cp _env/.env.example _env/.env
# → 在 _env/.env 里填 MINIMAX_API_KEY 和 MINIMAX_GROUP_ID

# 3. 录 30~60 秒干净声音样本 → _voice/sample-clean.wav
# 4. 克隆自己的声音
node scripts/clone-voice.mjs
# → 自动写入 _voice/voice-id.txt

# 5. 启动 Claude Code，发：
#    "我要做一场新演讲，brief 在 talks/2026-06-XX_xxx/brief.md，按 CLAUDE.md 流程开干。"
```

## 目录结构

```
speak-deck/
├── CLAUDE.md                  # 全局规则（Claude Code 启动必读）
├── _knowledge/                # 长期上下文
│   ├── style-guide.md         # 表达风格速记
│   ├── glossary.md            # 术语
│   ├── past-decks/            # 历史 PPT（PDF/PPTX/MD 都行）
│   └── templates/             # HTML 模板、注入器、场景规则
├── _profiles/                 # 视觉风格 + 语速档案
├── _voice/                    # 声音样本 + voice_id
├── _env/                      # 环境变量
├── scripts/                   # Node 脚本（克隆/TTS/解析/注入/构建/自检）
└── talks/                     # 每次演讲一个文件夹
    └── <date>_<topic>/
        ├── brief.md           # 这次演讲的需求
        ├── mode.txt           # "A" 或 "B"
        ├── context/           # 录音转写、客户文件
        ├── input/             # Mode B：原 slides.html
        ├── working/           # 中间产物
        └── output/            # 最终产物
```

## 每次新演讲

**Mode A（从零）**
```text
我要做一场新演讲，brief 在 talks/2026-06-XX_yyy/brief.md，按 CLAUDE.md 流程开干。
```

**Mode B（已有 HTML）**
```text
talks/2026-06-XX_zzz/input/slides.html 是我已经做好的 PPT。
brief 在 talks/2026-06-XX_zzz/brief.md（如果有的话）。
按 CLAUDE.md 的 Mode B 流程，给我加逐字稿和音频。
```

## 命名

`speakdeck` （目录/package/repo）· `SpeakDeck` （品牌名）
