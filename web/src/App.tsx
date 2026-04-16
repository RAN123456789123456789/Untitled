import { useCallback, useEffect, useMemo, useState } from "react";
import {
  App as AntApp,
  Badge,
  Button,
  Card,
  ConfigProvider,
  Descriptions,
  Drawer,
  Input,
  Layout,
  Select,
  Space,
  Steps,
  Table,
  Tag,
  Typography,
} from "antd";
import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

type ShipmentRow = Record<string, unknown>;
type Meta = { statuses: string[]; locations: string[] };

const K = {
  orderNo: "\u7269\u6d41\u5355\u53f7",
  status: "\u72b6\u6001",
  currentCenter: "\u5f53\u524d\u4f4d\u7f6e",
  prevCenter: "\u4e0a\u4e2a\u6570\u636e\u4e2d\u5fc3",
  nextCenter: "\u4e0b\u4e2a\u6570\u636e\u4e2d\u5fc3",
  product: "\u5546\u54c1\u4fe1\u606f",
  receiver: "\u6536\u8d27\u4eba\u4fe1\u606f",
  phone: "\u8054\u7cfb\u7535\u8bdd",
  address: "\u6536\u8d27\u5730\u5740",
  price: "\u4ef7\u683c",
  orderTime: "\u4e0b\u5355\u65f6\u95f4",
  arrivalTime: "\u62b5\u8fbe\u65f6\u95f4",
  stayDays: "\u6ede\u7559\u65f6\u957f",
  track: "\u7269\u6d41\u8f68\u8ff9",
  updatedAt: "\u66f4\u65b0\u65f6\u95f4",
} as const;

const AUTO_REFRESH_MS = 10_000;

function asString(v: unknown): string {
  if (v == null) return "";
  return String(v);
}

function splitTrack(track: unknown): string[] {
  const text = asString(track).trim();
  if (!text) return [];

  return text
    .split(/\s*(?:->|=>|→|➡)\s*/g)
    .map((x) => x.trim())
    .filter(Boolean);
}

function formatDateTime(v: unknown): string {
  const text = asString(v).trim();
  if (!text) return "";

  const d = dayjs(text);
  return d.isValid() ? d.format("YYYY-MM-DD HH:mm:ss") : text;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

export default function App() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<ShipmentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [meta, setMeta] = useState<Meta>({ statuses: [], locations: [] });
  const [lastRefreshAt, setLastRefreshAt] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [location, setLocation] = useState<string | undefined>(undefined);

  const [selected, setSelected] = useState<ShipmentRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (status) params.set("status", status);
    if (location) params.set("location", location);
    params.set("limit", "1000");
    params.set("offset", "0");
    return params.toString();
  }, [q, status, location]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [m, data] = await Promise.all([
        fetchJson<Meta>("/api/meta"),
        fetchJson<{ total: number; data: ShipmentRow[] }>(`/api/shipments?${queryString}`),
      ]);
      setMeta(m);
      setRows(data.data);
      setTotal(data.total);
      setLastRefreshAt(new Date().toISOString());
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), AUTO_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  const allKeys = useMemo(() => {
    const fixedOrder: string[] = [
      K.orderNo,
      K.status,
      K.currentCenter,
      K.prevCenter,
      K.nextCenter,
      K.updatedAt,
      K.product,
      K.receiver,
      K.phone,
      K.address,
      K.price,
      K.orderTime,
      K.arrivalTime,
      K.stayDays,
      K.track,
    ];

    const set = new Set<string>(fixedOrder);
    for (const row of rows) {
      for (const key of Object.keys(row)) set.add(key);
    }

    const rest = Array.from(set).filter((k) => !fixedOrder.includes(k)).sort();
    return [...fixedOrder, ...rest];
  }, [rows]);

  const columns = useMemo(() => {
    return allKeys.map((key) => {
      const base: Record<string, unknown> = {
        title: key,
        dataIndex: key,
      };

      if (key === K.orderNo) {
        return {
          ...base,
          width: 170,
          render: (v: unknown) => <Typography.Text code>{asString(v)}</Typography.Text>,
        };
      }

      if (key === K.status) {
        return {
          ...base,
          width: 120,
          render: (v: unknown) => <Tag color="processing">{asString(v)}</Tag>,
        };
      }

      if (key === K.track || key === K.address) {
        return { ...base, width: 340, ellipsis: true };
      }

      if (key === K.product) {
        return { ...base, width: 220, ellipsis: true };
      }

      if (key === K.orderTime || key === K.arrivalTime || key === K.updatedAt) {
        return {
          ...base,
          width: 180,
          render: (v: unknown) => formatDateTime(v),
        };
      }

      return { ...base, width: 160, ellipsis: true };
    });
  }, [allKeys]);

  const selectedTrack = useMemo(() => splitTrack(selected?.[K.track]), [selected]);
  const selectedCurrent = asString(selected?.[K.currentCenter]).trim();

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#22c55e",
          borderRadius: 12,
          colorBgLayout: "#f5f7fb",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        },
      }}
    >
      <AntApp>
        <Layout style={{ minHeight: "100vh", background: "#f5f7fb" }}>
          <Layout.Header
            style={{
              background: "rgba(255,255,255,0.9)",
              borderBottom: "1px solid #eef1f6",
              padding: "0 18px",
            }}
          >
            <Space style={{ height: "100%", width: "100%", justifyContent: "space-between" }}>
              <Space>
                <Typography.Title level={4} style={{ margin: 0 }}>
                  物流看板
                </Typography.Title>
                <Badge count={total} showZero title="匹配条数" />
                <Typography.Text type="secondary">
                  自动刷新: {AUTO_REFRESH_MS / 1000} 秒
                </Typography.Text>
                <Typography.Text type="secondary">
                  最近刷新: {lastRefreshAt ? formatDateTime(lastRefreshAt) : "-"}
                </Typography.Text>
              </Space>

              <Space wrap>
                <Select
                  style={{ width: 160 }}
                  value={status}
                  onChange={(v) => setStatus(v)}
                  options={meta.statuses.map((s) => ({ value: s, label: s }))}
                  allowClear
                  placeholder="状态(全部)"
                />
                <Select
                  style={{ width: 220 }}
                  value={location}
                  onChange={(v) => setLocation(v)}
                  options={meta.locations.map((s) => ({ value: s, label: s }))}
                  allowClear
                  showSearch
                  placeholder="当前位置(全部)"
                  filterOption={(input, option) =>
                    (option?.label as string | undefined)?.toLowerCase().includes(input.toLowerCase()) ?? false
                  }
                />
                <Input
                  style={{ width: 420 }}
                  placeholder="搜索: 单号 / 收货人 / 电话 / 地址 / 轨迹 / 数据中心..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onPressEnter={() => void load()}
                  prefix={<SearchOutlined />}
                  allowClear
                />
                <Button icon={<ReloadOutlined />} onClick={() => void load()} loading={loading}>
                  刷新
                </Button>
              </Space>
            </Space>
          </Layout.Header>

          <Layout.Content style={{ padding: 18, overflowX: "auto" }}>
            <div style={{ maxWidth: 1400, margin: "0 auto" }}>
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                <Card
                  styles={{ body: { padding: 14 } }}
                  style={{
                    borderRadius: 16,
                    border: "1px solid #eef1f6",
                    boxShadow: "0 8px 30px rgba(16, 24, 40, 0.06)",
                  }}
                >
                  <Space style={{ width: "100%", justifyContent: "space-between" }} wrap>
                    <Space direction="vertical" size={0}>
                      <Typography.Title level={5} style={{ margin: 0 }}>
                        物流明细
                      </Typography.Title>
                      <Typography.Text type="secondary">点击任意行查看详情与轨迹</Typography.Text>
                    </Space>
                    <Typography.Text type="secondary">
                      共 {total} 条，当前展示 {rows.length} 条
                    </Typography.Text>
                  </Space>
                </Card>

                <Card
                  styles={{ body: { padding: 0 } }}
                  style={{
                    borderRadius: 16,
                    border: "1px solid #eef1f6",
                    boxShadow: "0 8px 30px rgba(16, 24, 40, 0.06)",
                    overflow: "hidden",
                  }}
                >
                  <Table
                    rowKey={(r) => asString(r[K.orderNo]) || JSON.stringify(r)}
                    loading={loading}
                    columns={columns as never}
                    dataSource={rows}
                    size="middle"
                    scroll={{ x: "max-content" }}
                    pagination={{
                      pageSize: 15,
                      showSizeChanger: false,
                      showTotal: (t) => `共 ${t} 条`,
                    }}
                    onRow={(record) => ({
                      onClick: () => {
                        setSelected(record);
                        setDrawerOpen(true);
                      },
                    })}
                  />
                </Card>
              </Space>
            </div>
          </Layout.Content>

          <Drawer
            title={selected ? `物流单号: ${asString(selected[K.orderNo])}` : "详情"}
            open={drawerOpen}
            width={720}
            onClose={() => setDrawerOpen(false)}
            destroyOnClose
          >
            {selected ? (
              <>
                <Descriptions column={2} size="small" bordered>
                  <Descriptions.Item label="状态">{asString(selected[K.status])}</Descriptions.Item>
                  <Descriptions.Item label="更新时间">{formatDateTime(selected[K.updatedAt]) || "-"}</Descriptions.Item>
                  <Descriptions.Item label="当前位置">{asString(selected[K.currentCenter])}</Descriptions.Item>
                  <Descriptions.Item label="上个数据中心">{asString(selected[K.prevCenter])}</Descriptions.Item>
                  <Descriptions.Item label="下个数据中心">{asString(selected[K.nextCenter])}</Descriptions.Item>
                  <Descriptions.Item label="滞留时长">{asString(selected[K.stayDays])}</Descriptions.Item>
                  <Descriptions.Item label="收货人">{asString(selected[K.receiver])}</Descriptions.Item>
                  <Descriptions.Item label="联系电话">{asString(selected[K.phone])}</Descriptions.Item>
                  <Descriptions.Item label="收货地址" span={2}>
                    {asString(selected[K.address])}
                  </Descriptions.Item>
                  <Descriptions.Item label="商品信息" span={2}>
                    {asString(selected[K.product])}
                  </Descriptions.Item>
                  <Descriptions.Item label="下单时间">{formatDateTime(selected[K.orderTime])}</Descriptions.Item>
                  <Descriptions.Item label="抵达时间">{formatDateTime(selected[K.arrivalTime])}</Descriptions.Item>
                </Descriptions>

                <div style={{ height: 16 }} />
                <Typography.Text strong>物流轨迹</Typography.Text>
                <div style={{ height: 8 }} />

                {selectedTrack.length > 0 ? (
                  <>
                    <Steps
                      direction="vertical"
                      size="small"
                      current={Math.max(0, selectedTrack.findIndex((x) => x === selectedCurrent))}
                      items={selectedTrack.map((point) => ({
                        title: point,
                        description: point === selectedCurrent ? "当前" : undefined,
                      }))}
                    />
                    <div style={{ height: 12 }} />
                    <Typography.Text type="secondary">{asString(selected[K.track])}</Typography.Text>
                  </>
                ) : (
                  <Typography.Text type="secondary">暂无轨迹</Typography.Text>
                )}
              </>
            ) : null}
          </Drawer>
        </Layout>
      </AntApp>
    </ConfigProvider>
  );
}
