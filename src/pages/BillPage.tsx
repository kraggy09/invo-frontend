import { useState, useEffect, useMemo } from "react";
import {
  Card,
  Table,
  Input,
  Button,
  Select,
  DatePicker,
  InputNumber,
  Switch,
  AutoComplete,
  Spin,
  message,
} from "antd";
import {
  EyeOutlined,
  DownloadOutlined,
  PrinterOutlined,
  DollarOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
dayjs.extend(isBetween);
import apiCaller from "../utils/apiCaller";
import { formatIndianNumber } from "../utils";
import useBillStore from "../store/bill.store";
import { useNavigate } from "react-router-dom";

const { RangePicker } = DatePicker;

const allProducts = [
  "Toothpaste",
  "Soap",
  "Shampoo",
  "Rice",
  "Wheat",
  "Oil",
  "Sugar",
  "Salt",
  "Tea",
  "Coffee",
];

/**
 * Returns true when the selected date range is entirely in the past
 * (i.e. the end date is before the start of today).
 * In that case the store won't have those bills and we must fetch.
 */
const isHistoricalRange = (
  range: [dayjs.Dayjs | null, dayjs.Dayjs | null]
): boolean => {
  if (!range[0] || !range[1]) return false;
  const todayStart = dayjs().startOf("day");
  return range[1].isBefore(todayStart);
};

const BillPage = () => {
  // ── Zustand store (kept live by socket events) ──────────────────────────
  const billsFromStore = useBillStore((state) => state.bills);
  const navigate = useNavigate();

  // ── Local UI state ──────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [productQuery, setProductQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null]
  >([null, null]);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [amountRange, setAmountRange] = useState<[number, number]>([
    0,
    Infinity,
  ]);
  const [filteredBills, setFilteredBills] = useState<any[]>([]);
  const [productBills, setProductBills] = useState<any[] | null>(null);

  /**
   * historicalBills is only populated when the user picks a date range
   * that falls entirely before today. Otherwise it stays null and we read
   * from billsFromStore (which the socket keeps up-to-date).
   */
  const [historicalBills, setHistoricalBills] = useState<any[] | null>(null);

  // The effective data source: historical fetch result OR live store data
  const effectiveBills = historicalBills ?? billsFromStore;

  // ── Historical date-range fetch ─────────────────────────────────────────
  useEffect(() => {
    if (!isHistoricalRange(dateRange)) {
      // Range includes today or is cleared — store data is fresh enough
      setHistoricalBills(null);
      return;
    }

    setLoading(true);
    apiCaller
      .get("/bills", {
        params: {
          startDate: dateRange[0]!.startOf("day").toISOString(),
          endDate: dateRange[1]!.endOf("day").toISOString(),
        },
      })
      .then((res) => {
        setHistoricalBills(res.data.data?.bills ?? res.data.bills ?? []);
      })
      .catch(() => {
        message.error("Failed to fetch historical bills");
        setHistoricalBills([]);
      })
      .finally(() => setLoading(false));
  }, [dateRange]);

  // ── Product search API ──────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedProduct) {
      setProductBills(null);
      return;
    }
    setLoading(true);
    apiCaller
      .get("/bills/search-by-product", {
        params: {
          product: selectedProduct,
          from: dateRange[0]?.toISOString(),
          to: dateRange[1]?.toISOString(),
        },
      })
      .then((res) => setProductBills(res.data))
      .finally(() => setLoading(false));
  }, [selectedProduct, dateRange]);

  // ── Client-side filtering for Bill Search mode ──────────────────────────
  useEffect(() => {
    let data = [...(effectiveBills || [])];
    if (status !== "all") data = data.filter((b) => b.status === status);
    if (search) {
      data = data.filter(
        (b) =>
          b.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
          b._id?.toString().includes(search) ||
          b.customer?.phone?.includes(search) ||
          b.total?.toString().includes(search) ||
          b.payment?.toString().includes(search)
      );
    }
    if (dateRange[0] && dateRange[1]) {
      data = data.filter((b) =>
        dayjs(b.date).isBetween(dateRange[0], dateRange[1], null, "[]")
      );
    }
    if (amountRange[0] > 0)
      data = data.filter((b) => b.total >= amountRange[0]);
    if (amountRange[1] < Infinity)
      data = data.filter((b) => b.total <= amountRange[1]);
    setFilteredBills(data.reverse());
  }, [effectiveBills, status, search, dateRange, amountRange]);

  // ── Summary cards ───────────────────────────────────────────────────────
  const summary = useMemo(() => {
    const data = searchMode
      ? productBills !== null
        ? productBills
        : []
      : filteredBills;
    return {
      totalBills: data.length,
      totalAmount: data.reduce((sum, b) => sum + (b.total || 0), 0),
      totalPayment: data.reduce((sum, b) => sum + (b.payment || 0), 0),
      outstanding: data.reduce((sum, b) => sum + (b.outstanding || 0), 0),
    };
  }, [filteredBills, productBills, searchMode]);

  // ── Handle date-range change ────────────────────────────────────────────
  const handleDateRangeChange = (
    range: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null
  ) => {
    setDateRange(range ?? [null, null]);
  };

  // ── Table columns ───────────────────────────────────────────────────────
  const billColumns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (d: any) => dayjs(d).format("DD/MM/YYYY"),
    },
    {
      title: "Time",
      dataIndex: "date",
      key: "time",
      render: (d: any) => dayjs(d).format("hh:mm:ss A"),
    },
    { title: "Bill ID", dataIndex: "id", key: "id" },
    {
      title: "Customer",
      dataIndex: "customer",
      key: "customer",
      render: (c: any) => (
        <div>
          <div className="text-sm text-gray-900">{c?.name}</div>
          <div className="text-xs text-gray-500">{c?.phone}</div>
        </div>
      ),
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      render: (t: number) => `₹${formatIndianNumber(t)}`,
    },
    {
      title: "Payment",
      dataIndex: "payment",
      key: "payment",
      render: (p: number) => `₹${formatIndianNumber(p)}`,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (s: string) => (
        <span
          className={`px-2 py-1 text-xs rounded-full ${s === "Paid"
            ? "bg-green-100 text-green-800"
            : s === "Pending"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-red-100 text-red-800"
            }`}
        >
          {s}
        </span>
      ),
    },
    {
      title: "Created By",
      dataIndex: "createdBy",
      key: "createdBy",
      render: (u: any) => u?.name ?? u ?? "-",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: any) => (
        <Button
          icon={<EyeOutlined />}
          onClick={() =>
            // Use _id (MongoDB ObjectId) for routing — the backend uses findById()
            // record.id is the sequential display number, not the route param
            navigate(`/bills/${record._id}`, { state: { from: "bill" } })
          }
        />
      ),
    },
  ];

  const productColumns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (d: any) => dayjs(d).format("DD/MM/YYYY"),
    },
    {
      title: "Time",
      dataIndex: "date",
      key: "time",
      render: (d: any) => dayjs(d).format("hh:mm:ss A"),
    },
    { title: "Bill ID", dataIndex: "_id", key: "_id" },
    {
      title: "Customer",
      dataIndex: "customer",
      key: "customer",
      render: (c: any) => (
        <div>
          <div className="text-sm text-gray-900">{c?.name}</div>
          <div className="text-xs text-gray-500">{c?.phone}</div>
        </div>
      ),
    },
    {
      title: "Product Quantity",
      key: "quantity",
      render: (b: any) =>
        b.products?.find((p: any) => p.name === selectedProduct)?.quantity ||
        "-",
    },
    {
      title: "Product Total",
      key: "productTotal",
      render: (b: any) => {
        const prod = b.products?.find((p: any) => p.name === selectedProduct);
        return prod
          ? `₹${formatIndianNumber(prod.price * prod.quantity)}`
          : "-";
      },
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      render: (t: number) => `₹${formatIndianNumber(t)}`,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (s: string) => (
        <span
          className={`px-2 py-1 text-xs rounded-full ${s === "Paid"
            ? "bg-green-100 text-green-800"
            : s === "Pending"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-red-100 text-red-800"
            }`}
        >
          {s}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: any) => (
        <Button
          icon={<EyeOutlined />}
          onClick={() =>
            navigate(`/bills/${record._id}`, { state: { from: "bill" } })
          }
        />
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-50/50">
      <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 mb-8 border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Billing History</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage and track all generated bills</p>
        </div>
        <div className="flex flex-wrap gap-3 items-center w-full sm:w-auto">
          <div className="bg-gray-100/80 p-1 rounded-xl flex items-center w-full sm:w-auto">
            <Switch
              checked={searchMode}
              onChange={setSearchMode}
              className="mr-2"
              checkedChildren="Product Search"
              unCheckedChildren="Bill Search"
            />
          </div>
          {searchMode && (
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <AutoComplete
                className="w-full sm:w-48"
                options={allProducts.map((p) => ({ value: p }))}
                value={productQuery}
                onChange={setProductQuery}
                onSelect={(value) => setSelectedProduct(value)}
                placeholder="Product name..."
                allowClear
              />
              <RangePicker
                className="w-full sm:w-64"
                value={dateRange}
                onChange={(range) =>
                  handleDateRangeChange(
                    range as [dayjs.Dayjs | null, dayjs.Dayjs | null]
                  )
                }
                allowClear
              />
            </div>
          )}
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              className="flex-1 sm:flex-none h-10 border-0 bg-indigo-50 text-indigo-600 font-bold px-4 rounded-xl hover:bg-indigo-100 flex items-center justify-center gap-2 transition-all"
              icon={<DownloadOutlined />}
            >
              Export
            </Button>
            <Button
              className="flex-1 sm:flex-none h-10 border-0 bg-emerald-50 text-emerald-600 font-bold px-4 rounded-xl hover:bg-emerald-100 flex items-center justify-center gap-2 transition-all"
              icon={<PrinterOutlined />}
            >
              Print
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card
          className="rounded-2xl border-0 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300"
          style={{ background: "linear-gradient(135deg, #f0f5ff 0%, #d6e4ff 100%)" }}
          bodyStyle={{ padding: "20px" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-500 text-[10px] font-black uppercase tracking-widest mb-1">Total Bills</p>
              <p className="text-2xl font-black text-indigo-900 leading-none">{summary.totalBills}</p>
            </div>
            <div className="bg-white/50 p-3 rounded-xl shadow-inner group-hover:scale-110 transition-transform">
              <FileTextOutlined className="text-indigo-600 text-xl" />
            </div>
          </div>
        </Card>
        <Card
          className="rounded-2xl border-0 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300"
          style={{ background: "linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)" }}
          bodyStyle={{ padding: "20px" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-1">Total Amount</p>
              <p className="text-2xl font-black text-emerald-900 leading-none">
                ₹{formatIndianNumber(summary.totalAmount)}
              </p>
            </div>
            <div className="bg-white/50 p-3 rounded-xl shadow-inner group-hover:scale-110 transition-transform">
              <DollarOutlined className="text-emerald-600 text-xl" />
            </div>
          </div>
        </Card>
        <Card
          className="rounded-2xl border-0 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300"
          style={{ background: "linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%)" }}
          bodyStyle={{ padding: "20px" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-500 text-[10px] font-black uppercase tracking-widest mb-1">Total Payment</p>
              <p className="text-2xl font-black text-orange-900 leading-none">
                ₹{formatIndianNumber(summary.totalPayment)}
              </p>
            </div>
            <div className="bg-white/50 p-3 rounded-xl shadow-inner group-hover:scale-110 transition-transform">
              <DollarOutlined className="text-orange-600 text-xl" />
            </div>
          </div>
        </Card>
        <Card
          className="rounded-2xl border-0 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300"
          style={{ background: "linear-gradient(135deg, #fff1f0 0%, #ffccc7 100%)" }}
          bodyStyle={{ padding: "20px" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest mb-1">Outstanding</p>
              <p className="text-2xl font-black text-rose-900 leading-none">
                ₹{formatIndianNumber(summary.outstanding)}
              </p>
            </div>
            <div className="bg-white/50 p-3 rounded-xl shadow-inner group-hover:scale-110 transition-transform">
              <DollarOutlined className="text-rose-600 text-xl" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters for Bill Search mode */}
      {!searchMode && (
        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 mb-8 flex flex-wrap gap-6 items-end border border-gray-100">
          <div className="flex flex-col w-full sm:w-auto min-w-[240px]">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-tighter mb-2 ml-1">Search Records</label>
            <Input.Search
              placeholder="Customer, Bill ID, Phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
              allowClear
            />
          </div>
          <div className="flex flex-col w-full sm:w-auto min-w-[140px]">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-tighter mb-2 ml-1">Payment Status</label>
            <Select
              className="w-full"
              value={status}
              onChange={setStatus}
              options={[
                { value: "all", label: "All Status" },
                { value: "Paid", label: "Paid" },
                { value: "Pending", label: "Pending" },
                { value: "Partial", label: "Partial" },
              ]}
            />
          </div>
          <div className="flex flex-col w-full sm:w-auto min-w-[220px]">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-tighter mb-2 ml-1 flex items-center">
              Date Range
              {historicalBills !== null && (
                <span className="ml-2 text-orange-500 bg-orange-50 px-2 py-0.5 rounded text-[10px]">
                  HISTORICAL
                </span>
              )}
            </label>
            <RangePicker
              className="w-full"
              value={dateRange}
              onChange={(range) =>
                handleDateRangeChange(
                  range as [dayjs.Dayjs | null, dayjs.Dayjs | null]
                )
              }
            />
          </div>
          <div className="flex flex-col w-full sm:w-auto min-w-[180px]">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-tighter mb-2 ml-1">Amount Range</label>
            <div className="flex gap-2">
              <InputNumber
                min={0}
                className="w-1/2 sm:w-20"
                value={amountRange[0] === 0 ? undefined : amountRange[0]}
                onChange={(v) => setAmountRange([v || 0, amountRange[1]])}
                placeholder="Min"
              />
              <InputNumber
                min={0}
                className="w-1/2 sm:w-20"
                value={amountRange[1] === Infinity ? undefined : amountRange[1]}
                onChange={(v) =>
                  setAmountRange([amountRange[0], v || Infinity])
                }
                placeholder="Max"
              />
            </div>
          </div>
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <Table
          columns={searchMode ? productColumns : billColumns}
          dataSource={searchMode ? productBills ?? [] : filteredBills ?? []}
          loading={loading}
          rowKey="_id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            className: "px-6 py-4"
          }}
          scroll={{ x: "max-content" }}
          className="responsive-table"
        />
      </div>
      {loading && <Spin className="block mx-auto" />}
    </div>
  );
};

export default BillPage;
