import { useEffect, useMemo, useRef, useState } from "react";
import {
  App as AntApp,
  Badge,
  Button,
  Card,
  ConfigProvider,
  Drawer,
  Input,
  Layout,
  Progress,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import { ReloadOutlined, SyncOutlined, WarningOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

type Row = Record<string, unknown>;

function asString(v: unknown): string {
  if (v == null) return "";
  return String(v);
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

export default function App() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [draftQ, setDraftQ] = useState("");
  const [draftStatus, setDraftStatus] = useState<string | undefined>(undefined);
  const [allStatuses, setAllStatuses] = useState<string[]>([]);

  const [state, setState] = useState<{
    running: boolean;
    lastRunAt: string | null;
    lastError: string | null;
    scanned: number;
    found: number;
    config: { LOGISTICS_API: string; PORT: number; BATCH_SIZE: number; INTERVAL_MS: number };
  } | null>(null);

  const [selected, setSelected] = useState<Row | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [demoSec, setDemoSec] = useState(0);
  const DEMO_MAX_SEC = 35;
  const BACKEND_POLL_MS = 10_000;

  const appliedRef = useRef<{ q: string; status?: string }>({ q: "", status: undefined });
  const requestSeqRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const buildQueryString = (nextQ: string, nextStatus?: string) => {
    const p = new URLSearchParams();
    if (nextQ.trim()) p.set("q", nextQ.trim());
    if (nextStatus) p.set("status", nextStatus);
    return p.toString();
  };

  const statusOptions = useMemo(() => {
    return [{ value: "__ALL__", label: "全部" }, ...allStatuses.map((s) => ({ value: s, label: s }))];
  }, [allStatuses]);

  const load = async (override?: { q?: string; status?: string }) => {
    const seq = ++requestSeqRef.current;
    if (abortRef.current) abortRef.current.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setLoading(true);
    try {
      const base = appliedRef.current;
      const nextQ = override?.q ?? base.q;
      const nextStatus = override?.status ?? base.status;
      const qs = buildQueryString(nextQ, nextStatus);
      const [st, meta, data] = await Promise.all([
        fetchJson("/api/state", { signal: ac.signal }),
        fetchJson<{ statuses: string[] }>("/api/problems-meta", { signal: ac.signal }),
        fetchJson<{ total: number; data: Row[] }>(`/api/problems?${qs}`, { signal: ac.signal }),
      ]);

      if (seq !== requestSeqRef.current) return; // stale response
      setState(st as never);
      setAllStatuses(meta.statuses);
      setRows(data.data);
      setTotal(data.total);
    } catch (e) {
      if ((e as { name?: string }).name === "AbortError") return;
      throw e;
    } finally {
      if (seq === requestSeqRef.current) setLoading(false);
    }
  };

  const runOnce = async () => {
    await fetchJson("/api/run", { method: "POST" });
    await load();
  };

  useEffect(() => {
    appliedRef.current = { q, status };
    void load({ q, status });

    // 后台系统每 10 秒读取一次（对齐你的演示口径）
    const poll = window.setInterval(() => void load(), BACKEND_POLL_MS);

    // 演示计时器：0 -> 35 秒
    setDemoSec(0);
    const tick = window.setInterval(() => {
      setDemoSec((s) => {
        if (s >= DEMO_MAX_SEC) return s;
        return s + 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(poll);
      window.clearInterval(tick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const applyFilter = async () => {
    const nextQ = draftQ;
    const nextStatus = draftStatus;
    appliedRef.current = { q: nextQ, status: nextStatus };
    setQ(nextQ);
    setStatus(nextStatus);
    await load({ q: nextQ, status: nextStatus });
  };

  const columns = [
    {
      title: "物流单号",
      dataIndex: "物流单号",
      width: 180,
      render: (v: unknown) => <Typography.Text code>{asString(v)}</Typography.Text>,
    },
    {
      title: "状态",
      dataIndex: "状态",
      width: 120,
      render: (v: unknown) => <Tag color="red">{asString(v) || "-"}</Tag>,
    },
    { title: "当前位置", dataIndex: "当前位置", width: 180, ellipsis: true },
    { title: "收货人信息", dataIndex: "收货人信息", width: 120, ellipsis: true },
    { title: "联系电话", dataIndex: "联系电话", width: 150 },
    { title: "收货地址", dataIndex: "收货地址", width: 360, ellipsis: true },
    { title: "商品信息", dataIndex: "商品信息", width: 220, ellipsis: true },
  ];

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#22c55e",
          borderRadius: 12,
          colorBgLayout: "#f5f7fb",
        },
      }}
    >
      <AntApp>
        <Layout style={{ minHeight: "100vh", background: "#f5f7fb" }}>
          <Layout.Header style={{ background: "#fff", borderBottom: "1px solid #eef1f6", padding: "0 18px" }}>
            <Space style={{ height: "100%", width: "100%", justifyContent: "space-between" }}>
              <Space>
                <WarningOutlined style={{ color: "#ef4444" }} />
                <Typography.Title level={4} style={{ margin: 0 }}>
                  后台系统 · 问题件订单
                </Typography.Title>
                <Badge count={total} showZero />
              </Space>
              <Space wrap>
                <Select
                  style={{ width: 180 }}
                  value={draftStatus ?? "__ALL__"}
                  onChange={(v) => setDraftStatus(v === "__ALL__" ? undefined : v)}
                  options={statusOptions}
                  placeholder="状态"
                />
                <Input
                  style={{ width: 420 }}
                  placeholder="搜索：单号/地址/电话/状态..."
                  value={draftQ}
                  onChange={(e) => setDraftQ(e.target.value)}
                  onPressEnter={() => void applyFilter()}
                  allowClear
                />
                <Button type="primary" onClick={() => void applyFilter()} loading={loading}>
                  应用筛选
                </Button>
                <Button icon={<SyncOutlined />} onClick={() => void runOnce()} loading={loading}>
                  处理一批
                </Button>
                <Button icon={<ReloadOutlined />} onClick={() => void load()} loading={loading}>
                  刷新
                </Button>
              </Space>
            </Space>
          </Layout.Header>

          <Layout.Content style={{ padding: 18 }}>
            <div style={{ maxWidth: 1400, margin: "0 auto" }}>
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                <Card
                  style={{
                    borderRadius: 16,
                    border: "1px solid #eef1f6",
                    boxShadow: "0 8px 30px rgba(16, 24, 40, 0.06)",
                  }}
                  styles={{ body: { padding: 14 } }}
                >
                  <Space style={{ width: "100%", justifyContent: "space-between" }} wrap>
                    <Space direction="vertical" size={0}>
                      <Typography.Text strong>处理策略</Typography.Text>
                      <Typography.Text type="secondary">
                        每 {state ? state.config.INTERVAL_MS / 1000 : 10} 秒处理 {state ? state.config.BATCH_SIZE : 1000} 条
                      </Typography.Text>
                      <Typography.Text type="secondary">
                        演示计时：{demoSec} / {DEMO_MAX_SEC} 秒（后台每 10 秒自动刷新）
                      </Typography.Text>
                      <Progress
                        percent={Math.round((Math.min(demoSec, DEMO_MAX_SEC) / DEMO_MAX_SEC) * 100)}
                        size="small"
                        showInfo={false}
                      />
                    </Space>
                    <Space direction="vertical" size={0} style={{ textAlign: "right" }}>
                      <Typography.Text type="secondary">
                        上次运行：{state?.lastRunAt ? dayjs(state.lastRunAt).format("YYYY-MM-DD HH:mm:ss") : "-"}
                      </Typography.Text>
                      <Typography.Text type="secondary">
                        本次扫描：{state?.scanned ?? 0}，新增问题件：{state?.found ?? 0}
                      </Typography.Text>
                      {state?.lastError ? (
                        <Typography.Text type="danger">错误：{state.lastError}</Typography.Text>
                      ) : null}
                    </Space>
                  </Space>
                </Card>

                <Card
                  style={{
                    borderRadius: 16,
                    border: "1px solid #eef1f6",
                    boxShadow: "0 8px 30px rgba(16, 24, 40, 0.06)",
                    overflow: "hidden",
                  }}
                  styles={{ body: { padding: 0 } }}
                >
                  <Table
                    rowKey={(r) => asString(r["物流单号"]) || JSON.stringify(r)}
                    loading={loading}
                    columns={columns as never}
                    dataSource={rows}
                    size="middle"
                    scroll={{ x: "max-content" }}
                    pagination={{ pageSize: 15, showSizeChanger: false }}
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
            title={selected ? `物流单号：${asString(selected["物流单号"])}` : "详情"}
            open={drawerOpen}
            width={720}
            onClose={() => setDrawerOpen(false)}
            destroyOnClose
          >
            {selected ? (
              <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {JSON.stringify(selected, null, 2)}
              </pre>
            ) : null}
          </Drawer>
        </Layout>
      </AntApp>
    </ConfigProvider>
  );
}
