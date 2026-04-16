import express from "express";
import cors from "cors";
import { z } from "zod";
import fs from "node:fs";
import path from "node:path";

type ShipmentRow = Record<string, unknown>;

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

const LOGISTICS_API = process.env.LOGISTICS_API || "http://localhost:5179";
const PORT = Number(process.env.PORT || 5189);
const BATCH_SIZE = Number(process.env.BATCH_SIZE || 1000);
const INTERVAL_MS = Number(process.env.INTERVAL_MS || 10_000);

const dataDir = path.resolve(process.cwd(), "data");
const problemsPath = path.join(dataDir, "problem_orders.json");
fs.mkdirSync(dataDir, { recursive: true });

function loadProblems(): ShipmentRow[] {
  if (!fs.existsSync(problemsPath)) return [];
  try {
    const raw = fs.readFileSync(problemsPath, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as ShipmentRow[];
    return [];
  } catch {
    return [];
  }
}

function saveProblems(rows: ShipmentRow[]) {
  fs.writeFileSync(problemsPath, JSON.stringify(rows, null, 2), "utf-8");
}

function getKey(r: ShipmentRow): string {
  const k = r["物流单号"];
  return k == null ? "" : String(k);
}

function parseStayDays(v: unknown): number | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  const m = s.match(/(\d+)\s*天/);
  if (!m) return 0;
  const days = Number(m[1]);
  return Number.isFinite(days) ? days : null;
}

// 规则：
// - 状态命中“异常/问题/退回/拦截/破损/丢失/失败/拒收”等 -> 问题件
// - 或者滞留时长 >= 5 天 -> 问题件
function isProblem(r: ShipmentRow): boolean {
  const s = (r["状态"] ?? "").toString();
  if (/异常|问题|退回|拦截|破损|丢失|失败|拒收/i.test(s)) return true;

  const stayDays = parseStayDays(r["滞留时长"]);
  if (stayDays != null && stayDays >= 5) return true;

  return false;
}

async function fetchShipmentsPage(offset: number, limit: number) {
  const url = new URL("/api/shipments", LOGISTICS_API);
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("limit", String(limit));
  const res = await fetch(url);
  if (!res.ok) throw new Error(`logistics api http ${res.status}`);
  return (await res.json()) as { total: number; data: ShipmentRow[] };
}

let syncState = {
  running: false,
  lastRunAt: null as string | null,
  lastError: null as string | null,
  scanned: 0,
  found: 0,
};

async function runOneBatch() {
  if (syncState.running) return;
  syncState.running = true;
  syncState.lastError = null;
  try {
    let offset = 0;
    let scanned = 0;
    let found = 0;

    // 这里按“从头扫描”做示例；真实 20 万数据建议加增量游标/更新时间字段
    // 每次最多扫描 BATCH_SIZE 条（你说的 1000）
    const page = await fetchShipmentsPage(offset, BATCH_SIZE);
    scanned += page.data.length;

    const nextProblems: ShipmentRow[] = [];
    for (const r of page.data) {
      if (!isProblem(r)) continue;
      nextProblems.push(r);
      found += 1;
    }

    // 这里做“回溯到当前真实数据内容”：每轮都重建问题件列表，避免无限累计
    saveProblems(nextProblems);

    syncState.scanned = scanned;
    syncState.found = found;
    syncState.lastRunAt = new Date().toISOString();
  } catch (e) {
    syncState.lastError = e instanceof Error ? e.message : String(e);
    syncState.lastRunAt = new Date().toISOString();
  } finally {
    syncState.running = false;
  }
}

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.get("/api/state", (_req, res) => {
  res.json({
    ...syncState,
    config: { LOGISTICS_API, PORT, BATCH_SIZE, INTERVAL_MS },
  });
});

app.get("/api/problems", (req, res) => {
  const Query = z.object({
    q: z.string().optional(),
    status: z.string().optional(),
  });
  const parsed = Query.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "bad_query" });

  const { q, status } = parsed.data;
  let rows = loadProblems();
  if (status && status.trim()) {
    const st = status.trim();
    rows = rows.filter((r) => String(r["状态"] ?? "") === st);
  }
  if (q && q.trim()) {
    const needle = q.trim();
    rows = rows.filter((r) => JSON.stringify(r).includes(needle));
  }
  res.json({ total: rows.length, data: rows });
});

app.get("/api/problems-meta", (_req, res) => {
  const rows = loadProblems();
  const statuses = Array.from(new Set(rows.map((r) => String(r["状态"] ?? "")).filter(Boolean))).sort();
  res.json({ statuses });
});

app.post("/api/run", async (_req, res) => {
  await runOneBatch();
  res.json({ ok: true });
});

void runOneBatch();
setInterval(() => void runOneBatch(), INTERVAL_MS);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Admin API listening on http://localhost:${PORT}`);
});

