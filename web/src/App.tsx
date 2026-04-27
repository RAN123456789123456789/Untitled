import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  App as AntApp,
  Badge,
  Button,
  Card,
  Col,
  ConfigProvider,
  Descriptions,
  Drawer,
  Empty,
  Input,
  Layout,
  List,
  Progress,
  Row,
  Select,
  Space,
  Statistic,
  Steps,
  Table,
  Tag,
  Typography,
  type TableColumnsType,
} from "antd";
import {
  AimOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ControlOutlined,
  DashboardOutlined,
  FireOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  RobotOutlined,
  ThunderboltOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import "./App.css";

type ShipmentRow = Record<string, unknown>;
type CategoryKey = "NORMAL" | "P0" | "P1" | "P2";

type Meta = { statuses: string[]; locations: string[] };

type UpdateState = {
  running: boolean;
  startedAt: string | null;
  stoppedAt: string | null;
  lastTickAt: string | null;
  tick: number;
  injectedProblemsLastTick: number;
  config: {
    intervalMs: number;
    demoDurationMs: number;
    problemPerTick: number;
    batchSize: number;
  };
  autoStopAt: string | null;
};

type DerivedRow = {
  key: string;
  raw: ShipmentRow;
  orderNo: string;
  product: string;
  spec: string;
  receiver: string;
  phone: string;
  address: string;
  status: string;
  currentCenter: string;
  prevCenter: string;
  nextCenter: string;
  stayDays: number;
  stayText: string;
  track: string[];
  updatedAt: string;
  price: number;
  category: CategoryKey;
  categoryText: string;
  riskScore: number;
  priority: string;
  handlingLevel: string;
  suggestedAction: string;
  customsStatus: string;
  declarationNo: string;
  batchNo: string;
  supplier: string;
  origin: string;
  temperature: string;
  temperatureStatus: string;
  complaintStatus: string;
  complaintContent: string;
  complaintEmotion: string;
  workOrderStatus: string;
  owner: string;
  aiRisk: string;
  purchaseOrderNo: string;
  platform: string;
};

const KEY = {
  orderNo: "物流单号",
  status: "状态",
  currentCenter: "当前位置",
  prevCenter: "上个数据中心",
  nextCenter: "下个数据中心",
  product: "商品信息",
  spec: "商品规格",
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
  purchaseOrderNo: "采购订单号",
  batchNo: "批次号",
  supplier: "供应商名称",
  origin: "原产地",
  declarationNo: "报关单号",
  customsStatus: "清关状态",
  temperature: "当前温度(℃)",
  temperatureStatus: "温控状态",
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

const AUTO_REFRESH_FALLBACK_MS = 10_000;
const TRACK_SPLIT_RE = /\s*(?:->|=>|→|➡)\s*/g;
const DAY_RE = /(\d+)\s*天/;

const PRIORITY_ORDER: Record<CategoryKey, number> = {
  P0: 0,
  P1: 1,
  P2: 2,
  NORMAL: 3,
};

const CATEGORY_META: Record<
  CategoryKey,
  {
    title: string;
    short: string;
    color: string;
    badgeStatus: "default" | "processing" | "warning" | "error" | "success";
    level: string;
    summary: string;
  }
> = {
  NORMAL: {
    title: "正常履约",
    short: "正常",
    color: "green",
    badgeStatus: "success",
    level: "自动通过",
    summary: "订单链路稳定，系统按设定频率自动巡检。",
  },
  P0: {
    title: "P0 温度",
    short: "P0",
    color: "red",
    badgeStatus: "error",
    level: "最高优先",
    summary: "温控超阈/冷链风险，需最先处置。",
  },
  P1: {
    title: "P1 客诉",
    short: "P1",
    color: "magenta",
    badgeStatus: "processing",
    level: "高优先",
    summary: "客诉类问题，优先客服与协同处置。",
  },
  P2: {
    title: "P2 其他",
    short: "P2",
    color: "gold",
    badgeStatus: "warning",
    level: "中优先",
    summary: "未发货、未揽收、滞留、丢失等其余异常。",
  },
};

const MODULES = [
  {
    title: "数据接入层",
    desc: "订单、批次、报关、温控、物流、客诉数据统一接入。",
    icon: <DashboardOutlined />,
  },
  {
    title: "业务处理层",
    desc: "P0-P2 分级、L1-L3 协同、AI 风险判断和动作建议。",
    icon: <RobotOutlined />,
  },
  {
    title: "交互与监护层",
    desc: "总览、预警、协同队列、工单详情、异常追踪联动展示。",
    icon: <ControlOutlined />,
  },
  {
    title: "技术保障层",
    desc: "分批处理、断点续跑、增量巡检、自动回滚和回溯。",
    icon: <ThunderboltOutlined />,
  },
];

const TARGETS = [
  { title: "处理时效", value: "≤ 1 小时", icon: <ClockCircleOutlined /> },
  { title: "损耗控制", value: "≤ 2%", icon: <AimOutlined /> },
  { title: "峰值承载", value: "50 万单/日", icon: <FireOutlined /> },
  { title: "识别准确率", value: "≥ 99%", icon: <CheckCircleOutlined /> },
];

function asString(value: unknown): string {
  if (value == null) return "";
  return String(value);
}

function formatDateTime(value: unknown): string {
  const text = asString(value).trim();
  if (!text) return "-";

  const parsed = dayjs(text);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD HH:mm:ss") : text;
}

function parseStayDays(value: unknown): number {
  const text = asString(value).trim();
  const matched = text.match(DAY_RE);
  if (!matched) return 0;

  const days = Number(matched[1]);
  return Number.isFinite(days) ? days : 0;
}

function parseTrack(value: unknown): string[] {
  const text = asString(value).trim();
  if (!text) return [];

  return text
    .split(TRACK_SPLIT_RE)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseNumber(value: unknown): number {
  const text = asString(value).replace(/[^\d.]/g, "");
  if (!text) return 0;

  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toCategoryKey(exceptionType: string, priorityText = "", status = ""): CategoryKey {
  const p = priorityText.trim();
  if (p === "P0") return "P0";
  if (p === "P1") return "P1";
  if (p === "P2") return "P2";
  if (p === "P3" || p === "P4") return "NORMAL";

  const et = exceptionType;
  if (/温度|温控|冷链/.test(et) && !/正常/.test(et)) return "P0";
  if (/客诉|投诉/.test(et)) return "P1";
  if (/未发货|未揽收|滞留|丢失|丢件|运输异常|物流滞/.test(et)) return "P2";
  if (/A类|B类|C类|D类/.test(et)) {
    if (/A类|未发货|未揽收/.test(et)) return "P2";
    if (/C类|客诉/.test(et)) return "P1";
    if (/B类|运输|D类|重复/.test(et)) return "P2";
  }
  const st = status;
  if (/未发货|未揽收|滞留|异常|丢失|丢件|运输异常|破损|退回|失败/.test(st)) return "P2";
  return "NORMAL";
}

function deriveFallbackCategory(row: ShipmentRow): string {
  const status = asString(row[KEY.status]).trim();
  const stayDays = parseStayDays(row[KEY.stayDays]);

  if (status === "未发货" || status === "未揽收") return "A类 未发货/未揽收";
  if (/异常|问题|拦截|退回|破损|丢失|失败/i.test(status) || stayDays >= 5) return "B类 运输异常";
  return "正常履约";
}

function deriveRiskScore(row: ShipmentRow, category: CategoryKey): number {
  const baseMap: Record<CategoryKey, number> = {
    NORMAL: 18,
    P0: 96,
    P1: 86,
    P2: 72,
  };

  const stayDays = parseStayDays(row[KEY.stayDays]);
  const price = parseNumber(row[KEY.price]);
  const temp = parseNumber(row[KEY.temperature]);
  const extra = Math.min(10, stayDays * 2) + (price >= 800 ? 5 : 0) + (temp >= 6 ? 4 : 0);
  return Math.min(100, baseMap[category] + extra);
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return (await response.json()) as T;
}

export default function App() {
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rows, setRows] = useState<ShipmentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [meta, setMeta] = useState<Meta>({ statuses: [], locations: [] });
  const [state, setState] = useState<UpdateState | null>(null);
  const [lastRefreshAt, setLastRefreshAt] = useState<string | null>(null);
  const [refreshCountdown, setRefreshCountdown] = useState(
    Math.floor(AUTO_REFRESH_FALLBACK_MS / 1000),
  );

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [location, setLocation] = useState<string | undefined>(undefined);
  const [categoryFilter, setCategoryFilter] = useState<CategoryKey | "ALL">("ALL");

  const [selected, setSelected] = useState<DerivedRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const refreshIntervalMs = state?.config.intervalMs ?? AUTO_REFRESH_FALLBACK_MS;
  const refreshIntervalSec = Math.max(1, Math.floor(refreshIntervalMs / 1000));

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (status) params.set("status", status);
    if (location) params.set("location", location);
    params.set("limit", "1000");
    params.set("offset", "0");
    return params.toString();
  }, [location, q, status]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [nextMeta, shipmentResp, nextState] = await Promise.all([
        fetchJson<Meta>("/api/meta"),
        fetchJson<{ total: number; data: ShipmentRow[] }>(`/api/shipments?${queryString}`),
        fetchJson<UpdateState>("/api/update-data/state"),
      ]);

      setMeta(nextMeta);
      setRows(shipmentResp.data);
      setTotal(shipmentResp.total);
      setState(nextState);
      setLastRefreshAt(new Date().toISOString());
      setRefreshCountdown(refreshIntervalSec);
    } finally {
      setLoading(false);
    }
  }, [queryString, refreshIntervalSec]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const timer = window.setInterval(() => void loadData(), refreshIntervalMs);
    return () => window.clearInterval(timer);
  }, [loadData, refreshIntervalMs]);

  useEffect(() => {
    setRefreshCountdown(refreshIntervalSec);
  }, [lastRefreshAt, refreshIntervalSec]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRefreshCountdown((value) => (value <= 1 ? refreshIntervalSec : value - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [refreshIntervalSec]);

  const runEngineAction = useCallback(
    async (action: "start" | "stop" | "reset" | "tick") => {
      setActionLoading(action);
      try {
        await fetchJson(`/api/update-data/${action}`, { method: "POST" });
        await loadData();
      } finally {
        setActionLoading(null);
      }
    },
    [loadData],
  );

  const derivedRows = useMemo<DerivedRow[]>(() => {
    return rows.map((row, index) => {
      const orderNo = asString(row[KEY.orderNo]) || `ROW-${index + 1}`;
      const categoryText = asString(row[KEY.exceptionType]).trim() || deriveFallbackCategory(row);
      const priorityText = asString(row[KEY.priority]).trim();
      const statusText = asString(row[KEY.status]).trim();
      const category = toCategoryKey(categoryText, priorityText, statusText);
      const displayPriority = (() => {
        if (/^P\d/.test(priorityText)) return priorityText;
        if (category === "P0") return "P0";
        if (category === "P1") return "P1";
        if (category === "P2") return "P2";
        return priorityText || "P4";
      })();

      return {
        key: orderNo,
        raw: row,
        orderNo,
        product: asString(row[KEY.product]) || "待同步商品信息",
        spec: asString(row[KEY.spec]) || "-",
        receiver: asString(row[KEY.receiver]) || "-",
        phone: asString(row[KEY.phone]) || "-",
        address: asString(row[KEY.address]) || "-",
        status: asString(row[KEY.status]) || "待同步",
        currentCenter: asString(row[KEY.currentCenter]) || "待同步节点",
        prevCenter: asString(row[KEY.prevCenter]) || "-",
        nextCenter: asString(row[KEY.nextCenter]) || "-",
        stayDays: parseStayDays(row[KEY.stayDays]),
        stayText: asString(row[KEY.stayDays]) || "0天",
        track: parseTrack(row[KEY.track]),
        updatedAt: formatDateTime(row[KEY.updatedAt] || row[KEY.arrivalTime]),
        price: parseNumber(row[KEY.price]),
        category,
        categoryText,
        riskScore: deriveRiskScore(row, category),
        priority: displayPriority,
        handlingLevel: asString(row[KEY.handlingLevel]) || CATEGORY_META[category].level,
        suggestedAction: asString(row[KEY.aiSuggestion]) || "待系统补充建议",
        customsStatus: asString(row[KEY.customsStatus]) || "-",
        declarationNo: asString(row[KEY.declarationNo]) || "-",
        batchNo: asString(row[KEY.batchNo]) || "-",
        supplier: asString(row[KEY.supplier]) || "-",
        origin: asString(row[KEY.origin]) || "-",
        temperature: asString(row[KEY.temperature]) || "-",
        temperatureStatus: asString(row[KEY.temperatureStatus]) || "-",
        complaintStatus: asString(row[KEY.complaintStatus]) || "无客诉",
        complaintContent: asString(row[KEY.complaintContent]) || "暂无客诉内容",
        complaintEmotion: asString(row[KEY.complaintEmotion]) || "无",
        workOrderStatus: asString(row[KEY.workOrderStatus]) || "待同步",
        owner: asString(row[KEY.owner]) || "待分配",
        aiRisk: asString(row[KEY.aiRisk]) || "暂无 AI 风险判断",
        purchaseOrderNo: asString(row[KEY.purchaseOrderNo]) || "-",
        platform: asString(row[KEY.platform]) || "-",
      };
    });
  }, [rows]);

  const filteredRows = useMemo(() => {
    const list = derivedRows.filter((row) => (categoryFilter === "ALL" ? true : row.category === categoryFilter));
    return [...list].sort((a, b) => {
      const diff = PRIORITY_ORDER[a.category] - PRIORITY_ORDER[b.category];
      if (diff !== 0) return diff;
      return b.riskScore - a.riskScore;
    });
  }, [categoryFilter, derivedRows]);

  const abnormalRows = useMemo(
    () => derivedRows.filter((row) => row.category !== "NORMAL"),
    [derivedRows],
  );

  const categoryStats = useMemo(() => {
    const stats: Record<CategoryKey, number> = {
      NORMAL: 0,
      P0: 0,
      P1: 0,
      P2: 0,
    };

    for (const row of derivedRows) stats[row.category] += 1;
    return stats;
  }, [derivedRows]);

  const overview = useMemo(() => {
    const totalRows = derivedRows.length;
    const abnormalCount = abnormalRows.length;
    const highRiskCount = abnormalRows.filter((row) => row.priority === "P0" || row.priority === "P1").length;
    const averageStay = totalRows
      ? (derivedRows.reduce((sum, row) => sum + row.stayDays, 0) / totalRows).toFixed(1)
      : "0.0";
    const healthyRate = totalRows ? Math.max(0, 100 - Math.round((abnormalCount / totalRows) * 100)) : 100;

    return {
      totalRows,
      abnormalCount,
      highRiskCount,
      averageStay,
      healthyRate,
      manualBacklog: abnormalRows.filter((row) => row.handlingLevel !== "自动通过").length,
    };
  }, [abnormalRows, derivedRows]);

  const topRiskCenters = useMemo(() => {
    const map = new Map<string, { count: number; maxRisk: number }>();

    for (const row of abnormalRows) {
      const key = row.currentCenter || "待同步节点";
      const prev = map.get(key) ?? { count: 0, maxRisk: 0 };
      map.set(key, {
        count: prev.count + 1,
        maxRisk: Math.max(prev.maxRisk, row.riskScore),
      });
    }

    return Array.from(map.entries())
      .map(([center, value]) => ({ center, ...value }))
      .sort((a, b) => b.count - a.count || b.maxRisk - a.maxRisk)
      .slice(0, 5);
  }, [abnormalRows]);

  const collaborationQueue = useMemo(() => {
    return abnormalRows
      .sort((a, b) => {
        const diff = PRIORITY_ORDER[a.category] - PRIORITY_ORDER[b.category];
        if (diff !== 0) return diff;
        return b.riskScore - a.riskScore;
      })
      .slice(0, 5);
  }, [abnormalRows]);

  const columns = useMemo<TableColumnsType<DerivedRow>>(
    () => [
      {
        title: "物流单号",
        dataIndex: "orderNo",
        width: 160,
        fixed: "left",
        render: (value: string) => <Typography.Text code>{value}</Typography.Text>,
      },
      {
        title: "异常类型",
        dataIndex: "categoryText",
        width: 160,
        render: (_: string, row) => <Tag color={CATEGORY_META[row.category].color}>{row.categoryText}</Tag>,
      },
      {
        title: "处理等级",
        dataIndex: "handlingLevel",
        width: 130,
        render: (value: string) => <Tag>{value}</Tag>,
      },
      {
        title: "优先级",
        dataIndex: "priority",
        width: 100,
        render: (value: string) => (
          <Tag color={value === "P0" ? "red" : value === "P1" ? "volcano" : value === "P2" ? "gold" : "blue"}>
            {value}
          </Tag>
        ),
      },
      {
        title: "风险分",
        dataIndex: "riskScore",
        width: 120,
        render: (value: number) => <Progress percent={value} size="small" showInfo={false} />,
      },
      {
        title: "商品信息",
        dataIndex: "product",
        width: 220,
        ellipsis: true,
      },
      {
        title: "清关状态",
        dataIndex: "customsStatus",
        width: 120,
        render: (value: string) => (
          <Tag color={value.includes("已放行") ? "success" : value.includes("查验") ? "warning" : "default"}>
            {value}
          </Tag>
        ),
      },
      {
        title: "温控",
        dataIndex: "temperatureStatus",
        width: 130,
        render: (_: string, row) => (
          <Tag color={row.temperatureStatus === "正常" ? "success" : row.temperatureStatus === "预警" ? "gold" : "red"}>
            {row.temperature}℃ / {row.temperatureStatus}
          </Tag>
        ),
      },
      {
        title: "当前节点",
        dataIndex: "currentCenter",
        width: 180,
        ellipsis: true,
      },
      {
        title: "工单状态",
        dataIndex: "workOrderStatus",
        width: 140,
      },
      {
        title: "物流状态",
        dataIndex: "status",
        width: 120,
        render: (value: string) => <Tag bordered={false}>{value}</Tag>,
      },
      {
        title: "滞留时长",
        dataIndex: "stayText",
        width: 120,
      },
      {
        title: "收货人",
        dataIndex: "receiver",
        width: 120,
      },
    ],
    [],
  );

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#1677ff",
          colorInfo: "#1677ff",
          colorSuccess: "#13c2c2",
          colorWarning: "#faad14",
          colorError: "#ff4d4f",
          borderRadius: 18,
          colorBgLayout: "#eef3fb",
          fontFamily:
            "'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
        },
      }}
    >
      <AntApp>
        <Layout className="app-shell">
          <Layout.Header className="app-header">
            <div className="header-bar">
              <Space size={12} align="center">
                <div className="header-logo">
                  <RobotOutlined />
                </div>
                <div>
                  <Typography.Title level={3} style={{ margin: 0 }}>
                    鲜时达 RPA+AI 智能管控台
                  </Typography.Title>
                  <Typography.Text type="secondary">数贸无界，鲜达全球</Typography.Text>
                </div>
                <Badge
                  status={state?.running ? "processing" : "default"}
                  text={state?.running ? "巡检运行中" : "巡检已暂停"}
                />
              </Space>

              <Space wrap>
                <Tag color="blue">自动刷新倒计时 {refreshCountdown}s</Tag>
                <Tag color="cyan">问题注入 {state?.config.problemPerTick ?? 5} 单/轮</Tag>
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  loading={actionLoading === "start"}
                  onClick={() => void runEngineAction("start")}
                >
                  启动巡检
                </Button>
                <Button
                  icon={<PauseCircleOutlined />}
                  loading={actionLoading === "stop"}
                  onClick={() => void runEngineAction("stop")}
                >
                  暂停
                </Button>
                <Button
                  icon={<ThunderboltOutlined />}
                  loading={actionLoading === "tick"}
                  onClick={() => void runEngineAction("tick")}
                >
                  立即推进一轮
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  loading={actionLoading === "reset"}
                  onClick={() => void runEngineAction("reset")}
                >
                  回滚基线
                </Button>
                <Button icon={<ReloadOutlined />} loading={loading} onClick={() => void loadData()}>
                  刷新数据
                </Button>
              </Space>
            </div>
          </Layout.Header>

          <Layout.Content className="page-content">
            <div className="page-container">
              <Row gutter={[18, 18]}>
                <Col xs={24} xl={16}>
                  <Card className="hero-card">
                    <Space direction="vertical" size={18} style={{ width: "100%" }}>
                      <div>
                        <Tag color="processing">跨境精品生鲜</Tag>
                        <Tag color="success">后台物流同步</Tag>
                        <Tag color="purple">RPA + AI 协同</Tag>
                      </div>

                      <Typography.Title level={1} className="hero-title">
                        面向跨境冷链履约的
                        <br />
                        智能异常管控中枢
                      </Typography.Title>

                      <Typography.Paragraph className="hero-text">
                        当前页面已直接消费更新后的物流 Excel 数据。订单、批次、报关、温控、客诉、
                        工单字段会随着后台物流数据一起刷新，避免前端展示与后台筛单逻辑脱节。
                      </Typography.Paragraph>

                      <Row gutter={[12, 12]}>
                        {TARGETS.map((item) => (
                          <Col xs={12} md={6} key={item.title}>
                            <div className="target-chip">
                              <div className="target-chip-icon">{item.icon}</div>
                              <div>
                                <div className="target-chip-label">{item.title}</div>
                                <div className="target-chip-value">{item.value}</div>
                              </div>
                            </div>
                          </Col>
                        ))}
                      </Row>
                    </Space>
                  </Card>
                </Col>

                <Col xs={24} xl={8}>
                  <Card className="side-hero-card" title="系统运行快照">
                    <Space direction="vertical" size={14} style={{ width: "100%" }}>
                      <Row gutter={[12, 12]}>
                        <Col span={12}>
                          <Statistic title="本轮 Tick" value={state?.tick ?? 0} prefix={<ThunderboltOutlined />} />
                        </Col>
                        <Col span={12}>
                          <Statistic
                            title="上轮注入问题单"
                            value={state?.injectedProblemsLastTick ?? 0}
                            prefix={<WarningOutlined />}
                          />
                        </Col>
                        <Col span={12}>
                          <Statistic title="批处理规模" value={state?.config.batchSize ?? 1000} />
                        </Col>
                        <Col span={12}>
                          <Statistic title="自动巡检周期" value={`${Math.round(refreshIntervalMs / 1000)}s`} />
                        </Col>
                      </Row>

                      <Descriptions size="small" column={1}>
                        <Descriptions.Item label="最近刷新">{formatDateTime(lastRefreshAt)}</Descriptions.Item>
                        <Descriptions.Item label="最近一轮推进">{formatDateTime(state?.lastTickAt)}</Descriptions.Item>
                        <Descriptions.Item label="自动停止时间">{formatDateTime(state?.autoStopAt)}</Descriptions.Item>
                      </Descriptions>
                    </Space>
                  </Card>
                </Col>
              </Row>

              <Row gutter={[18, 18]} className="section-gap">
                <Col xs={24} md={12} xl={6}>
                  <Card className="metric-card">
                    <Statistic title="匹配订单量" value={total || overview.totalRows} prefix={<DashboardOutlined />} />
                    <Typography.Text type="secondary">当前条件下展示 {filteredRows.length} 条</Typography.Text>
                  </Card>
                </Col>
                <Col xs={24} md={12} xl={6}>
                  <Card className="metric-card">
                    <Statistic title="异常订单" value={overview.abnormalCount} prefix={<WarningOutlined />} />
                    <Typography.Text type="secondary">P0-P2 综合识别结果</Typography.Text>
                  </Card>
                </Col>
                <Col xs={24} md={12} xl={6}>
                  <Card className="metric-card">
                    <Statistic title="高优先级工单" value={overview.highRiskCount} prefix={<FireOutlined />} />
                    <Typography.Text type="secondary">P0-P1 待优先处理</Typography.Text>
                  </Card>
                </Col>
                <Col xs={24} md={12} xl={6}>
                  <Card className="metric-card">
                    <Statistic title="健康履约率" value={overview.healthyRate} suffix="%" prefix={<CheckCircleOutlined />} />
                    <Typography.Text type="secondary">平均滞留 {overview.averageStay} 天</Typography.Text>
                  </Card>
                </Col>
              </Row>

              <Row gutter={[18, 18]} className="section-gap">
                <Col span={24}>
                  <Card
                    title="优先级分档看板"
                    extra={<Tag color="blue">P0 最重要，点击筛协同台；表格按 P0→P1→P2 排序</Tag>}
                  >
                    <Row gutter={[16, 16]}>
                      {(["P0", "P1", "P2"] as CategoryKey[]).map((item) => {
                        const metaItem = CATEGORY_META[item];
                        const active = categoryFilter === item;

                        return (
                          <Col xs={24} md={8} xl={8} key={item}>
                            <button
                              type="button"
                              className={`category-card${active ? " active" : ""}`}
                              onClick={() => setCategoryFilter((value) => (value === item ? "ALL" : item))}
                            >
                              <div className="category-card-top">
                                <Badge status={metaItem.badgeStatus} />
                                <span className="category-card-tag">{metaItem.short}</span>
                              </div>
                              <div className="category-card-title">{metaItem.title}</div>
                              <div className="category-card-value">{categoryStats[item]}</div>
                              <div className="category-card-level">{metaItem.level}</div>
                              <div className="category-card-desc">{metaItem.summary}</div>
                            </button>
                          </Col>
                        );
                      })}
                    </Row>
                  </Card>
                </Col>
              </Row>

              <Row gutter={[18, 18]} className="section-gap">
                <Col span={24}>
                  <Card
                    title="履约协同台"
                    extra={
                      <Space wrap>
                        <Tag color="blue">全部 {derivedRows.length}</Tag>
                        <Tag color="volcano">异常 {overview.abnormalCount}</Tag>
                        <Tag color="purple">人工待办 {overview.manualBacklog}</Tag>
                      </Space>
                    }
                  >
                    <Space wrap size={12} style={{ marginBottom: 16 }}>
                      <Select
                        style={{ width: 180 }}
                        value={status}
                        onChange={(value) => setStatus(value)}
                        allowClear
                        placeholder="物流状态"
                        options={meta.statuses.map((item) => ({ value: item, label: item }))}
                      />
                      <Select
                        style={{ width: 220 }}
                        value={location}
                        onChange={(value) => setLocation(value)}
                        allowClear
                        showSearch
                        placeholder="当前节点"
                        options={meta.locations.map((item) => ({ value: item, label: item }))}
                        filterOption={(input, option) =>
                          asString(option?.label).toLowerCase().includes(input.toLowerCase())
                        }
                      />
                      <Input
                        style={{ width: 360 }}
                        value={q}
                        onChange={(event) => setQ(event.target.value)}
                        placeholder="搜索单号 / 报关单号 / 批次号 / 供应商 / AI建议"
                        allowClear
                      />
                      <Select
                        style={{ width: 180 }}
                        value={categoryFilter}
                        onChange={(value) => setCategoryFilter(value)}
                        options={[
                          { value: "ALL", label: "全部优先级" },
                          { value: "P0", label: "P0 温度" },
                          { value: "P1", label: "P1 客诉" },
                          { value: "P2", label: "P2 其他" },
                        ]}
                      />
                    </Space>

                    <Table<DerivedRow>
                      rowKey="key"
                      loading={loading}
                      columns={columns}
                      dataSource={filteredRows}
                      size="middle"
                      scroll={{ x: 1850 }}
                      pagination={{
                        pageSize: 12,
                        showSizeChanger: false,
                        showTotal: (value) => `共 ${value} 条`,
                      }}
                      onRow={(record) => ({
                        onClick: () => {
                          setSelected(record);
                          setDrawerOpen(true);
                        },
                      })}
                    />
                  </Card>
                </Col>
              </Row>

              <Row gutter={[18, 18]} className="section-gap">
                <Col xs={24} xl={10}>
                  <Card title="文档能力映射">
                    <List
                      itemLayout="horizontal"
                      dataSource={MODULES}
                      renderItem={(item) => (
                        <List.Item>
                          <List.Item.Meta
                            avatar={<div className="module-icon">{item.icon}</div>}
                            title={item.title}
                            description={item.desc}
                          />
                        </List.Item>
                      )}
                    />
                  </Card>
                </Col>

                <Col xs={24} xl={14}>
                  <Card title="风险预警与协同队列">
                    <Row gutter={[16, 16]}>
                      <Col xs={24} md={11}>
                        <Typography.Text strong>高频异常节点</Typography.Text>
                        <div className="mini-list">
                          {topRiskCenters.length > 0 ? (
                            topRiskCenters.map((item) => (
                              <div className="mini-list-item" key={item.center}>
                                <div>
                                  <div className="mini-list-title">{item.center}</div>
                                  <div className="mini-list-sub">异常工单 {item.count} 单</div>
                                </div>
                                <Tag color={item.maxRisk >= 90 ? "red" : "gold"}>{item.maxRisk} 分</Tag>
                              </div>
                            ))
                          ) : (
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无高频异常节点" />
                          )}
                        </div>
                      </Col>

                      <Col xs={24} md={13}>
                        <Typography.Text strong>人机协同待办</Typography.Text>
                        <div className="mini-list">
                          {collaborationQueue.length > 0 ? (
                            collaborationQueue.map((item) => (
                              <div className="mini-list-item" key={item.key}>
                                <div>
                                  <div className="mini-list-title">{item.orderNo}</div>
                                  <div className="mini-list-sub">
                                    {item.categoryText} · {item.workOrderStatus}
                                  </div>
                                </div>
                                <Tag color={item.priority === "P0" ? "red" : "volcano"}>{item.priority}</Tag>
                              </div>
                            ))
                          ) : (
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无待协同工单" />
                          )}
                        </div>
                      </Col>
                    </Row>
                  </Card>
                </Col>
              </Row>
            </div>
          </Layout.Content>

          <Drawer
            title={selected ? `工单详情 · ${selected.orderNo}` : "工单详情"}
            open={drawerOpen}
            width={820}
            onClose={() => setDrawerOpen(false)}
            destroyOnClose
          >
            {selected ? (
              <Space direction="vertical" size={16} style={{ width: "100%" }}>
                <Alert
                  type={selected.category === "NORMAL" ? "success" : "warning"}
                  showIcon
                  message={`${selected.categoryText} · ${selected.handlingLevel}`}
                  description={selected.suggestedAction}
                />

                <Descriptions column={2} bordered size="small">
                  <Descriptions.Item label="物流单号">{selected.orderNo}</Descriptions.Item>
                  <Descriptions.Item label="订单平台">{selected.platform}</Descriptions.Item>
                  <Descriptions.Item label="商品信息">{selected.product}</Descriptions.Item>
                  <Descriptions.Item label="商品规格">{selected.spec}</Descriptions.Item>
                  <Descriptions.Item label="采购订单号">{selected.purchaseOrderNo}</Descriptions.Item>
                  <Descriptions.Item label="批次号">{selected.batchNo}</Descriptions.Item>
                  <Descriptions.Item label="报关单号">{selected.declarationNo}</Descriptions.Item>
                  <Descriptions.Item label="清关状态">{selected.customsStatus}</Descriptions.Item>
                  <Descriptions.Item label="供应商">{selected.supplier}</Descriptions.Item>
                  <Descriptions.Item label="原产地">{selected.origin}</Descriptions.Item>
                  <Descriptions.Item label="当前状态">{selected.status}</Descriptions.Item>
                  <Descriptions.Item label="工单状态">{selected.workOrderStatus}</Descriptions.Item>
                  <Descriptions.Item label="处理等级">{selected.handlingLevel}</Descriptions.Item>
                  <Descriptions.Item label="优先级">{selected.priority}</Descriptions.Item>
                  <Descriptions.Item label="当前节点">{selected.currentCenter}</Descriptions.Item>
                  <Descriptions.Item label="滞留时长">{selected.stayText}</Descriptions.Item>
                  <Descriptions.Item label="温控">{`${selected.temperature}℃ / ${selected.temperatureStatus}`}</Descriptions.Item>
                  <Descriptions.Item label="责任人">{selected.owner}</Descriptions.Item>
                  <Descriptions.Item label="客诉状态">{selected.complaintStatus}</Descriptions.Item>
                  <Descriptions.Item label="客诉情绪">{selected.complaintEmotion}</Descriptions.Item>
                  <Descriptions.Item label="收货人">{selected.receiver}</Descriptions.Item>
                  <Descriptions.Item label="联系电话">{selected.phone}</Descriptions.Item>
                  <Descriptions.Item label="收货地址" span={2}>
                    {selected.address}
                  </Descriptions.Item>
                  <Descriptions.Item label="AI风险判断" span={2}>
                    {selected.aiRisk}
                  </Descriptions.Item>
                  <Descriptions.Item label="客诉内容" span={2}>
                    {selected.complaintContent}
                  </Descriptions.Item>
                  <Descriptions.Item label="更新时间" span={2}>
                    {selected.updatedAt}
                  </Descriptions.Item>
                </Descriptions>

                <Card title="物流轨迹">
                  {selected.track.length > 0 ? (
                    <Steps
                      direction="vertical"
                      size="small"
                      current={Math.max(0, selected.track.findIndex((item) => item === selected.currentCenter))}
                      items={selected.track.map((item) => ({
                        title: item,
                        description: item === selected.currentCenter ? "当前处理节点" : undefined,
                      }))}
                    />
                  ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无轨迹信息" />
                  )}
                </Card>

                <Card title="原始字段">
                  <pre className="raw-json">{JSON.stringify(selected.raw, null, 2)}</pre>
                </Card>
              </Space>
            ) : null}
          </Drawer>
        </Layout>
      </AntApp>
    </ConfigProvider>
  );
}
