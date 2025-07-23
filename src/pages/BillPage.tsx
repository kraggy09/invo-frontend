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

const BillPage = () => {
  // Zustand store
  const billsFromStore = useBillStore((state) => state.bills);
  const navigate = useNavigate();

  // Local state for API data
  const [bills, setBills] = useState<any[] | null>(null); // null means not loaded from API yet
  const [loading, setLoading] = useState(false);
  const [searchMode, setSearchMode] = useState(false); // false: Bill Search, true: Product Search
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
  const [productBills, setProductBills] = useState<any[] | null>(null); // null means not loaded from API yet

  // Use bills from store until API data is loaded
  const effectiveBills = bills !== null ? bills : billsFromStore;

  // Fetch bills (simulate API)
  // You can trigger this with a button or on mount as needed
  // useEffect(() => {
  //   setLoading(true);
  //   setTimeout(() => {
  //     // Replace with real API call
  //     setBills([]); // TODO: Load real data
  //     setLoading(false);
  //   }, 500);
  // }, []);

  // Product search API
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

  // Filter bills for Bill Search mode
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

  // Summary cards
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

  // Table columns
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
          className={`px-2 py-1 text-xs rounded-full ${
            s === "Paid"
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
          className={`px-2 py-1 text-xs rounded-full ${
            s === "Paid"
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
    <div className="p-4 min-h-screen bg-gray-50">
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-xl font-semibold text-gray-800">Billing History</h1>
        <div className="flex gap-2 items-center">
          <Switch
            checked={searchMode}
            onChange={setSearchMode}
            className="mr-2"
            checkedChildren="Product Search"
            unCheckedChildren="Bill Search"
          />
          {searchMode && (
            <>
              <AutoComplete
                style={{ width: 200 }}
                options={allProducts.map((p) => ({ value: p }))}
                value={productQuery}
                onChange={setProductQuery}
                onSelect={(value) => setSelectedProduct(value)}
                placeholder="Search product..."
                allowClear
              />
              <RangePicker
                className="ml-2"
                value={dateRange}
                onChange={(range) =>
                  setDateRange(
                    range as [dayjs.Dayjs | null, dayjs.Dayjs | null]
                  )
                }
                allowClear
              />
            </>
          )}
          <Button
            className="bg-blue-50 text-blue-600 flex items-center gap-1 hover:bg-blue-100 transition-colors"
            icon={<DownloadOutlined />}
          >
            Export
          </Button>
          <Button
            className="bg-green-50 text-green-600 flex items-center gap-1 hover:bg-green-100 transition-colors"
            icon={<PrinterOutlined />}
          >
            Print
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
        <Card
          style={{
            background: "#f6ffed",
            border: "1px solid #b7eb8f",
            boxShadow: "0 2px 8px rgba(34,197,94,0.06)",
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Bills</p>
              <p className="text-xl font-semibold">{summary.totalBills}</p>
            </div>
            <div className="bg-blue-50 p-2 rounded-full">
              <FileTextOutlined className="text-blue-500" />
            </div>
          </div>
        </Card>
        <Card
          style={{
            background: "#e6f7ff",
            border: "1px solid #91d5ff",
            boxShadow: "0 2px 8px rgba(24,144,255,0.06)",
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="text-xl font-semibold">
                ₹{formatIndianNumber(summary.totalAmount)}
              </p>
            </div>
            <div className="bg-green-50 p-2 rounded-full">
              <DollarOutlined className="text-green-500" />
            </div>
          </div>
        </Card>
        <Card
          style={{
            background: "#f0f5ff",
            border: "1px solid #adc6ff",
            boxShadow: "0 2px 8px rgba(47,84,235,0.06)",
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Payment</p>
              <p className="text-xl font-semibold">
                ₹{formatIndianNumber(summary.totalPayment)}
              </p>
            </div>
            <div className="bg-purple-50 p-2 rounded-full">
              <DollarOutlined className="text-purple-500" />
            </div>
          </div>
        </Card>
        <Card
          style={{
            background: "#fffbe6",
            border: "1px solid #ffe58f",
            boxShadow: "0 2px 8px rgba(250,219,20,0.06)",
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Outstanding</p>
              <p className="text-xl font-semibold">
                ₹{formatIndianNumber(summary.outstanding)}
              </p>
            </div>
            <div className="bg-red-50 p-2 rounded-full">
              <DollarOutlined className="text-red-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters for Bill Search mode */}
      {!searchMode && (
        <div className="bg-white rounded-lg shadow-sm p-4 mb-2 flex flex-wrap gap-4 items-end border border-gray-200">
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">Search</label>
            <Input.Search
              placeholder="Customer name, bill id, phone, amount..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 220 }}
              allowClear
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">Status</label>
            <Select
              value={status}
              onChange={setStatus}
              style={{ width: 120 }}
              options={[
                { value: "all", label: "All Status" },
                { value: "Paid", label: "Paid" },
                { value: "Pending", label: "Pending" },
                { value: "Partial", label: "Partial" },
              ]}
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">Date Range</label>
            <RangePicker
              value={dateRange}
              onChange={(range) =>
                setDateRange(range as [dayjs.Dayjs | null, dayjs.Dayjs | null])
              }
              style={{ width: 220 }}
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">Amount</label>
            <div className="flex gap-2">
              <InputNumber
                min={0}
                value={amountRange[0] === 0 ? undefined : amountRange[0]}
                onChange={(v) => setAmountRange([v || 0, amountRange[1]])}
                placeholder="Min"
                style={{ width: 80 }}
              />
              <InputNumber
                min={0}
                value={amountRange[1] === Infinity ? undefined : amountRange[1]}
                onChange={(v) =>
                  setAmountRange([amountRange[0], v || Infinity])
                }
                placeholder="Max"
                style={{ width: 80 }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Table Section */}
      <Table
        columns={searchMode ? productColumns : billColumns}
        dataSource={searchMode ? productBills ?? [] : filteredBills ?? []}
        loading={loading}
        rowKey={searchMode ? "_id" : "_id"}
        pagination={{ pageSize: 10 }}
      />
      {loading && <Spin className="block mx-auto" />}
    </div>
  );
};

export default BillPage;
