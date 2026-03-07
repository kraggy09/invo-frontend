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
  Tag,
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
import { formatIndianNumber } from "../utils";
import dayjs from "dayjs";
import { Bill, BillCreatedBy } from "../store/bill.store";

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
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Date</span>,
      dataIndex: "createdAt",
      key: "date",
      render: (d: string) => (
        <div className="flex flex-col">
          <span className="font-bold text-gray-800">{dayjs(d).format("DD/MM/YYYY")}</span>
          <span className="text-[10px] font-bold text-gray-400">{dayjs(d).format("hh:mm A")}</span>
        </div>
      ),
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ID</span>,
      dataIndex: "id",
      key: "id",
      render: (id: string | number) => <span className="font-mono font-black text-indigo-500 text-xs">#{id}</span>,
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Products Total</span>,
      dataIndex: "productsTotal",
      key: "productsTotal",
      align: "right" as const,
      render: (t: number, record: Bill) => {
        const pTotal = t ?? record?.items?.reduce((sum: number, item: any) => sum + (item.total || 0), 0) ?? 0;
        return <span className="font-black text-gray-800">₹{formatIndianNumber(pTotal)}</span>;
      },
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Total</span>,
      dataIndex: "total",
      key: "total",
      align: "right" as const,
      render: (t: number) => <span className="font-black text-gray-800">₹{formatIndianNumber(t)}</span>,
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Payment</span>,
      dataIndex: "payment",
      key: "payment",
      align: "right" as const,
      render: (p: number) => <span className="font-black text-green-600">₹{formatIndianNumber(p)}</span>,
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Outstanding</span>,
      key: "outstanding",
      align: "right" as const,
      render: (_: unknown, record: any) => {
        let o = (record.total || 0) - (record.payment || 0);
        if (record.isReturn && record.paymentMode === 'ADJUSTMENT') {
          o = record.total;
        }

        return (
          <span className={`font-black ${o > 0 ? "text-orange-500" : o < 0 ? "text-green-500" : "text-gray-300"}`}>
            {o < 0 ? "-" : ""}₹{formatIndianNumber(Math.abs(o))}
          </span>
        );
      },
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Created By</span>,
      dataIndex: "createdBy",
      key: "createdBy",
      render: (u: BillCreatedBy) => (
        <span className="text-xs font-bold text-gray-500 capitalize">{u?.name || "System"}</span>
      ),
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center block">View</span>,
      key: "view",
      align: "center" as const,
      render: (_: unknown, record: any) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => {
            if (record.isReturn) {
              navigate(`/return-bills/${record._id}`, { state: { from: "customer" } });
            } else {
              navigate(`/bills/${record._id}`, { state: { from: "customer" } });
            }
          }}
          className="text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
        />
      ),
    },
  ];

  const transactionColumns = [
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Txn ID</span>,
      dataIndex: "id",
      key: "id",
      render: (id: string, record: any) => (
        <div className="flex flex-col">
          <span className="text-xs font-black text-indigo-600 uppercase tracking-tighter">#{id}</span>
          <span className="text-[10px] font-bold text-gray-400">{dayjs(record.createdAt).format("DD MMM, YYYY · hh:mm A")}</span>
        </div>
      ),
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Method/Purpose</span>,
      dataIndex: "purpose",
      key: "purpose",
      render: (v: string) => (
        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-lg">
          {v || "Standard Payment"}
        </span>
      ),
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-right block pr-4">Entry Amount</span>,
      dataIndex: "amount",
      key: "amount",
      render: (v: number) => (
        <div className="text-right pr-4">
          <span className="font-black text-green-600 tracking-tighter text-sm">₹{v.toLocaleString()}</span>
        </div>
      ),
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center block">Final Bal.</span>,
      dataIndex: "newOutstanding",
      key: "newOutstanding",
      render: (v: number) => (
        <div className="text-center">
          <span className="font-black text-gray-800 tracking-tighter text-xs">₹{v.toLocaleString()}</span>
        </div>
      ),
    },
    {
      title: "",
      key: "view",
      width: 60,
      render: (_: any, record: any) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/transactions/${record._id}`)}
          className="text-gray-400 hover:text-indigo-600 transition-colors"
        />
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
    <main className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-50/50 flex flex-col items-center">
      <div className="w-full max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <Button
            type="text"
            icon={<ArrowLeftOutlined className="text-[10px]" />}
            onClick={() => navigate("/customers")}
            className="flex items-center gap-2 font-black text-gray-400 hover:text-indigo-600 transition-all p-0 h-auto uppercase tracking-widest text-[10px]"
          >
            Terminal Root / CRM
          </Button>
          <div className="text-right hidden sm:block">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] block">Registry Sync 2.0</span>
            <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest text-right">Authorized Account Terminal</span>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden mb-8 group">
          <div className="bg-indigo-600 p-8 sm:p-12 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative overflow-hidden">
            <div className="relative z-10 flex items-center gap-6">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[32px] bg-white/10 backdrop-blur-md flex items-center justify-center text-3xl font-black border border-white/20 shadow-xl group-hover:scale-110 transition-transform duration-500">
                {customer?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-indigo-500/50 rounded-full mb-2 border border-indigo-400/30 backdrop-blur-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span className="text-[8px] font-black uppercase tracking-widest">Active Registry</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tighter leading-tight capitalize">{customer?.name}</h1>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs font-bold text-indigo-100/70 bg-white/5 border border-white/10 px-3 py-1 rounded-xl focus:outline-none">
                    {customer?.phone}
                  </span>
                  <span className="text-[10px] font-black text-indigo-100/40 uppercase tracking-widest">ID: {customer?._id?.slice(-6).toUpperCase()}</span>
                </div>
              </div>
            </div>
            <div className="relative z-10 bg-white/10 backdrop-blur-xl rounded-[32px] p-6 sm:p-8 border border-white/20 min-w-[220px] shadow-2xl">
              <span className="text-[10px] font-black text-indigo-100 uppercase tracking-widest block mb-1">Financial Exposure</span>
              <div className="text-4xl font-black tracking-tighter leading-none">
                <span className="text-indigo-200 text-lg mr-1 tracking-normal">₹</span>
                {Number(customer?.outstanding || 0).toLocaleString()}
              </div>
              <p className="text-[8px] font-black text-indigo-200/50 uppercase tracking-widest mt-2">{customer?.outstanding > 0 ? "Outstanding Amount" : "Settled"}</p>
            </div>

            <div className="absolute top-0 right-0 p-20 opacity-5 group-hover:scale-110 transition-transform duration-1000 rotate-12">
              <BarChartOutlined style={{ fontSize: 300 }} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden mb-12">
          <Tabs
            activeKey={tab}
            onChange={setTab}
            className="customer-tabs"
            items={[
              {
                key: "bills",
                label: <span className="px-6 py-4 font-black uppercase text-[10px] tracking-widest">Bill History</span>,
                children: (
                  <div className="p-2 sm:p-8">
                    <Table
                      columns={billColumns}
                      dataSource={
                        [
                          ...(customer?.bills || []).map((b: any) => ({ ...b, isReturn: false })),
                          ...(customer?.returnBills || []).map((rb: any) => ({
                            ...rb,
                            id: `R-${rb.id || rb._id}`,
                            productsTotal: rb.productsTotal,
                            total: rb.previousOutstanding - rb.productsTotal,
                            payment: rb.paymentMode === "CASH" ? -rb.totalAmount : 0,
                            isReturn: true
                          }))
                        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      }
                      rowKey="id"
                      pagination={{ pageSize: 10, showSizeChanger: true, className: "px-6 py-4" }}
                      scroll={{ x: 800 }}
                      className="modern-table"
                      rowClassName="group cursor-pointer hover:bg-indigo-50/30 transition-all duration-300"
                    />
                  </div>
                ),
              },
              {
                key: "transactions",
                label: <span className="px-6 py-4 font-black uppercase text-[10px] tracking-widest">Ledger Entries</span>,
                children: (
                  <div className="p-2 sm:p-8">
                    <Table
                      columns={transactionColumns}
                      dataSource={customer?.transactions || []}
                      rowKey="_id"
                      pagination={{ pageSize: 10, showSizeChanger: false, className: "px-6 py-4" }}
                      scroll={{ x: 800 }}
                      className="modern-table"
                      rowClassName="group cursor-pointer hover:bg-indigo-50/30 transition-all duration-300"
                    />
                  </div>
                ),
              },
              {
                key: "analytics",
                label: <span className="px-6 py-4 font-black uppercase text-[10px] tracking-widest">Insight Matrix</span>,
                children: (
                  <div className="p-4 sm:p-12">
                    {locked ? (
                      <div className="py-20 text-center max-w-sm mx-auto">
                        <div className="w-20 h-20 rounded-[32px] bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-8 shadow-inner border border-indigo-100">
                          <LockOutlined style={{ fontSize: 28 }} />
                        </div>
                        <h2 className="text-2xl font-black text-gray-800 mb-2 tracking-tight">Security Protocol</h2>
                        <p className="text-gray-400 text-xs font-bold mb-10 px-4">Authorized Admin Credentials Required to view comprehensive financial flow analytics.</p>
                        <Input.Password
                          value={pin}
                          onChange={(e) => setPin(e.target.value)}
                          placeholder="••••"
                          className="h-16 rounded-[24px] text-center text-3xl font-black mb-6 border-2 border-gray-50 bg-gray-50/30 focus:bg-white transition-all shadow-inner"
                          onPressEnter={handlePinSubmit}
                          maxLength={4}
                        />
                        <Button
                          type="primary"
                          onClick={handlePinSubmit}
                          className="w-full h-14 bg-indigo-600 border-none font-black text-[10px] tracking-widest rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 uppercase"
                        >
                          Verify & Decode Insights
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                          <div>
                            <h3 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-3">
                              <LineChartOutlined className="text-indigo-600" /> Revenue Flow
                            </h3>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-0.5">Time-Series Engagement Analytics</p>
                          </div>
                          <Select
                            value={analyticsDays}
                            onChange={(val: number) => setAnalyticsDays(val)}
                            className="w-full sm:w-48 h-12 rounded-2xl font-black"
                            options={[
                              { value: 7, label: "Last 7 Business Days" },
                              { value: 15, label: "Last 15 Cycles" },
                              { value: 30, label: "Last 30 Cycles" },
                              { value: 90, label: "Quarterly Analysis" }
                            ]}
                          />
                        </div>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          <div className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm transition-all hover:shadow-xl hover:shadow-blue-50/50 group">
                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-1">Gross Yield</span>
                            <div className="text-3xl font-black text-gray-800 tracking-tighter group-hover:text-blue-600 transition-colors">₹{Number(analyticsSummary.totalSales).toLocaleString()}</div>
                          </div>
                          <div className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm transition-all hover:shadow-xl hover:shadow-emerald-50/50 group">
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block mb-1">Net Margin</span>
                            <div className="text-3xl font-black text-gray-800 tracking-tighter group-hover:text-emerald-600 transition-colors">₹{Number(analyticsSummary.totalProfit).toLocaleString()}</div>
                          </div>
                          <div className="bg-indigo-600 border border-indigo-500 rounded-[32px] p-8 shadow-xl shadow-indigo-100 lg:col-span-1 sm:col-span-2 group">
                            <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest block mb-1">Total Liquidity</span>
                            <div className="text-3xl font-black text-white tracking-tighter">₹{Number(analyticsSummary.totalPayments).toLocaleString()}</div>
                          </div>
                        </div>

                        {/* Multi-Area Graph */}
                        <div className="bg-gray-50/50 rounded-[40px] p-6 sm:p-10 border border-gray-100">
                          <div style={{ width: '100%', height: 400 }}>
                            {analyticsLoading ? (
                              <div className="w-full h-full flex justify-center items-center"><Spin size="large" /></div>
                            ) : analyticsData.length === 0 ? (
                              <div className="w-full h-full flex flex-col justify-center items-center text-gray-400">
                                <BarChartOutlined style={{ fontSize: 40 }} className="mb-4 opacity-20" />
                                <p className="font-black text-[10px] uppercase tracking-[0.2em]">Insufficient Data Points</p>
                              </div>
                            ) : (
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={analyticsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                  <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                  <XAxis
                                    dataKey="date"
                                    tickFormatter={(dateStr) => dayjs(dateStr).format('D MMM')}
                                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 900 }}
                                    axisLine={false}
                                    tickLine={false}
                                    dy={15}
                                  />
                                  <YAxis
                                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 900 }}
                                    tickFormatter={(val) => `₹${val}`}
                                    axisLine={false}
                                    tickLine={false}
                                  />
                                  <ChartTooltip
                                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', padding: '20px' }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}
                                    labelStyle={{ marginBottom: '12px', fontWeight: 900, fontSize: '14px', color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}
                                  />
                                  <Legend verticalAlign="top" align="right" height={50} iconType="circle" wrapperStyle={{ fontWeight: 900, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                                  <Area type="monotone" name="Registry Sales" dataKey="sales" stroke="#6366f1" strokeWidth={5} fillOpacity={1} fill="url(#colorSales)" />
                                  <Area type="monotone" name="Net Profit" dataKey="profit" stroke="#10b981" strokeWidth={5} fillOpacity={1} fill="url(#colorProfit)" />
                                </AreaChart>
                              </ResponsiveContainer>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ),
              },
            ]}
          />
        </div>
      </div>

      <style>{`
        .customer-tabs .ant-tabs-nav {
          margin-bottom: 0 !important;
          border-bottom: 1px solid #f1f5f9;
          padding: 0 2rem;
        }
        .customer-tabs .ant-tabs-tab {
          margin: 0 !important;
          padding: 1.5rem 1.5rem !important;
          transition: all 0.3s ease !important;
        }
        .customer-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
          color: #4f46e5 !important;
        }
        .customer-tabs .ant-tabs-ink-bar {
          height: 4px !important;
          background: #4f46e5 !important;
          border-radius: 4px 4px 0 0;
        }
        .modern-table .ant-table {
          background: transparent !important;
        }
        .modern-table .ant-table-thead > tr > th {
          background: transparent !important;
          border-bottom: 1px solid #f8fafc !important;
          padding: 1.5rem 1rem !important;
        }
        .modern-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f8fafc !important;
          padding: 1.25rem 1rem !important;
        }
      `}</style>
    </main>
  );
};

export default IndividualCustomerPage;
