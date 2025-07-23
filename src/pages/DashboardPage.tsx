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
  ArrowDownOutlined,
} from "@ant-design/icons";
import InventoryRequest, {
  IInventoryRequest,
} from "../components/InventoryRequest";
import { formatIndianNumber } from "../utils";
import apiCaller from "../utils/apiCaller";

// Dummy data for the dashboard
const dummyData = {
  sales: [
    { _id: "2024-01", totalAmount: 50000 },
    { _id: "2024-02", totalAmount: 75000 },
    { _id: "2024-03", totalAmount: 60000 },
    { _id: "2024-04", totalAmount: 90000 },
  ],
  trans: [
    { _id: "2024-01", totalTrans: 100 },
    { _id: "2024-02", totalTrans: 150 },
    { _id: "2024-03", totalTrans: 120 },
    { _id: "2024-04", totalTrans: 180 },
  ],
  totalCurrSales: [{ overallSales: 90000 }],
  totalPreviousSales: [{ overallSales: 60000 }],
  currentTransactions: [{ overallPayment: 80000 }],
  previousTransaction: [{ overallPayment: 50000 }],
  outstanding: 25000,
  dailySummary: {
    todaySales: 25000,
    todayTransactions: 15,
    averageTicket: 1666.67,
    peakHour: "14:00 - 15:00",
  },
  paymentStatus: [
    { status: "Paid", count: 45, amount: 75000 },
    { status: "Pending", count: 12, amount: 25000 },
  ],
  //   recentCustomers: [
  //     { name: "Rahul Sharma", amount: 15000, time: "2h ago", type: "Regular" },
  //     { name: "Priya Patel", amount: 25000, time: "4h ago", type: "VIP" },
  //     { name: "Amit Kumar", amount: 18000, time: "5h ago", type: "Regular" },
  //   ],
  topProducts: [
    { name: "Product X", sales: 45, change: "+12%", revenue: 22500 },
    { name: "Product Y", sales: 38, change: "+8%", revenue: 19000 },
    { name: "Product Z", sales: 32, change: "-5%", revenue: 16000 },
  ],
  quickStats: {
    totalCustomers: 150,
    activeCustomers: 120,
    newCustomers: 15,
    returningCustomers: 105,
  },
};
// Dummy data for inventory requests
const dummyInventoryRequests = [
  {
    _id: "1",
    date: new Date(),
    createdBy: "John Doe",
    product: {
      name: "Product A",
      stock: 150.5,
    },
    oldStock: 100.0,
    quantity: 50.5,
  },
  {
    _id: "2",
    date: new Date(),
    createdBy: "Jane Smith",
    product: {
      name: "Product B",
      stock: 200.0,
    },
    oldStock: 180.0,
    quantity: 20.0,
  },
  {
    _id: "3",
    date: new Date(),
    createdBy: "Mike Johnson",
    product: {
      name: "Product C",
      stock: 75.25,
    },
    oldStock: 50.0,
    quantity: 25.25,
  },
];

const DashboardPage = () => {
  const [days, setDays] = useState(7);
  const [inventoryRequests, setInventoryRequests] = useState<
    IInventoryRequest[] | null
  >();

  const getIncrease = (curr: number, prev: number) => {
    return ((curr - prev) / prev) * 100;
  };

  const getInventoryRequests = async () => {
    try {
      const res = await apiCaller.get("/products/get-requests");
      console.log(res.data, "This is the inventory requests data");
      setInventoryRequests(res.data.data);
    } catch (error) {
      console.log("Error fetching inventory requests:", error);
    }
  };

  // ALL THE DATA FETCHING LOGIC GOES HERE
  useEffect(() => {
    getInventoryRequests();
  }, []);
  const mergedData = dummyData.sales.map((sale) => {
    const trans = dummyData.trans.find((tran) => tran._id === sale._id);
    return {
      date: sale._id,
      totalAmount: sale.totalAmount,
      totalTrans: trans ? trans.totalTrans : 0,
    };
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-2rem)]">
        {/* Left Section - 60% width */}
        <div className="lg:col-span-2 space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-xs">Total Sales</p>
                  <p className="text-xl font-bold mt-1">
                    ₹
                    {formatIndianNumber(
                      dummyData.totalCurrSales[0].overallSales
                    )}
                  </p>
                  <div className="mt-1">
                    <span
                      className={`${
                        getIncrease(
                          dummyData.totalCurrSales[0].overallSales,
                          dummyData.totalPreviousSales[0].overallSales
                        ) > 0
                          ? "text-green-600"
                          : "text-red-600"
                      } text-xs`}
                    >
                      {getIncrease(
                        dummyData.totalCurrSales[0].overallSales,
                        dummyData.totalPreviousSales[0].overallSales
                      ).toFixed(2)}
                      % vs last month
                    </span>
                  </div>
                </div>
                <div className="bg-blue-50 p-2 rounded-full">
                  <LineChartOutlined className="text-blue-500 text-lg" />
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-xs">Total Payments</p>
                  <p className="text-xl font-bold mt-1">
                    ₹
                    {formatIndianNumber(
                      dummyData.currentTransactions[0].overallPayment
                    )}
                  </p>
                  <div className="mt-1">
                    <span
                      className={`${
                        getIncrease(
                          dummyData.currentTransactions[0].overallPayment,
                          dummyData.previousTransaction[0].overallPayment
                        ) > 0
                          ? "text-green-600"
                          : "text-red-600"
                      } text-xs`}
                    >
                      {getIncrease(
                        dummyData.currentTransactions[0].overallPayment,
                        dummyData.previousTransaction[0].overallPayment
                      ).toFixed(2)}
                      % vs last month
                    </span>
                  </div>
                </div>
                <div className="bg-green-50 p-2 rounded-full">
                  <DollarOutlined className="text-green-500 text-lg" />
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-xs">Outstanding</p>
                  <p className="text-xl font-bold mt-1">
                    ₹{formatIndianNumber(dummyData.outstanding)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Total pending amount
                  </p>
                </div>
                <div className="bg-yellow-50 p-2 rounded-full">
                  <FileTextOutlined className="text-yellow-500 text-lg" />
                </div>
              </div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-semibold">Sales Overview</h2>
              <div className="flex gap-2">
                {[7, 15, 30].map((day) => (
                  <button
                    key={day}
                    onClick={() => setDays(day)}
                    className={`px-2 py-1 rounded-md text-xs ${
                      days === day
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {day}d
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[200px]">
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

          {/* Inventory Requests Section */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <InventoryRequest
              inventoryRequests={inventoryRequests}
              setInventoryRequests={setInventoryRequests}
            />
          </div>
        </div>

        {/* Right Section - 40% width */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h2 className="text-base font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/new-bill"
                className="bg-blue-50 text-blue-600 p-3 rounded-lg text-center hover:bg-blue-100 transition-colors"
              >
                <DollarOutlined className="text-xl mb-2" />
                <p className="text-sm font-medium">New Bill</p>
              </Link>
              <Link
                to="/products"
                className="bg-green-50 text-green-600 p-3 rounded-lg text-center hover:bg-green-100 transition-colors"
              >
                <ShoppingOutlined className="text-xl mb-2" />
                <p className="text-sm font-medium">Inventory</p>
              </Link>
              <Link
                to="/customers"
                className="bg-purple-50 text-purple-600 p-3 rounded-lg text-center hover:bg-purple-100 transition-colors"
              >
                <UserOutlined className="text-xl mb-2" />
                <p className="text-sm font-medium">Customers</p>
              </Link>
              <Link
                to="/daily-report"
                className="bg-orange-50 text-orange-600 p-3 rounded-lg text-center hover:bg-orange-100 transition-colors"
              >
                <FileTextOutlined className="text-xl mb-2" />
                <p className="text-sm font-medium">Reports</p>
              </Link>
            </div>
          </div>
          {/* Daily Summary */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Today's Summary</h2>
              <ClockCircleOutlined className="text-gray-400" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Today's Sales</p>
                <p className="text-lg font-semibold text-blue-600">
                  ₹{formatIndianNumber(dummyData.dailySummary.todaySales)}
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Transactions</p>
                <p className="text-lg font-semibold text-green-600">
                  {dummyData.dailySummary.todayTransactions}
                </p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Avg. Ticket</p>
                <p className="text-lg font-semibold text-purple-600">
                  ₹{formatIndianNumber(dummyData.dailySummary.averageTicket)}
                </p>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Peak Hour</p>
                <p className="text-lg font-semibold text-orange-600">
                  {dummyData.dailySummary.peakHour}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Status */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Payment Status</h2>
              <DollarOutlined className="text-gray-400" />
            </div>
            <div className="space-y-3">
              {dummyData.paymentStatus.map((status, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        status.status === "Paid"
                          ? "bg-green-500"
                          : status.status === "Pending"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                    />
                    <p className="font-medium">{status.status}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {status.count} transactions
                    </p>
                    <p className="text-xs text-gray-500">
                      ₹{formatIndianNumber(status.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Customers */}
          {/* <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Recent Customers</h2>
              <UserOutlined className="text-gray-400" />
            </div>
            <div className="space-y-3">
              {dummyData.recentCustomers.map((customer, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{customer.name}</p>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded ${
                          customer.type === "VIP"
                            ? "bg-purple-100 text-purple-600"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {customer.type}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <ClockCircleOutlined />
                      {customer.time}
                    </p>
                  </div>
                  <p className="font-medium text-green-600">
                    ₹{formatIndianNumber(customer.amount)}
                  </p>
                </div>
              ))}
            </div>
          </div> */}

          {/* Top Products */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Top Products</h2>
              <ShoppingOutlined className="text-gray-400" />
            </div>
            <div className="space-y-3">
              {dummyData.topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-xs text-gray-500">
                      {product.sales} sales • ₹
                      {formatIndianNumber(product.revenue)}
                    </p>
                  </div>
                  <div
                    className={`flex items-center gap-1 ${
                      product.change.startsWith("+")
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {product.change.startsWith("+") ? (
                      <ArrowUpOutlined />
                    ) : (
                      <ArrowDownOutlined />
                    )}
                    <span>{product.change}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Stats */}
          {/* <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Customer Stats</h2>
              <UserOutlined className="text-gray-400" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Total Customers</p>
                <p className="text-lg font-semibold text-blue-600">
                  {dummyData.quickStats.totalCustomers}
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Active</p>
                <p className="text-lg font-semibold text-green-600">
                  {dummyData.quickStats.activeCustomers}
                </p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500">New This Month</p>
                <p className="text-lg font-semibold text-purple-600">
                  {dummyData.quickStats.newCustomers}
                </p>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Returning</p>
                <p className="text-lg font-semibold text-orange-600">
                  {dummyData.quickStats.returningCustomers}
                </p>
              </div>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
