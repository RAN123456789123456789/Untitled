import express from "express";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { readShipmentsFromExcel } from "./shipments";
import { createUpdateEngine } from "./updateData";

type ShipmentRow = Record<string, unknown>;

const KEY = {
  orderNo: "\u7269\u6d41\u5355\u53f7",
  status: "\u72b6\u6001",
  currentCenter: "\u5f53\u524d\u4f4d\u7f6e",
  prevCenter: "\u4e0a\u4e2a\u6570\u636e\u4e2d\u5fc3",
  nextCenter: "\u4e0b\u4e2a\u6570\u636e\u4e2d\u5fc3",
  product: "\u5546\u54c1\u4fe1\u606f",
  receiver: "\u6536\u8d27\u4eba\u4fe1\u606f",
  phone: "\u8054\u7cfb\u7535\u8bdd",
  address: "\u6536\u8d27\u5730\u5740",
  track: "\u7269\u6d41\u8f68\u8ff9",
} as const;

const QuerySchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
  location: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(5000).optional().default(500),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

function asString(v: unknown): string {
  if (v == null) return "";
  return String(v);
}

function resolveExcelPath(): string {
  const name1 = "\u865a\u62df\u7269\u6d41\u5355\u53f7(3)_\u52a0\u524d\u540e\u6570\u636e\u4e2d\u5fc3.xlsx";
  const name2 = "\u865a\u62df\u7269\u6d41\u5355\u53f7(3).xlsx";

  const candidates = [
    path.resolve(process.cwd(), "..", name1),
    path.resolve(process.cwd(), "..", "\u7269\u6d41\u7cfb\u7edf", name1),
    path.resolve(process.cwd(), "..", name2),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  return candidates[0];
}

const app = express();
app.use(cors());

const excelPath = resolveExcelPath();
const baselineRows = readShipmentsFromExcel(excelPath);
const engine = createUpdateEngine({ baseline: baselineRows });
engine.start();

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/shipments", (req, res) => {
  const parsed = QuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_query", details: parsed.error.flatten() });
  }

  const { q, status, location, limit, offset } = parsed.data;
  const rows = engine.getCurrent();
  let filtered: ShipmentRow[] = rows;

  if (q && q.trim()) {
    const needle = q.trim();
    filtered = filtered.filter((row) =>
      [
        row[KEY.orderNo],
        row[KEY.product],
        row[KEY.receiver],
        row[KEY.phone],
        row[KEY.address],
        row[KEY.track],
        row[KEY.status],
        row[KEY.currentCenter],
        row[KEY.prevCenter],
        row[KEY.nextCenter],
      ]
        .filter(Boolean)
        .some((v) => String(v).includes(needle)),
    );
  }

  if (status && status.trim()) {
    const expected = status.trim();
    filtered = filtered.filter((row) => String(row[KEY.status] ?? "") === expected);
  }

  if (location && location.trim()) {
    const expected = location.trim();
    filtered = filtered.filter((row) => String(row[KEY.currentCenter] ?? "") === expected);
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
  const rows = engine.getCurrent();
  const statuses = Array.from(new Set(rows.map((row) => asString(row[KEY.status]).trim()).filter(Boolean))).sort();
  const locations = Array.from(new Set(rows.map((row) => asString(row[KEY.currentCenter]).trim()).filter(Boolean))).sort();
  res.json({ statuses, locations });
});

app.get("/api/update-data/state", (_req, res) => {
  res.json(engine.state);
});

app.post("/api/update-data/start", (_req, res) => {
  engine.start();
  res.json({ ok: true, state: engine.state });
});

app.post("/api/update-data/stop", (_req, res) => {
  engine.stop();
  res.json({ ok: true, state: engine.state });
});

app.post("/api/update-data/reset", (_req, res) => {
  engine.reset();
  res.json({ ok: true, state: engine.state });
});

app.post("/api/update-data/tick", (_req, res) => {
  engine.applyOneTick();
  res.json({ ok: true, state: engine.state });
});

const port = Number(process.env.PORT || 5179);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}`);
});
