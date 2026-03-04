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
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 lg:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Left Section - 60% width */}
        <div className="lg:col-span-2 space-y-4 lg:space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Total Sales</p>
                  <p className="text-xl sm:text-2xl font-bold mt-1">
                    ₹
                    {formatIndianNumber(
                      dashboardData?.totalCurrSales?.[0]?.overallSales || 0
                    )}
                  </p>
                  <div className="mt-1">
                    <span
                      className={`${getIncrease(
                        dashboardData?.totalCurrSales?.[0]?.overallSales || 0,
                        dashboardData?.totalPreviousSales?.[0]?.overallSales || 0
                      ) >= 0
                        ? "text-green-600"
                        : "text-red-600"
                        } text-xs`}
                    >
                      {getIncrease(
                        dashboardData?.totalCurrSales?.[0]?.overallSales || 0,
                        dashboardData?.totalPreviousSales?.[0]?.overallSales || 0
                      ).toFixed(2)}
                      % vs last month
                    </span>
                  </div>
                </div>
                <div className="bg-blue-50 p-3 rounded-full">
                  <LineChartOutlined className="text-blue-500 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Total Payments</p>
                  <p className="text-xl sm:text-2xl font-bold mt-1">
                    ₹
                    {formatIndianNumber(
                      dashboardData?.currentTransactions?.[0]?.overallPayment || 0
                    )}
                  </p>
                  <div className="mt-1">
                    <span
                      className={`${getIncrease(
                        dashboardData?.currentTransactions?.[0]?.overallPayment || 0,
                        dashboardData?.previousTransaction?.[0]?.overallPayment || 0
                      ) >= 0
                        ? "text-green-600"
                        : "text-red-600"
                        } text-xs`}
                    >
                      {getIncrease(
                        dashboardData?.currentTransactions?.[0]?.overallPayment || 0,
                        dashboardData?.previousTransaction?.[0]?.overallPayment || 0
                      ).toFixed(2)}
                      % vs last month
                    </span>
                  </div>
                </div>
                <div className="bg-green-50 p-3 rounded-full">
                  <DollarOutlined className="text-green-500 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Outstanding</p>
                  <p className="text-xl sm:text-2xl font-bold mt-1">
                    ₹{formatIndianNumber(dashboardData?.outstanding || 0)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1 italic">
                    Total pending amount
                  </p>
                </div>
                <div className="bg-yellow-50 p-3 rounded-full">
                  <FileTextOutlined className="text-yellow-500 text-xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-lg font-bold text-gray-800">Sales Overview</h2>
              <div className="flex items-center bg-gray-50 p-1 rounded-lg border border-gray-100">
                {[7, 15, 30].map((day) => (
                  <button
                    key={day}
                    onClick={() => setDays(day)}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${days === day
                      ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                      : "text-gray-500 hover:bg-white hover:text-blue-600"
                      }`}
                  >
                    {day}d
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[250px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mergedData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickMargin={5}
                  />
                  <YAxis tick={{ fontSize: 12 }} tickMargin={5} />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip
                    contentStyle={{
                      fontSize: "12px",
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="totalAmount"
                    stroke="#3B82F6"
                    fillOpacity={1}
                    fill="url(#colorSales)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Daily Summary */}
        {dashboardData?.dailySummary && (
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-800">Today's Summary</h2>
              <div className="bg-gray-100 p-2 rounded-lg">
                <ClockCircleOutlined className="text-gray-600" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Today's Sales</p>
                <p className="text-xl font-bold text-blue-700">
                  ₹{formatIndianNumber(dashboardData.dailySummary.todaySales)}
                </p>
              </div>
              <div className="bg-green-50/50 p-4 rounded-xl border border-green-100">
                <p className="text-xs font-bold text-green-400 uppercase tracking-wider mb-1">Transactions</p>
                <p className="text-xl font-bold text-green-700">
                  {dashboardData.dailySummary.todayTransactions}
                </p>
              </div>
              <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100">
                <p className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">Avg. Ticket</p>
                <p className="text-xl font-bold text-purple-700">
                  ₹{formatIndianNumber(dashboardData.dailySummary.averageTicket)}
                </p>
              </div>
              <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                <p className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-1">Peak Hour</p>
                <p className="text-xl font-bold text-orange-700">
                  {dashboardData.dailySummary.peakHour}
                </p>
              </div>
            </div>
            <div className="bg-indigo-50/30 p-4 rounded-xl border border-indigo-100/50">
              <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3">Top Products Today</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dashboardData.dailySummary.topProductsToday && dashboardData.dailySummary.topProductsToday.length > 0 ? (
                  dashboardData.dailySummary.topProductsToday.map((product, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white p-2.5 rounded-lg shadow-sm border border-indigo-50">
                      <p className="text-sm font-bold text-indigo-900 capitalize">{product.name}</p>
                      <div className="bg-indigo-600 px-2.5 py-1 rounded-md">
                        <p className="text-[10px] text-white font-black">{product.sales.toFixed(0)} UNITS</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm font-medium text-indigo-400 italic">No sales recorded yet today.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Inventory Requests Section */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
          <InventoryRequest
            inventoryRequests={inventoryRequests}
            setInventoryRequests={setInventoryRequests}
          />
        </div>
      </div>

      {/* Right Section - 40% width */}
      <div className="space-y-4 lg:space-y-6">
        {/* Quick Actions */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-6 font-display">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3 lg:gap-4">
            <Link
              to="/new-bill"
              className="group bg-blue-50/50 hover:bg-blue-600 p-4 rounded-xl text-center transition-all duration-300 border border-blue-100"
            >
              <DollarOutlined className="text-2xl mb-2 text-blue-600 group-hover:text-white transition-colors" />
              <p className="text-xs font-bold text-blue-700 group-hover:text-white uppercase tracking-tight">New Bill</p>
            </Link>
            <Link
              to="/products"
              className="group bg-green-50/50 hover:bg-green-600 p-4 rounded-xl text-center transition-all duration-300 border border-green-100"
            >
              <ShoppingOutlined className="text-2xl mb-2 text-green-600 group-hover:text-white transition-colors" />
              <p className="text-xs font-bold text-green-700 group-hover:text-white uppercase tracking-tight">Inventory</p>
            </Link>
            <Link
              to="/customers"
              className="group bg-purple-50/50 hover:bg-purple-600 p-4 rounded-xl text-center transition-all duration-300 border border-purple-100"
            >
              <UserOutlined className="text-2xl mb-2 text-purple-600 group-hover:text-white transition-colors" />
              <p className="text-xs font-bold text-purple-700 group-hover:text-white uppercase tracking-tight">Customers</p>
            </Link>
            <Link
              to="/daily-report"
              className="group bg-orange-50/50 hover:bg-orange-600 p-4 rounded-xl text-center transition-all duration-300 border border-orange-100"
            >
              <FileTextOutlined className="text-2xl mb-2 text-orange-600 group-hover:text-white transition-colors" />
              <p className="text-xs font-bold text-orange-700 group-hover:text-white uppercase tracking-tight">Reports</p>
            </Link>
          </div>
        </div>
        {/* Payment Status */}
        {dashboardData?.paymentStatus && (
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-800">Payment Status</h2>
              <div className="bg-gray-100 p-2 rounded-lg">
                <DollarOutlined className="text-gray-600" />
              </div>
            </div>
            <div className="space-y-4">
              {dashboardData.paymentStatus.map((status, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full animate-pulse ${status.status === "Paid"
                        ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"
                        : status.status === "Pending"
                          ? "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]"
                          : "bg-red-500 shadow-[0_0_8px_rgba(239,44,44,0.4)]"
                        }`}
                    />
                    <p className="font-bold text-gray-700">{status.status}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-gray-900 leading-tight">
                      {status.count} <span className="text-[10px] text-gray-400 font-bold uppercase ml-1">Bills</span>
                    </p>
                    <p className="text-xs text-blue-600 font-bold mt-0.5">
                      ₹{formatIndianNumber(status.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Customers */}
        {dashboardData?.recentCustomers && (
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-800">Recent Customers</h2>
              <div className="bg-gray-100 p-2 rounded-lg">
                <UserOutlined className="text-gray-600" />
              </div>
            </div>
            <div className="space-y-4">
              {dashboardData.recentCustomers.map((customer, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-xl border border-gray-50 bg-gray-50/30">
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-gray-900 truncate">{customer.name}</p>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider ${customer.type === "VIP"
                          ? "bg-purple-100 text-purple-700 border border-purple-200"
                          : "bg-gray-100 text-gray-600 border border-gray-200"
                          }`}
                      >
                        {customer.type}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 flex items-center gap-1 font-bold">
                      <ClockCircleOutlined className="text-[10px]" />
                      {new Date(customer.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <p className="font-black text-green-600 whitespace-nowrap">
                    ₹{formatIndianNumber(customer.amount)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Products */}
        {dashboardData?.topProducts && (
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-800">Top Products</h2>
              <div className="bg-gray-100 p-2 rounded-lg">
                <ShoppingOutlined className="text-gray-600" />
              </div>
            </div>
            <div className="space-y-4">
              {dashboardData.topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-xl border border-gray-50 hover:bg-gray-50 transition-all cursor-default group">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 capitalize truncate group-hover:text-blue-600 transition-colors">{product.name}</p>
                    <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                      {product.sales.toFixed(0)} SALES • <span className="text-gray-600">₹{formatIndianNumber(product.revenue)}</span>
                    </p>
                  </div>
                  <div
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black ${product.change.startsWith("+")
                      ? "bg-green-50 text-green-600 border border-green-100"
                      : "bg-red-50 text-red-600 border border-red-100"
                      }`}
                  >
                    {product.change.startsWith("+") ? (
                      <ArrowUpOutlined className="text-[10px]" />
                    ) : (
                      <ArrowDownOutlined className="text-[10px]" />
                    )}
                    <span>{product.change}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Customer Stats */}
        {dashboardData?.quickStats && (
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-800">Customer Stats</h2>
              <div className="bg-gray-100 p-2 rounded-lg">
                <UserOutlined className="text-gray-600" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 font-display">
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 group transition-all duration-300">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1 group-hover:text-blue-600">Total Customers</p>
                <p className="text-2xl font-black text-blue-700 leading-none">
                  {dashboardData.quickStats.totalCustomers}
                </p>
              </div>
              <div className="bg-green-50/50 p-4 rounded-xl border border-green-100 group transition-all duration-300">
                <p className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-1 group-hover:text-green-600">Active</p>
                <p className="text-2xl font-black text-green-700 leading-none">
                  {dashboardData.quickStats.activeCustomers}
                </p>
              </div>
              <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100 group transition-all duration-300">
                <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1 group-hover:text-purple-600">New / Month</p>
                <p className="text-2xl font-black text-purple-700 leading-none">
                  {dashboardData.quickStats.newCustomers}
                </p>
              </div>
              <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100 group transition-all duration-300">
                <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1 group-hover:text-orange-600">Returning</p>
                <p className="text-2xl font-black text-orange-700 leading-none">
                  {dashboardData.quickStats.returningCustomers}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
