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
