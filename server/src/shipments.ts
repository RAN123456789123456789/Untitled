import fs from "node:fs";
import xlsx from "xlsx";

export type ShipmentRow = Record<string, unknown>;

function normalizeCell(v: unknown): unknown {
  if (v == null) return v;
  if (v instanceof Date) return v.toISOString().replace("T", " ").slice(0, 19);
  return v;
}

export function readShipmentsFromExcel(excelPath: string): ShipmentRow[] {
  if (!fs.existsSync(excelPath)) {
    throw new Error(`Excel not found: ${excelPath}`);
  }

  const wb = xlsx.readFile(excelPath, { cellDates: true });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const json = xlsx.utils.sheet_to_json<Record<string, unknown>>(ws, {
    defval: null,
    raw: false,
  });

  return json.map((r) => {
    const out: ShipmentRow = {};
    for (const [k, v] of Object.entries(r)) out[k] = normalizeCell(v);
    return out;
  });
}

