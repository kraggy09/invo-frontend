import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Tabs,
  Table,
  Statistic,
  Input,
  Button,
  message,
  Spin,
  Tooltip,
  Select,
} from "antd";
import {
  ArrowLeftOutlined,
  EyeOutlined,
  LockOutlined,
  BarChartOutlined,
  LineChartOutlined,
} from "@ant-design/icons";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import apiCaller from "../utils/apiCaller";
import dayjs from "dayjs";

const ACCENT = "#2563eb";

const IndividualCustomerPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(true);
  const [pin, setPin] = useState("");
  const [tab, setTab] = useState("bills");
  const [analyticsDays, setAnalyticsDays] = useState(7);
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [analyticsSummary, setAnalyticsSummary] = useState({ totalSales: 0, totalProfit: 0, totalPayments: 0 });
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCustomer() {
      setLoading(true);
      setError(null);
      try {
        const res = await apiCaller.get(`/customers/${id}`);
        setCustomer(res.data.data.customer);
        console.log(res.data.data.customer, "This is the customer data");
      } catch (err: any) {
        setError("Failed to fetch customer details");
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchCustomer();
  }, [id]);

  useEffect(() => {
    async function fetchAnalytics() {
      if (!id || locked || tab !== "analytics") return;
      setAnalyticsLoading(true);
      try {
        const res = await apiCaller.get(`/customers/${id}/analytics?days=${analyticsDays}`);
        if (res.data.success) {
          setAnalyticsData(res.data.data.chartData);
          setAnalyticsSummary(res.data.data.summary);
        }
      } catch (err: any) {
        message.error("Failed to fetch customer analytics");
      } finally {
        setAnalyticsLoading(false);
      }
    }
    fetchAnalytics();
  }, [id, locked, tab, analyticsDays]);


  const billColumns = [
    {
      title: "Bill Id",
      dataIndex: "id",
      key: "id",
      render: (id: string) => (
        <span className="font-mono text-xs bg-gray-50 px-2 py-1 rounded">
          {id}
        </span>
      ),
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (v: string) =>
        v ? (
          <span>
            {dayjs(v).format("DD/MM/YYYY")}
            <span className="text-gray-400 text-xs block">
              {dayjs(v).format("hh:mm A")}
            </span>
          </span>
        ) : (
          "-"
        ),
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      render: (v: number) => (
        <span className="font-semibold text-blue-700">₹{v}</span>
      ),
    },
    {
      title: "Outstanding",
      dataIndex: "outstanding",
      key: "outstanding",
      render: (v: number) => (
        <span className="font-semibold text-orange-600">{v}</span>
      ),
    },
    {
      title: "Payment",
      dataIndex: "payment",
      key: "payment",
      render: (v: number) => (
        <span className="font-semibold text-green-700">₹{v}</span>
      ),
    },
    {
      title: "",
      key: "view",
      render: (_: any, record: any) => (
        <Tooltip title="View Bill">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/bills/${record._id}`)}
          />
        </Tooltip>
      ),
    },
  ];

  const transactionColumns = [
    {
      title: "Trans. Id",
      dataIndex: "id",
      key: "id",
      render: (id: string) => (
        <span className="font-mono text-xs bg-gray-50 px-2 py-1 rounded">
          {id}
        </span>
      ),
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (v: string) =>
        v ? (
          <span>
            {dayjs(v).format("DD/MM/YYYY")}
            <span className="text-gray-400 text-xs block">
              {dayjs(v).format("hh:mm A")}
            </span>
          </span>
        ) : (
          "-"
        ),
    },
    {
      title: "Purpose",
      dataIndex: "purpose",
      key: "purpose",
      render: (v: string) => <span className="capitalize">{v || "-"}</span>,
    },
    {
      title: "Payment",
      dataIndex: "amount",
      key: "amount",
      render: (v: number) => (
        <span className="font-semibold text-green-700">₹{v}</span>
      ),
    },
    {
      title: "Prev. Outstanding",
      dataIndex: "previousOutstanding",
      key: "previousOutstanding",
      render: (v: number) => <span className="text-gray-500">{v}</span>,
    },
    {
      title: "New Outstanding",
      dataIndex: "newOutstanding",
      key: "newOutstanding",
      render: (v: number) => <span className="text-gray-700">{v}</span>,
    },
    {
      title: "",
      key: "view",
      render: (_: any, record: any) => (
        <Tooltip title="View Transaction">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/transactions/${record._id}`)}
          />
        </Tooltip>
      ),
    },
  ];

  const handlePinSubmit = () => {
    if (pin === "1234") {
      setLocked(false);
      setPin("");
    } else {
      message.error("Incorrect PIN");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-red-500">
        <p>{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white p-4 md:p-10">
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate("/customers")}
        className="mb-4"
      >
        Back to Customers
      </Button>
      <div className="max-w-3xl mx-auto">
        <Card
          className="mb-8 shadow-md border border-gray-100"
          bodyStyle={{ padding: 24 }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2 text-gray-800 capitalize">
                {customer?.name}
              </h2>
              <div className="text-gray-500 mb-1">
                Mobile: <span className="font-mono">{customer?.phone}</span>
              </div>
              <div className="text-gray-500 mb-1">
                Customer ID: <span className="font-mono">{customer?._id}</span>
              </div>
            </div>
            <Statistic
              title={<span className="text-gray-500">Outstanding</span>}
              value={customer?.outstanding || 0}
              prefix="₹"
              valueStyle={{ color: ACCENT, fontWeight: 700, fontSize: 28 }}
              className="min-w-[160px]"
            />
          </div>
        </Card>
        <Card className="shadow-md border border-gray-100">
          <Tabs
            activeKey={tab}
            onChange={setTab}
            items={[
              {
                key: "bills",
                label: "Bills",
                children: (
                  <Table
                    columns={billColumns}
                    dataSource={customer?.bills || []}
                    rowKey="id"
                    pagination={{ pageSize: 5 }}
                    className="modern-table"
                  />
                ),
              },
              {
                key: "transactions",
                label: "Transactions",
                children: (
                  <Table
                    columns={transactionColumns}
                    dataSource={customer?.transactions || []}
                    rowKey="id"
                    pagination={{ pageSize: 5 }}
                    className="modern-table"
                  />
                ),
              },
              // OPTIONAL: Enable analytics protected by PIN
              {
                key: "analytics",
                label: "Analytics",
                children: locked ? (
                  <Card className="max-w-md mx-auto mt-10 text-center border-0 shadow-none">
                    <LockOutlined style={{ fontSize: 40, color: ACCENT }} />
                    <div className="font-semibold text-gray-700 mt-4 mb-2 text-lg">
                      Enter Admin PIN to view analytics
                    </div>
                    <Input.Password
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      placeholder="Enter 4-digit PIN"
                      style={{ width: 220, marginBottom: 16 }}
                      onPressEnter={handlePinSubmit}
                      size="large"
                    />
                    <br />
                    <Button
                      type="primary"
                      onClick={handlePinSubmit}
                      style={{ background: ACCENT }}
                      size="large"
                      className="w-[220px]"
                    >
                      Unlock Insights
                    </Button>
                  </Card>
                ) : (
                  <div className="py-2">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <LineChartOutlined className="text-blue-600" /> Financial Overview
                      </h3>
                      <div>
                        <span className="text-gray-500 mr-2 text-sm">Timeframe:</span>
                        <Select
                          value={analyticsDays}
                          onChange={(val: number) => setAnalyticsDays(val)}
                          style={{ width: 120 }}
                          options={[
                            { value: 7, label: "Last 7 Days" },
                            { value: 15, label: "Last 15 Days" },
                            { value: 30, label: "Last 30 Days" },
                            { value: 45, label: "Last 45 Days" }
                          ]}
                        />
                      </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                      <Card className="bg-blue-50/50 border border-blue-100 shadow-sm" bodyStyle={{ padding: 16 }}>
                        <Statistic title={<span className="text-blue-600 font-medium">Gross Sales</span>} value={Number(analyticsSummary.totalSales).toFixed(2)} prefix="₹" valueStyle={{ color: '#1e3a8a' }} />
                      </Card>
                      <Card className="bg-green-50/50 border border-green-100 shadow-sm" bodyStyle={{ padding: 16 }}>
                        <Statistic title={<span className="text-green-600 font-medium">Total Profit</span>} value={Number(analyticsSummary.totalProfit).toFixed(2)} prefix="₹" valueStyle={{ color: '#166534' }} />
                      </Card>
                      <Card className="bg-purple-50/50 border border-purple-100 shadow-sm" bodyStyle={{ padding: 16 }}>
                        <Statistic title={<span className="text-purple-600 font-medium">Payments Tracked</span>} value={Number(analyticsSummary.totalPayments).toFixed(2)} prefix="₹" valueStyle={{ color: '#6b21a8' }} />
                      </Card>
                    </div>

                    {/* Multi-Area Graph */}
                    <div className="bg-white p-4 border border-gray-100 rounded-lg shadow-sm" style={{ height: 400 }}>
                      {analyticsLoading ? (
                        <div className="w-full h-full flex justify-center items-center"><Spin /></div>
                      ) : analyticsData.length === 0 ? (
                        <div className="w-full h-full flex justify-center items-center text-gray-400">No analytical data available for this range.</div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={analyticsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                              </linearGradient>
                              <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                              </linearGradient>
                              <linearGradient id="colorPayment" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.4} />
                            <XAxis
                              dataKey="date"
                              tickFormatter={(dateStr) => dayjs(dateStr).format('MMM D')}
                              tick={{ fontSize: 12, fill: '#6b7280' }}
                              axisLine={false}
                              tickLine={false}
                              dy={10}
                            />
                            <YAxis
                              tick={{ fontSize: 12, fill: '#6b7280' }}
                              tickFormatter={(val) => `₹${Number(val).toFixed(0)}`}
                              axisLine={false}
                              tickLine={false}
                              dx={-10}
                            />
                            <ChartTooltip
                              formatter={(value: number) => [`₹${Number(value).toFixed(2)}`, ""]}
                              labelFormatter={(label) => dayjs(label).format("MMMM D, YYYY")}
                              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '13px', paddingTop: '5px' }} />
                            <Area type="monotone" name="Gross Sales" dataKey="sales" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                            <Area type="monotone" name="True Profit" dataKey="profit" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
                            <Area type="monotone" name="Inbound Payments" dataKey="payment" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorPayment)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                ),
              },
            ]}
          />
        </Card>
      </div>
    </main>
  );
};

export default IndividualCustomerPage;
