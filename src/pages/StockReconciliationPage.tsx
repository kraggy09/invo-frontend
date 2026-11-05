import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Button,
  Tag,
  Tabs,
  Modal,
  Table,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Tooltip,
  Popconfirm,
  Badge,
  Card,
  Row,
  Col,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  SearchOutlined,
  SafetyCertificateOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  CloseOutlined,
  DeleteOutlined,
  PlusOutlined,
  WarningOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  MinusOutlined,
  ReloadOutlined,
  BarcodeOutlined,
  FileDoneOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { message } from "../utils/antdStatic";
import dayjs from "dayjs";
import useProductStore, { IProduct } from "../store/product.store";
import useUserStore from "../store/user.store";
import apiCaller from "../utils/apiCaller";

const { RangePicker } = DatePicker;

const COMMON_REASONS = [
  "Physical Stock Audit Count",
  "Damaged / Broken Items",
  "Shrinkage / Unrecorded Loss",
  "Spillage / Expired Goods",
  "Counting Discrepancy Correction",
  "Found Unrecorded Stock",
  "Packaging Mismatch",
  "Other",
];

interface ReconciliationDraftItem {
  product: IProduct;
  actualStock: number;
  reason: string;
  customReason?: string;
  boxCount?: number;
  packetCount?: number;
  pieceCount?: number;
}

interface ReconciliationHistoryRecord {
  _id: string;
  shopId: string;
  date: string;
  createdAt: string;
  product?: {
    _id: string;
    name: string;
    barcode?: number[];
    measuring?: string;
    costPrice?: number;
    retailPrice?: number;
    stock?: number;
  };
  oldStock: number;
  newStock: number;
  quantity: number;
  purpose: string;
  reason?: string;
  actionBy?: {
    _id: string;
    name: string;
    username: string;
  };
  createdBy?: {
    _id: string;
    name: string;
    username: string;
  };
}

const StockReconciliationPage: React.FC = () => {
  const { user } = useUserStore();
  const { products, setProducts } = useProductStore();

  const isAdmin =
    user?.roles?.some((role) =>
      ["SUPER_ADMIN", "ADMIN", "CREATOR"].includes(role)
    ) || false;

  const [activeTab, setActiveTab] = useState<string>("reconcile");

  // ==========================================
  // TAB 1: RECONCILE STAGE STATE
  // ==========================================
  const [productSearch, setProductSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [reconcileList, setReconcileList] = useState<ReconciliationDraftItem[]>([]);
  const [generalReason, setGeneralReason] = useState<string>("Physical Stock Audit Count");
  const [submitting, setSubmitting] = useState(false);

  // Quick helper modal for box/packet breakdown
  const [boxCalcModal, setBoxCalcModal] = useState<{
    open: boolean;
    item?: ReconciliationDraftItem;
  }>({ open: false });

  // Negative stock products that urgently need reconciliation
  const negativeStockProducts = useMemo(() => {
    return products.filter((p) => (p.stock || 0) < 0);
  }, [products]);

  // Product search dropdown options
  const searchSuggestions = useMemo(() => {
    if (!productSearch.trim()) return [];
    const term = productSearch.toLowerCase();
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.barcode.some((b: any) => String(b).includes(term))
      )
      .slice(0, 20);
  }, [products, productSearch]);

  // Add product to draft reconciliation list
  const handleAddProductToDraft = (prod: IProduct) => {
    if (reconcileList.some((item) => item.product._id === prod._id)) {
      message.warning(`"${prod.name}" is already in the reconciliation list`);
      return;
    }

    // Default actual stock to current stock (or 0 if negative)
    const initialActual = prod.stock < 0 ? 0 : prod.stock;

    const newItem: ReconciliationDraftItem = {
      product: prod,
      actualStock: initialActual,
      reason: generalReason,
    };

    setReconcileList((prev) => [newItem, ...prev]);
    setProductSearch("");
    setSelectedProductId(null);
  };

  // Add all negative stock items in one click
  const handleAddAllNegativeStock = () => {
    const existingIds = new Set(reconcileList.map((i) => i.product._id));
    const toAdd = negativeStockProducts
      .filter((p) => !existingIds.has(p._id))
      .map((p) => ({
        product: p,
        actualStock: 0,
        reason: "Negative Stock Correction",
      }));

    if (toAdd.length === 0) {
      message.info("All negative stock products are already staged");
      return;
    }

    setReconcileList((prev) => [...toAdd, ...prev]);
    message.success(`Added ${toAdd.length} negative stock products to reconciliation`);
  };

  const handleUpdateItemActual = (productId: string, actualStock: number) => {
    setReconcileList((prev) =>
      prev.map((item) =>
        item.product._id === productId ? { ...item, actualStock } : item
      )
    );
  };

  const handleUpdateItemReason = (
    productId: string,
    reason: string,
    customReason?: string
  ) => {
    setReconcileList((prev) =>
      prev.map((item) =>
        item.product._id === productId
          ? {
              ...item,
              reason,
              customReason:
                customReason !== undefined ? customReason : item.customReason,
            }
          : item
      )
    );
  };

  const handleRemoveDraftItem = (productId: string) => {
    setReconcileList((prev) =>
      prev.filter((item) => item.product._id !== productId)
    );
  };

  // Summary Metrics of current staged draft
  const draftMetrics = useMemo(() => {
    let totalItems = reconcileList.length;
    let netUnitVariance = 0;
    let netValueImpact = 0;
    let discrepantCount = 0;

    for (const item of reconcileList) {
      const diff = item.actualStock - item.product.stock;
      if (diff !== 0) discrepantCount++;
      netUnitVariance += diff;
      netValueImpact += diff * (item.product.costPrice || 0);
    }

    return { totalItems, netUnitVariance, netValueImpact, discrepantCount };
  }, [reconcileList]);

  // Submit reconciliation to backend
  const handleSubmitReconciliation = async () => {
    if (reconcileList.length === 0) {
      message.error("Please add at least one product to reconcile");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        generalReason,
        items: reconcileList.map((item) => ({
          productId: item.product._id,
          actualStock: item.actualStock,
          reason:
            item.reason === "Other" && item.customReason
              ? item.customReason
              : item.reason,
        })),
      };

      const res = await apiCaller.post("/stocks/reconcile", payload);

      if (res.data?.success) {
        message.success(
          res.data.message ||
            `Successfully reconciled ${reconcileList.length} products!`
        );

        // Update product store state directly
        const updatedList = res.data.data?.reconciled || [];
        const updateMap = new Map(
          updatedList.map((u: any) => [u.productId, u.newStock])
        );

        setProducts(
          products.map((p) => {
            if (updateMap.has(p._id)) {
              return { ...p, stock: updateMap.get(p._id) as number };
            }
            return p;
          })
        );

        setReconcileList([]);
        // Refresh history if tab is viewed
        fetchHistory();
      }
    } catch (err: any) {
      console.error("Reconciliation error:", err);
      message.error(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          "Failed to reconcile stock"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // TAB 2: AUDIT HISTORY STATE & FETCH
  // ==========================================
  const [historyRecords, setHistoryRecords] = useState<ReconciliationHistoryRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLimit, setHistoryLimit] = useState(15);
  const [historySearch, setHistorySearch] = useState("");
  const [debouncedHistorySearch, setDebouncedHistorySearch] = useState("");
  const [historyDateRange, setHistoryDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null] | null
  >(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedHistorySearch(historySearch);
      setHistoryPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [historySearch]);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const params: Record<string, any> = {
        page: historyPage,
        limit: historyLimit,
      };

      if (debouncedHistorySearch.trim()) {
        params.search = debouncedHistorySearch.trim();
      }

      if (historyDateRange && historyDateRange[0] && historyDateRange[1]) {
        params.startDate = historyDateRange[0].format("YYYY-MM-DD");
        params.endDate = historyDateRange[1].format("YYYY-MM-DD");
      }

      const res = await apiCaller.get("/stocks/reconcile/history", { params });
      if (res.data?.success) {
        setHistoryRecords(res.data.data.records || []);
        setHistoryTotal(res.data.data.total || 0);
      }
    } catch (err: any) {
      console.error("Failed to fetch reconciliation history:", err);
      message.error(err?.response?.data?.message || "Failed to load audit records");
    } finally {
      setHistoryLoading(false);
    }
  }, [historyPage, historyLimit, debouncedHistorySearch, historyDateRange]);

  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory();
    }
  }, [activeTab, fetchHistory]);

  // Draft table columns
  const draftColumns: ColumnsType<ReconciliationDraftItem> = [
    {
      title: "Product Details",
      key: "product",
      render: (_: any, record: ReconciliationDraftItem) => (
        <div>
          <div className="font-bold text-gray-900 text-sm">{record.product.name}</div>
          <div className="text-[11px] font-mono text-gray-400 flex items-center gap-2 mt-0.5">
            {record.product.barcode && record.product.barcode.length > 0 && (
              <span className="flex items-center gap-1">
                <BarcodeOutlined /> {record.product.barcode[0]}
              </span>
            )}
            <span>• Unit: {record.product.measuring}</span>
            {record.product.costPrice !== undefined && (
              <span>• CP: ₹{record.product.costPrice}</span>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "System Stock",
      key: "systemStock",
      width: 130,
      render: (_: any, record: ReconciliationDraftItem) => {
        const isNegative = record.product.stock < 0;
        return (
          <div>
            <span
              className={`font-mono font-black text-sm ${
                isNegative ? "text-red-600" : "text-gray-800"
              }`}
            >
              {record.product.stock} {record.product.measuring}
            </span>
            {isNegative && (
              <Tag color="red" className="block text-[9px] font-black uppercase mt-0.5 w-fit">
                Negative Alert
              </Tag>
            )}
          </div>
        );
      },
    },
    {
      title: "Actual Physical Count",
      key: "actualStock",
      width: 170,
      render: (_: any, record: ReconciliationDraftItem) => (
        <div className="flex items-center gap-2">
          <InputNumber
            min={0}
            step={record.product.measuring === "kg" ? 0.05 : 1}
            value={record.actualStock}
            onChange={(val) =>
              handleUpdateItemActual(record.product._id, val !== null ? val : 0)
            }
            className="w-28 font-mono font-black rounded-xl"
          />
          {(record.product.box || record.product.packet) && (
            <Tooltip title="Calculate using Box / Packet sizes">
              <Button
                size="small"
                icon={<ThunderboltOutlined />}
                onClick={() => setBoxCalcModal({ open: true, item: record })}
                className="rounded-lg text-[10px] font-bold text-indigo-600"
              >
                Box/Pkt
              </Button>
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      title: "Variance (Diff)",
      key: "variance",
      width: 140,
      render: (_: any, record: ReconciliationDraftItem) => {
        const diff = record.actualStock - record.product.stock;
        if (diff === 0) {
          return (
            <Tag color="default" className="font-mono font-bold text-xs">
              <MinusOutlined className="text-[10px]" /> 0 No Change
            </Tag>
          );
        }
        if (diff > 0) {
          return (
            <Tag color="success" className="font-mono font-bold text-xs flex items-center gap-1 w-fit">
              <ArrowUpOutlined /> +{diff} {record.product.measuring}
            </Tag>
          );
        }
        return (
          <Tag color="error" className="font-mono font-bold text-xs flex items-center gap-1 w-fit">
            <ArrowDownOutlined /> {diff} {record.product.measuring}
          </Tag>
        );
      },
    },
    {
      title: "Value Impact",
      key: "valueImpact",
      width: 130,
      render: (_: any, record: ReconciliationDraftItem) => {
        const diff = record.actualStock - record.product.stock;
        const impact = diff * (record.product.costPrice || 0);
        if (impact === 0) {
          return <span className="font-mono text-gray-400 text-xs">₹0</span>;
        }
        return (
          <span
            className={`font-mono font-black text-xs ${
              impact < 0 ? "text-red-600" : "text-emerald-600"
            }`}
          >
            {impact > 0 ? `+₹${impact.toLocaleString()}` : `-₹${Math.abs(impact).toLocaleString()}`}
          </span>
        );
      },
    },
    {
      title: "Reason / Note",
      key: "reason",
      width: 220,
      render: (_: any, record: ReconciliationDraftItem) => (
        <div className="space-y-1.5">
          <Select
            size="small"
            value={record.reason}
            onChange={(val) => handleUpdateItemReason(record.product._id, val)}
            className="w-full text-xs font-semibold"
            options={COMMON_REASONS.map((r) => ({ value: r, label: r }))}
          />
          {record.reason === "Other" && (
            <Input
              size="small"
              placeholder="Specify custom reason..."
              value={record.customReason || ""}
              onChange={(e) =>
                handleUpdateItemReason(record.product._id, record.reason, e.target.value)
              }
              className="text-xs rounded-lg"
            />
          )}
        </div>
      ),
    },
    {
      title: "",
      key: "remove",
      width: 60,
      render: (_: any, record: ReconciliationDraftItem) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveDraftItem(record.product._id)}
          className="hover:bg-red-50 rounded-lg"
        />
      ),
    },
  ];

  // History table columns
  const historyColumns: ColumnsType<ReconciliationHistoryRecord> = [
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
      title: "Product",
      key: "product",
      render: (_: any, record: ReconciliationHistoryRecord) => (
        <div>
          <div className="font-bold text-gray-900 text-sm">
            {record.product?.name || "Unknown Product"}
          </div>
          <div className="text-[11px] font-mono text-gray-400 flex items-center gap-2 mt-0.5">
            {record.product?.barcode && record.product.barcode.length > 0 && (
              <span>Barcode: {record.product.barcode[0]}</span>
            )}
            <span>• Unit: {record.product?.measuring || "piece"}</span>
          </div>
        </div>
      ),
    },
    {
      title: "System Stock Before",
      dataIndex: "oldStock",
      key: "oldStock",
      width: 140,
      render: (st: number, record: ReconciliationHistoryRecord) => (
        <span className="font-mono font-bold text-gray-600 text-xs">
          {st} {record.product?.measuring || "pcs"}
        </span>
      ),
    },
    {
      title: "Reconciled Actual Stock",
      dataIndex: "newStock",
      key: "newStock",
      width: 160,
      render: (st: number, record: ReconciliationHistoryRecord) => (
        <span className="font-mono font-black text-indigo-700 text-sm">
          {st} {record.product?.measuring || "pcs"}
        </span>
      ),
    },
    {
      title: "Variance Applied",
      dataIndex: "quantity",
      key: "quantity",
      width: 140,
      render: (diff: number, record: ReconciliationHistoryRecord) => {
        if (diff === 0) {
          return (
            <Tag color="default" className="font-mono font-bold text-xs">
              0
            </Tag>
          );
        }
        if (diff > 0) {
          return (
            <Tag color="success" className="font-mono font-bold text-xs flex items-center gap-1 w-fit">
              <ArrowUpOutlined /> +{diff} {record.product?.measuring || ""}
            </Tag>
          );
        }
        return (
          <Tag color="error" className="font-mono font-bold text-xs flex items-center gap-1 w-fit">
            <ArrowDownOutlined /> {diff} {record.product?.measuring || ""}
          </Tag>
        );
      },
    },
    {
      title: "Audit Reason",
      dataIndex: "reason",
      key: "reason",
      render: (reason: string) => (
        <span className="text-xs font-semibold text-gray-700">
          {reason || "Stock Reconciliation"}
        </span>
      ),
    },
    {
      title: "Reconciled By",
      key: "actionBy",
      width: 140,
      render: (_: any, record: ReconciliationHistoryRecord) => (
        <div>
          <div className="font-bold text-gray-900 text-xs">
            {record.actionBy?.name || record.createdBy?.name || "Admin"}
          </div>
          <div className="text-[10px] text-gray-400 font-mono">
            @{record.actionBy?.username || record.createdBy?.username || "admin"}
          </div>
        </div>
      ),
    },
  ];

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-gray-50/50 p-8 flex items-center justify-center">
        <div className="bg-white rounded-3xl p-10 max-w-md text-center border border-gray-100 shadow-sm">
          <SafetyCertificateOutlined className="text-5xl text-red-500 mb-4" />
          <h2 className="text-xl font-black text-gray-900 mb-2">Restricted Access</h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            Stock reconciliation is restricted to authorized store administrators only. Please contact your administrator if you need stock adjustments.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-tight">
                Stock Reconciliation
              </h1>
              <Tag color="indigo" className="font-black text-[10px] uppercase rounded-full">
                Admin Exclusive
              </Tag>
            </div>
            <p className="text-xs font-semibold text-gray-500 mt-1">
              Audit physical shop inventory against system stock and reconcile inventory variances
            </p>
          </div>

          {negativeStockProducts.length > 0 && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-100 px-4 py-2.5 rounded-2xl">
              <WarningOutlined className="text-red-500 text-base" />
              <div>
                <div className="text-xs font-bold text-red-700">
                  {negativeStockProducts.length} Products with Negative Stock
                </div>
                <div className="text-[10px] text-red-500 font-medium">
                  Actual stock is higher than software count
                </div>
              </div>
              <Button
                size="small"
                type="primary"
                danger
                onClick={handleAddAllNegativeStock}
                className="rounded-xl text-xs font-black uppercase tracking-wider"
              >
                Reconcile All
              </Button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 sm:p-6">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: "reconcile",
                label: (
                  <span className="font-bold flex items-center gap-2 text-sm py-1">
                    <SafetyCertificateOutlined />
                    Reconcile Stock (Live Audit)
                    {reconcileList.length > 0 && (
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-black">
                        {reconcileList.length} Staged
                      </span>
                    )}
                  </span>
                ),
                children: (
                  <div className="space-y-6 pt-2">
                    {/* Top Search & Staging Bar */}
                    <div className="bg-gray-50/80 p-4 sm:p-5 rounded-2xl border border-gray-100 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
                      <div className="flex-1 max-w-xl">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">
                          Search Product to Reconcile
                        </label>
                        <Select
                          showSearch
                          value={selectedProductId}
                          placeholder="Type product name or scan barcode to add..."
                          defaultActiveFirstOption={false}
                          showArrow={false}
                          filterOption={false}
                          onSearch={setProductSearch}
                          onChange={(val) => {
                            const found = products.find((p) => p._id === val);
                            if (found) handleAddProductToDraft(found);
                          }}
                          notFoundContent={null}
                          className="w-full h-11 text-xs font-semibold"
                          options={searchSuggestions.map((p) => ({
                            value: p._id,
                            label: (
                              <div className="flex justify-between items-center py-1">
                                <div>
                                  <span className="font-bold text-gray-800">{p.name}</span>
                                  <span className="text-[10px] text-gray-400 font-mono ml-2">
                                    {p.barcode?.[0]}
                                  </span>
                                </div>
                                <span className="font-mono text-xs font-bold text-indigo-600">
                                  Current: {p.stock} {p.measuring}
                                </span>
                              </div>
                            ),
                          }))}
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">
                            Default Audit Reason
                          </label>
                          <Select
                            value={generalReason}
                            onChange={setGeneralReason}
                            className="h-11 w-56 text-xs font-semibold"
                            options={COMMON_REASONS.map((r) => ({ value: r, label: r }))}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Summary Metrics Bar if items are staged */}
                    {reconcileList.length > 0 && (
                      <Row gutter={[16, 16]}>
                        <Col xs={12} sm={6}>
                          <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4">
                            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                              Products Staged
                            </span>
                            <span className="text-xl font-mono font-black text-indigo-900 mt-1 block">
                              {draftMetrics.totalItems}
                            </span>
                          </div>
                        </Col>
                        <Col xs={12} sm={6}>
                          <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-4">
                            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                              Discrepant Items
                            </span>
                            <span className="text-xl font-mono font-black text-amber-900 mt-1 block">
                              {draftMetrics.discrepantCount}
                            </span>
                          </div>
                        </Col>
                        <Col xs={12} sm={6}>
                          <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4">
                            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                              Net Quantity Variance
                            </span>
                            <span
                              className={`text-xl font-mono font-black mt-1 block ${
                                draftMetrics.netUnitVariance < 0
                                  ? "text-red-600"
                                  : "text-emerald-700"
                              }`}
                            >
                              {draftMetrics.netUnitVariance > 0
                                ? `+${draftMetrics.netUnitVariance}`
                                : draftMetrics.netUnitVariance}
                            </span>
                          </div>
                        </Col>
                        <Col xs={12} sm={6}>
                          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                              Net Stock Cost Impact
                            </span>
                            <span
                              className={`text-xl font-mono font-black mt-1 block ${
                                draftMetrics.netValueImpact < 0
                                  ? "text-red-600"
                                  : "text-emerald-700"
                              }`}
                            >
                              ₹{draftMetrics.netValueImpact.toLocaleString()}
                            </span>
                          </div>
                        </Col>
                      </Row>
                    )}

                    {/* Staged Draft Table */}
                    {reconcileList.length === 0 ? (
                      <div className="bg-gray-50/50 rounded-2xl p-16 text-center border border-dashed border-gray-200">
                        <SafetyCertificateOutlined className="text-5xl text-indigo-400 mb-3" />
                        <h3 className="font-black text-gray-800 text-base m-0">
                          No Products Staged for Reconciliation
                        </h3>
                        <p className="text-xs text-gray-400 font-medium max-w-md mx-auto mt-1">
                          Search any product above to enter physical stock counts, or click "Reconcile All" to quickly correct negative stock items.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-xs">
                          <Table
                            columns={draftColumns}
                            dataSource={reconcileList}
                            rowKey={(item) => item.product._id}
                            pagination={false}
                            scroll={{ x: 900 }}
                          />
                        </div>

                        {/* Confirmation Bar */}
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/80 p-4 rounded-2xl border border-gray-100">
                          <Button
                            danger
                            onClick={() => setReconcileList([])}
                            className="rounded-xl font-bold text-xs"
                          >
                            Clear Staged List
                          </Button>

                          <Popconfirm
                            title="Confirm Stock Reconciliation"
                            description={`Are you sure you want to reconcile ${reconcileList.length} products? System stock will be updated live.`}
                            onConfirm={handleSubmitReconciliation}
                            okText="Yes, Apply Reconciliation"
                            cancelText="Cancel"
                          >
                            <Button
                              type="primary"
                              loading={submitting}
                              icon={<CheckCircleOutlined />}
                              className="h-11 px-8 bg-green-600 hover:bg-green-700 border-none rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-green-100"
                            >
                              Authorize & Apply Reconciliation
                            </Button>
                          </Popconfirm>
                        </div>
                      </div>
                    )}
                  </div>
                ),
              },
              {
                key: "history",
                label: (
                  <span className="font-bold flex items-center gap-2 text-sm py-1">
                    <HistoryOutlined />
                    Reconciliation Audit History
                    {historyTotal > 0 && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-black">
                        {historyTotal}
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
                          placeholder="Search product name, barcode, admin, reason..."
                          prefix={<SearchOutlined className="text-gray-400" />}
                          value={historySearch}
                          onChange={(e) => setHistorySearch(e.target.value)}
                          allowClear
                          className="h-10 rounded-xl max-w-md font-medium text-xs"
                        />

                        <RangePicker
                          value={historyDateRange}
                          onChange={(dates) => {
                            setHistoryDateRange(dates);
                            setHistoryPage(1);
                          }}
                          className="h-10 rounded-xl text-xs font-medium"
                          format="DD MMM YYYY"
                        />
                      </div>

                      <div className="flex items-center gap-2 justify-end">
                        <Tooltip title="Refresh Records">
                          <Button
                            icon={<ReloadOutlined spin={historyLoading} />}
                            onClick={() => fetchHistory()}
                            className="h-10 w-10 flex items-center justify-center rounded-xl"
                          />
                        </Tooltip>
                      </div>
                    </div>

                    {/* History Table */}
                    <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-xs">
                      <Table
                        columns={historyColumns}
                        dataSource={historyRecords}
                        rowKey="_id"
                        loading={historyLoading}
                        scroll={{ x: 1000 }}
                        pagination={{
                          current: historyPage,
                          pageSize: historyLimit,
                          total: historyTotal,
                          showSizeChanger: true,
                          pageSizeOptions: ["15", "30", "50", "100"],
                          onChange: (page, limit) => {
                            setHistoryPage(page);
                            setHistoryLimit(limit);
                          },
                          showTotal: (total, range) => (
                            <span className="text-xs font-medium text-gray-500">
                              Showing {range[0]}-{range[1]} of {total} reconciliation records
                            </span>
                          ),
                        }}
                      />
                    </div>
                  </div>
                ),
              },
            ]}
          />
        </div>

        {/* Box / Packet Breakdown Calculator Modal */}
        <Modal
          open={boxCalcModal.open}
          onCancel={() => setBoxCalcModal({ open: false })}
          title="Box & Packet Count Calculator"
          footer={null}
          centered
          width={450}
        >
          {boxCalcModal.item && (
            <div className="py-3 space-y-4">
              <div className="bg-gray-50 p-3 rounded-xl text-xs">
                <span className="font-bold text-gray-800">{boxCalcModal.item.product.name}</span>
                <div className="text-gray-400 font-mono mt-0.5">
                  Box Size: {boxCalcModal.item.product.box || "N/A"} pcs • Packet Size:{" "}
                  {boxCalcModal.item.product.packet || "N/A"} pcs
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {boxCalcModal.item.product.box && boxCalcModal.item.product.box > 0 ? (
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                      Boxes (×{boxCalcModal.item.product.box})
                    </label>
                    <InputNumber
                      min={0}
                      defaultValue={0}
                      id="calc-box"
                      className="w-full font-mono font-bold"
                    />
                  </div>
                ) : null}

                {boxCalcModal.item.product.packet && boxCalcModal.item.product.packet > 0 ? (
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                      Packets (×{boxCalcModal.item.product.packet})
                    </label>
                    <InputNumber
                      min={0}
                      defaultValue={0}
                      id="calc-packet"
                      className="w-full font-mono font-bold"
                    />
                  </div>
                ) : null}

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                    Loose Pieces
                  </label>
                  <InputNumber
                    min={0}
                    defaultValue={0}
                    id="calc-piece"
                    className="w-full font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button onClick={() => setBoxCalcModal({ open: false })}>Cancel</Button>
                <Button
                  type="primary"
                  onClick={() => {
                    const boxVal =
                      Number(
                        (document.getElementById("calc-box") as HTMLInputElement)?.value
                      ) || 0;
                    const pktVal =
                      Number(
                        (document.getElementById("calc-packet") as HTMLInputElement)?.value
                      ) || 0;
                    const pcsVal =
                      Number(
                        (document.getElementById("calc-piece") as HTMLInputElement)?.value
                      ) || 0;

                    const totalPieces =
                      boxVal * (boxCalcModal.item?.product.box || 0) +
                      pktVal * (boxCalcModal.item?.product.packet || 0) +
                      pcsVal;

                    handleUpdateItemActual(boxCalcModal.item!.product._id, totalPieces);
                    setBoxCalcModal({ open: false });
                  }}
                  className="bg-indigo-600 font-bold"
                >
                  Set Actual Count
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </main>
  );
};

export default StockReconciliationPage;
