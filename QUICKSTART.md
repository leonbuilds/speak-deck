# QuickStart：第一次跑通 SpeakDeck

## 步骤 1：装依赖

```bash
cd ~/speak-deck    # 或你这个项目的实际路径
npm install
```

## 步骤 2：配 MiniMax 凭据

```bash
cp _env/.env.example _env/.env
```

在 [MiniMax 控制台](https://platform.minimaxi.com/) 拿到 `API Key` 和 `Group ID` 后填进去。

## 步骤 3：克隆你的声音

1. 录 30–60 秒干净人声（推荐文本和录音要求见 `_voice/README.md`），保存为 `_voice/sample-clean.wav`
2. 跑：

```bash
npm run clone-voice
```

成功后 `_voice/voice-id.txt` 会自动写入。

## 步骤 4：往 `_knowledge/past-decks/` 丢 2–3 份代表性历史方案

PDF / PPTX / MD 都行。Claude Code 会自己读。

## 步骤 5：启动 Claude Code

在项目根目录执行：

```bash
claude
```

### Mode A 第一次（从零）

新建文件夹 `talks/2026-06-XX_test/` 和 `brief.md`：

```bash
mkdir -p talks/2026-06-XX_test
cp _knowledge/templates/brief.template.md talks/2026-06-XX_test/brief.md
# 编辑 brief.md 填好基本信息
```

然后告诉 Claude Code：

```text
我要做一场新演讲，brief 在 talks/2026-06-XX_test/brief.md，按 CLAUDE.md 流程开干。
```

### Mode B 第一次（已有 HTML）

```bash
mkdir -p talks/2026-06-XX_test/input
cp ~/path/to/your/slides.html talks/2026-06-XX_test/input/slides.html
# 可选：也写一份 brief.md
```

告诉 Claude Code：

```text
talks/2026-06-XX_test/input/slides.html 是我做好的 PPT。
按 CLAUDE.md 的 Mode B 流程，给我加逐字稿和音频。
```

## 步骤 6：验收

Claude Code 跑完后：

- HTML 在 `talks/<本次>/output/slides.html`，用浏览器打开
- 按 `P` 切换演讲模式（右下角逐字稿浮层）
- 上下方向键 / 空格 翻页，翻到哪页自动播哪页的音频
- `M` 暂停音频，`R` 重播当前页

## 常见命令速查

```bash
npm run clone-voice                                # 克隆声音（一次性）
npm run build talks/<本次>                          # Mode A：渲染 HTML
npm run parse talks/<本次>/input/slides.html talks/<本次>/working  # Mode B：解析 HTML
npm run inject -- --in talks/<本次>/input/slides.html --pages talks/<本次>/working/pages.json --out talks/<本次>/output/slides.html
npm run tts talks/<本次>/output                     # 生成音频
npm run check talks/<本次>                          # 自检
```

---

## 健康检查

跑一遍下面这串，应该都通：

```bash
node -e "console.log('node ok')"
test -f _env/.env && echo "env ok" || echo "✗ 缺 .env"
test -f _voice/voice-id.txt && echo "voice ok" || echo "✗ 缺 voice-id"
ls _knowledge/past-decks/ | grep -v gitkeep | head -3
```
