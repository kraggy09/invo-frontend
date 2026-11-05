import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Tag,
  Tabs,
  Modal,
  Table,
  Input,
  Select,
  DatePicker,
  Tooltip,
  Skeleton,
  Spin,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  SearchOutlined,
  ShopOutlined,
  PlusOutlined,
  EyeOutlined,
  HistoryOutlined,
  TagOutlined,
  ReloadOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  MinusOutlined,
  BarcodeOutlined,
  InboxOutlined,
  LockOutlined,
  EyeInvisibleOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  AuditOutlined,
} from "@ant-design/icons";
import { message } from "../utils/antdStatic";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import {
  ISupplierPurchase,
  ISupplierPurchaseItem,
} from "../store/supplierPurchase.store";
import apiCaller from "../utils/apiCaller";
import useUserStore from "../store/user.store";

const { RangePicker } = DatePicker;

export interface IProductPurchaseHistoryItem {
  _id: string;
  purchaseId: string;
  createdAt: string;
  approvedAt?: string;
  status: string;
  paymentMode?: string;
  supplier?: {
    _id: string;
    name: string;
    phone: string;
  };
  product?: {
    _id: string;
    name: string;
    barcode?: number[];
    measuring?: string;
    costPrice?: number;
    retailPrice?: number;
    wholesalePrice?: number;
    superWholesalePrice?: number;
    stock?: number;
  };
  quantity: number;
  costPrice: number;
  previousCostPrice?: number;
  retailPrice: number;
  previousRetailPrice?: number;
  wholesalePrice?: number;
  superWholesalePrice?: number;
  priceUpdated?: boolean;
  totalCost: number;
  approvedBy?: {
    _id: string;
    name: string;
    username: string;
  };
  raisedBy?: {
    _id: string;
    name: string;
    username: string;
  };
}

const SupplierPurchasePage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("purchases");

  // ==========================================
  // TAB 1: PURCHASE HISTORY STATE
  // ==========================================
  const [purchases, setPurchases] = useState<ISupplierPurchase[]>([]);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [purchaseTotal, setPurchaseTotal] = useState(0);
  const [purchasePage, setPurchasePage] = useState(1);
  const [purchaseLimit, setPurchaseLimit] = useState(10);
  const [purchaseSearch, setPurchaseSearch] = useState("");
  const [debouncedPurchaseSearch, setDebouncedPurchaseSearch] = useState("");
  const [purchaseStatus, setPurchaseStatus] = useState<string>("ALL");
  const [purchaseDateRange, setPurchaseDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null] | null
  >(null);

  // Detail Modal state
  const [selectedPurchase, setSelectedPurchase] = useState<ISupplierPurchase | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // ==========================================
  // TAB 2: PRODUCT PRICE & PURCHASE HISTORY STATE
  // ==========================================
  const [productHistory, setProductHistory] = useState<IProductPurchaseHistoryItem[]>([]);
  const [productLoading, setProductLoading] = useState(false);
  const [productTotal, setProductTotal] = useState(0);
  const [productPage, setProductPage] = useState(1);
  const [productLimit, setProductLimit] = useState(10);
  const [productSearch, setProductSearch] = useState("");
  const [debouncedProductSearch, setDebouncedProductSearch] = useState("");
  const [productDateRange, setProductDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null] | null
  >(null);

  // ==========================================
  // ADMIN & FINANCIAL METRICS (PIN PROTECTED)
  // ==========================================
  const { user } = useUserStore();
  const canSeeFinancials = user?.roles?.some((role) =>
    ["ADMIN", "SUPER_ADMIN", "CREATOR"].includes(role)
  );
  const [showAdmin, setShowAdmin] = useState(false);
  const [pin, setPin] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summary, setSummary] = useState({
    totalPurchases: 0,
    totalCashPaid: 0,
    totalCredit: 0,
    approvedCount: 0,
    creditBillsCount: 0,
    totalUnits: 0,
    uniqueProductsCount: 0,
    priceUpdatesCount: 0,
    pendingCount: 0,
    pendingAmount: 0,
    totalCount: 0,
    cashPercent: 0,
  });

  const handlePinSubmit = () => {
    if (user?.pin && pin === user.pin) {
      setShowAdmin(true);
      setPin("");
    } else {
      message.error("Incorrect PIN");
    }
  };

  const fetchSummary = useCallback(async () => {
    if (!canSeeFinancials) return;
    setSummaryLoading(true);
    try {
      const params: Record<string, any> = {};
      if (purchaseDateRange && purchaseDateRange[0] && purchaseDateRange[1]) {
        params.startDate = purchaseDateRange[0].format("YYYY-MM-DD");
        params.endDate = purchaseDateRange[1].format("YYYY-MM-DD");
      }
      const res = await apiCaller.get("/supplier-purchases/summary", { params });
      if (res.data?.success && res.data?.data) {
        setSummary(res.data.data);
      }
    } catch (err: any) {
      console.error("Failed to fetch supplier purchase summary:", err);
    } finally {
      setSummaryLoading(false);
    }
  }, [canSeeFinancials, purchaseDateRange]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const metricCards = [
    {
      label: "Total Purchases",
      val: `₹${summary.totalPurchases.toLocaleString()}`,
      icon: <DollarOutlined className="text-xl" />,
      sub: `${summary.approvedCount} approved bills`,
      color: "bg-emerald-600 shadow-emerald-100",
      bg: "bg-emerald-50/30",
    },
    {
      label: "Cash Paid Out",
      val: `₹${summary.totalCashPaid.toLocaleString()}`,
      icon: <ArrowUpOutlined className="text-xl" />,
      sub: `${summary.cashPercent}% cash settled`,
      color: "bg-indigo-600 shadow-indigo-100",
      bg: "bg-indigo-50/30",
    },
    {
      label: "Credit Added",
      val: `₹${summary.totalCredit.toLocaleString()}`,
      icon: <AuditOutlined className="text-xl" />,
      sub: `${summary.creditBillsCount} on credit / khata`,
      color: "bg-amber-600 shadow-amber-100",
      bg: "bg-amber-50/30",
    },
    {
      label: "Stock Inwarded",
      val: `${summary.totalUnits.toLocaleString()} Units`,
      icon: <InboxOutlined className="text-xl" />,
      sub: `${summary.uniqueProductsCount} unique products`,
      color: "bg-blue-600 shadow-blue-100",
      bg: "bg-blue-50/30",
    },
    {
      label: "Pending Review",
      val: `${summary.pendingCount} Pending`,
      icon: <ClockCircleOutlined className="text-xl" />,
      sub: `₹${summary.pendingAmount.toLocaleString()} awaiting action`,
      color: "bg-violet-600 shadow-violet-100",
      bg: "bg-violet-50/30",
    },
  ];

  // Search Debounces
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedPurchaseSearch(purchaseSearch);
      setPurchasePage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [purchaseSearch]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedProductSearch(productSearch);
      setProductPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [productSearch]);

  // ==========================================
  // API FETCH: PURCHASES
  // ==========================================
  const fetchPurchases = useCallback(async () => {
    setPurchaseLoading(true);
    try {
      const params: Record<string, any> = {
        page: purchasePage,
        limit: purchaseLimit,
      };

      if (debouncedPurchaseSearch.trim()) {
        params.search = debouncedPurchaseSearch.trim();
      }

      if (purchaseStatus && purchaseStatus !== "ALL") {
        params.status = purchaseStatus;
      }

      if (purchaseDateRange && purchaseDateRange[0] && purchaseDateRange[1]) {
        params.startDate = purchaseDateRange[0].format("YYYY-MM-DD");
        params.endDate = purchaseDateRange[1].format("YYYY-MM-DD");
      }

      const res = await apiCaller.get("/supplier-purchases", { params });
      if (res.data?.success) {
        setPurchases(res.data.data.purchases || []);
        setPurchaseTotal(res.data.data.total || 0);
      }
    } catch (err: any) {
      console.error("Failed to fetch purchases:", err);
      message.error(err?.response?.data?.message || "Failed to fetch purchase history");
    } finally {
      setPurchaseLoading(false);
    }
  }, [purchasePage, purchaseLimit, debouncedPurchaseSearch, purchaseStatus, purchaseDateRange]);

  useEffect(() => {
    if (activeTab === "purchases") {
      fetchPurchases();
    }
  }, [activeTab, fetchPurchases]);

  // ==========================================
  // API FETCH: PRODUCT PURCHASE & PRICE HISTORY
  // ==========================================
  const fetchProductHistory = useCallback(async () => {
    setProductLoading(true);
    try {
      const params: Record<string, any> = {
        page: productPage,
        limit: productLimit,
      };

      if (debouncedProductSearch.trim()) {
        params.search = debouncedProductSearch.trim();
      }

      if (productDateRange && productDateRange[0] && productDateRange[1]) {
        params.startDate = productDateRange[0].format("YYYY-MM-DD");
        params.endDate = productDateRange[1].format("YYYY-MM-DD");
      }

      const res = await apiCaller.get("/supplier-purchases/product-history", { params });
      if (res.data?.success) {
        setProductHistory(res.data.data.history || []);
        setProductTotal(res.data.data.total || 0);
      }
    } catch (err: any) {
      console.error("Failed to fetch product purchase history:", err);
      message.error(err?.response?.data?.message || "Failed to fetch product history");
    } finally {
      setProductLoading(false);
    }
  }, [productPage, productLimit, debouncedProductSearch, productDateRange]);

  useEffect(() => {
    if (activeTab === "productHistory") {
      fetchProductHistory();
    }
  }, [activeTab, fetchProductHistory]);

  // Load single purchase for modal (ensures latest full data)
  const handleOpenPurchaseModal = async (purchase: ISupplierPurchase | string) => {
    const id = typeof purchase === "string" ? purchase : purchase._id;
    setModalLoading(true);
    try {
      const res = await apiCaller.get(`/supplier-purchases/${id}`);
      if (res.data?.success) {
        setSelectedPurchase(res.data.data.purchase || res.data.data);
      } else {
        if (typeof purchase !== "string") setSelectedPurchase(purchase);
      }
    } catch {
      if (typeof purchase !== "string") setSelectedPurchase(purchase);
    } finally {
      setModalLoading(false);
    }
  };

  // Jump from purchase item to product history
  const handleTraceProductHistory = (productName: string) => {
    setSelectedPurchase(null);
    setProductSearch(productName);
    setActiveTab("productHistory");
  };

  // ==========================================
  // TABLE COLUMNS: PURCHASE HISTORY
  // ==========================================
  const purchaseColumns: ColumnsType<ISupplierPurchase> = [
    {
      title: "Date & Time",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 170,
      render: (val: string) => (
        <div>
          <div className="font-mono text-xs font-bold text-gray-800">
            {dayjs(val).format("DD MMM YYYY")}
          </div>
          <div className="text-[11px] font-mono text-gray-400">
            {dayjs(val).format("hh:mm A")}
          </div>
        </div>
      ),
    },
    {
      title: "Supplier",
      dataIndex: "supplier",
      key: "supplier",
      render: (sup: any) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
            <ShopOutlined />
          </div>
          <div>
            <div className="font-bold text-gray-900 text-sm leading-snug">
              {sup?.name || "Unknown Supplier"}
            </div>
            {sup?.phone && (
              <div className="text-[11px] font-mono text-gray-400">{sup.phone}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Items Inwarded",
      dataIndex: "items",
      key: "items",
      width: 130,
      render: (items: ISupplierPurchaseItem[]) => {
        const count = items?.length || 0;
        const totalUnits = items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
        return (
          <div>
            <Tag color="cyan" className="font-bold text-[11px] rounded-md px-2 py-0.5">
              {count} {count === 1 ? "Product" : "Products"}
            </Tag>
            <div className="text-[10px] font-mono text-gray-400 mt-1">
              {totalUnits} units inward
            </div>
          </div>
        );
      },
    },
    {
      title: "Payment Mode",
      dataIndex: "paymentMode",
      key: "paymentMode",
      width: 130,
      render: (mode: string) => {
        const color =
          mode === "CASH" ? "green" : mode === "PARTIAL" ? "blue" : "purple";
        return (
          <Tag color={color} className="font-black text-[10px] tracking-wider uppercase rounded-md">
            {mode || "CREDIT"}
          </Tag>
        );
      },
    },
    {
      title: "Total Amount",
      dataIndex: "totalAmount",
      key: "totalAmount",
      width: 150,
      render: (amt: number) => (
        <span className="font-mono font-black text-gray-900 text-sm">
          ₹{(amt || 0).toLocaleString()}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: string) => {
        const config: Record<string, { color: string; label: string }> = {
          APPROVED: { color: "green", label: "Approved" },
          ACCEPTED: { color: "blue", label: "Awaiting Admin" },
          PENDING: { color: "gold", label: "Pending Entry" },
          REJECTED: { color: "red", label: "Rejected" },
        };
        const st = config[status] || { color: "default", label: status };
        return (
          <Tag color={st.color} className="font-bold text-[10px] uppercase rounded-full px-2.5">
            {st.label}
          </Tag>
        );
      },
    },
    {
      title: "Handled By",
      key: "handledBy",
      width: 140,
      render: (_: any, record: ISupplierPurchase) => (
        <div className="text-xs">
          <div className="font-semibold text-gray-700">
            {record.approvedBy?.name || record.raisedBy?.name || "System"}
          </div>
          <div className="text-[10px] text-gray-400">
            {record.approvedBy ? "Authorized" : "Inwarded"}
          </div>
        </div>
      ),
    },
    {
      title: "Action",
      key: "action",
      width: 110,
      fixed: "right",
      render: (_: any, record: ISupplierPurchase) => (
        <Button
          type="primary"
          ghost
          icon={<EyeOutlined />}
          size="small"
          onClick={() => handleOpenPurchaseModal(record)}
          className="rounded-lg font-bold text-xs border-indigo-200 text-indigo-600 hover:text-indigo-700 hover:border-indigo-400"
        >
          Details
        </Button>
      ),
    },
  ];

  // ==========================================
  // TABLE COLUMNS: PRODUCT PRICE HISTORY
  // ==========================================
  const productColumns: ColumnsType<IProductPurchaseHistoryItem> = [
    {
      title: "Date & Time",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 170,
      render: (val: string) => (
        <div>
          <div className="font-mono text-xs font-bold text-gray-800">
            {dayjs(val).format("DD MMM YYYY")}
          </div>
          <div className="text-[11px] font-mono text-gray-400">
            {dayjs(val).format("hh:mm A")}
          </div>
        </div>
      ),
    },
    {
      title: "Product Details",
      key: "productDetails",
      render: (_: any, item: IProductPurchaseHistoryItem) => (
        <div>
          <div className="font-bold text-gray-900 text-sm">
            {item.product?.name || "Unknown Product"}
          </div>
          <div className="text-[11px] font-mono text-gray-400 flex items-center gap-2 mt-0.5">
            {item.product?.barcode && item.product.barcode.length > 0 && (
              <span className="flex items-center gap-1">
                <BarcodeOutlined /> {item.product.barcode[0]}
              </span>
            )}
            {item.product?.measuring && <span>• Unit: {item.product.measuring}</span>}
          </div>
        </div>
      ),
    },
    {
      title: "Supplier (Who Charged)",
      dataIndex: "supplier",
      key: "supplier",
      render: (sup: any) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
            <ShopOutlined />
          </div>
          <div>
            <span className="font-bold text-gray-800 text-xs block">
              {sup?.name || "Unknown Supplier"}
            </span>
            {sup?.phone && (
              <span className="text-[10px] font-mono text-gray-400 block">{sup.phone}</span>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Qty Inward",
      dataIndex: "quantity",
      key: "quantity",
      width: 110,
      render: (qty: number, item: IProductPurchaseHistoryItem) => (
        <span className="font-mono font-bold text-indigo-600 text-xs">
          {qty} {item.product?.measuring || "pcs"}
        </span>
      ),
    },
    {
      title: "Rate Charged (Cost Price)",
      dataIndex: "costPrice",
      key: "costPrice",
      width: 170,
      render: (cp: number, item: IProductPurchaseHistoryItem) => {
        const prev = item.previousCostPrice ?? cp;
        const diff = cp - prev;
        const diffPercent = prev > 0 ? ((diff / prev) * 100).toFixed(1) : "0";

        return (
          <div>
            <div className="font-mono font-black text-gray-900 text-sm">
              ₹{(cp || 0).toLocaleString()}
            </div>
            {item.previousCostPrice !== undefined && diff !== 0 ? (
              <div className="flex items-center gap-1 mt-0.5">
                {diff > 0 ? (
                  <Tag
                    color="error"
                    className="m-0 text-[10px] font-bold py-0 px-1.5 rounded flex items-center gap-0.5"
                  >
                    <ArrowUpOutlined /> +₹{diff} (+{diffPercent}%)
                  </Tag>
                ) : (
                  <Tag
                    color="success"
                    className="m-0 text-[10px] font-bold py-0 px-1.5 rounded flex items-center gap-0.5"
                  >
                    <ArrowDownOutlined /> -₹{Math.abs(diff)} ({diffPercent}%)
                  </Tag>
                )}
              </div>
            ) : (
              <div className="text-[10px] font-mono text-gray-400 flex items-center gap-0.5 mt-0.5">
                <MinusOutlined className="text-[8px]" /> Unchanged
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "Selling Rate (Retail)",
      key: "retailPrice",
      width: 130,
      render: (_: any, item: IProductPurchaseHistoryItem) => (
        <div>
          <span className="font-mono font-bold text-gray-800 text-xs">
            ₹{(item.retailPrice ?? item.product?.retailPrice ?? 0).toLocaleString()}
          </span>
          {item.priceUpdated && (
            <Tag color="purple" className="text-[9px] font-black uppercase rounded block mt-0.5 w-fit">
              Updated
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "Total Inward Value",
      dataIndex: "totalCost",
      key: "totalCost",
      width: 140,
      render: (tot: number) => (
        <span className="font-mono font-black text-gray-900 text-xs">
          ₹{(tot || 0).toLocaleString()}
        </span>
      ),
    },
    {
      title: "Bill Ref",
      key: "manifestRef",
      width: 110,
      fixed: "right",
      render: (_: any, item: IProductPurchaseHistoryItem) => (
        <Button
          type="link"
          size="small"
          onClick={() => handleOpenPurchaseModal(item.purchaseId)}
          className="font-bold text-xs text-indigo-600 hover:text-indigo-800 p-0"
        >
          View Bill
        </Button>
      ),
    },
  ];

  // Distinct product summary banner if search returned items for a specific product
  const primaryProduct =
    productHistory.length > 0 && productHistory[0].product
      ? productHistory[0].product
      : null;

  return (
    <main className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-tight">
              Supplier Purchases & Price History
            </h1>
            <p className="text-xs font-semibold text-gray-500 mt-1">
              View supplier purchases, bills, and price history
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate("/supplier-purchases/new")}
              className="h-11 px-6 bg-indigo-600 hover:bg-indigo-700 border-none rounded-xl text-xs font-black tracking-wider uppercase shadow-md shadow-indigo-100"
            >
              New Purchase Bill
            </Button>
          </div>
        </div>

        {/* Admin PIN Protected Performance Metrics Matrix */}
        {canSeeFinancials && (
          <div className="w-full">
            {!showAdmin ? (
              <div className="bg-white rounded-[32px] p-4 shadow-sm border border-gray-100 flex flex-col items-center gap-4 max-w-md mx-auto animate-in fade-in duration-500">
                <div className="w-full flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0">
                    <LockOutlined className="text-indigo-600 text-lg" />
                  </div>
                  {!user?.pin ? (
                    <div className="flex-1 text-center py-2">
                      <p className="text-[10px] font-black text-red-500 uppercase tracking-widest leading-tight">
                        Admin PIN Required
                      </p>
                      <p className="text-[9px] font-bold text-red-400 mt-1">
                        Ask admin to allow you a pin
                      </p>
                    </div>
                  ) : (
                    <>
                      <Input.Password
                        prefix={<LockOutlined className="text-gray-300 mr-1" />}
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        placeholder="ENTER PIN"
                        className="h-12 rounded-2xl border-gray-100 bg-gray-50/50 font-black tracking-widest text-xs flex-1"
                        onPressEnter={handlePinSubmit}
                      />
                      <Button
                        type="primary"
                        onClick={handlePinSubmit}
                        className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 border-none rounded-2xl text-[10px] font-black tracking-widest shadow-lg shadow-indigo-100 uppercase shrink-0"
                      >
                        UNLOCK
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in duration-700">
                <div className="flex justify-center">
                  <Button
                    type="text"
                    icon={<EyeInvisibleOutlined className="text-xs" />}
                    onClick={() => setShowAdmin(false)}
                    className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] hover:text-red-500 transition-all flex items-center gap-2"
                  >
                    HIDE FINANCIALS
                  </Button>
                </div>

                <Spin spinning={summaryLoading}>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {metricCards.map((m, i) => (
                      <div
                        key={i}
                        className={`p-8 rounded-[32px] shadow-sm border border-gray-100/50 relative overflow-hidden group hover:border-gray-200 hover:shadow-md transition-all duration-500 ${m.bg}`}
                      >
                        <div
                          className={`w-12 h-12 rounded-2xl ${
                            m.color.split(" ")[0]
                          } text-white flex items-center justify-center mb-6 shadow-xl ${
                            m.color.split(" ")[1]
                          } group-hover:scale-110 transition-transform duration-500`}
                        >
                          {m.icon}
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">
                          {m.label}
                        </p>
                        <p className="text-2xl font-black text-gray-800 tracking-tighter mb-2">
                          {m.val}
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-gray-300" />
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                            {m.sub}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Spin>
              </div>
            )}
          </div>
        )}

        {/* Tab Selection */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 sm:p-6">
          <Tabs
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key)}
            className="custom-audit-tabs"
            items={[
              {
                key: "purchases",
                label: (
                  <span className="font-bold flex items-center gap-2 text-sm py-1">
                    <HistoryOutlined />
                    Purchase Bills History
                    {purchaseTotal > 0 && (
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-black">
                        {purchaseTotal}
                      </span>
                    )}
                  </span>
                ),
                children: (
                  <div className="space-y-4 pt-2">
                    {/* Filters Bar */}
                    <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between bg-gray-50/70 p-3.5 rounded-2xl border border-gray-100">
                      <div className="flex flex-1 flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                        <Input
                          placeholder="Search supplier, product name, barcode, invoice..."
                          prefix={<SearchOutlined className="text-gray-400" />}
                          value={purchaseSearch}
                          onChange={(e) => setPurchaseSearch(e.target.value)}
                          allowClear
                          className="h-10 rounded-xl max-w-md font-medium text-xs"
                        />

                        <Select
                          value={purchaseStatus}
                          onChange={(val) => {
                            setPurchaseStatus(val);
                            setPurchasePage(1);
                          }}
                          className="h-10 w-full sm:w-44 text-xs font-semibold"
                          options={[
                            { value: "ALL", label: "All Statuses" },
                            { value: "APPROVED", label: "Approved Only" },
                            { value: "ACCEPTED", label: "Awaiting Approval" },
                            { value: "PENDING", label: "Pending Entry" },
                            { value: "REJECTED", label: "Rejected" },
                          ]}
                        />

                        <RangePicker
                          value={purchaseDateRange}
                          onChange={(dates) => {
                            setPurchaseDateRange(dates);
                            setPurchasePage(1);
                          }}
                          className="h-10 rounded-xl text-xs font-medium"
                          format="DD MMM YYYY"
                        />
                      </div>

                      <div className="flex items-center gap-2 justify-end">
                        <Tooltip title="Refresh Records">
                          <Button
                            icon={
                              <ReloadOutlined
                                spin={purchaseLoading || summaryLoading}
                              />
                            }
                            onClick={() => {
                              fetchPurchases();
                              fetchSummary();
                            }}
                            className="h-10 w-10 flex items-center justify-center rounded-xl"
                          />
                        </Tooltip>
                      </div>
                    </div>

                    {/* Purchases Table */}
                    <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-xs">
                      <Table
                        columns={purchaseColumns}
                        dataSource={purchases}
                        rowKey="_id"
                        loading={purchaseLoading}
                        scroll={{ x: 1000 }}
                        pagination={{
                          current: purchasePage,
                          pageSize: purchaseLimit,
                          total: purchaseTotal,
                          showSizeChanger: true,
                          pageSizeOptions: ["10", "20", "50", "100"],
                          onChange: (page, limit) => {
                            setPurchasePage(page);
                            setPurchaseLimit(limit);
                          },
                          showTotal: (total, range) => (
                            <span className="text-xs font-medium text-gray-500">
                              Showing {range[0]}-{range[1]} of {total} purchases
                            </span>
                          ),
                        }}
                      />
                    </div>
                  </div>
                ),
              },
              {
                key: "productHistory",
                label: (
                  <span className="font-bold flex items-center gap-2 text-sm py-1">
                    <TagOutlined />
                    Product Price & Cost History
                    {productTotal > 0 && (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-black">
                        {productTotal}
                      </span>
                    )}
                  </span>
                ),
                children: (
                  <div className="space-y-4 pt-2">
                    {/* Filters Bar for Product History */}
                    <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between bg-gray-50/70 p-3.5 rounded-2xl border border-gray-100">
                      <div className="flex flex-1 flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                        <Input
                          placeholder="Search any product by name or barcode to see supplier rates..."
                          prefix={<SearchOutlined className="text-gray-400" />}
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          allowClear
                          className="h-10 rounded-xl max-w-lg font-medium text-xs"
                        />

                        <RangePicker
                          value={productDateRange}
                          onChange={(dates) => {
                            setProductDateRange(dates);
                            setProductPage(1);
                          }}
                          className="h-10 rounded-xl text-xs font-medium"
                          format="DD MMM YYYY"
                        />
                      </div>

                      <div className="flex items-center gap-2 justify-end">
                        <Tooltip title="Refresh Records">
                          <Button
                            icon={<ReloadOutlined spin={productLoading} />}
                            onClick={() => fetchProductHistory()}
                            className="h-10 w-10 flex items-center justify-center rounded-xl"
                          />
                        </Tooltip>
                      </div>
                    </div>

                    {/* Product Summary Header Card (when searching/viewing a product) */}
                    {debouncedProductSearch.trim() && primaryProduct && (
                      <div className="bg-gradient-to-r from-indigo-50/80 via-blue-50/50 to-white border border-indigo-100/80 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl font-bold shadow-sm shadow-indigo-200">
                            <TagOutlined />
                          </div>
                          <div>
                            <div className="font-black text-gray-900 text-base">
                              {primaryProduct.name}
                            </div>
                            <div className="text-xs font-mono text-gray-500 flex items-center gap-2 mt-0.5">
                              {primaryProduct.barcode && primaryProduct.barcode.length > 0 && (
                                <span>Barcode: {primaryProduct.barcode[0]}</span>
                              )}
                              <span>• Unit: {primaryProduct.measuring || "piece"}</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-xs font-bold border-t md:border-t-0 md:border-l border-indigo-100 pt-3 md:pt-0 md:pl-6">
                          <div>
                            <span className="text-[10px] text-gray-400 block uppercase tracking-wider">
                              Current Stock
                            </span>
                            <span className="font-mono text-gray-800 text-sm font-black">
                              {primaryProduct.stock ?? "—"} {primaryProduct.measuring || ""}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-400 block uppercase tracking-wider">
                              System Cost Price
                            </span>
                            <span className="font-mono text-indigo-600 text-sm font-black">
                              ₹{(primaryProduct.costPrice ?? 0).toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-400 block uppercase tracking-wider">
                              System Retail Price
                            </span>
                            <span className="font-mono text-emerald-600 text-sm font-black">
                              ₹{(primaryProduct.retailPrice ?? 0).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Empty State Prompt when no search query and no history */}
                    {!debouncedProductSearch.trim() && productHistory.length === 0 && !productLoading ? (
                      <div className="bg-gray-50/50 rounded-2xl p-12 text-center border border-dashed border-gray-200">
                        <InboxOutlined className="text-4xl text-indigo-400 mb-3" />
                        <h3 className="font-black text-gray-800 text-base m-0">
                          Inspect Product Supplier Rates
                        </h3>
                        <p className="text-xs text-gray-400 font-medium max-w-md mx-auto mt-1">
                          Search any product above by name or barcode to see which supplier charged what price at what date and time.
                        </p>
                      </div>
                    ) : (
                      /* Product Price History Table */
                      <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-xs">
                        <Table
                          columns={productColumns}
                          dataSource={productHistory}
                          rowKey={(item) => `${item.purchaseId}-${item.product?._id}-${item.createdAt}`}
                          loading={productLoading}
                          scroll={{ x: 1050 }}
                          pagination={{
                            current: productPage,
                            pageSize: productLimit,
                            total: productTotal,
                            showSizeChanger: true,
                            pageSizeOptions: ["10", "20", "50", "100"],
                            onChange: (page, limit) => {
                              setProductPage(page);
                              setProductLimit(limit);
                            },
                            showTotal: (total, range) => (
                              <span className="text-xs font-medium text-gray-500">
                                Showing {range[0]}-{range[1]} of {total} price records
                              </span>
                            ),
                          }}
                        />
                      </div>
                    )}
                  </div>
                ),
              },
            ]}
          />
        </div>

        {/* Purchase Details Modal */}
        <Modal
          open={!!selectedPurchase}
          onCancel={() => setSelectedPurchase(null)}
          footer={null}
          width={760}
          centered
          title={
            <div className="flex items-center gap-2 font-black text-base text-gray-900">
              <ShopOutlined className="text-indigo-600" />
              <span>Purchase Bill Details</span>
            </div>
          }
        >
          {modalLoading ? (
            <div className="py-8">
              <Skeleton active paragraph={{ rows: 6 }} />
            </div>
          ) : selectedPurchase ? (
            <div className="py-4 space-y-5">
              {/* Top Overview Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50/90 p-4 rounded-2xl border border-gray-100">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Supplier
                  </span>
                  <div className="font-black text-xs text-gray-900 truncate">
                    {selectedPurchase.supplier?.name || "Unknown"}
                  </div>
                  {selectedPurchase.supplier?.phone && (
                    <div className="text-[10px] font-mono text-gray-400">
                      {selectedPurchase.supplier.phone}
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Total Amount
                  </span>
                  <div className="font-mono font-black text-xs text-indigo-600">
                    ₹{(selectedPurchase.totalAmount || 0).toLocaleString()}
                  </div>
                  <div className="text-[10px] font-bold text-gray-400">
                    Mode: {selectedPurchase.paymentMode || "CREDIT"}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Cash Paid Out
                  </span>
                  <div className="font-mono font-black text-xs text-emerald-600">
                    ₹{(selectedPurchase.cashPaid || 0).toLocaleString()}
                  </div>
                  <div className="text-[10px] font-bold text-gray-400">
                    Udhaar: ₹{(selectedPurchase.creditAmount || 0).toLocaleString()}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Status & Date
                  </span>
                  <div className="font-black text-xs text-gray-800">
                    {selectedPurchase.status}
                  </div>
                  <div className="text-[10px] font-mono text-gray-400">
                    {dayjs(selectedPurchase.createdAt).format("DD MMM YYYY")}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-700 mb-2">
                  Purchased Items
                </h4>
                <div className="border border-gray-100 rounded-2xl overflow-hidden">
                  <Table
                    dataSource={selectedPurchase.items}
                    rowKey={(item) => item.product?._id || Math.random().toString()}
                    pagination={false}
                    size="small"
                    columns={[
                      {
                        title: "Product",
                        key: "name",
                        render: (_: any, item: ISupplierPurchaseItem) => (
                          <div>
                            <div className="font-bold text-gray-800 text-xs">
                              {item.product?.name}
                            </div>
                            <div className="text-[10px] font-mono text-gray-400">
                              Unit: {item.product?.measuring || "piece"}
                            </div>
                          </div>
                        ),
                      },
                      {
                        title: "Qty",
                        dataIndex: "quantity",
                        key: "quantity",
                        width: 70,
                        render: (q: number) => (
                          <span className="font-mono font-bold text-xs">{q}</span>
                        ),
                      },
                      {
                        title: "Cost Price (Rate)",
                        key: "costPrice",
                        width: 130,
                        render: (_: any, item: ISupplierPurchaseItem) => (
                          <span className="font-mono font-bold text-xs text-gray-800">
                            ₹{item.newCostPrice ?? item.previousCostPrice ?? 0}
                          </span>
                        ),
                      },
                      {
                        title: "Retail Price",
                        key: "retailPrice",
                        width: 110,
                        render: (_: any, item: ISupplierPurchaseItem) => (
                          <span className="font-mono text-xs text-gray-600">
                            ₹{item.newRetailPrice ?? item.previousRetailPrice ?? 0}
                          </span>
                        ),
                      },
                      {
                        title: "Subtotal",
                        key: "subtotal",
                        width: 110,
                        render: (_: any, item: ISupplierPurchaseItem) => {
                          const cp = item.newCostPrice ?? item.previousCostPrice ?? 0;
                          return (
                            <span className="font-mono font-black text-xs text-gray-900">
                              ₹{(item.quantity * cp).toLocaleString()}
                            </span>
                          );
                        },
                      },
                      {
                        title: "",
                        key: "traceAction",
                        width: 90,
                        render: (_: any, item: ISupplierPurchaseItem) => (
                          <Tooltip title="View rate history for this product">
                            <Button
                              type="link"
                              size="small"
                              onClick={() => handleTraceProductHistory(item.product?.name)}
                              className="font-bold text-[11px] text-indigo-600 p-0 hover:text-indigo-800"
                            >
                              Trace Rate
                            </Button>
                          </Tooltip>
                        ),
                      },
                    ]}
                  />
                </div>
              </div>
            </div>
          ) : null}
        </Modal>
      </div>
    </main>
  );
};

export default SupplierPurchasePage;
