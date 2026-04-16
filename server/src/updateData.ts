import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { ShipmentRow } from "./shipments";

export type UpdateDataConfig = {
  intervalMs: number;
  demoDurationMs: number;
  problemPerTick: number;
  batchSize: number;
};

const DEFAULT_CONFIG: UpdateDataConfig = {
  intervalMs: 10_000,
  demoDurationMs: 0,
  problemPerTick: 5,
  batchSize: 1000,
};

const KEY = {
  orderNo: "\u7269\u6d41\u5355\u53f7",
  status: "\u72b6\u6001",
  currentCenter: "\u5f53\u524d\u4f4d\u7f6e",
  prevCenter: "\u4e0a\u4e2a\u6570\u636e\u4e2d\u5fc3",
  nextCenter: "\u4e0b\u4e2a\u6570\u636e\u4e2d\u5fc3",
  track: "\u7269\u6d41\u8f68\u8ff9",
  stayDays: "\u6ede\u7559\u65f6\u957f",
  updatedAt: "\u66f4\u65b0\u65f6\u95f4",
} as const;

const STATUS_POOL = [
  "\u8fd0\u8f93\u4e2d",
  "\u5df2\u5230\u7ad9",
  "\u5206\u62e3\u4e2d",
  "\u6d3e\u9001\u4e2d",
] as const;

const EXCEPTION_STATUS = "\u8fd0\u8f93\u5f02\u5e38";
const PROBLEM_STATUS_RE = /\u5f02\u5e38|\u95ee\u9898|\u62e6\u622a|\u9000\u56de|\u7834\u635f|\u4e22\u5931|\u5931\u8d25|\u62d2\u6536/i;
const TRACK_SPLIT_RE = /\s*(?:->|=>|\u2192|\u27a1)\s*/g;
const DAY_RE = /(\d+)\s*\u5929/;

function toFiniteInt(value: unknown, fallback: number, min = 0, max = Number.MAX_SAFE_INTEGER): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function readConfigFromLogisticsFolder(): UpdateDataConfig {
  try {
    const configPath = path.resolve(
      process.cwd(),
      "..",
      "\u7269\u6d41\u7cfb\u7edf",
      "\u66f4\u65b0\u6570\u636e",
      "config.json",
    );

    if (!fs.existsSync(configPath)) return DEFAULT_CONFIG;

    const raw = fs.readFileSync(configPath, "utf-8");
    const parsed = JSON.parse(raw) as Partial<UpdateDataConfig>;

    return {
      intervalMs: toFiniteInt(parsed.intervalMs, DEFAULT_CONFIG.intervalMs, 1000, 60_000),
      demoDurationMs: toFiniteInt(parsed.demoDurationMs, DEFAULT_CONFIG.demoDurationMs, 0, 24 * 60 * 60 * 1000),
      problemPerTick: toFiniteInt(parsed.problemPerTick, DEFAULT_CONFIG.problemPerTick, 0, 50),
      batchSize: toFiniteInt(parsed.batchSize, DEFAULT_CONFIG.batchSize, 1, 10_000),
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

function asString(v: unknown): string {
  if (v == null) return "";
  return String(v);
}

function splitTrack(track: unknown): string[] {
  const value = asString(track).trim();
  if (!value) return [];

  return value
    .split(TRACK_SPLIT_RE)
    .map((part) => part.trim())
    .filter(Boolean);
}

function joinTrack(parts: string[]): string {
  return parts.filter(Boolean).join(" -> ");
}

function pick<T>(arr: readonly T[]): T | undefined {
  if (arr.length === 0) return undefined;
  return arr[crypto.randomInt(0, arr.length)];
}

function pickDifferent(arr: readonly string[], current: string): string | undefined {
  const candidates = arr.filter((x) => x && x !== current);
  return pick(candidates);
}

function stableId(r: ShipmentRow): string {
  const orderNo = r[KEY.orderNo];
  if (orderNo != null && String(orderNo).trim()) return String(orderNo);
  return crypto.createHash("sha1").update(JSON.stringify(r)).digest("hex").slice(0, 12);
}

function parseStayDays(v: unknown): number | null {
  const text = asString(v).trim();
  if (!text) return null;
  const matched = text.match(DAY_RE);
  if (!matched) return null;

  const days = Number(matched[1]);
  if (!Number.isFinite(days)) return null;
  return Math.max(0, Math.floor(days));
}

function bumpStayDaysText(prev: unknown, targetDays: number): string {
  const safeDays = Math.max(0, targetDays);
  const base = asString(prev);

  if (DAY_RE.test(base)) {
    return base.replace(DAY_RE, `${safeDays}\u5929`);
  }

  return `${safeDays}\u5929`;
}

function raiseStayDaysText(prev: unknown, minDays: number): string {
  const current = parseStayDays(prev) ?? 0;
  return bumpStayDaysText(prev, Math.max(minDays, current));
}

function isProblemRow(row: ShipmentRow): boolean {
  const status = asString(row[KEY.status]).trim();
  if (PROBLEM_STATUS_RE.test(status)) return true;

  const stayDays = parseStayDays(row[KEY.stayDays]);
  return stayDays != null && stayDays >= 5;
}

function collectProblemIds(rows: ShipmentRow[]): Set<string> {
  const ids = new Set<string>();
  for (const row of rows) {
    if (isProblemRow(row)) ids.add(stableId(row));
  }
  return ids;
}

function formatDateTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function collectCenterPool(rows: ShipmentRow[]): string[] {
  const set = new Set<string>();

  for (const row of rows) {
    const direct = [row[KEY.currentCenter], row[KEY.prevCenter], row[KEY.nextCenter]];
    for (const item of direct) {
      const value = asString(item).trim();
      if (value) set.add(value);
    }

    for (const point of splitTrack(row[KEY.track])) {
      if (point) set.add(point);
    }
  }

  return Array.from(set);
}

function inferNextByTrack(track: string[], current: string): string | undefined {
  if (track.length === 0) return undefined;
  if (!current) return track[0];

  for (let i = track.length - 1; i >= 0; i -= 1) {
    if (track[i] === current) {
      if (i + 1 < track.length) return track[i + 1];
      return undefined;
    }
  }

  return undefined;
}

function appendTrackPoint(track: string[], value: string) {
  if (!value) return;
  if (track.length === 0 || track[track.length - 1] !== value) {
    track.push(value);
  }
}

export type UpdateEngineState = {
  running: boolean;
  startedAt: string | null;
  stoppedAt: string | null;
  lastTickAt: string | null;
  tick: number;
  injectedProblemsLastTick: number;
  config: UpdateDataConfig;
  autoStopAt: string | null;
};

export function createUpdateEngine(input: { baseline: ShipmentRow[] }) {
  const config = readConfigFromLogisticsFolder();

  let baseline = input.baseline.map((row) => ({ ...row }));
  let current = input.baseline.map((row) => ({ ...row }));
  let persistentProblemIds = collectProblemIds(current);

  let timer: NodeJS.Timeout | null = null;
  let autoStopTimer: NodeJS.Timeout | null = null;

  const state: UpdateEngineState = {
    running: false,
    startedAt: null,
    stoppedAt: null,
    lastTickAt: null,
    tick: 0,
    injectedProblemsLastTick: 0,
    config,
    autoStopAt: null,
  };

  function resetToBaseline() {
    current = baseline.map((row) => ({ ...row }));
    persistentProblemIds = collectProblemIds(current);
  }

  function setBaseline(nextBaseline: ShipmentRow[]) {
    baseline = nextBaseline.map((row) => ({ ...row }));
    resetToBaseline();
  }

  function getCurrent() {
    return current;
  }

  function applyOneTick() {
    const tickAt = new Date();
    const tickAtIso = tickAt.toISOString();
    const tickAtText = formatDateTime(tickAt);

    state.tick += 1;
    state.lastTickAt = tickAtIso;

    const centerPool = collectCenterPool(current);
    const updateCount = Math.min(60, current.length);

    for (let i = 0; i < updateCount; i += 1) {
      const row = pick(current);
      if (!row) break;
      const rowId = stableId(row);
      const wasProblem = persistentProblemIds.has(rowId) || isProblemRow(row);
      if (wasProblem) {
        persistentProblemIds.add(rowId);
      }

      const track = splitTrack(row[KEY.track]);
      const currentCenter = asString(row[KEY.currentCenter]).trim();
      const configuredNext = asString(row[KEY.nextCenter]).trim();

      if (track.length === 0 && currentCenter) {
        track.push(currentCenter);
      }

      let destination = configuredNext && configuredNext !== currentCenter ? configuredNext : undefined;
      if (!destination) {
        destination = inferNextByTrack(track, currentCenter);
      }
      if (!destination) {
        destination = pickDifferent(centerPool, currentCenter) ?? currentCenter;
      }

      if (destination && destination !== currentCenter) {
        appendTrackPoint(track, destination);
        if (currentCenter) {
          row[KEY.prevCenter] = currentCenter;
        }
        row[KEY.currentCenter] = destination;
      }

      const movedCenter = asString(row[KEY.currentCenter]).trim();
      const upcoming = inferNextByTrack(track, movedCenter) ?? pickDifferent(centerPool, movedCenter);
      if (upcoming) {
        row[KEY.nextCenter] = upcoming;
      }

      row[KEY.track] = joinTrack(track);
      if (wasProblem) {
        row[KEY.stayDays] = raiseStayDaysText(row[KEY.stayDays], 5);
        if (!PROBLEM_STATUS_RE.test(asString(row[KEY.status]))) {
          row[KEY.status] = EXCEPTION_STATUS;
        }
      } else {
        row[KEY.stayDays] = bumpStayDaysText(row[KEY.stayDays], crypto.randomInt(0, 4));
        row[KEY.status] = pick(STATUS_POOL) ?? row[KEY.status];
      }
      row[KEY.updatedAt] = tickAtText;
    }

    const injectedKeys = new Set<string>();
    let injected = 0;
    const maxInject = toFiniteInt(state.config.problemPerTick, 0, 0, 50);
    const nonProblemCandidates = current.filter((row) => {
      const key = stableId(row);
      if (injectedKeys.has(key)) return false;
      if (persistentProblemIds.has(key)) return false;
      if (isProblemRow(row)) return false;
      return true;
    });

    while (injected < maxInject && nonProblemCandidates.length > 0) {
      const idx = crypto.randomInt(0, nonProblemCandidates.length);
      const row = nonProblemCandidates.splice(idx, 1)[0];
      const key = stableId(row);

      if (injectedKeys.has(key)) continue;
      injectedKeys.add(key);

      row[KEY.stayDays] = raiseStayDaysText(row[KEY.stayDays], 5);
      if (!PROBLEM_STATUS_RE.test(asString(row[KEY.status]))) {
        row[KEY.status] = EXCEPTION_STATUS;
      }
      row[KEY.updatedAt] = tickAtText;

      persistentProblemIds.add(key);
      injected += 1;
    }

    state.injectedProblemsLastTick = injected;
  }

  function stopInternal() {
    if (timer) clearInterval(timer);
    timer = null;

    if (autoStopTimer) clearTimeout(autoStopTimer);
    autoStopTimer = null;

    state.running = false;
    state.stoppedAt = new Date().toISOString();
    state.autoStopAt = null;
  }

  function scheduleAutoStop() {
    if (autoStopTimer) clearTimeout(autoStopTimer);
    autoStopTimer = null;

    const duration = toFiniteInt(state.config.demoDurationMs, 0, 0, 24 * 60 * 60 * 1000);
    if (duration <= 0) {
      state.autoStopAt = null;
      return;
    }

    const autoStopAt = new Date(Date.now() + duration);
    state.autoStopAt = autoStopAt.toISOString();

    autoStopTimer = setTimeout(() => {
      stopInternal();
      resetToBaseline();
    }, duration);
  }

  function start() {
    if (state.running) return;

    state.running = true;
    state.startedAt = new Date().toISOString();
    state.stoppedAt = null;
    state.lastTickAt = null;
    state.tick = 0;
    state.injectedProblemsLastTick = 0;

    timer = setInterval(() => applyOneTick(), state.config.intervalMs);
    applyOneTick();
    scheduleAutoStop();
  }

  function stop() {
    stopInternal();
  }

  function reset() {
    stopInternal();
    resetToBaseline();
  }

  return {
    state,
    getCurrent,
    setBaseline,
    start,
    stop,
    reset,
    applyOneTick,
  };
}
