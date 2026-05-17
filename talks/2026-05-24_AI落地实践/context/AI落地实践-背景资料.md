# AI 落地实践 · 5.24 线下分享 — 背景资料

> 本文件汇总本次分享的素材来源、讲者背景与三个贯穿案例，供讲稿《AI落地实践-演讲稿.md》配套使用。

## 一、分享主题

**标题**：AI 落地实践：用 Vibe Coding 打造你的第 1–N 个产品
**时长**：约 40 分钟
**形式**：线下分享（5.24）
**主线**：沿「做出一个产品」的真实路径走一遍 —— 0→1，再到 1→N
**核心信念**：没有最好的工具，只有最适合你当下这一步的工具。

## 二、内容骨架来源

理论框架整理自北京大学《Agentic Coding：从 Vibe Coding 到超级个体的进化之路》（AI 肖睿团队，2026.02）。

讲稿从中提取的骨架：

- 编程革命的奇点时刻（2025.11，Claude Opus 4.6 / GPT-5.2）
- 编程演进史：手工 → IDE → Copilot → Agentic
- 四种编程范式：Copilot / Vibe Coding / SPEC Coding / Agentic Coding（未来：ID Coding）
- Vibe Coding 定义（Karpathy，Feel / Flow / Function，编程民主化）
- 开发者角色转变：Code Writer → Reviewer / Architect / Commander
- SPEC Coding：写给 AI 看的需求文档
- Agentic Coding：长程任务 + 自主闭环（Plan-Act-Observe-Fix）
- 工具五大阵营 + 选型四问
- 三大行业风险：性能断崖（私有库约 23%）、维护成本飙升（约 4 倍）、技能萎缩与合规
- 超级个体四大能力；从 How 回归 What 与 Why；"船票"收尾

## 三、讲者背景

- **讲者**：阿亮 · 一线 AI Agent 工程师 · vibe coding 实战派
- **品牌**：与智行 YuZhiXing —— AI 工程化训练营 · 大模型咨询落地
- **GitHub**：leonbuilds
- **方法论标识**：本地工作目录命名为 `auto-agentic-coding`；notchi 的 SPEC.md 作者栏署名「leon + AI 编排」—— 本人即「超级个体」实践样本，先写 SPEC、设检查点，再由 AI 编排执行。

## 四、三个贯穿案例

三个项目分别代表一个产品的三种状态：最小可用 / 从 0 到 1 / 从 1 到 N。

### 案例 1 · clip-shot —— 最小可用工具（0→1 最小样本）

- **定位**：macOS 菜单栏小工具，剪贴板图片 → 云端 → 直接给出 Markdown 链接
- **语言**：Swift（讲者并不熟悉的语言，因需求小而清晰，AI 快速跑通）
- **配套**：图床后端为另一仓库 img-oss（以 GitHub 仓库当图片存储）
- **仓库状态**：Private
- **在讲稿中的作用**：演示「为解决自己真实痛点造出第一个工具」，说明「需求小而明确时，陌生技术栈不再是门槛」
- **待讲者补充**：实际开发用时、所用工具（Cursor / Claude Code / Cowork）、上线与自用情况

### 案例 2 · notchi —— 从 0 到 1 的完整产品

- **定位**：macOS（Apple Silicon）Live2D 编程桌宠，住在刘海下方，被动可视化 AI 编程工具的 token 用量与会话状态
- **技术栈**：Tauri 2 + Rust + React 19 + TypeScript + Tailwind 4 + shadcn/ui + SQLite
- **数据源**：监听 Claude Code / Codex CLI / Claude Desktop 的本地 jsonl
- **三级信息层**：L1 宠物本体颜色 / L2 悬停胶囊横条 / L3 配置仪表盘
- **工程化亮点（SPEC.md，约 420 行）**：一句话定义、目标用户、核心价值、**「不做清单」**、v1→v2 路线图、**EARS 语法验收场景 S1–S19**、技术约束、技术栈决策、任务拆解到 PR 分支、变更记录
- **流程**：含 **2 个人工检查点**（确认范围 / 确认技术栈）；阶段 1/2/3 各为独立 `claude/phase-x` 分支
- **进度**：MVP 估算 7 天；102 次提交；v0.1.0 已发布（2026-05-08）；后续 v1.0→v2.x 路线图
- **踩坑记录**：`rusqlite` 与 `tauri-plugin-sql` 因底层均 `links="sqlite3"` 冲突，AI 做了取舍并记入 CHANGELOG
- **在讲稿中的作用**：演示「从念头 → 写 SPEC → 7 天 MVP → 发布」的完整 0→1；并作为 SPEC Coding 与 Agentic Coding 的现身说法

### 案例 3 · landr —— 从 1 到 N 的商业化旗舰

- **定位**：AI 求职 Agent，全链路：简历理解 → 岗位匹配 → 面试准备 → 智能投递
- **6 个 Agent 模块**：简历智能体、岗位智能体、匹配与重写、面试准备、申请追踪（7 列拖拽看板）、多 LLM 适配层
- **工程「脏活」**：JD 二次抓取（列表仅 18 字摘要时后台开 tab 抓详情页结构化数据）、Boss 直聘风控规避、多平台 JD 字段对齐
- **浏览器扩展**：Chrome MV3 扩展，把「打开 Boss 直聘 → 收集岗位」从人工约 30 分钟压到约 1 分钟
- **技术栈**：Next.js 16 + React 19 + TypeScript 5 + Tailwind v4 + shadcn/ui + Prisma + SQLite；6 个数据模型（User / Resume / Job / Application / SearchTask / JdFetchTask）
- **多 LLM 适配**：DeepSeek / Kimi / 通义千问 / OpenAI 任选；API Key 以 AES-256 加密存储；JWT 鉴权
- **测试与部署**：Vitest 26+ 单测 + Playwright e2e；PM2 + 阿里云 ECS（亦可 Vercel）
- **进度**：25 次提交、2 个进行中的 PR；含 AGENTS.md / CLAUDE.md / CHANGELOG.md
- **Roadmap**：明确区分「已完成 / 计划中 / 不做（明确）」；不做项包括自动打招呼/自动投递（风控红线）、帮 P 简历
- **项目自我定位**：与智行案例库旗舰开源项目 —— 用同一套「SPEC + 检查点 + Skills」工程方法论，把一个 vibe coding 想法做到上线、可维护、可商业化
- **在讲稿中的作用**：作为「从 1 到 N」的核心范本

## 五、案例 → 讲稿映射

| 讲稿位置 | 对应案例 |
|---|---|
| 开场自我介绍 | 阿亮 / 与智行 AI 工程化训练营 |
| 认知准备 · 我的视角 | `auto-agentic-coding` 目录、SPEC.md 署名「leon + AI 编排」 |
| 从 0→1 · 案例 A | clip-shot（解决自身痛点的最小工具） |
| 从 0→1 · 案例 B | notchi 的诞生（念头 → SPEC → 7 天 MVP → v0.1.0） |
| 从 1→N · 武器一 SPEC Coding | notchi 的 SPEC.md 现身说法 |
| 从 1→N · 武器二 Agentic Coding | notchi 的人工检查点 + PR 分支拆解 |
| 从 1→N · 核心案例 | landr（商业化旗舰） |
| 工具与避坑 · 真实踩坑 | notchi 的依赖冲突、landr 的工程脏活、资产授权/陌生语言 |
| 超级个体 · 我的判断 | 一人同时推进 Rust / TypeScript / Swift 三个项目 |

## 六、待讲者补充的真实数据

填上以下数据可显著增强现场说服力：

- clip-shot：开发用时、所用工具、上线与自用情况
- notchi：从念头到 v0.1.0 的真实周期、实际投入
- landr：累计投入时间、是否有真实用户反馈
- 与智行训练营：累计带过多少学员（可用于开场）

---

*素材来源：北京大学《Agentic Coding：从 Vibe Coding 到超级个体的进化之路》；GitHub leonbuilds 的 notchi、landr、img-oss 公开仓库及 notchi/SPEC.md。clip-shot、ship-yard 为私有仓库，clip-shot 仅依据其公开描述整理。*
