import { useEffect, useMemo, useState } from "react";
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

function asString(v: unknown): string {
  if (v == null) return "";
  return String(v);
}

function splitTrack(track: unknown): string[] {
  const s = asString(track).trim();
  if (!s) return [];
  return s.split("→").map((x) => x.trim()).filter(Boolean);
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

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [location, setLocation] = useState<string | undefined>(undefined);

  const [selected, setSelected] = useState<ShipmentRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    if (status) p.set("status", status);
    if (location) p.set("location", location);
    p.set("limit", "1000");
    p.set("offset", "0");
    return p.toString();
  }, [q, status, location]);

  const load = async () => {
    setLoading(true);
    try {
      const [m, data] = await Promise.all([
        fetchJson<Meta>("/api/meta"),
        fetchJson<{ total: number; data: ShipmentRow[] }>(`/api/shipments?${queryString}`),
      ]);
      setMeta(m);
      setRows(data.data);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allKeys = useMemo(() => {
    const order = [
      "物流单号",
      "状态",
      "当前位置",
      "上个数据中心",
      "下个数据中心",
      "商品信息",
      "收货人信息",
      "联系电话",
      "收货地址",
      "价格",
      "下单时间",
      "抵达时间",
      "滞留时长",
      "物流轨迹",
    ];
    const set = new Set<string>(order);
    for (const r of rows) for (const k of Object.keys(r)) set.add(k);
    const rest = Array.from(set).filter((k) => !order.includes(k)).sort();
    return [...order, ...rest];
  }, [rows]);

  const columns = useMemo(() => {
    return allKeys.map((key) => {
      const base: Record<string, unknown> = { title: key, dataIndex: key };

      if (key === "物流单号") {
        return {
          ...base,
          width: 170,
          render: (v: unknown) => <Typography.Text code>{asString(v)}</Typography.Text>,
        };
      }
      if (key === "状态") {
        return { ...base, width: 110, render: (v: unknown) => <Tag>{asString(v)}</Tag> };
      }
      if (key === "物流轨迹") {
        return { ...base, width: 360, ellipsis: true };
      }
      if (key === "收货地址") {
        return { ...base, width: 360, ellipsis: true };
      }
      if (key === "商品信息") {
        return { ...base, width: 180, ellipsis: true };
      }
      if (key === "联系电话") {
        return { ...base, width: 150, render: (v: unknown) => asString(v) };
      }
      if (key === "价格") {
        return { ...base, width: 110, render: (v: unknown) => (asString(v) ? `¥ ${asString(v)}` : "") };
      }
      if (key === "下单时间" || key === "抵达时间") {
        return {
          ...base,
          width: 170,
          render: (v: unknown) => {
            const s = asString(v);
            if (!s) return "";
            const d = dayjs(s);
            return d.isValid() ? d.format("YYYY-MM-DD HH:mm:ss") : s;
          },
        };
      }

      return { ...base, width: 160, ellipsis: true };
    });
  }, [allKeys]);

  const header = (
    <Layout.Header
      className="app-header"
      style={{
        background: "rgba(255,255,255,0.85)",
        borderBottom: "1px solid #eef1f6",
        padding: "0 18px",
      }}
    >
      <Space style={{ height: "100%", width: "100%", justifyContent: "space-between" }}>
        <Space>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: "#22c55e",
              boxShadow: "0 0 0 4px rgba(34,197,94,0.18)",
            }}
          />
          <Typography.Title level={4} style={{ margin: 0, letterSpacing: 0.2 }}>
            物流看板
          </Typography.Title>
          <Badge count={total} showZero title="匹配条数" />
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
            placeholder="搜索：单号 / 收货人 / 电话 / 地址 / 轨迹 / 数据中心..."
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
  );

  const content = (
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
                共 {total} 条 · 当前展示 {rows.length} 条
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
              rowKey={(r) => asString(r["物流单号"]) || JSON.stringify(r)}
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
  );

  const drawer = (
    <Drawer
      title={selected ? `物流单号：${asString(selected["物流单号"])}` : "详情"}
      open={drawerOpen}
      width={720}
      onClose={() => setDrawerOpen(false)}
      destroyOnClose
    >
      {selected ? (
        <>
          <Descriptions column={2} size="small" bordered>
            <Descriptions.Item label="状态">{asString(selected["状态"])}</Descriptions.Item>
            <Descriptions.Item label="当前位置">{asString(selected["当前位置"])}</Descriptions.Item>
            <Descriptions.Item label="上个数据中心">{asString(selected["上个数据中心"])}</Descriptions.Item>
            <Descriptions.Item label="下个数据中心">{asString(selected["下个数据中心"])}</Descriptions.Item>
            <Descriptions.Item label="收货人">{asString(selected["收货人信息"])}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{asString(selected["联系电话"])}</Descriptions.Item>
            <Descriptions.Item label="收货地址" span={2}>
              {asString(selected["收货地址"])}
            </Descriptions.Item>
            <Descriptions.Item label="商品信息" span={2}>
              {asString(selected["商品信息"])}
            </Descriptions.Item>
            <Descriptions.Item label="下单时间">{asString(selected["下单时间"])}</Descriptions.Item>
            <Descriptions.Item label="抵达时间">{asString(selected["抵达时间"])}</Descriptions.Item>
            <Descriptions.Item label="滞留时长" span={2}>
              {asString(selected["滞留时长"])}
            </Descriptions.Item>
          </Descriptions>

          <div style={{ height: 16 }} />
          <Typography.Text strong>物流轨迹</Typography.Text>
          <div style={{ height: 8 }} />
          <Steps
            direction="vertical"
            size="small"
            current={Math.max(
              0,
              splitTrack(selected["物流轨迹"]).findIndex((x) => x === asString(selected["当前位置"]).trim()),
            )}
            items={splitTrack(selected["物流轨迹"]).map((t) => ({
              title: t,
              description:
                t === asString(selected["当前位置"]).trim()
                  ? "当前"
                  : t === asString(selected["上个数据中心"]).trim()
                    ? "上个"
                    : t === asString(selected["下个数据中心"]).trim()
                      ? "下个"
                      : undefined,
            }))}
          />
          <div style={{ height: 12 }} />
          <Typography.Text type="secondary">{asString(selected["物流轨迹"])}</Typography.Text>
        </>
      ) : null}
    </Drawer>
  );

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
          {header}
          {content}
          {drawer}
        </Layout>
      </AntApp>
    </ConfigProvider>
  );
}
