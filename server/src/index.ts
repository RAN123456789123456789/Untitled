import express from "express";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { readShipmentsFromExcel } from "./shipments";
import { createUpdateEngine } from "./updateData";
import { KEY, asString } from "./businessFields";

type ShipmentRow = Record<string, unknown>;

const QuerySchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
  location: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(5000).optional().default(500),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

function resolveExcelPath(): string {
  const fromEnv = String(process.env.EXCEL_FILE ?? process.env.EXCEL_PATH ?? "").trim();
  if (fromEnv) {
    const resolved = path.isAbsolute(fromEnv) ? fromEnv : path.resolve(process.cwd(), fromEnv);
    if (fs.existsSync(resolved)) return resolved;
  }

  const problemOrdersFile = path.resolve("C:/Users/ran/Desktop/有问题的订单数据.xlsx");
  if (fs.existsSync(problemOrdersFile)) return problemOrdersFile;

  const name1 = "\u865a\u62df\u7269\u6d41\u5355\u53f7(3)_\u52a0\u524d\u540e\u6570\u636e\u4e2d\u5fc3.xlsx";
  const name2 = "\u865a\u62df\u7269\u6d41\u5355\u53f7(3).xlsx";
  const sysDir = "\u7269\u6d41\u7cfb\u7edf";

  // 与 tools 中同步目标一致：优先使用「物流系统」目录下的主数据表，避免与根目录副本长期不一致
  const candidates = [
    path.resolve(process.cwd(), "..", sysDir, name1),
    path.resolve(process.cwd(), "..", name1),
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
// eslint-disable-next-line no-console
console.log(`[server] Excel baseline: ${excelPath}`);
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
        row[KEY.exceptionType],
        row[KEY.handlingLevel],
        row[KEY.priority],
        row[KEY.workOrderStatus],
        row[KEY.customsDeclarationNo],
        row[KEY.customsStatus],
        row[KEY.batchNo],
        row[KEY.supplier],
        row[KEY.temperatureStatus],
        row[KEY.complaintStatus],
        row[KEY.aiSuggestion],
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
