import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const XLSX = require(path.join(__dirname, "../server/node_modules/xlsx"));

const TARGET_DATA_ROWS = 1000;
const SHEET_NAME = "物流数据";

const rootDir = path.resolve(__dirname, "..");
// 与 tools/update-logistics-workbooks.mjs 的 targetFiles 对齐（根目录双表 + 物流系统内主表）
const targets = [
  path.join(rootDir, "虚拟物流单号(3).xlsx"),
  path.join(rootDir, "虚拟物流单号(3)_加前后数据中心.xlsx"),
  path.join(rootDir, "物流系统", "虚拟物流单号(3)_加前后数据中心.xlsx"),
];

function parseDateTime(s) {
  const m = String(s ?? "").match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
  if (!m) return new Date();
  return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
}

function formatDateTime(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function addMs(d, ms) {
  return new Date(d.getTime() + ms);
}

function padRowsFromTemplate(rows) {
  const n0 = rows.length;
  if (n0 >= TARGET_DATA_ROWS) return rows;
  const out = rows.map((r) => ({ ...r }));
  for (let i = n0; i < TARGET_DATA_ROWS; i++) {
    const template = rows[i % n0];
    const cycle = Math.floor(i / n0);
    const row = { ...template };
    const seq = String(i + 1).padStart(4, "0");
    row["物流单号"] = `XSD2026${String(i + 1).padStart(6, "0")}`;
    row["订单来源平台"] = ["淘宝国际", "京东国际", "抖音商城"][i % 3];
    row["采购订单号"] = `PO-XSD-202604-${seq}`;
    row["批次号"] = `LOT-XSD-202604${String(i + 1).padStart(3, "0")}`;
    row["报关单号"] = `CUS-XSD-202604-${seq}`;

    const offsetMin = cycle * 97 + (i % 41) * 13;
    const t0 = parseDateTime(template["下单时间"]);
    const t1 = parseDateTime(template["抵达时间"] ?? template["下单时间"]);
    const tu = parseDateTime(template["温控更新时间"] ?? template["更新时间"] ?? template["下单时间"]);
    row["下单时间"] = formatDateTime(addMs(t0, offsetMin * 60 * 1000));
    row["抵达时间"] = formatDateTime(addMs(t1, offsetMin * 60 * 1000 + 36e5));
    row["温控更新时间"] = formatDateTime(addMs(tu, offsetMin * 60 * 1000));
    row["更新时间"] = formatDateTime(addMs(parseDateTime(template["更新时间"] ?? tu), offsetMin * 60 * 1000));

    out.push(row);
  }
  return out;
}

async function processFile(filePath) {
  let buf;
  try {
    buf = await fs.readFile(filePath);
  } catch {
    console.warn("skip missing:", filePath);
    return null;
  }
  const wb = XLSX.read(buf, { type: "buffer", cellDates: true });
  const sheet = wb.Sheets[SHEET_NAME] ?? wb.Sheets[wb.SheetNames[0]];
  if (!sheet) {
    console.warn("no sheet in", filePath);
    return null;
  }
  const headerMatrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  const headers = headerMatrix[0];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  const before = rows.length;
  const next = padRowsFromTemplate(rows);
  const aoa = [headers, ...next.map((row) => headers.map((h) => row[h] ?? ""))];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  wb.Sheets[SHEET_NAME] = ws;
  if (wb.SheetNames[0] !== SHEET_NAME) {
    const i = wb.SheetNames.indexOf(SHEET_NAME);
    if (i === -1) wb.SheetNames[0] = SHEET_NAME;
  }
  const out = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });
  try {
    await fs.writeFile(filePath, out);
    return { filePath, before, after: next.length };
  } catch (e) {
    if (e && e.code === "EBUSY") {
      const alt = filePath.replace(/\.xlsx$/i, "_1000条.xlsx");
      await fs.writeFile(alt, out);
      return { filePath, before, after: next.length, wroteInstead: alt, note: "原文件被占用(如 Excel 已打开)，已另存为" };
    }
    throw e;
  }
}

const results = [];
for (const p of targets) {
  const r = await processFile(p);
  if (r) results.push(r);
}
console.log(JSON.stringify({ targetDataRows: TARGET_DATA_ROWS, results }, null, 2));
