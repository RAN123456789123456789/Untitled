# 物流看板（React + Ant Design）

数据源：`虚拟物流单号(3)_加前后数据中心.xlsx`

## 目录结构

- `server/`：读取 Excel 并提供 JSON API
- `web/`：Ant Design 前端管理台

## 启动后端

在一个终端中：

```bash
cd server
npm i
npx tsx src/index.ts
```

默认端口：`5179`

接口：

- `GET /api/health`
- `GET /api/meta`
- `GET /api/shipments?q=...&status=...&location=...&limit=...&offset=...`

## 启动前端

在另一个终端中：

```bash
cd web
npm i
npm run dev
```

访问 Vite 提示的地址即可（前端已把 `/api` 代理到 `http://localhost:5179`）。

# rpa
在 物流系统/更新数据/ 新建了模块目录

物流系统/更新数据/config.json：控制 10秒更新、演示35秒、每次5个问题件等
物流系统/更新数据/README.md：说明用途
物流系统（根目录 server/）支持“实时更新 + 回溯到当前数据”

现在物流系统不再每次请求都重读Excel，而是：
启动时读取Excel作为 baseline（当前真实数据）
内存里维护 current（实时变化数据）
演示结束会 自动回溯 current → baseline
每10秒一次真实变化，且每次固定出现5个问题（滞留≥5天）

每轮会推进一部分订单的“物流中心相关字段”（当前位置/上下数据中心/轨迹/状态等）
同时固定注入 problemPerTick=5：把 5 单的 滞留时长 强制变成 5天，并把状态变为更直观的 “运输异常”
后台系统（后台系统/server）每10秒读取物流系统并实时更新

默认 INTERVAL_MS 已改成 10_000
每次同步会“重建问题件列表”，避免无限累计，确保 跟随物流系统变化实时变化（回溯友好）
后台系统前端（后台系统/web）提供 0→35 秒计时器

页面显示 演示计时：0 / 35 秒
并明确提示 后台每10秒自动刷新