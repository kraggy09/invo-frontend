import { useState, useMemo, useEffect } from "react";
import {
  EyeOutlined,
  DownloadOutlined,
  PrinterOutlined,
  FileTextOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import { formatIndianNumber } from "../utils";
import UniversalTable, {
  UniversalColumnType,
} from "../components/UniversalTable";
import FilterBuilder from "../components/FilterBuilder";
import { Switch, AutoComplete, DatePicker, Spin } from "antd";
import type { Dayjs } from "dayjs";
import { useSearchParams } from "react-router-dom";
import apiCaller from "../utils/apiCaller"; // or your fetch utility

const { RangePicker } = DatePicker;

// Dummy data for bills
const dummyBills: Bill[] = [
  {
    _id: "1",
    date: new Date(),
    customer: { name: "Rahul Sharma", phone: "9876543210" },
    total: 1750,
    payment: 1500,
    outstanding: 250,
    status: "Pending",
  },
  {
    _id: "2",
    date: new Date(),
    customer: { name: "Priya Patel", phone: "9876543211" },
    total: 1800,
    payment: 1800,
    outstanding: 0,
    status: "Paid",
  },
  {
    _id: "3",
    date: new Date(),
    customer: { name: "Amit Kumar", phone: "9876543212" },
    total: 1200,
    payment: 1000,
    outstanding: 200,
    status: "Partial",
  },
  {
    _id: "1",
    date: new Date(),
    customer: { name: "Rahul Sharma", phone: "9876543210" },
    total: 1750,
    payment: 1500,
    outstanding: 250,
    status: "Pending",
  },
  {
    _id: "2",
    date: new Date(),
    customer: { name: "Priya Patel", phone: "9876543211" },
    total: 1800,
    payment: 1800,
    outstanding: 0,
    status: "Paid",
  },
  {
    _id: "3",
    date: new Date(),
    customer: { name: "Amit Kumar", phone: "9876543212" },
    total: 1200,
    payment: 1000,
    outstanding: 200,
    status: "Partial",
  },
  {
    _id: "1",
    date: new Date(),
    customer: { name: "Rahul Sharma", phone: "9876543210" },
    total: 1750,
    payment: 1500,
    outstanding: 250,
    status: "Pending",
  },
  {
    _id: "2",
    date: new Date(),
    customer: { name: "Priya Patel", phone: "9876543211" },
    total: 1800,
    payment: 1800,
    outstanding: 0,
    status: "Paid",
  },
  {
    _id: "3",
    date: new Date(),
    customer: { name: "Amit Kumar", phone: "9876543212" },
    total: 1200,
    payment: 1000,
    outstanding: 200,
    status: "Partial",
  },
  {
    _id: "1",
    date: new Date(),
    customer: { name: "Rahul Sharma", phone: "9876543210" },
    total: 1750,
    payment: 1500,
    outstanding: 250,
    status: "Pending",
  },
  {
    _id: "2",
    date: new Date(),
    customer: { name: "Priya Patel", phone: "9876543211" },
    total: 1800,
    payment: 1800,
    outstanding: 0,
    status: "Paid",
  },
  {
    _id: "3",
    date: new Date(),
    customer: { name: "Amit Kumar", phone: "9876543212" },
    total: 1200,
    payment: 1000,
    outstanding: 200,
    status: "Partial",
  },
  {
    _id: "1",
    date: new Date(),
    customer: { name: "Rahul Sharma", phone: "9876543210" },
    total: 1750,
    payment: 1500,
    outstanding: 250,
    status: "Pending",
  },
  {
    _id: "2",
    date: new Date(),
    customer: { name: "Priya Patel", phone: "9876543211" },
    total: 1800,
    payment: 1800,
    outstanding: 0,
    status: "Paid",
  },
  {
    _id: "3",
    date: new Date(),
    customer: { name: "Amit Kumar", phone: "9876543212" },
    total: 1200,
    payment: 1000,
    outstanding: 200,
    status: "Partial",
  },
];

// Dummy product list for search
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

interface Bill {
  _id: string;
  date: Date;
  customer: {
    name: string;
    phone: string;
  };
  total: number;
  payment: number;
  outstanding: number;
  status: "Paid" | "Pending" | "Partial";
  // Add a products field for demo
  products?: { name: string; quantity: number; price: number }[];
}

interface FilterState {
  status?: string;
  dateRange?: [Dayjs, Dayjs];
  category?: string;
}

const BillPage = () => {
  const [searchParams] = useSearchParams();
  const [bills] = useState<Bill[]>(dummyBills);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [filters, setFilters] = useState<FilterState>({});
  const [productSearchMode, setProductSearchMode] = useState(false);
  const [productQuery, setProductQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([
    null,
    null,
  ]);
  const [billsWithProduct, setBillsWithProduct] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedProduct) {
      setBillsWithProduct([]);
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
      .then((res) => setBillsWithProduct(res.data))
      .finally(() => setLoading(false));
  }, [selectedProduct, dateRange]);

  const filterOptions = [
    {
      key: "status",
      label: "Status",
      type: "select" as const,
      options: [
        { label: "All", value: "All" },
        { label: "Paid", value: "Paid" },
        { label: "Pending", value: "Pending" },
        { label: "Partial", value: "Partial" },
      ],
    },
    {
      key: "dateRange",
      label: "Date Range",
      type: "dateRange" as const,
    },
  ];

  // Bill columns for UniversalTable
  const billColumns: UniversalColumnType<Bill>[] = [
    {
      column: {
        title: "Date & Time",
        dataIndex: "date",
        key: "date",
        render: (date: Date) => (
          <div>
            <div className="text-sm text-gray-900">
              {date.toLocaleDateString()}
            </div>
            <div className="text-xs text-gray-500">
              {date.toLocaleTimeString()}
            </div>
          </div>
        ),
      },
    },
    {
      column: {
        title: "Bill ID",
        dataIndex: "_id",
        key: "_id",
      },
      onCellClick: (record, rowIndex, colIndex) => {
        console.log("Bill ID cell clicked:", record._id, rowIndex, colIndex);
      },
    },
    {
      column: {
        title: "Customer",
        dataIndex: "customer",
        key: "customer",
        render: (customer: Bill["customer"]) => (
          <div>
            <div className="text-sm text-gray-900">{customer.name}</div>
            <div className="text-xs text-gray-500">{customer.phone}</div>
          </div>
        ),
      },
    },
    {
      column: {
        title: "Total",
        dataIndex: "total",
        key: "total",
        render: (total: number) => `₹${formatIndianNumber(total)}`,
      },
    },
    {
      column: {
        title: "Payment",
        dataIndex: "payment",
        key: "payment",
        render: (payment: number) => `₹${formatIndianNumber(payment)}`,
      },
    },
    {
      column: {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (status: Bill["status"]) => (
          <span
            className={`px-2 py-1 text-xs rounded-full ${
              status === "Paid"
                ? "bg-green-100 text-green-800"
                : status === "Pending"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {status}
          </span>
        ),
      },
    },
    {
      column: {
        title: "Actions",
        key: "actions",
        render: () => (
          <button className="text-blue-600 hover:text-blue-800">
            <EyeOutlined className="text-lg" />
          </button>
        ),
      },
    },
  ];

  // Product-in-bill columns
  const productBillColumns: UniversalColumnType<Bill>[] = [
    {
      column: {
        title: "Date",
        dataIndex: "date",
        key: "date",
        render: (date: Date) => date.toLocaleDateString(),
      },
    },
    {
      column: {
        title: "Time",
        dataIndex: "date",
        key: "time",
        render: (date: Date) => date.toLocaleTimeString(),
      },
    },
    {
      column: {
        title: "Customer Name",
        dataIndex: "customer",
        key: "customerName",
        render: (customer: Bill["customer"]) => customer.name,
      },
    },
    {
      column: {
        title: "Quantity",
        key: "quantity",
        render: (_, record) => {
          const prod = record.products?.find((p) => p.name === selectedProduct);
          return prod ? prod.quantity : "-";
        },
      },
    },
    {
      column: {
        title: "Total Price",
        key: "totalPrice",
        render: (_, record) => {
          const prod = record.products?.find((p) => p.name === selectedProduct);
          return prod ? prod.price * prod.quantity : "-";
        },
      },
    },
    {
      column: {
        title: "View",
        key: "actions",
        render: (_, record) => (
          <button className="text-blue-600 hover:text-blue-800">
            <EyeOutlined className="text-lg" />
          </button>
        ),
      },
    },
  ];

  // Filtered bills for normal mode
  const filteredBills = useMemo(
    () =>
      bills.filter((bill) => {
        const matchesSearch =
          searchQuery === "" ||
          bill.customer.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          bill._id.includes(searchQuery) ||
          bill.customer.phone.includes(searchQuery) ||
          bill.total.toString().includes(searchQuery) ||
          bill.payment.toString().includes(searchQuery);

        const matchesStatus =
          !filters.status ||
          filters.status === "All" ||
          bill.status === filters.status;

        const matchesDateRange =
          !filters.dateRange ||
          (bill.date >= filters.dateRange[0].toDate() &&
            bill.date <= filters.dateRange[1].toDate());

        return matchesSearch && matchesStatus && matchesDateRange;
      }),
    [bills, searchQuery, filters]
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-xl font-semibold text-gray-800">
            Billing History
          </h1>
          <div className="flex gap-2 items-center">
            <Switch
              checked={productSearchMode}
              onChange={setProductSearchMode}
              className="mr-2"
              checkedChildren="Product Search"
              unCheckedChildren="Bill Search"
            />
            {productSearchMode && (
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
                    setDateRange(range as [Dayjs | null, Dayjs | null])
                  }
                  allowClear
                />
              </>
            )}
            <button className="bg-blue-50 text-blue-600 px-3 py-1 rounded-md flex items-center gap-1 hover:bg-blue-100 transition-colors">
              <DownloadOutlined />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button className="bg-green-50 text-green-600 px-3 py-1 rounded-md flex items-center gap-1 hover:bg-green-100 transition-colors">
              <PrinterOutlined />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </div>
      </div>

      {!productSearchMode && (
        <FilterBuilder
          filters={filterOptions}
          onFilterChange={setFilters}
          onSearch={setSearchQuery}
          searchPlaceholder={"Search bills by customer name, ID, or amount..."}
        />
      )}

      {/* Summary Cards */}
      {!productSearchMode && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Bills</p>
                <p className="text-xl font-semibold">{filteredBills.length}</p>
              </div>
              <div className="bg-blue-50 p-2 rounded-full">
                <FileTextOutlined className="text-blue-500" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="text-xl font-semibold">
                  ₹
                  {formatIndianNumber(
                    filteredBills.reduce((sum, bill) => sum + bill.total, 0)
                  )}
                </p>
              </div>
              <div className="bg-green-50 p-2 rounded-full">
                <DollarOutlined className="text-green-500" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Payment</p>
                <p className="text-xl font-semibold">
                  ₹
                  {formatIndianNumber(
                    filteredBills.reduce((sum, bill) => sum + bill.payment, 0)
                  )}
                </p>
              </div>
              <div className="bg-purple-50 p-2 rounded-full">
                <DollarOutlined className="text-purple-500" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Outstanding</p>
                <p className="text-xl font-semibold">
                  ₹
                  {formatIndianNumber(
                    filteredBills.reduce(
                      (sum, bill) => sum + bill.outstanding,
                      0
                    )
                  )}
                </p>
              </div>
              <div className="bg-red-50 p-2 rounded-full">
                <DollarOutlined className="text-red-500" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table Section */}
      {productSearchMode ? (
        <UniversalTable<Bill>
          key={
            billsWithProduct.length +
            productQuery +
            (selectedProduct || "") +
            JSON.stringify(dateRange)
          }
          data={billsWithProduct}
          columns={productBillColumns}
          pageSize={10}
        />
      ) : (
        <UniversalTable<Bill>
          key={filteredBills.length + searchQuery + JSON.stringify(filters)}
          data={filteredBills}
          columns={billColumns}
          pageSize={10}
          onRowClick={(record, rowIndex) => {
            console.log("Row clicked:", record, rowIndex);
          }}
        />
      )}
    </div>
  );
};

export default BillPage;
