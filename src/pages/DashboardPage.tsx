import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  ResponsiveContainer,
  Tooltip,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  LineChartOutlined,
  DollarOutlined,
  FileTextOutlined,
  ShoppingOutlined,
  UserOutlined,
  ClockCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from "@ant-design/icons";
import InventoryRequest, {
  IInventoryRequest,
} from "../components/InventoryRequest";
import { formatIndianNumber } from "../utils";
import apiCaller from "../utils/apiCaller";
import dayjs from "dayjs";

interface SalesData {
  _id: string;
  totalAmount: number;
}
interface TransData {
  _id: string;
  totalTrans: number;
}
interface PaymentStatusData {
  status: string;
  count: number;
  amount: number;
}
interface TopProductData {
  name: string;
  sales: number;
  revenue: number;
  change: string;
}
interface RecentCustomerData {
  name: string;
  amount: number;
  time: string;
  type: string;
}

interface DashboardData {
  totalCurrSales: { overallSales: number }[];
  totalPreviousSales: { overallSales: number }[];
  currentTransactions: { overallPayment: number }[];
  previousTransaction: { overallPayment: number }[];
  sales: SalesData[];
  trans: TransData[];
  outstanding: number;
  paymentStatus: PaymentStatusData[];
  topProducts: TopProductData[];
  recentCustomers: RecentCustomerData[];
  dailySummary: {
    todaySales: number;
    todayTransactions: number;
    averageTicket: number;
    peakHour: string;
    topProductsToday?: { name: string; sales: number; revenue: number }[];
  };
  quickStats: {
    totalCustomers: number;
    activeCustomers: number;
    newCustomers: number;
    returningCustomers: number;
  };
}

const DashboardPage = () => {
  const [days, setDays] = useState(7);
  const [inventoryRequests, setInventoryRequests] = useState<
    IInventoryRequest[]
  >([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  const getIncrease = (curr: number, prev: number) => {
    if (!prev || prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  };

  const getInventoryRequests = async () => {
    try {
      const res = await apiCaller.get("/stocks/requests");
      setInventoryRequests(res.data.data);
    } catch (error) {
      console.log("Error fetching inventory requests:", error);
    }
  };

  const getDashboardData = async () => {
    try {
      const res = await apiCaller.post("/admin/dashboard", { days });
      setDashboardData(res.data);
    } catch (error) {
      console.log("Error fetching dashboard data:", error);
    }
  };

  // ALL THE DATA FETCHING LOGIC GOES HERE
  useEffect(() => {
    getInventoryRequests();
    getDashboardData();
  }, [days]);

  const mergedData = dashboardData?.sales.map((sale) => {
    const trans = dashboardData.trans.find((tran) => tran._id === sale._id);
    return {
      date: sale._id,
      totalAmount: sale.totalAmount,
      totalTrans: trans ? trans.totalTrans : 0,
    };
  }) || [];

  return (
    <main className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tighter leading-tight">Terminal Command</h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Cross-Terminal Analytical Intelligence</p>
          </div>
          <div className="flex items-center bg-white p-2 rounded-[24px] shadow-sm border border-gray-100/50">
            {[7, 15, 30].map((day) => (
              <button
                key={day}
                onClick={() => setDays(day)}
                className={`px-8 py-2.5 rounded-[18px] text-[10px] font-black transition-all duration-500 uppercase tracking-widest ${days === day
                  ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100 scale-105"
                  : "text-gray-400 hover:text-indigo-600 hover:bg-indigo-50/50"
                  }`}
              >
                {day} Days
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Content Area - 8 Columns */}
          <div className="lg:col-span-8 space-y-8">
            {/* Top Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {[
                {
                  label: "Gross Yield",
                  value: dashboardData?.totalCurrSales?.[0]?.overallSales || 0,
                  prev: dashboardData?.totalPreviousSales?.[0]?.overallSales || 0,
                  icon: <LineChartOutlined />,
                  color: "indigo",
                  bg: "bg-indigo-50/30"
                },
                {
                  label: "Net Inflow",
                  value: dashboardData?.currentTransactions?.[0]?.overallPayment || 0,
                  prev: dashboardData?.previousTransaction?.[0]?.overallPayment || 0,
                  icon: <DollarOutlined />,
                  color: "green",
                  bg: "bg-green-50/30"
                },
                {
                  label: "Passive Arrears",
                  value: dashboardData?.outstanding || 0,
                  prev: null,
                  icon: <FileTextOutlined />,
                  color: "orange",
                  bg: "bg-orange-50/30"
                }
              ].map((stat, i) => (
                <div key={i} className={`p-8 rounded-[32px] shadow-sm border border-gray-100 relative overflow-hidden group hover:border-gray-200 transition-all duration-500 ${stat.bg}`}>
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-${stat.color}-500 opacity-[0.03] rounded-full -mr-16 -mt-16 group-hover:scale-125 transition-transform duration-1000`} />
                  <div className="relative z-10">
                    <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-500 text-white flex items-center justify-center mb-6 text-xl shadow-lg shadow-${stat.color}-100 group-hover:rotate-6 transition-transform duration-500`}>
                      {stat.icon}
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">{stat.label}</p>
                    <h3 className="text-3xl font-black text-gray-800 tracking-tighter mb-2">₹{formatIndianNumber(stat.value)}</h3>
                    {stat.prev !== null && (
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black ${getIncrease(stat.value, stat.prev) >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>
                        {getIncrease(stat.value, stat.prev) >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                        {Math.abs(getIncrease(stat.value, stat.prev)).toFixed(1)}% Yield
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Area Chart Card */}
            <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-12">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-8 bg-indigo-600 rounded-full" />
                  <h3 className="text-sm font-black text-gray-800 uppercase tracking-[0.2em]">Revenue Velocity Matrix</h3>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-indigo-600" />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Yield</span>
                </div>
              </div>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mergedData}>
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }}
                      tickMargin={20}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }}
                      tickFormatter={(val) => `₹${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '24px',
                        border: 'none',
                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                        padding: '16px',
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(10px)'
                      }}
                      itemStyle={{ fontWeight: 900, fontSize: '12px', color: '#4f46e5' }}
                      labelStyle={{ fontWeight: 900, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', color: '#94a3b8' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="totalAmount"
                      stroke="#4f46e5"
                      strokeWidth={6}
                      fillOpacity={1}
                      fill="url(#chartGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Daily Breakdown */}
            {dashboardData?.dailySummary && (
              <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100 relative overflow-hidden group">
                <div className="flex items-center justify-between mb-10">
                  <h3 className="text-sm font-black text-gray-800 uppercase tracking-[0.2em]">Operational Insight Logic</h3>
                  <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-full border border-indigo-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                    <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Real-time Node</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
                  {[
                    { label: "Today's Sales", val: `₹${formatIndianNumber(dashboardData.dailySummary.todaySales)}`, icon: <DollarOutlined />, color: "text-blue-600" },
                    { label: "Today's Transactions", val: dashboardData.dailySummary.todayTransactions, icon: <FileTextOutlined />, color: "text-green-600" },
                    { label: "Average Ticket", val: `₹${formatIndianNumber(dashboardData.dailySummary.averageTicket)}`, icon: <ArrowUpOutlined />, color: "text-purple-600" },
                    { label: "Peak Hour", val: dashboardData.dailySummary.peakHour, icon: <ClockCircleOutlined />, color: "text-orange-600" }
                  ].map((x, i) => (
                    <div key={i} className="group/item">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 group-hover/item:text-indigo-400 transition-colors">{x.label}</p>
                      <p className={`text-2xl font-black ${x.color} tracking-tighter`}>{x.val}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-gray-50/30 rounded-[32px] p-8 border border-gray-50/50">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Top Products Today</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {dashboardData.dailySummary.topProductsToday?.map((p, i) => (
                      <div key={i} className="flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-gray-50 hover:border-indigo-100 transition-all group/asset">
                        <span className="font-black text-gray-700 uppercase text-[11px] tracking-tight">{p.name}</span>
                        <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 group-hover/asset:bg-indigo-600 group-hover/asset:border-indigo-600 transition-all">
                          <span className="text-indigo-600 group-hover:text-white text-[10px] font-black uppercase tracking-widest">
                            {p.sales.toFixed(0)} Units
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Inventory Requests */}
            <div className="bg-white p-2 rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
              <InventoryRequest inventoryRequests={inventoryRequests} setInventoryRequests={setInventoryRequests} />
            </div>
          </div>

          {/* Sidebar - 4 Columns */}
          <div className="lg:col-span-4 space-y-8">
            {/* Quick Access Matrix */}
            <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100">
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-[0.2em] mb-8">System Access Root</h3>
              <div className="grid grid-cols-2 gap-6">
                {[
                  { to: "/new-bill", icon: <DollarOutlined />, label: "Billing", color: "text-indigo-600", bg: "hover:bg-indigo-50/50" },
                  { to: "/products", icon: <ShoppingOutlined />, label: "Inventory", color: "text-green-600", bg: "hover:bg-green-50/50" },
                  { to: "/customers", icon: <UserOutlined />, label: "CRM", color: "text-purple-600", bg: "hover:bg-purple-50/50" },
                  { to: "/daily-report", icon: <FileTextOutlined />, label: "Audits", color: "text-orange-600", bg: "hover:bg-orange-50/50" }
                ].map((act, i) => (
                  <Link key={i} to={act.to} className={`group p-8 rounded-[32px] bg-gray-50/50 ${act.bg} shadow-none hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-500 border border-gray-50/50 text-center`}>
                    <div className={`text-3xl mb-4 ${act.color} transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6`}>{act.icon}</div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-gray-800 transition-colors uppercase">{act.label}</p>
                  </Link>
                ))}
              </div>
            </div>

            {/* Payment Velocity */}
            <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100">
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-[0.2em] mb-8">Settlement Velocity</h3>
              <div className="space-y-4">
                {dashboardData?.paymentStatus.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-6 rounded-[28px] bg-gray-50/30 border border-gray-100/50 hover:bg-white hover:border-indigo-100 transition-all duration-500 group">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full animate-pulse ${s.status === "Paid" ? "bg-green-500 shadow-lg shadow-green-100" : s.status === "Pending" ? "bg-amber-500 shadow-lg shadow-amber-100" : "bg-red-500 shadow-lg shadow-red-100"
                        }`} />
                      <span className="font-black text-gray-700 text-[11px] tracking-widest uppercase">{s.status}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-gray-800">₹{formatIndianNumber(s.amount)}</p>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">{s.count} Operations</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Registry Entries */}
            <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100">
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-[0.2em] mb-8">Recent Registry</h3>
              <div className="space-y-6">
                {dashboardData?.recentCustomers.map((c, i) => (
                  <div key={i} className="flex items-center justify-between group cursor-default">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-lg group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-black text-gray-800 truncate max-w-[140px] uppercase tracking-tight">{c.name}</p>
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mt-1">{dayjs(c.time).format("hh:mm A")}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-green-600">₹{formatIndianNumber(c.amount)}</p>
                      <div className="w-full h-0.5 bg-green-50 mt-1 rounded-full overflow-hidden">
                        <div className="w-full h-full bg-green-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default DashboardPage;
