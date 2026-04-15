import express from "express";
import cors from "cors";
import path from "node:path";
import { z } from "zod";
import { readShipmentsFromExcel } from "./shipments";

const app = express();
app.use(cors());

const QuerySchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
  location: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(5000).optional().default(500),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/shipments", (req, res) => {
  const parsed = QuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_query", details: parsed.error.flatten() });
  }

  const { q, status, location, limit, offset } = parsed.data;
  const excelPath = path.resolve(process.cwd(), "..", "虚拟物流单号(3)_加前后数据中心.xlsx");

  const rows = readShipmentsFromExcel(excelPath);
  let filtered = rows;

  if (q && q.trim()) {
    const needle = q.trim();
    filtered = filtered.filter((r) =>
      [
        r["物流单号"],
        r["商品信息"],
        r["收货人信息"],
        r["联系电话"],
        r["收货地址"],
        r["物流轨迹"],
        r["状态"],
        r["当前位置"],
        r["上个数据中心"],
        r["下个数据中心"],
      ]
        .filter(Boolean)
        .some((v) => String(v).includes(needle)),
    );
  }
  if (status && status.trim()) {
    filtered = filtered.filter((r) => String(r["状态"] ?? "") === status.trim());
  }
  if (location && location.trim()) {
    filtered = filtered.filter((r) => String(r["当前位置"] ?? "") === location.trim());
  }

  const total = filtered.length;
  const page = filtered.slice(offset, offset + limit);

  res.json({
    total,
    limit,
    offset,
    data: page,
  });
});

app.get("/api/meta", (_req, res) => {
  const excelPath = path.resolve(process.cwd(), "..", "虚拟物流单号(3)_加前后数据中心.xlsx");
  const rows = readShipmentsFromExcel(excelPath);
  const statuses = Array.from(new Set(rows.map((r) => String(r["状态"] ?? "")).filter(Boolean))).sort();
  const locations = Array.from(new Set(rows.map((r) => String(r["当前位置"] ?? "")).filter(Boolean))).sort();
  res.json({ statuses, locations });
});

const port = Number(process.env.PORT || 5179);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}`);
});

