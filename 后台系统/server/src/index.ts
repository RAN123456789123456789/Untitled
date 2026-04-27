import express from "express";
import cors from "cors";
import { z } from "zod";
import fs from "node:fs";
import path from "node:path";

type ShipmentRow = Record<string, unknown>;

const KEY = {
  orderNo: "物流单号",
  status: "状态",
  stayDays: "滞留时长",
  exceptionType: "异常类型",
} as const;

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

const LOGISTICS_API = process.env.LOGISTICS_API || "http://localhost:5179";
const PORT = Number(process.env.PORT || 5189);
/** 物流 API 单次最大 limit，与 server 中 QuerySchema 上限一致；分页拉全量保证与物流看板数据一一对应 */
const PAGE_SIZE = Number(process.env.LOGISTICS_PAGE_SIZE || 5000);
const INTERVAL_MS = Number(process.env.INTERVAL_MS || 10_000);
const BASE_PROBLEM_COUNT = 100;
const INCREMENT_PROBLEM_COUNT = 15;
const PER_TYPE_MIN = 3;
const PER_TYPE_MAX = 5;

const dataDir = path.resolve(process.cwd(), "data");
const problemsPath = path.join(dataDir, "problem_orders.json");
fs.mkdirSync(dataDir, { recursive: true });

function loadProblems(): ShipmentRow[] {
  if (!fs.existsSync(problemsPath)) return [];
  try {
    const raw = fs.readFileSync(problemsPath, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ShipmentRow[]) : [];
  } catch {
    return [];
  }
}

function saveProblems(rows: ShipmentRow[]) {
  fs.writeFileSync(problemsPath, JSON.stringify(rows, null, 2), "utf-8");
}

function parseStayDays(value: unknown): number {
  const text = String(value ?? "").trim();
  const matched = text.match(/(\d+)\s*天/);
  if (!matched) return 0;
  const days = Number(matched[1]);
  return Number.isFinite(days) ? days : 0;
}

function isProblem(row: ShipmentRow): boolean {
  const explicit = String(row[KEY.exceptionType] ?? "").trim();
  if (explicit && explicit !== "正常履约") return true;

  const status = String(row[KEY.status] ?? "").trim();
  if (/异常|问题|退回|拦截|破损|丢失|失败|拒收/i.test(status)) return true;

  return parseStayDays(row[KEY.stayDays]) >= 5;
}

function getOrderNo(row: ShipmentRow): string {
  return String(row[KEY.orderNo] ?? "").trim();
}

type ProblemType = "A" | "B" | "C" | "D" | "OTHER";

function detectProblemType(row: ShipmentRow): ProblemType {
  const exceptionType = String(row[KEY.exceptionType] ?? "").trim();
  if (/^A类/i.test(exceptionType) || /未发货|未揽收/.test(exceptionType)) return "A";
  if (/^B类/i.test(exceptionType) || /运输异常|滞留|温控|断链/.test(exceptionType)) return "B";
  if (/^C类/i.test(exceptionType) || /客诉|投诉/.test(exceptionType)) return "C";
  if (/^D类/i.test(exceptionType) || /重复异常|多轮/.test(exceptionType)) return "D";

  const status = String(row[KEY.status] ?? "").trim();
  if (/未发货|未揽收/.test(status)) return "A";
  if (/客诉|投诉/.test(status)) return "C";
  if (/重复|多轮/.test(status)) return "D";
  return "B";
}

function pickRowsByRules(candidates: ShipmentRow[], target: number): ShipmentRow[] {
  const seen = new Set<string>();
  const deduped = candidates.filter((row) => {
    const orderNo = getOrderNo(row);
    if (!orderNo || seen.has(orderNo)) return false;
    seen.add(orderNo);
    return true;
  });

  const groups = new Map<ProblemType, ShipmentRow[]>();
  for (const row of deduped) {
    const type = detectProblemType(row);
    const list = groups.get(type) ?? [];
    list.push(row);
    groups.set(type, list);
  }

  const orderedTypes: ProblemType[] = ["A", "B", "C", "D", "OTHER"];
  const availableTypes = orderedTypes.filter((type) => (groups.get(type)?.length ?? 0) > 0);
  if (availableTypes.length === 0) return [];

  const picks: ShipmentRow[] = [];
  const pickSet = new Set<string>();
  const pickCountByType = new Map<ProblemType, number>();

  // 第一轮：每种问题优先补到至少 3 条（在总量允许范围内）
  let remaining = target;
  for (let i = 0; i < availableTypes.length && remaining > 0; i += 1) {
    const type = availableTypes[i];
    const rows = groups.get(type) ?? [];
    const reserveForOthers = Math.max(0, (availableTypes.length - i - 1) * PER_TYPE_MIN);
    const maxCanTake = Math.max(0, remaining - reserveForOthers);
    const need = Math.min(PER_TYPE_MIN, rows.length, maxCanTake);
    for (let n = 0; n < need; n += 1) {
      const row = rows.shift();
      if (!row) break;
      const orderNo = getOrderNo(row);
      if (!orderNo || pickSet.has(orderNo)) continue;
      picks.push(row);
      pickSet.add(orderNo);
      pickCountByType.set(type, (pickCountByType.get(type) ?? 0) + 1);
      remaining -= 1;
      if (remaining <= 0) break;
    }
  }

  // 第二轮：继续补到每种最多 5 条，直到达到 target
  while (remaining > 0) {
    let progressed = false;
    for (const type of availableTypes) {
      if (remaining <= 0) break;
      const current = pickCountByType.get(type) ?? 0;
      if (current >= PER_TYPE_MAX) continue;
      const rows = groups.get(type) ?? [];
      const row = rows.shift();
      if (!row) continue;
      const orderNo = getOrderNo(row);
      if (!orderNo || pickSet.has(orderNo)) continue;
      picks.push(row);
      pickSet.add(orderNo);
      pickCountByType.set(type, current + 1);
      remaining -= 1;
      progressed = true;
    }
    if (!progressed) break;
  }

  // 兜底：类型分布不够时，用剩余问题件补满目标值
  if (remaining > 0) {
    for (const row of deduped) {
      if (remaining <= 0) break;
      const orderNo = getOrderNo(row);
      if (!orderNo || pickSet.has(orderNo)) continue;
      picks.push(row);
      pickSet.add(orderNo);
      remaining -= 1;
    }
  }

  return picks;
}

async function fetchShipmentsPage(offset: number, limit: number) {
  const url = new URL("/api/shipments", LOGISTICS_API);
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("limit", String(limit));
  const res = await fetch(url);
  if (!res.ok) throw new Error(`logistics api http ${res.status}`);
  return (await res.json()) as { total: number; data: ShipmentRow[] };
}

async function fetchAllShipments(): Promise<{ total: number; data: ShipmentRow[] }> {
  const limit = Math.min(5000, Math.max(1, PAGE_SIZE));
  let offset = 0;
  const data: ShipmentRow[] = [];
  let total = 0;

  for (;;) {
    const page = await fetchShipmentsPage(offset, limit);
    total = page.total;
    data.push(...page.data);
    if (page.data.length === 0) break;
    offset += page.data.length;
    if (data.length >= total) break;
  }

  return { total, data };
}

let syncState = {
  running: false,
  lastRunAt: null as string | null,
  lastError: null as string | null,
  scanned: 0,
  found: 0,
};

async function resetProblemsFromLatest() {
  const page = await fetchAllShipments();
  const allProblems = page.data.filter((row) => isProblem(row));
  const resetRows = pickRowsByRules(allProblems, BASE_PROBLEM_COUNT);
  saveProblems(resetRows);
  syncState.scanned = page.data.length;
  syncState.found = resetRows.length;
}

async function runOneBatch() {
  if (syncState.running) return;
  syncState.running = true;
  syncState.lastError = null;

  try {
    const page = await fetchAllShipments();
    const allProblems = page.data.filter((row) => isProblem(row));
    const existing = loadProblems();
    const existingOrderNos = new Set(existing.map((row) => getOrderNo(row)).filter(Boolean));
    const incrementalPool = allProblems.filter((row) => !existingOrderNos.has(getOrderNo(row)));
    const additions = pickRowsByRules(incrementalPool, INCREMENT_PROBLEM_COUNT);
    const nextProblems = [...existing, ...additions];

    saveProblems(nextProblems);
    syncState.scanned = page.data.length;
    syncState.found = additions.length;
    syncState.lastRunAt = new Date().toISOString();
  } catch (error) {
    syncState.lastError = error instanceof Error ? error.message : String(error);
    syncState.lastRunAt = new Date().toISOString();
  } finally {
    syncState.running = false;
  }
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/state", (_req, res) => {
  res.json({
    ...syncState,
    config: {
      LOGISTICS_API,
      PORT,
      PAGE_SIZE,
      INTERVAL_MS,
      BASE_PROBLEM_COUNT,
      INCREMENT_PROBLEM_COUNT,
      PER_TYPE_MIN,
      PER_TYPE_MAX,
    },
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
    rows = rows.filter((row) => String(row[KEY.status] ?? "") === status.trim());
  }

  if (q && q.trim()) {
    const needle = q.trim();
    rows = rows.filter((row) => JSON.stringify(row).includes(needle));
  }

  res.json({ total: rows.length, data: rows });
});

app.get("/api/problems-meta", (_req, res) => {
  const rows = loadProblems();
  const statuses = Array.from(new Set(rows.map((row) => String(row[KEY.status] ?? "")).filter(Boolean))).sort();
  res.json({ statuses });
});

app.post("/api/run", async (_req, res) => {
  await runOneBatch();
  res.json({ ok: true });
});

app.post("/api/reset", async (_req, res) => {
  if (syncState.running) return res.status(409).json({ error: "busy" });
  syncState.running = true;
  syncState.lastError = null;
  try {
    await resetProblemsFromLatest();
    syncState.lastRunAt = new Date().toISOString();
    res.json({ ok: true });
  } catch (error) {
    syncState.lastError = error instanceof Error ? error.message : String(error);
    syncState.lastRunAt = new Date().toISOString();
    res.status(500).json({ error: "reset_failed", message: syncState.lastError });
  } finally {
    syncState.running = false;
  }
});

void resetProblemsFromLatest();
setInterval(() => void runOneBatch(), INTERVAL_MS);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Admin API listening on http://localhost:${PORT}`);
});
