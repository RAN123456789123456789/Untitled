import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const sourcePath = path.join(rootDir, "tmp_excel_source.json");
const outputDir = path.join(rootDir, "outputs", "logistics-sync");

const targetFiles = [
  path.join(rootDir, "虚拟物流单号(3).xlsx"),
  path.join(rootDir, "虚拟物流单号(3)_加前后数据中心.xlsx"),
  path.join(rootDir, "物流系统", "虚拟物流单号(3)_加前后数据中心.xlsx"),
];

const products = [
  {
    name: "加拿大波士顿龙虾",
    spec: "500-600g/只",
    salesPrice: 398,
    purchasePrice: 248,
    quantity: 2,
    supplier: "Nova Scotia Premium Lobster Co.",
    origin: "加拿大·新斯科舍省",
    baseTemp: 2.6,
  },
  {
    name: "加拿大波士顿龙虾",
    spec: "650-750g/只",
    salesPrice: 568,
    purchasePrice: 356,
    quantity: 2,
    supplier: "Atlantic Fresh Seafood Ltd.",
    origin: "加拿大·新不伦瑞克省",
    baseTemp: 2.9,
  },
  {
    name: "阿拉斯加帝王蟹",
    spec: "1.2-1.5kg/盒",
    salesPrice: 888,
    purchasePrice: 612,
    quantity: 1,
    supplier: "Alaska King Crab Reserve",
    origin: "美国·阿拉斯加州",
    baseTemp: 1.8,
  },
  {
    name: "阿拉斯加帝王蟹",
    spec: "1.8-2.1kg/盒",
    salesPrice: 1298,
    purchasePrice: 908,
    quantity: 1,
    supplier: "Bering Sea Cold Chain Inc.",
    origin: "美国·阿拉斯加州",
    baseTemp: 1.6,
  },
  {
    name: "加拿大熟冻龙虾尾",
    spec: "300g*4盒",
    salesPrice: 458,
    purchasePrice: 278,
    quantity: 1,
    supplier: "Maritime Cold Ocean Foods",
    origin: "加拿大·爱德华王子岛",
    baseTemp: 3.2,
  },
  {
    name: "阿拉斯加雪蟹腿",
    spec: "1kg/盒",
    salesPrice: 628,
    purchasePrice: 402,
    quantity: 1,
    supplier: "North Pacific Frozen Seafoods",
    origin: "美国·阿拉斯加州",
    baseTemp: 2.2,
  },
];

const platforms = ["淘宝国际", "京东国际", "抖音商城"];
const normalSuggestions = [
  "维持当前巡检频率，继续跟踪冷链温度与到仓时效。",
  "链路稳定，保持系统自动放行，无需人工介入。",
  "建议维持 30 分钟巡检节奏，关注末端签收表现。",
];

const routeTemplates = [
  ["上海浦东机场海关监管仓", "上海洋山保税冷库", "南京江宁冷链物流港", "苏州相城冷链中转场", "北京顺义生鲜前置仓"],
  ["广州白云机场口岸冷库", "广州南沙保税冷库", "长沙雨花冷链分拨中心", "武汉东西湖冷链中转场", "郑州航空港生鲜前置仓"],
  ["青岛胶东机场海关监管仓", "青岛上合保税冷库", "济南历城冷链分拨中心", "天津武清冷链中转场", "北京大兴生鲜前置仓"],
  ["深圳宝安机场口岸冷库", "深圳盐田保税冷库", "东莞虎门冷链分拨中心", "南昌向塘冷链中转场", "杭州钱塘生鲜前置仓"],
];

const columns = [
  "物流单号",
  "订单来源平台",
  "商品信息",
  "商品规格",
  "收货人信息",
  "联系电话",
  "收货地址",
  "价格",
  "采购价",
  "采购数量",
  "采购订单号",
  "批次号",
  "供应商名称",
  "原产地",
  "报关单号",
  "清关状态",
  "下单时间",
  "物流轨迹",
  "状态",
  "当前位置",
  "抵达时间",
  "滞留时长",
  "上个数据中心",
  "下个数据中心",
  "当前温度(℃)",
  "温控状态",
  "温控更新时间",
  "客诉状态",
  "客诉内容",
  "客诉情绪",
  "异常类型",
  "处理等级",
  "优先级",
  "工单状态",
  "责任人",
  "AI风险判断",
  "AI建议",
  "更新时间",
];

function formatDateTime(input) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function addHours(input, hours) {
  const base = new Date(input);
  return new Date(base.getTime() + hours * 60 * 60 * 1000);
}

function parseStayDays(value) {
  const text = String(value ?? "").trim();
  const matched = text.match(/(\d+)\s*天/);
  if (!matched) return 0;
  const days = Number(matched[1]);
  return Number.isFinite(days) ? days : 0;
}

function detectCategory(status, stayDays, index) {
  if (status === "未发货" || status === "未揽收") return "A类 未发货/未揽收";
  if (stayDays >= 7 || index % 19 === 0) return "D类 重复异常";
  if (stayDays >= 5 && index % 3 === 0) return "C类 客诉预警";
  if (stayDays >= 5) return "B类 运输异常";
  return "正常履约";
}

function buildRoute(address, index) {
  const template = routeTemplates[index % routeTemplates.length];
  return [...template, address];
}

function resolveCurrentIndex(rawStatus, category, index) {
  if (rawStatus === "未发货") return 0;
  if (rawStatus === "未揽收") return 1;
  if (category === "D类 重复异常") return 2 + (index % 2);
  if (category === "C类 客诉预警") return 3;
  if (category === "B类 运输异常") return 2 + (index % 2);
  return 3 + (index % 2);
}

function buildBusinessFields(category, item, index, rawStatus, stayDays, arrivedAt) {
  const inspectionAt = formatDateTime(addHours(arrivedAt, (index % 3) + 1));

  if (category === "A类 未发货/未揽收") {
    return {
      logisticsStatus: rawStatus,
      customsStatus: index % 2 === 0 ? "已放行" : "待放行",
      temperature: item.baseTemp.toFixed(1),
      temperatureStatus: "正常",
      complaintStatus: "无客诉",
      complaintContent: "",
      complaintEmotion: "无",
      handlingLevel: "L1 全自动",
      priority: "P3",
      workOrderStatus: rawStatus === "未发货" ? "待商家处理" : "待物流揽收核查",
      owner: rawStatus === "未发货" ? "商家运营组" : "物流对接人",
      aiRisk: "揽收超时风险 0.64，建议优先催发货并复核面单状态。",
      aiSuggestion: "自动生成催发货工单，并在 30 分钟后触发二次巡检。",
      updatedAt: inspectionAt,
    };
  }

  if (category === "B类 运输异常") {
    return {
      logisticsStatus: "运输异常",
      customsStatus: index % 2 === 0 ? "查验中" : "已放行",
      temperature: (item.baseTemp + 3.9 + (index % 2) * 0.6).toFixed(1),
      temperatureStatus: index % 2 === 0 ? "预警" : "异常",
      complaintStatus: "无客诉",
      complaintContent: "",
      complaintEmotion: "无",
      handlingLevel: "L2 人机协同",
      priority: item.salesPrice >= 800 ? "P1" : "P2",
      workOrderStatus: "待物流核查",
      owner: "冷链调度专员",
      aiRisk: "滞留/断链风险 0.78，建议排查转运中心拥堵与温控波动。",
      aiSuggestion: "触发双人背对背核查，并优先协调最近冷链车次改配。",
      updatedAt: inspectionAt,
    };
  }

  if (category === "C类 客诉预警") {
    return {
      logisticsStatus: "运输异常",
      customsStatus: "已放行",
      temperature: (item.baseTemp + 2.6).toFixed(1),
      temperatureStatus: "预警",
      complaintStatus: "已投诉",
      complaintContent:
        index % 2 === 0 ? "客户反馈预约宴请时段即将开始，担心帝王蟹品质下降。" : "客户连续来电催单，担心波龙因滞留影响鲜活度。",
      complaintEmotion: index % 2 === 0 ? "普通询问" : "极度愤怒",
      handlingLevel: "L2 人机协同",
      priority: "P1",
      workOrderStatus: "客服安抚中",
      owner: "客服安抚专员",
      aiRisk: "客诉升级风险 0.86，建议先安抚后补偿，并同步冷链异常核查。",
      aiSuggestion: "调用 LLM 生成安抚话术，优先安排客服回呼并给出补偿建议。",
      updatedAt: inspectionAt,
    };
  }

  if (category === "D类 重复异常") {
    return {
      logisticsStatus: "运输异常",
      customsStatus: index % 2 === 0 ? "补充材料中" : "已放行",
      temperature: (item.baseTemp + 5.2 + (index % 2) * 0.5).toFixed(1),
      temperatureStatus: "异常",
      complaintStatus: "已投诉",
      complaintContent: "订单已连续多轮异常，客户要求升级处理并确认是否需要退款。",
      complaintEmotion: "极度愤怒",
      handlingLevel: "L3 人工复核",
      priority: "P0",
      workOrderStatus: "待人工复核",
      owner: "风险复核专员",
      aiRisk: "重复异常/死亡风险 0.93，建议立即升级人工介入并冻结后续履约动作。",
      aiSuggestion: "汇总历史异常工单，转交风控负责人进行专项复核与责任判定。",
      updatedAt: inspectionAt,
    };
  }

  return {
    logisticsStatus: "运输中",
    customsStatus: "已放行",
    temperature: (item.baseTemp + ((index % 4) - 1) * 0.3).toFixed(1),
    temperatureStatus: "正常",
    complaintStatus: "无客诉",
    complaintContent: "",
    complaintEmotion: "无",
    handlingLevel: "自动通过",
    priority: "P4",
    workOrderStatus: "巡检通过",
    owner: "系统自动巡检",
    aiRisk: "风险低于阈值，链路稳定。",
    aiSuggestion: normalSuggestions[index % normalSuggestions.length],
    updatedAt: inspectionAt,
  };
}

function transformRow(raw, index) {
  const item = products[index % products.length];
  const stayDays = parseStayDays(raw["滞留时长"]);
  const rawStatus = String(raw["状态"] ?? "运输中");
  const category = detectCategory(rawStatus, stayDays, index);
  const route = buildRoute(String(raw["收货地址"] ?? ""), index);
  const currentIndex = Math.min(route.length - 2, resolveCurrentIndex(rawStatus, category, index));
  const prevCenter = currentIndex > 0 ? route[currentIndex - 1] : "";
  const currentCenter = route[currentIndex];
  const nextCenter = route[currentIndex + 1] ?? "";
  const orderTime = raw["下单时间"] ?? raw["抵达时间"] ?? new Date().toISOString();
  const arrivedAt = raw["抵达时间"] ?? addHours(orderTime, 30 + index);
  const fields = buildBusinessFields(category, item, index, rawStatus, stayDays, arrivedAt);
  const customsSeq = String(index + 1).padStart(4, "0");

  return {
    物流单号: String(raw["物流单号"] ?? `XD${String(index + 1).padStart(8, "0")}`),
    订单来源平台: platforms[index % platforms.length],
    商品信息: item.name,
    商品规格: item.spec,
    收货人信息: String(raw["收货人信息"] ?? ""),
    联系电话: String(raw["联系电话"] ?? ""),
    收货地址: String(raw["收货地址"] ?? ""),
    价格: item.salesPrice + (index % 3) * 20,
    采购价: item.purchasePrice + (index % 2) * 15,
    采购数量: item.quantity + (index % 2 === 0 && item.quantity === 1 ? 1 : 0),
    采购订单号: `PO-XSD-202604-${customsSeq}`,
    批次号: `LOT-XSD-${202604}${String(index + 1).padStart(3, "0")}`,
    供应商名称: item.supplier,
    原产地: item.origin,
    报关单号: `CUS-XSD-202604-${customsSeq}`,
    清关状态: fields.customsStatus,
    下单时间: formatDateTime(orderTime),
    物流轨迹: route.join(" → "),
    状态: fields.logisticsStatus,
    当前位置: currentCenter,
    抵达时间: formatDateTime(arrivedAt),
    滞留时长: String(raw["滞留时长"] ?? "0天"),
    上个数据中心: prevCenter,
    下个数据中心: nextCenter,
    "当前温度(℃)": Number(fields.temperature),
    温控状态: fields.temperatureStatus,
    温控更新时间: fields.updatedAt,
    客诉状态: fields.complaintStatus,
    客诉内容: fields.complaintContent,
    客诉情绪: fields.complaintEmotion,
    异常类型: category,
    处理等级: fields.handlingLevel,
    优先级: fields.priority,
    工单状态: fields.workOrderStatus,
    责任人: fields.owner,
    AI风险判断: fields.aiRisk,
    AI建议: fields.aiSuggestion,
    更新时间: fields.updatedAt,
  };
}

function columnLetter(index) {
  let value = index + 1;
  let letter = "";
  while (value > 0) {
    const mod = (value - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    value = Math.floor((value - 1) / 26);
  }
  return letter;
}

async function buildWorkbook(rows) {
  const workbook = Workbook.create();
  const sheet = workbook.worksheets.add("物流数据");
  const matrix = [columns, ...rows.map((row) => columns.map((column) => row[column] ?? ""))];
  const endCell = `${columnLetter(columns.length - 1)}${matrix.length}`;
  sheet.getRange(`A1:${endCell}`).values = matrix;
  sheet.freezePanes.freezeRows(1);
  sheet.showGridLines = false;

  sheet.getRange(`A1:${columnLetter(columns.length - 1)}1`).format = {
    fill: "#0F4C81",
    font: { bold: true, color: "#FFFFFF" },
    horizontalAlignment: "center",
    verticalAlignment: "center",
  };

  sheet.getRange(`A2:${endCell}`).format.wrapText = true;
  sheet.getRange(`A2:A${matrix.length}`).format.numberFormat = "@";
  sheet.getRange(`G2:G${matrix.length}`).format.columnWidthPx = 260;
  sheet.getRange(`R2:R${matrix.length}`).format.columnWidthPx = 420;
  sheet.getRange(`AC2:AC${matrix.length}`).format.columnWidthPx = 200;
  sheet.getRange(`AJ2:AJ${matrix.length}`).format.columnWidthPx = 260;
  sheet.getRange(`AK2:AK${matrix.length}`).format.columnWidthPx = 340;
  sheet.getRange(`A1:${columnLetter(columns.length - 1)}${matrix.length}`).format.autofitColumns();
  sheet.getRange(`A1:${columnLetter(columns.length - 1)}${matrix.length}`).format.autofitRows();

  sheet.tables.add(`A1:${endCell}`, true, "LogisticsDataTable");
  return workbook;
}

async function main() {
  const rawRows = JSON.parse(await fs.readFile(sourcePath, "utf8"));
  const rows = rawRows.map(transformRow);
  const workbook = await buildWorkbook(rows);

  await fs.mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, "鲜时达跨境冷链物流数据.xlsx");
  const blob = await SpreadsheetFile.exportXlsx(workbook);
  await blob.save(outputPath);

  for (const targetFile of targetFiles) {
    await fs.copyFile(outputPath, targetFile);
  }

  console.log(JSON.stringify({ outputPath, targetFiles, rows: rows.length }, null, 2));
}

await main();
