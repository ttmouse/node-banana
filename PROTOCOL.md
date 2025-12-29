# Fractal Docs Protocol — V2 (For Human–AI Collaboration)

> Goal: **让 AI 能独立持续工作，而你只需要做“判断”与“方向控制”。**
> 目标：让 AI 在规则内自我维护结构，你只负责“是否正确”。

---

## 0. Bootstrapping (For Human) / 自引导指令
> 🚨 **AI 自启动指令**:
> "首先阅读 `PROTOCOL.md`。本项目使用 **Fractal Docs Protocol**。你作为纯逻辑执行引擎。
> **规则 1**: 在任何代码变更前，检查局部地图 (`.folder.md`) 和文件头。
> **规则 2**: 如果地图与地形（代码）不符，立即更新地图。"

## 1. Guiding Philosophy / 核心理念

1️⃣ **代码是真实世界，文档是地图。地图必须跟地形同步。**
2️⃣ **只同步真正会影响边界与协作的变化。**
3️⃣ **保持极简：能用 3 行表达的，就绝不写第 4 行。**

---

## 1. Scope — When These Rules Apply / 适用范围

这些规则只作用于：

* `src/` 里的核心业务与架构代码
* 对外暴露接口（API / Service / Adapter / Repository）

以下内容 **不强制**（但建议保留 `CLAUDE.md` 作为 AI 协作上下文）：

* 配置文件、脚本、临时代码
* `CLAUDE.md` (AI Context & Commands)
* 纯常量、简单工具函数、re‑export 文件

👉 目的：减少无意义维护，专注“影响系统协作的部分”。

---

## 2. Three Map Layers / 三层地图体系

### 2.1 Root README（宏观地图）

内容：

* 一句话定义项目
* 顶层目录结构（只到 1–2 层）
* 模块边界与角色
* 简短同步规则

> **Only update if boundaries or structure change.**
> 只有结构或边界变更时才更新。

---

### 2.2 `.folder.md`（局部地图）

只放在**有清晰职责的目录**（如 `app/`, `domain/`, `infra/`）。

模板（≤3 行描述 + 核心文件清单）：

```md
# Folder: <path>

> Trigger: Update when responsibilities or file list meaningfully change.
> 触发：当职责或关键文件列表发生“实质变化”时更新。

<Line1: responsibility / 职责>
<Line2: upstream/downstream boundary / 上下游边界>
<Line3: key invariant / 关键不变量>

## Core Files
- <fileA>: role EN / 职责 CN
- <fileB>: role EN / 职责 CN
```

👉 只列 **核心代码单元**；测试/配置/脚本可选。

---

### 2.3 File Header (In/Out/Pos) / 文件头三行

仅对“边界文件”强制（API、Service、Adapter、Repository）。

```ts
// [IN]: <deps EN> / <依赖>
// [OUT]: <exports EN> / <输出>
// [POS]: <role EN> / <在系统中的位置>
// Protocol: When updated, sync this header + parent .folder.md
// 协议：更新本文件时，同步本头注释与上级 .folder.md
```

> **If logic doesn’t change dependencies/exports/role — do NOT touch this header.**
> 若依赖/输出/职责没变，禁止修改头注释。

---

## 3. Update Workflow / 更新流程（必须按顺序）

1️⃣ 先完成代码
2️⃣ 若影响 IN/OUT/POS → 更新对应文件头
3️⃣ 若影响该目录职责/文件清单 → 更新 `.folder.md`
4️⃣ 若影响整体结构或边界 → 更新 `README.md`
5️⃣ 做一致性自检

---

## 4. Triggers — What Counts as “Meaningful Change”

下列情况才触发同步：

### ✔ 需要同步

* 新增/删除导出的接口
* 调整模块边界或职责
* 移动文件到不同层/目录
* 新增重要模块

### ✘ 不需要同步

* 重命名变量
* 格式化、重排
* 微小实现细节优化
* 不影响外部行为的重构

---

## 5. Language Rule / 语言规则

* **English is canonical.** 中文为解释。
* 若两种语言不一致 → 必须在同次改动中修正。

---

## 6. Consistency Checklist / 自检清单

* [ ] 改动是否影响边界？
* [ ] 若影响 → 文件头是否更新？
* [ ] 目录职责是否变化 → `.folder.md` 是否同步？
* [ ] 结构/模块边界是否变化 → README 是否同步？
* [ ] 是否写多了？能否更短？

---

## 7. Collaboration Principle / 协作原则

> You (human): 判断方向、决定边界。
> AI: 写代码、维护地图、保持一致性。

如果在执行中发现：

* 文档所述 ≠ 代码行为

AI 应优先：

1. 指出冲突（用最少字）
2. 假设“以代码为准”
3. 同步修文档

---

## Quick Start

> Follow this protocol. When starting a new task:
>
> 1. Scan affected scope only
> 2. Apply fractal updates
> 3. Keep everything minimal

> 开始任务时：
> 1）只扫描本次受影响范围
> 2）按层级同步
> 3）保持极简
