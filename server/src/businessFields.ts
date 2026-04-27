import type { ShipmentRow } from "./shipments";

export const KEY = {
  orderNo: "物流单号",
  status: "状态",
  currentCenter: "当前位置",
  prevCenter: "上个数据中心",
  nextCenter: "下个数据中心",
  product: "商品信息",
  receiver: "收货人信息",
  phone: "联系电话",
  address: "收货地址",
  price: "价格",
  orderTime: "下单时间",
  arrivalTime: "抵达时间",
  stayDays: "滞留时长",
  track: "物流轨迹",
  updatedAt: "更新时间",
  platform: "订单来源平台",
  productSpec: "商品规格",
  purchasePrice: "采购价",
  purchaseQuantity: "采购数量",
  purchaseOrderNo: "采购订单号",
  batchNo: "批次号",
  supplier: "供应商名称",
  origin: "原产地",
  customsDeclarationNo: "报关单号",
  customsStatus: "清关状态",
  currentTemp: "当前温度(℃)",
  temperatureStatus: "温控状态",
  temperatureUpdatedAt: "温控更新时间",
  complaintStatus: "客诉状态",
  complaintContent: "客诉内容",
  complaintEmotion: "客诉情绪",
  exceptionType: "异常类型",
  handlingLevel: "处理等级",
  priority: "优先级",
  workOrderStatus: "工单状态",
  owner: "责任人",
  aiRisk: "AI风险判断",
  aiSuggestion: "AI建议",
} as const;

export type ExceptionCategory =
  | "正常履约"
  | "温度异常"
  | "客诉问题"
  | "未发货"
  | "未揽收"
  | "物流滞留"
  | "丢失问题";

export function asString(value: unknown): string {
  if (value == null) return "";
  return String(value);
}

export function parseStayDays(value: unknown): number {
  const text = asString(value).trim();
  const matched = text.match(/(\d+)\s*天/);
  if (!matched) return 0;

  const days = Number(matched[1]);
  return Number.isFinite(days) ? Math.max(0, Math.floor(days)) : 0;
}

export function parsePrice(value: unknown): number {
  const text = asString(value).replace(/[^\d.]/g, "").trim();
  if (!text) return 0;

  const price = Number(text);
  return Number.isFinite(price) ? price : 0;
}

export function isHighValueCargo(row: ShipmentRow): boolean {
  const product = asString(row[KEY.product]);
  const price = parsePrice(row[KEY.price]);
  return /龙虾|帝王蟹|雪蟹|冷链|生鲜/i.test(product) || price >= 600;
}

export function stableHash(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) % 100000;
  }
  return hash;
}

function parseTemperature(value: unknown): number {
  const raw = Number(String(value ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(raw) ? raw : NaN;
}

function isTemperatureIssue(row: ShipmentRow): boolean {
  const temp = parseTemperature(row[KEY.currentTemp]);
  const tempStatus = asString(row[KEY.temperatureStatus]).trim();
  if (Number.isFinite(temp) && temp >= 8) return true;
  return /异常|预警/i.test(tempStatus);
}

function isComplaintIssue(row: ShipmentRow): boolean {
  const complaintStatus = asString(row[KEY.complaintStatus]).trim();
  const complaintContent = asString(row[KEY.complaintContent]).trim();
  return /投诉|客诉|升级|不满/i.test(complaintStatus) || complaintContent.length > 0;
}

function pickProblemCategory(row: ShipmentRow): ExceptionCategory {
  const status = asString(row[KEY.status]).trim();
  const stayDays = parseStayDays(row[KEY.stayDays]);

  if (isTemperatureIssue(row)) return "温度异常";
  if (isComplaintIssue(row)) return "客诉问题";
  if (status === "未发货") return "未发货";
  if (status === "未揽收") return "未揽收";
  if (/丢失|丢件|遗失/i.test(status)) return "丢失问题";
  if (/滞留|异常|问题|拦截|退回|破损|失败/i.test(status) || stayDays >= 5) return "物流滞留";
  return "物流滞留";
}

export function detectExceptionCategory(row: ShipmentRow): ExceptionCategory {
  const explicit = asString(row[KEY.exceptionType]).trim();
  if (explicit === "正常履约") return "正常履约";
  if (/温度/.test(explicit)) return "温度异常";
  if (/客诉|投诉/.test(explicit)) return "客诉问题";
  if (/未发货/.test(explicit)) return "未发货";
  if (/未揽收/.test(explicit)) return "未揽收";
  if (/丢失|丢件|遗失/.test(explicit)) return "丢失问题";
  if (/滞留|运输/.test(explicit)) return "物流滞留";

  const status = asString(row[KEY.status]).trim();
  const stayDays = parseStayDays(row[KEY.stayDays]);

  if (isTemperatureIssue(row) || isComplaintIssue(row)) return pickProblemCategory(row);
  if (status === "未发货") return "未发货";
  if (status === "未揽收") return "未揽收";
  if (/异常|问题|拦截|退回|破损|丢失|失败|滞留/i.test(status) || stayDays >= 5) {
    return pickProblemCategory(row);
  }

  return "正常履约";
}

export function isProblemRow(row: ShipmentRow): boolean {
  return detectExceptionCategory(row) !== "正常履约";
}

function normalTemperature(row: ShipmentRow): number {
  const existing = Number(row[KEY.currentTemp]);
  if (Number.isFinite(existing) && existing > 0 && existing < 10) return existing;
  const base = isHighValueCargo(row) ? 2.6 : 3.2;
  return Number(base.toFixed(1));
}

function applyNormalFields(row: ShipmentRow, timestamp: string) {
  row[KEY.exceptionType] = "正常履约";
  row[KEY.handlingLevel] = "自动通过";
  row[KEY.priority] = "P4";
  row[KEY.workOrderStatus] = "巡检通过";
  row[KEY.owner] = "系统自动巡检";
  row[KEY.aiRisk] = "风险低于阈值，链路稳定。";
  row[KEY.aiSuggestion] = "维持当前巡检频率，继续跟踪冷链温度与末端签收时效。";
  row[KEY.complaintStatus] = "无客诉";
  row[KEY.complaintContent] = "";
  row[KEY.complaintEmotion] = "无";
  row[KEY.status] = "运输中";
  row[KEY.customsStatus] = asString(row[KEY.customsStatus]).trim() || "已放行";
  row[KEY.currentTemp] = Number(normalTemperature(row).toFixed(1));
  row[KEY.temperatureStatus] = "正常";
  row[KEY.temperatureUpdatedAt] = timestamp;
  row[KEY.updatedAt] = timestamp;
}

function applyAFields(row: ShipmentRow, timestamp: string) {
  row[KEY.exceptionType] = "未发货-商家未出库";
  row[KEY.handlingLevel] = "L1 全自动";
  row[KEY.priority] = "P2";
  row[KEY.workOrderStatus] = "待商家处理";
  row[KEY.owner] = "商家运营组";
  row[KEY.aiRisk] = "揽收超时风险 0.64，建议优先催发货并复核面单状态。";
  row[KEY.aiSuggestion] = "自动生成催发货工单，并在 30 分钟后触发二次巡检。";
  row[KEY.complaintStatus] = "无客诉";
  row[KEY.complaintContent] = "";
  row[KEY.complaintEmotion] = "无";
  row[KEY.customsStatus] = asString(row[KEY.customsStatus]).trim() || "已放行";
  row[KEY.currentTemp] = Number(normalTemperature(row).toFixed(1));
  row[KEY.temperatureStatus] = "正常";
  row[KEY.temperatureUpdatedAt] = timestamp;
  row[KEY.updatedAt] = timestamp;
}

function applyBFields(row: ShipmentRow, timestamp: string) {
  const hash = stableHash(asString(row[KEY.orderNo]));
  if (!/丢失|丢件|遗失/.test(asString(row[KEY.status]))) {
    row[KEY.status] = "运输异常";
  }
  row[KEY.exceptionType] = "物流滞留-节点超时";
  row[KEY.handlingLevel] = "L2 人机协同";
  row[KEY.priority] = "P2";
  row[KEY.workOrderStatus] = "待物流核查";
  row[KEY.owner] = "冷链调度专员";
  row[KEY.aiRisk] = "滞留/断链风险 0.78，建议排查转运中心拥堵与温控波动。";
  row[KEY.aiSuggestion] = "触发双人背对背核查，并优先协调最近冷链车次改配。";
  row[KEY.complaintStatus] = "无客诉";
  row[KEY.complaintContent] = "";
  row[KEY.complaintEmotion] = "无";
  row[KEY.customsStatus] = hash % 2 === 0 ? "查验中" : "已放行";
  row[KEY.currentTemp] = Number((normalTemperature(row) + 3.8 + (hash % 2) * 0.6).toFixed(1));
  row[KEY.temperatureStatus] = hash % 2 === 0 ? "预警" : "异常";
  row[KEY.temperatureUpdatedAt] = timestamp;
  row[KEY.updatedAt] = timestamp;
}

function applyCFields(row: ShipmentRow, timestamp: string) {
  const hash = stableHash(asString(row[KEY.orderNo]));
  row[KEY.status] = "运输异常";
  row[KEY.exceptionType] = "客诉问题-用户投诉升级";
  row[KEY.handlingLevel] = "L2 人机协同";
  row[KEY.priority] = "P1";
  row[KEY.workOrderStatus] = "客服安抚中";
  row[KEY.owner] = "客服安抚专员";
  row[KEY.aiRisk] = "客诉升级风险 0.86，建议先安抚后补偿，并同步冷链异常核查。";
  row[KEY.aiSuggestion] = "调用 LLM 生成安抚话术，优先安排客服回呼并给出补偿建议。";
  row[KEY.complaintStatus] = "已投诉";
  row[KEY.complaintContent] =
    hash % 2 === 0
      ? "客户反馈宴请时段即将开始，担心帝王蟹品质下降。"
      : "客户连续来电催单，担心波龙因滞留影响鲜活度。";
  row[KEY.complaintEmotion] = hash % 2 === 0 ? "普通询问" : "极度愤怒";
  row[KEY.customsStatus] = "已放行";
  row[KEY.currentTemp] = Number((normalTemperature(row) + 2.4).toFixed(1));
  row[KEY.temperatureStatus] = "预警";
  row[KEY.temperatureUpdatedAt] = timestamp;
  row[KEY.updatedAt] = timestamp;
}

function applyDFields(row: ShipmentRow, timestamp: string) {
  row[KEY.status] = "运输异常";
  row[KEY.exceptionType] = "温度异常-冷链温控超阈";
  row[KEY.handlingLevel] = "L2 人机协同";
  row[KEY.priority] = "P0";
  row[KEY.workOrderStatus] = "待温控处置";
  row[KEY.owner] = "冷链温控专员";
  row[KEY.aiRisk] = "温控失效风险 0.94，货损概率高，建议立即应急处理。";
  row[KEY.aiSuggestion] = "优先安排就近冷库复温并复测温度，必要时中止派送并升级理赔流程。";
  row[KEY.complaintStatus] = asString(row[KEY.complaintStatus]).trim() || "无客诉";
  row[KEY.complaintContent] = asString(row[KEY.complaintContent]).trim();
  row[KEY.complaintEmotion] = asString(row[KEY.complaintEmotion]).trim() || "无";
  row[KEY.customsStatus] = asString(row[KEY.customsStatus]).trim() || "已放行";
  row[KEY.currentTemp] = Number((normalTemperature(row) + 5.4).toFixed(1));
  row[KEY.temperatureStatus] = "异常";
  row[KEY.temperatureUpdatedAt] = timestamp;
  row[KEY.updatedAt] = timestamp;
}

function applyUncollectedFields(row: ShipmentRow, timestamp: string) {
  row[KEY.exceptionType] = "未揽收-物流未揽件";
  row[KEY.handlingLevel] = "L1 全自动";
  row[KEY.priority] = "P2";
  row[KEY.workOrderStatus] = "待物流揽收核查";
  row[KEY.owner] = "物流对接人";
  row[KEY.aiRisk] = "揽收超时风险 0.62，需核查揽收网点与面单状态。";
  row[KEY.aiSuggestion] = "自动提醒物流揽收并触发 30 分钟后复检。";
  row[KEY.complaintStatus] = "无客诉";
  row[KEY.complaintContent] = "";
  row[KEY.complaintEmotion] = "无";
  row[KEY.customsStatus] = asString(row[KEY.customsStatus]).trim() || "已放行";
  row[KEY.currentTemp] = Number(normalTemperature(row).toFixed(1));
  row[KEY.temperatureStatus] = "正常";
  row[KEY.temperatureUpdatedAt] = timestamp;
  row[KEY.updatedAt] = timestamp;
}

function applyLostFields(row: ShipmentRow, timestamp: string) {
  row[KEY.status] = "运输异常";
  row[KEY.exceptionType] = "丢失问题-运输丢件";
  row[KEY.handlingLevel] = "L2 人机协同";
  row[KEY.priority] = "P2";
  row[KEY.workOrderStatus] = "待物流寻件";
  row[KEY.owner] = "物流理赔专员";
  row[KEY.aiRisk] = "丢件风险 0.88，需尽快发起寻件与责任认定。";
  row[KEY.aiSuggestion] = "同步发起寻件工单与赔付预案，优先联系末端网点核查。";
  row[KEY.complaintStatus] = asString(row[KEY.complaintStatus]).trim() || "已投诉";
  row[KEY.complaintContent] = asString(row[KEY.complaintContent]).trim() || "客户反馈包裹疑似丢失，要求尽快处理。";
  row[KEY.complaintEmotion] = asString(row[KEY.complaintEmotion]).trim() || "焦虑";
  row[KEY.customsStatus] = asString(row[KEY.customsStatus]).trim() || "已放行";
  row[KEY.currentTemp] = Number(normalTemperature(row).toFixed(1));
  row[KEY.temperatureStatus] = "正常";
  row[KEY.temperatureUpdatedAt] = timestamp;
  row[KEY.updatedAt] = timestamp;
}

export function applyBusinessFields(row: ShipmentRow, timestamp: string, forcedCategory?: ExceptionCategory) {
  const category = forcedCategory ?? detectExceptionCategory(row);

  switch (category) {
    case "未发货":
      applyAFields(row, timestamp);
      break;
    case "未揽收":
      applyUncollectedFields(row, timestamp);
      break;
    case "物流滞留":
      applyBFields(row, timestamp);
      break;
    case "客诉问题":
      applyCFields(row, timestamp);
      break;
    case "温度异常":
      applyDFields(row, timestamp);
      break;
    case "丢失问题":
      applyLostFields(row, timestamp);
      break;
    default:
      applyNormalFields(row, timestamp);
      break;
  }

  return category;
}
