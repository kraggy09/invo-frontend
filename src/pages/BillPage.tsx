import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Table,
  Input,
  DatePicker,
  InputNumber,
  Button,
  Select,
  Segmented
} from "antd";
import { message } from "../utils/antdStatic";
import {
  EyeOutlined,
  DollarOutlined,
  FileTextOutlined,
  ArrowDownOutlined,
  WarningOutlined,
  LockOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
dayjs.extend(isBetween);
import apiCaller from "../utils/apiCaller";
import { formatIndianNumber } from "../utils";
import useBillStore, { Bill, BillCustomer, BillCreatedBy, BillItem } from "../store/bill.store";
import { useNavigate } from "react-router-dom";
import useUserStore from "../store/user.store";
import useProductStore from "../store/product.store";
import { ShoppingOutlined } from "@ant-design/icons";

const { RangePicker } = DatePicker;

const getOutstanding = (b: Bill) => b.total - b.payment;

const getStatus = (b: Bill): string => {
  const outstanding = getOutstanding(b);
  if (outstanding <= 0) return "Paid";
  if (b.payment > 0) return "Partial";
  return "Pending";
};

const BillPage = () => {
  const billsFromStore = useBillStore((state) => state.bills);
  const navigate = useNavigate();
  const { user } = useUserStore();

  // Local state
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [amountRange, setAmountRange] = useState<[number, number]>([0, Infinity]);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([dayjs(), dayjs()]);
  const [historicalBills, setHistoricalBills] = useState<Bill[] | null>(null);
  const [historicalSummary, setHistoricalSummary] = useState<any>(null);
  const [pagination, setPagination] = useState({ current: 1, total: 0, pageSize: 20 });
  const [showAdmin, setShowAdmin] = useState(false);
  const [pin, setPin] = useState("");

  const canSeeFinancials = user?.roles?.some((role) =>
    ["ADMIN", "SUPER_ADMIN", "CREATOR"].includes(role)
  );

  const { products } = useProductStore();
  const [searchMode, setSearchMode] = useState<"general" | "product">("general");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [productHistoricalBills, setProductHistoricalBills] = useState<any[]>([]);
  const [productHistoricalSummary, setProductHistoricalSummary] = useState<any>(null);
  const [productPagination, setProductPagination] = useState({ current: 1, total: 0, pageSize: 20 });

  // If dateRange is today, use live store; otherwise use fetched data
  const isToday =
    dateRange[0]?.isSame(dayjs(), "day") &&
    dateRange[1]?.isSame(dayjs(), "day");

  const [historicalReturnBills, setHistoricalReturnBills] = useState<any[]>([]);

  const mappedBillsFromStore = useMemo(() => {
    return billsFromStore.map(bill => ({
      ...bill,
      key: bill._id,
      billId: bill.id,
      billTotal: bill.productsTotal ?? bill.items?.reduce((sum, item) => sum + (item.total || 0), 0) ?? 0,
      isReturn: false,
    }));
  }, [billsFromStore]);

  const effectiveBills = useMemo(() => {
    if (isToday) return mappedBillsFromStore;

    const bills = (historicalBills ?? []).map(bill => ({
      ...bill,
      key: bill._id,
      billId: bill.id,
      billTotal: bill.productsTotal ?? bill.items?.reduce((sum, item) => sum + (item.total || 0), 0) ?? 0,
      isReturn: false,
    }));

    const returns = (historicalReturnBills ?? []).map(rb => {
      const dateVal = rb.createdAt || rb.date;
      return {
        ...rb,
        key: `return_${rb.id || rb._id}`,
        billId: `R-${rb.id || rb._id}`,
        billTotal: -rb.productsTotal,
        payment: rb.paymentMode === "CASH" ? -rb.totalAmount : 0,
        total: rb.previousOutstanding - rb.productsTotal,
        status: "Returned",
        isReturn: true,
        createdAt: dateVal, // Use for sorting/display
      };
    });

    return [...bills, ...returns].sort((a, b) =>
      new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
    );
  }, [isToday, mappedBillsFromStore, historicalBills, historicalReturnBills]);

  // Fetch from API only when date range changes to non-today
  const fetchHistoricalData = useCallback(async (page = 1) => {
    if (!dateRange[0] || !dateRange[1]) return;
    if (searchMode === "general" && isToday) return;

    setLoading(true);
    try {
      const startDate = dateRange[0].startOf("day").toISOString();
      const endDate = dateRange[1].endOf("day").toISOString();

      if (searchMode === "product") {
        if (!selectedProductId) {
          message.warning("Select a product to search");
          setLoading(false);
          return;
        }
        const product = products.find(p => p._id === selectedProductId);
        if (!product) return;

        const res = await apiCaller.post("/bills/search-by-product", {
          product,
          startDate,
          endDate,
          page,
          limit: productPagination.pageSize
        });

        const bills = res.data.data?.bills || [];
        setProductHistoricalBills(bills);
        setProductPagination(prev => ({ ...prev, current: page, total: res.data.data?.total || 0 }));

        setProductHistoricalSummary({
          totalInstances: res.data.data?.summary?.totalInstances || 0,
          totalQuantity: res.data.data?.summary?.totalQuantity || 0,
          totalRevenue: res.data.data?.summary?.totalRevenue || 0,
        });

        message.success("Product history loaded");
      } else {
        const [billRes, returnRes] = await Promise.all([
          apiCaller.get("/bills", { params: { startDate, endDate, page, limit: pagination.pageSize, search: search || undefined } }),
          apiCaller.get("/return-bills", { params: { startDate, endDate, page, limit: pagination.pageSize } })
        ]);

        setHistoricalBills(billRes.data.data?.bills || []);
        setHistoricalReturnBills(returnRes.data.data?.returnBills || []);

        setPagination(prev => ({
          ...prev,
          current: page,
          total: (billRes.data.data?.total || 0) + (returnRes.data.data?.total || 0)
        }));

        if (page === 1) {
          const summaryRes = await apiCaller.get("/bills/summary", {
            params: { startDate, endDate }
          });
          setHistoricalSummary(summaryRes.data.data);
        }

        if (page === 1) message.success("Bills loaded for selected range");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      message.error("Failed to fetch historical data");
      if (searchMode === "product") {
        setProductHistoricalBills([]);
      } else {
        setHistoricalBills([]);
        setHistoricalReturnBills([]);
      }
    } finally {
      setLoading(false);
    }
  }, [dateRange, isToday, pagination.pageSize, productPagination.pageSize, search, searchMode, selectedProductId, products]);

  useEffect(() => {
    if (isToday && searchMode === "general") {
      setHistoricalBills(null);
      setHistoricalReturnBills([]);
      setHistoricalSummary(null);
      return;
    }
    fetchHistoricalData(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, isToday, searchMode]);

  const filteredBills = useMemo(() => {
    if (!isToday) return effectiveBills; // Backend already filtered/ordered for regular bills, we added returns

    let data = [...effectiveBills];

    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        (b: any) =>
          b.customer?.name?.toLowerCase().includes(q) ||
          b.billId?.toString().includes(search) || // Use billId unified
          b.customer?.phone?.toString().includes(search)
      );
    }

    if (amountRange[0] > 0) data = data.filter((b: any) => Math.abs(b.total) >= amountRange[0]);
    if (amountRange[1] < Infinity) data = data.filter((b: any) => Math.abs(b.total) <= amountRange[1]);

    return data; // Already sorted in effectiveBills or reversed if today (though store is usually sorted)
  }, [effectiveBills, search, amountRange, isToday]);

  // Summary stats
  const summary = useMemo(() => {
    if (!isToday && historicalSummary) {
      return {
        totalBills: pagination.total,
        totalAmount: historicalSummary.totalBillAmount,
        totalPayment: historicalSummary.totalPaymentIn,
        outstanding: historicalSummary.totalBillAmount - historicalSummary.totalPaymentIn, // Estimation
      };
    }

    return {
      totalBills: filteredBills.length,
      totalAmount: filteredBills.reduce((s, b: any) => s + (b.total || 0), 0),
      totalPayment: filteredBills.reduce((s, b: any) => s + (b.payment || 0), 0),
      outstanding: filteredBills.reduce((s, b: any) => s + getOutstanding(b), 0),
    };
  }, [filteredBills, isToday, historicalSummary, pagination.total]);

  const handlePinSubmit = () => {
    if (user?.pin && pin === user.pin) {
      setShowAdmin(true);
      setPin("");
    } else {
      message.error("Incorrect PIN");
    }
  };

  // Table columns
  const columns = [
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
      dataIndex: "billId",
      key: "billId",
      render: (id: string) => <span className="font-mono font-black text-indigo-500 text-xs">#{id}</span>,
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</span>,
      dataIndex: "customer",
      key: "customer",
      render: (c: BillCustomer) => (
        <div className="flex flex-col cursor-pointer group/customer" onClick={(e) => {
          e.stopPropagation();
          c?._id && navigate(`/customers/${c._id}`);
        }}>
          <span className="font-black text-gray-700 capitalize group-hover/customer:text-indigo-600 transition-colors">{c?.name || "—"}</span>
          {c?.phone && <span className="text-[10px] font-bold text-gray-400 group-hover/customer:text-indigo-400 transition-colors">{c.phone}</span>}
        </div>
      ),
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Products Total</span>,
      dataIndex: "billTotal",
      key: "billTotal",
      align: "right" as const,
      render: (t: number) => <span className={`font-black ${t < 0 ? "text-red-500" : "text-gray-800"}`}>₹{formatIndianNumber(t)}</span>,
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Total</span>,
      dataIndex: "total",
      key: "total",
      align: "right" as const,
      render: (t: number, record: any) => {
        const prevOutstanding = record.isReturn
          ? Math.round((t || 0) + Math.abs(record.billTotal || 0))
          : Math.round((t || 0) - (record.billTotal || 0));
        return (
          <div className="flex flex-col items-end">
            <span className={`font-black ${record.isReturn ? "text-red-500" : "text-gray-800"}`}>₹{formatIndianNumber(t)}</span>
            {prevOutstanding > 0 && (
              <span className="text-[10px] font-bold text-orange-400 mt-0.5">
                +₹{formatIndianNumber(prevOutstanding)} Prv
              </span>
            )}
            {prevOutstanding < 0 && (
              <span className="text-[10px] font-bold text-green-500 mt-0.5">
                -₹{formatIndianNumber(Math.abs(prevOutstanding))} Adv
              </span>
            )}
          </div>
        );
      },
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Payment</span>,
      dataIndex: "payment",
      key: "payment",
      align: "right" as const,
      render: (p: number) => <span className={`font-black ${p < 0 ? "text-red-500" : "text-green-600"}`}>₹{formatIndianNumber(p)}</span>,
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Outstanding</span>,
      key: "outstanding",
      align: "right" as const,
      render: (_: unknown, record: any) => {
        const o = getOutstanding(record);
        return (
          <span className={`font-black ${o > 0 ? "text-orange-500" : "text-gray-300"}`}>
            ₹{formatIndianNumber(o)}
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
          onClick={(e) => {
            e.stopPropagation();
            if (record.isReturn) {
              navigate(`/return-bills/${record._id}`, { state: { from: "bill" } });
            } else {
              navigate(`/bills/${record._id}`, { state: { from: "bill" } });
            }
          }}
          className="text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
        />
      ),
    },
  ];

  const productSearchColumns = [
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
      dataIndex: "_id",
      key: "billId",
      render: (_id: string, record: any) => <span className="font-mono font-black text-indigo-500 text-xs">#{record.id || record._id.toString().slice(-6).toUpperCase()}</span>,
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</span>,
      dataIndex: "customer",
      key: "customer",
      render: (c: BillCustomer) => (
        <div className="flex flex-col cursor-pointer group/customer" onClick={(e) => {
          e.stopPropagation();
          c?._id && navigate(`/customers/${c._id}`);
        }}>
          <span className="font-black text-gray-700 capitalize group-hover/customer:text-indigo-600 transition-colors">{c?.name || "—"}</span>
          {c?.phone && <span className="text-[10px] font-bold text-gray-400 group-hover/customer:text-indigo-400 transition-colors">{c.phone}</span>}
        </div>
      ),
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Qty Sold</span>,
      key: "qty",
      align: "right" as const,
      render: (_: any, record: any) => {
        const qty = record.items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0;
        return <span className="font-black text-orange-500">{qty} Units</span>;
      }
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Prev Qty</span>,
      key: "prevQty",
      align: "right" as const,
      render: (_: any, record: any) => {
        const prev = record.items?.[0]?.previousQuantity ?? 0;
        return <span className="font-black text-gray-500">{prev} Units</span>;
      }
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">New Qty</span>,
      key: "newQty",
      align: "right" as const,
      render: (_: any, record: any) => {
        const next = record.items?.[record.items.length - 1]?.newQuantity ?? 0;
        return <span className="font-black text-indigo-600">{next} Units</span>;
      }
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Product Revenue</span>,
      key: "productRevenue",
      align: "right" as const,
      render: (_: any, record: any) => {
        const rev = record.items?.reduce((sum: number, item: any) => sum + (item.total || 0), 0) || 0;
        return <span className="font-black text-green-600">₹{formatIndianNumber(rev)}</span>;
      }
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Total Bill Amount</span>,
      dataIndex: "total",
      key: "total",
      align: "right" as const,
      render: (t: number) => <span className={`font-black text-gray-800`}>₹{formatIndianNumber(t)}</span>,
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center block">View</span>,
      key: "view",
      align: "center" as const,
      render: (_: unknown, record: any) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/bills/${record._id || record.id}`, { state: { from: "bill" } });
          }}
          className="text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
        />
      ),
    },
  ];

  const handleRowClick = (record: any) => {
    if (record.isReturn) {
      navigate(`/return-bills/${record._id}`, { state: { from: "bill" } });
    } else {
      navigate(`/bills/${record._id || record.id}`, { state: { from: "bill" } });
    }
  };

  const displayColumns = searchMode === "product" ? productSearchColumns : columns;
  const displayData = searchMode === "product" ? productHistoricalBills : filteredBills;

  let tablePagination: any;
  if (searchMode === "product") {
    tablePagination = {
      current: productPagination.current,
      total: productPagination.total,
      pageSize: productPagination.pageSize,
      onChange: (page: number) => fetchHistoricalData(page),
      showSizeChanger: false,
      className: "px-6 py-4",
    };
  } else if (!isToday) {
    tablePagination = {
      current: pagination.current,
      total: pagination.total,
      pageSize: pagination.pageSize,
      onChange: (page: number) => fetchHistoricalData(page),
      showSizeChanger: false,
      className: "px-6 py-4",
    };
  } else {
    tablePagination = { pageSize: 12, showSizeChanger: false, className: "px-6 py-4" };
  }

  return (
    <main className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
          <div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tighter leading-tight">
              Ledger Archives
            </h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">
              Authorized Revenue Documentation
              {!isToday && searchMode === "general" && historicalBills && (
                <span className="ml-3 bg-orange-50 text-orange-500 px-2 py-0.5 rounded-md text-[8px] tracking-normal">
                  HISTORICAL MODE
                </span>
              )}
            </p>
          </div>
          <Segmented
            options={[
              { label: "Registry Search", value: "general", icon: <FileTextOutlined /> },
              { label: "Product Analytics", value: "product", icon: <ShoppingOutlined /> }
            ]}
            value={searchMode}
            onChange={(val) => {
              setSearchMode(val as "general" | "product");
            }}
            className="p-1.5 bg-gray-50/50 rounded-2xl shadow-sm border border-gray-100 font-bold"
          />
        </div>

        {/* Summary Cards with PIN/RBAC */}
        {canSeeFinancials && (
          <>
            {!showAdmin ? (
              <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col items-center gap-3 mb-10 max-w-md mx-auto animate-in fade-in duration-500">
                <div className="w-full flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                    <LockOutlined className="text-indigo-600 text-sm" />
                  </div>
                  {!user?.pin ? (
                    <div className="flex-1 text-center py-2">
                      <p className="text-[10px] font-black text-red-500 uppercase tracking-widest leading-tight">Terminal Locked</p>
                      <p className="text-[8px] font-bold text-red-400">Ask admin to allow you a pin</p>
                    </div>
                  ) : (
                    <>
                      <Input.Password
                        prefix={<LockOutlined className="text-gray-300 mr-1" />}
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        placeholder="Enter PIN"
                        className="h-10 rounded-xl border-gray-100 bg-gray-50/50 font-bold text-xs flex-1"
                        onPressEnter={handlePinSubmit}
                        size="small"
                      />
                      <Button
                        type="primary"
                        onClick={handlePinSubmit}
                        className="h-10 px-5 bg-indigo-600 hover:bg-indigo-700 border-none rounded-xl text-[9px] font-black tracking-widest shadow-md shadow-indigo-100 uppercase shrink-0"
                      >
                        Unlock
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in duration-700">
                <div className="flex justify-center mb-6">
                  <Button
                    type="text"
                    icon={<EyeInvisibleOutlined className="text-xs" />}
                    onClick={() => setShowAdmin(false)}
                    className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] hover:text-red-500 transition-all flex items-center gap-2"
                  >
                    LOCK LEDGER FINANCIALS
                  </Button>
                </div>

                {searchMode === "general" ? (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {[
                      {
                        label: "Total Registry",
                        value: summary.totalBills.toString(),
                        icon: <FileTextOutlined />,
                        color: "bg-indigo-600 shadow-indigo-100",
                        bg: "bg-indigo-50/30",
                        accent: "text-indigo-400",
                      },
                      {
                        label: "Gross Invoiced",
                        value: `₹${formatIndianNumber(summary.totalAmount)}`,
                        icon: <DollarOutlined />,
                        color: "bg-emerald-600 shadow-emerald-100",
                        bg: "bg-emerald-50/30",
                        accent: "text-emerald-400",
                      },
                      {
                        label: "Settled Funds",
                        value: `₹${formatIndianNumber(summary.totalPayment)}`,
                        icon: <ArrowDownOutlined />,
                        color: "bg-blue-600 shadow-blue-100",
                        bg: "bg-blue-50/30",
                        accent: "text-blue-400",
                      },
                      {
                        label: "Exposure",
                        value: `₹${formatIndianNumber(summary.outstanding)}`,
                        icon: <WarningOutlined />,
                        color: "bg-orange-600 shadow-orange-100",
                        bg: "bg-orange-50/30",
                        accent: "text-orange-400",
                      },
                    ].map((card, i) => (
                      <div
                        key={i}
                        className={`p-6 sm:p-8 rounded-[32px] shadow-sm border border-gray-100/50 relative overflow-hidden group hover:border-gray-200 hover:shadow-md transition-all duration-500 ${card.bg}`}
                      >
                        <div
                          className={`w-11 h-11 rounded-2xl ${card.color.split(" ")[0]} text-white flex items-center justify-center mb-5 shadow-xl ${card.color.split(" ")[1]} group-hover:scale-110 transition-transform duration-500`}
                        >
                          {card.icon}
                        </div>
                        <p className={`text-[10px] font-black ${card.accent} uppercase tracking-[0.2em] mb-1`}>
                          {card.label}
                        </p>
                        <p className="text-2xl font-black text-gray-800 tracking-tighter leading-none">
                          {card.value}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    {productHistoricalSummary && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                        <div className="p-6 sm:p-8 rounded-[32px] shadow-sm border border-gray-100/50 relative overflow-hidden group hover:border-gray-200 hover:shadow-md transition-all duration-500 bg-indigo-50/30">
                          <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mb-5 shadow-xl shadow-indigo-100 group-hover:scale-110 transition-transform duration-500">
                            <FileTextOutlined />
                          </div>
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">Total Instances</p>
                          <p className="text-2xl font-black text-gray-800 tracking-tighter leading-none">
                            {productHistoricalSummary.totalInstances} Bills
                          </p>
                        </div>
                        <div className="p-6 sm:p-8 rounded-[32px] shadow-sm border border-gray-100/50 relative overflow-hidden group hover:border-gray-200 hover:shadow-md transition-all duration-500 bg-orange-50/30">
                          <div className="w-11 h-11 rounded-2xl bg-orange-600 text-white flex items-center justify-center mb-5 shadow-xl shadow-orange-100 group-hover:scale-110 transition-transform duration-500">
                            <ShoppingOutlined />
                          </div>
                          <p className="text-[10px] font-black text-orange-400 uppercase tracking-[0.2em] mb-1">Quantity Sold</p>
                          <p className="text-2xl font-black text-gray-800 tracking-tighter leading-none">
                            {productHistoricalSummary.totalQuantity} Units
                          </p>
                        </div>
                        <div className="p-6 sm:p-8 rounded-[32px] shadow-sm border border-gray-100/50 relative overflow-hidden group hover:border-gray-200 hover:shadow-md transition-all duration-500 bg-green-50/30">
                          <div className="w-11 h-11 rounded-2xl bg-green-600 text-white flex items-center justify-center mb-5 shadow-xl shadow-green-100 group-hover:scale-110 transition-transform duration-500">
                            <DollarOutlined />
                          </div>
                          <p className="text-[10px] font-black text-green-400 uppercase tracking-[0.2em] mb-1">Product Revenue</p>
                          <p className="text-2xl font-black text-gray-800 tracking-tighter leading-none">
                            ₹{formatIndianNumber(productHistoricalSummary.totalRevenue)}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}

        {/* Filters */}
        <div className="bg-white rounded-[32px] shadow-sm p-6 sm:p-8 mb-8 flex flex-col lg:flex-row gap-6 lg:items-end border border-gray-100 transition-all duration-500">
          {searchMode === "general" ? (
            <>
              <div className="flex flex-col flex-1 min-w-0">
                <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2 ml-1">
                  Search
                </label>
                <Input.Search
                  placeholder="Customer name, bill ID, phone"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-12 rounded-xl"
                  allowClear
                />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2 ml-1">
                  Amount Range (₹)
                </label>
                <div className="flex gap-2">
                  <InputNumber
                    min={0}
                    value={amountRange[0] === 0 ? undefined : amountRange[0]}
                    onChange={(v) => setAmountRange([v || 0, amountRange[1]])}
                    placeholder="Min"
                    className="h-12 rounded-xl flex-1"
                  />
                  <InputNumber
                    min={0}
                    value={amountRange[1] === Infinity ? undefined : amountRange[1]}
                    onChange={(v) => setAmountRange([amountRange[0], v || Infinity])}
                    placeholder="Max"
                    className="h-12 rounded-xl flex-1"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col flex-[2] min-w-0">
              <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2 ml-1">
                Select Product
              </label>
              <Select
                showSearch
                placeholder="Type to search products..."
                optionFilterProp="children"
                value={selectedProductId}
                onChange={(val) => setSelectedProductId(val)}
                className="h-12 w-full premium-select"
                options={products.map(p => ({ value: p._id, label: p.name }))}
                filterOption={(input, option) =>
                  String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
              />
            </div>
          )}

          <div className="flex flex-col flex-1 min-w-0">
            <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2 ml-1">
              Report Span
            </label>
            <div className="flex gap-2">
              <RangePicker
                className="h-12 flex-1 rounded-xl border-gray-100"
                value={dateRange}
                onChange={(range) =>
                  setDateRange(
                    (range as [dayjs.Dayjs | null, dayjs.Dayjs | null]) ?? [dayjs(), dayjs()]
                  )
                }
                allowClear={false}
              />
              <Button
                type="primary"
                onClick={() => fetchHistoricalData(1)}
                loading={loading}
                className="h-12 px-5 bg-indigo-600 hover:bg-indigo-700 border-none rounded-xl text-[9px] font-black tracking-widest shadow-md shadow-indigo-100 uppercase shrink-0"
              >
                Fetch
              </Button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden mb-12">
          <Table
            columns={displayColumns}
            dataSource={displayData}
            loading={loading}
            rowKey="_id"
            scroll={{ x: 1000 }}
            pagination={tablePagination}
            className="modern-table no-border-table"
            rowClassName="group cursor-pointer hover:bg-indigo-50/30 transition-all duration-300"
            onRow={(record) => ({
              onClick: () => handleRowClick(record),
            })}
          />
        </div>
      </div>

      <style>{`
        .premium-select .ant-select-selector {
          height: 48px !important;
          border-radius: 12px !important;
          border-color: #f1f5f9 !important;
          display: flex !important;
          align-items: center !important;
          font-weight: 900 !important;
          font-size: 10px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
        }
        .no-border-table .ant-table { background: transparent !important; }
        .no-border-table .ant-table-thead > tr > th {
          background: transparent !important;
          border-bottom: 2px solid #f8fafc !important;
          padding: 1.5rem 1rem !important;
        }
        .no-border-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f8fafc !important;
          padding: 1.25rem 1rem !important;
        }
        .no-border-table .ant-table-row:hover > td { background: #fdfdfd !important; }
      `}</style>
    </main>
  );
};

export default BillPage;
