import { useState, useEffect } from "react";
import {
  EyeOutlined,
  DownloadOutlined,
  PrinterOutlined,
  FileTextOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import { formatIndianNumber } from "../utils";
import DataTable from "../components/DataTable";
import FilterBuilder from "../components/FilterBuilder";
import type { ColumnsType } from "antd/es/table";
import type { Dayjs } from "dayjs";
import { useSearchParams } from "react-router-dom";

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
];

// Dummy data for products
const dummyProducts: Product[] = [
  {
    _id: "P1",
    name: "Product 1",
    category: "Electronics",
    price: 1000,
    stock: 50,
    status: "In Stock",
  },
  {
    _id: "P2",
    name: "Product 2",
    category: "Clothing",
    price: 500,
    stock: 0,
    status: "Out of Stock",
  },
  {
    _id: "P3",
    name: "Product 3",
    category: "Books",
    price: 200,
    stock: 20,
    status: "In Stock",
  },
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
}

interface Product {
  _id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: "In Stock" | "Out of Stock";
}

interface FilterState {
  status?: string;
  dateRange?: [Dayjs, Dayjs];
  category?: string;
}

const BillPage = () => {
  const [searchParams] = useSearchParams();
  const [bills] = useState<Bill[]>(dummyBills);
  const [products] = useState<Product[]>(dummyProducts);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [filters, setFilters] = useState<FilterState>({});
  const [activeView, setActiveView] = useState<"bills" | "products">("bills");

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

  const productFilterOptions = [
    {
      key: "status",
      label: "Status",
      type: "select" as const,
      options: [
        { label: "All", value: "All" },
        { label: "In Stock", value: "In Stock" },
        { label: "Out of Stock", value: "Out of Stock" },
      ],
    },
    {
      key: "category",
      label: "Category",
      type: "select" as const,
      options: [
        { label: "All", value: "All" },
        { label: "Electronics", value: "Electronics" },
        { label: "Clothing", value: "Clothing" },
        { label: "Books", value: "Books" },
      ],
    },
  ];

  const billColumns: ColumnsType<Bill> = [
    {
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
    {
      title: "Bill ID",
      dataIndex: "_id",
      key: "_id",
    },
    {
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
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      render: (total: number) => `₹${formatIndianNumber(total)}`,
    },
    {
      title: "Payment",
      dataIndex: "payment",
      key: "payment",
      render: (payment: number) => `₹${formatIndianNumber(payment)}`,
    },
    {
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
    {
      title: "Actions",
      key: "actions",
      render: () => (
        <button className="text-blue-600 hover:text-blue-800">
          <EyeOutlined className="text-lg" />
        </button>
      ),
    },
  ];

  const productColumns: ColumnsType<Product> = [
    {
      title: "Product ID",
      dataIndex: "_id",
      key: "_id",
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      render: (price: number) => `₹${formatIndianNumber(price)}`,
    },
    {
      title: "Stock",
      dataIndex: "stock",
      key: "stock",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: Product["status"]) => (
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            status === "In Stock"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {status}
        </span>
      ),
    },
  ];

  const filteredBills = bills.filter((bill) => {
    const matchesSearch =
      searchQuery === "" ||
      bill.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
  });

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      searchQuery === "" ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product._id.includes(searchQuery) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.price.toString().includes(searchQuery);

    const matchesStatus =
      !filters.status ||
      filters.status === "All" ||
      product.status === filters.status;

    const matchesCategory =
      !filters.category ||
      filters.category === "All" ||
      product.category === filters.category;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Update active view based on search query
  useEffect(() => {
    if (searchQuery) {
      const isProductSearch = products.some(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setActiveView(isProductSearch ? "products" : "bills");
    }
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-xl font-semibold text-gray-800">
            {activeView === "bills" ? "Billing History" : "Products"}
          </h1>
          <div className="flex gap-2">
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

      <FilterBuilder
        filters={activeView === "bills" ? filterOptions : productFilterOptions}
        onFilterChange={setFilters}
        onSearch={setSearchQuery}
        searchPlaceholder={
          activeView === "bills"
            ? "Search bills by customer name, ID, or amount..."
            : "Search products by name, category, or price..."
        }
      />

      {/* Summary Cards */}
      {activeView === "bills" && (
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

      {activeView === "products" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Products</p>
                <p className="text-xl font-semibold">
                  {filteredProducts.length}
                </p>
              </div>
              <div className="bg-blue-50 p-2 rounded-full">
                <FileTextOutlined className="text-blue-500" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">In Stock</p>
                <p className="text-xl font-semibold">
                  {
                    filteredProducts.filter((p) => p.status === "In Stock")
                      .length
                  }
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
                <p className="text-sm text-gray-500">Out of Stock</p>
                <p className="text-xl font-semibold">
                  {
                    filteredProducts.filter((p) => p.status === "Out of Stock")
                      .length
                  }
                </p>
              </div>
              <div className="bg-red-50 p-2 rounded-full">
                <DollarOutlined className="text-red-500" />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeView === "bills" ? (
        <DataTable<Bill>
          data={filteredBills}
          columns={billColumns}
          pageSize={10}
          onRowClick={(record) => {
            // Handle row click
            console.log("Clicked record:", record);
          }}
        />
      ) : (
        <DataTable<Product>
          data={filteredProducts}
          columns={productColumns}
          pageSize={10}
          onRowClick={(record) => {
            // Handle row click
            console.log("Clicked record:", record);
          }}
        />
      )}
    </div>
  );
};

export default BillPage;
