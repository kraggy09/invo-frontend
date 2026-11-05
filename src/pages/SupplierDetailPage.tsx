import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Button,
  Spin,
  Tag,
  Tabs,
  Table,
  Modal,
  InputNumber,
  Tooltip,
} from "antd";
import {
  ArrowLeftOutlined,
  PhoneOutlined,
  DollarOutlined,
  ShopOutlined,
  EyeOutlined,
  CalendarOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  HistoryOutlined,
  FileTextOutlined,
  CreditCardOutlined,
} from "@ant-design/icons";
import { message } from "../utils/antdStatic";
import dayjs from "dayjs";
import apiCaller from "../utils/apiCaller";
import { ISupplier } from "../store/supplier.store";
import { ISupplierPurchase } from "../store/supplierPurchase.store";
import { formatIndianNumber } from "../utils";
import { useSocket } from "../contexts/SocketContext";
import { SocketEvents } from "../types/socket";

const SupplierDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();

  const [loading, setLoading] = useState(true);
  const [supplier, setSupplier] = useState<ISupplier | null>(null);
  const [purchases, setPurchases] = useState<ISupplierPurchase[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  // Payment Modal state
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMode, setPayMode] = useState<"CASH" | "ONLINE">("CASH");
  const [paying, setPaying] = useState(false);

  // View Bill / Manifest Modal state
  const [viewingPurchase, setViewingPurchase] =
    useState<ISupplierPurchase | null>(null);

  const fetchSupplierData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await apiCaller.get(`/suppliers/${id}`);
      if (res.data?.success) {
        setSupplier(res.data.data.supplier);
        setPurchases(res.data.data.purchases || []);
        setTransactions(res.data.data.transactions || []);
      }
    } catch (err: any) {
      console.error(err);
      message.error(
        err?.response?.data?.message || "Failed to load supplier details",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupplierData();
  }, [id]);

  // Live Socket.io Sync (parity with Customer page)
  useEffect(() => {
    if (!socket || !isConnected || !id) return;

    const handleSupplierUpdated = (updatedSupplier: any) => {
      if (updatedSupplier && (updatedSupplier._id === id || updatedSupplier.id === id)) {
        setSupplier(updatedSupplier);
      }
    };

    const handleTransactionCreated = (data: any) => {
      const tx = data?.transaction || data;
      const sId =
        typeof tx?.supplier === "string"
          ? tx.supplier
          : tx?.supplier?._id || data?.supplier?._id || data?.supplier;
      if (sId && id && sId.toString() === id.toString()) {
        setTransactions((prev) => {
          if (
            prev.some(
              (t) =>
                t._id === tx._id || (t.id && tx.id && t.id === tx.id)
            )
          )
            return prev;
          return [tx, ...prev];
        });
        const newOut =
          tx.newOutstanding !== undefined
            ? tx.newOutstanding
            : data?.supplier?.outstanding;
        if (newOut !== undefined) {
          setSupplier((prev) =>
            prev ? { ...prev, outstanding: newOut } : prev
          );
        }
      }
    };

    const handlePurchaseUpdated = (data: any) => {
      const p = data?.purchase || data;
      const sId = typeof p?.supplier === "string" ? p.supplier : p?.supplier?._id;
      if (sId === id) {
        setPurchases((prev) => {
          const index = prev.findIndex((item) => item._id === p._id);
          if (index >= 0) {
            const next = [...prev];
            next[index] = p;
            return next;
          }
          return [p, ...prev];
        });
        if (p.newSupplierOutstanding !== undefined) {
          setSupplier((prev) => (prev ? { ...prev, outstanding: p.newSupplierOutstanding } : prev));
        }
      }
    };

    socket.on(SocketEvents.SUPPLIER.UPDATED, handleSupplierUpdated);
    socket.on(SocketEvents.TRANSACTION.CREATED, handleTransactionCreated);
    socket.on(SocketEvents.SUPPLIER_PURCHASE.CREATED, handlePurchaseUpdated);
    socket.on(SocketEvents.SUPPLIER_PURCHASE.ACCEPTED, handlePurchaseUpdated);
    socket.on(SocketEvents.SUPPLIER_PURCHASE.APPROVED, handlePurchaseUpdated);
    socket.on(SocketEvents.SUPPLIER_PURCHASE.REJECTED, handlePurchaseUpdated);

    return () => {
      socket.off(SocketEvents.SUPPLIER.UPDATED, handleSupplierUpdated);
      socket.off(SocketEvents.TRANSACTION.CREATED, handleTransactionCreated);
      socket.off(SocketEvents.SUPPLIER_PURCHASE.CREATED, handlePurchaseUpdated);
      socket.off(SocketEvents.SUPPLIER_PURCHASE.ACCEPTED, handlePurchaseUpdated);
      socket.off(SocketEvents.SUPPLIER_PURCHASE.APPROVED, handlePurchaseUpdated);
      socket.off(SocketEvents.SUPPLIER_PURCHASE.REJECTED, handlePurchaseUpdated);
    };
  }, [socket, isConnected, id]);

  // Aggregate stats
  const totalPurchasesValue = useMemo(() => {
    return purchases
      .filter((p) => p.status === "APPROVED")
      .reduce((sum, p) => sum + (p.totalAmount || 0), 0);
  }, [purchases]);

  const totalPaidValue = useMemo(() => {
    return transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [transactions]);

  const handleMakePayment = async () => {
    if (!supplier || payAmount <= 0) {
      message.error("Please enter a valid payment amount");
      return;
    }

    setPaying(true);
    try {
      const txIdRes = await apiCaller.get("/transactions/latest-id");
      const transactionId = txIdRes.data?.data?.transactionId ?? 0;

      await apiCaller.post("/transactions", {
        supplierId: supplier._id,
        name: supplier.name,
        amount: payAmount,
        paymentMode: payMode,
        purpose: "Supplier Outstanding Payment",
        transactionId,
      });

      message.success(
        `Payment of ₹${formatIndianNumber(payAmount)} to ${supplier.name} recorded!`,
      );
      setShowPayModal(false);
      setPayAmount(0);
      fetchSupplierData();
    } catch (err: any) {
      console.error(err);
      message.error(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          "Failed to record payment",
      );
    } finally {
      setPaying(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Spin spinning={loading} size="large">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/suppliers")}
            className="mb-4 text-xs font-bold text-gray-500 hover:text-indigo-600"
          >
            Back to Suppliers
          </Button>

          {supplier && (
            <>
              {/* Profile Card */}
              <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-gray-100 shadow-sm mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-2xl">
                    <ShopOutlined />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black text-gray-800 tracking-tight m-0">
                      {supplier.name}
                    </h1>
                    <div className="flex items-center gap-3 text-xs text-gray-400 font-bold mt-1">
                      <span className="flex items-center gap-1 font-mono">
                        <PhoneOutlined /> {supplier.phone}
                      </span>
                      {supplier.address && (
                        <>
                          <span>•</span>
                          <span>{supplier.address}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <Button
                    icon={<PlusOutlined />}
                    onClick={() =>
                      navigate("/products/updateStock", {
                        state: { supplierId: supplier._id },
                      })
                    }
                    className="h-12 px-6 rounded-xl text-xs font-black tracking-wider uppercase border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                  >
                    New Inward Entry
                  </Button>

                  <Button
                    type="primary"
                    icon={<DollarOutlined />}
                    onClick={() => {
                      setPayAmount(
                        supplier.outstanding > 0 ? supplier.outstanding : 0,
                      );
                      setShowPayModal(true);
                    }}
                    className="h-12 px-8 bg-emerald-600 hover:bg-emerald-700 border-none rounded-xl text-xs font-black tracking-wider uppercase shadow-lg shadow-emerald-100"
                  >
                    Pay Supplier
                  </Button>
                </div>
              </div>

              {/* Statistics Overview Cards (Like Individual Customer Page) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {/* Current Udhaar */}
                <div className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase text-amber-600 tracking-wider">
                      Market Udhaar (Payable)
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-sm">
                      <CreditCardOutlined />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-amber-800 font-mono">
                    ₹{formatIndianNumber(supplier.outstanding || 0)}
                  </div>
                  <span className="text-[10px] text-gray-400 font-bold mt-1 block">
                    Current balance due to party
                  </span>
                </div>

                {/* Total Purchases Value */}
                <div className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">
                      Total Inward Purchases
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm">
                      <FileTextOutlined />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-gray-800 font-mono">
                    ₹{formatIndianNumber(totalPurchasesValue)}
                  </div>
                  <span className="text-[10px] text-gray-400 font-bold mt-1 block">
                    Cumulative goods bought
                  </span>
                </div>

                {/* Total Cleared Payments */}
                <div className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">
                      Total Cleared Payments
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm">
                      <CheckCircleOutlined />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-emerald-600 font-mono">
                    ₹{formatIndianNumber(totalPaidValue)}
                  </div>
                  <span className="text-[10px] text-gray-400 font-bold mt-1 block">
                    Total cash out to this party
                  </span>
                </div>

                {/* Inward Manifests Count */}
                <div className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase text-purple-600 tracking-wider">
                      Total Purchases
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-sm">
                      <HistoryOutlined />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-gray-800 font-mono">
                    {purchases.length}
                  </div>
                  <span className="text-[10px] text-gray-400 font-bold mt-1 block">
                    Purchase bills recorded
                  </span>
                </div>
              </div>

              {/* Tabs: Bills / Inward Manifests vs Payments Ledger */}
              <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-gray-100 shadow-sm">
                <Tabs
                  className="modern-tabs"
                  items={[
                    {
                      key: "purchases",
                      label: (
                        <span className="font-bold flex items-center gap-2">
                          <FileTextOutlined />
                          Purchase Bills
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-black">
                            {purchases.length}
                          </span>
                        </span>
                      ),
                      children: (
                        <Table
                          dataSource={purchases}
                          rowKey="_id"
                          pagination={{ pageSize: 8 }}
                          columns={[
                            {
                              title: "Date & Time",
                              dataIndex: "createdAt",
                              key: "createdAt",
                              render: (val) => (
                                <span className="font-mono text-xs font-bold text-gray-700">
                                  {dayjs(val).format("DD MMM YYYY, hh:mm A")}
                                </span>
                              ),
                            },
                            {
                              title: "Products",
                              key: "items",
                              render: (_: any, record: ISupplierPurchase) => (
                                <Tooltip
                                  title={record.items
                                    ?.map(
                                      (it) =>
                                        `${it.product?.name || "Item"} (${it.quantity})`,
                                    )
                                    .join(", ")}
                                >
                                  <span className="font-bold text-xs text-indigo-600 cursor-pointer">
                                    {record.items?.length || 0} Items (
                                    {record.items?.reduce(
                                      (s, it) => s + (it.quantity || 0),
                                      0,
                                    )}{" "}
                                    units)
                                  </span>
                                </Tooltip>
                              ),
                            },
                            {
                              title: "Status",
                              dataIndex: "status",
                              key: "status",
                              render: (st) => (
                                <Tag
                                  color={
                                    st === "APPROVED"
                                      ? "green"
                                      : st === "ACCEPTED"
                                        ? "blue"
                                        : st === "REJECTED"
                                          ? "red"
                                          : "orange"
                                  }
                                  className="font-black text-[10px] uppercase rounded-full"
                                >
                                  {st}
                                </Tag>
                              ),
                            },
                            {
                              title: "Total Bill Amount",
                              dataIndex: "totalAmount",
                              key: "totalAmount",
                              render: (amt) => (
                                <span className="font-mono font-black text-gray-800">
                                  ₹{formatIndianNumber(amt || 0)}
                                </span>
                              ),
                            },
                            {
                              title: "Cash Paid",
                              dataIndex: "cashPaid",
                              key: "cashPaid",
                              render: (amt) => (
                                <span className="font-mono font-bold text-emerald-600">
                                  ₹{formatIndianNumber(amt || 0)}
                                </span>
                              ),
                            },
                            {
                              title: "Added to Udhaar",
                              dataIndex: "creditAmount",
                              key: "creditAmount",
                              render: (amt) => (
                                <span className="font-mono font-bold text-amber-600">
                                  ₹{formatIndianNumber(amt || 0)}
                                </span>
                              ),
                            },
                            {
                              title: "Action",
                              key: "action",
                              render: (_: any, record: ISupplierPurchase) => (
                                <Button
                                  type="text"
                                  icon={<EyeOutlined />}
                                  onClick={() => setViewingPurchase(record)}
                                  className="text-indigo-600 hover:text-indigo-800 font-bold text-xs flex items-center gap-1"
                                >
                                  View Bill
                                </Button>
                              ),
                            },
                          ]}
                        />
                      ),
                    },
                    {
                      key: "payments",
                      label: (
                        <span className="font-bold flex items-center gap-2">
                          <DollarOutlined />
                          Payment History (Cash Out)
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-black">
                            {transactions.length}
                          </span>
                        </span>
                      ),
                      children: (
                        <Table
                          dataSource={transactions}
                          rowKey="_id"
                          pagination={{ pageSize: 8 }}
                          columns={[
                            {
                              title: "Date & Time",
                              dataIndex: "createdAt",
                              key: "createdAt",
                              render: (val) => (
                                <span className="font-mono text-xs font-bold text-gray-700">
                                  {dayjs(val).format("DD MMM YYYY, hh:mm A")}
                                </span>
                              ),
                            },
                            {
                              title: "Amount Paid",
                              dataIndex: "amount",
                              key: "amount",
                              render: (amt) => (
                                <span className="font-mono font-black text-sm text-emerald-600">
                                  ₹{formatIndianNumber(amt || 0)}
                                </span>
                              ),
                            },
                            {
                              title: "Payment Mode",
                              dataIndex: "paymentMode",
                              key: "paymentMode",
                              render: (mode) => (
                                <Tag
                                  color="blue"
                                  className="font-black text-[10px] uppercase rounded-lg"
                                >
                                  {mode}
                                </Tag>
                              ),
                            },
                            {
                              title: "Purpose",
                              dataIndex: "purpose",
                              key: "purpose",
                              render: (pur) => (
                                <span className="text-xs text-gray-600 font-medium">
                                  {pur || "Supplier Outstanding Payment"}
                                </span>
                              ),
                            },
                            {
                              title: "Before Udhaar",
                              dataIndex: "previousOutstanding",
                              key: "previousOutstanding",
                              render: (v) => (
                                <span className="font-mono text-xs text-gray-500">
                                  ₹{formatIndianNumber(v || 0)}
                                </span>
                              ),
                            },
                            {
                              title: "After Udhaar",
                              dataIndex: "newOutstanding",
                              key: "newOutstanding",
                              render: (v) => (
                                <span className="font-mono text-xs font-bold text-gray-800">
                                  ₹{formatIndianNumber(v || 0)}
                                </span>
                              ),
                            },
                            {
                              title: "Processed By",
                              dataIndex: "approvedBy",
                              key: "approvedBy",
                              render: (usr) => (
                                <span className="text-xs text-gray-600 font-medium">
                                  {usr?.name || "Admin"}
                                </span>
                              ),
                            },
                          ]}
                        />
                      ),
                    },
                  ]}
                />
              </div>
            </>
          )}

          {/* View Supplier Bill / Manifest Modal */}
          <Modal
            open={!!viewingPurchase}
            onCancel={() => setViewingPurchase(null)}
            footer={null}
            width={850}
            centered
            title={
              <div className="flex items-center gap-3">
                <span className="font-black text-lg text-gray-800">
                  Supplier Inward Bill Details
                </span>
                <Tag
                  color={
                    viewingPurchase?.status === "APPROVED"
                      ? "green"
                      : viewingPurchase?.status === "ACCEPTED"
                        ? "blue"
                        : "orange"
                  }
                  className="font-black text-[10px] uppercase rounded-full"
                >
                  {viewingPurchase?.status}
                </Tag>
              </div>
            }
          >
            {viewingPurchase && (
              <div className="py-4 space-y-6">
                {/* Meta details */}
                <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100 flex flex-wrap justify-between gap-4 text-xs">
                  <div>
                    <span className="text-[10px] font-black uppercase text-gray-400 block">
                      Supplier
                    </span>
                    <span className="font-bold text-gray-800 text-sm">
                      {supplier?.name}
                    </span>
                    <span className="text-gray-400 block font-mono">
                      {supplier?.phone}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-black uppercase text-gray-400 block">
                      Date & Time
                    </span>
                    <span className="font-mono font-bold text-gray-700">
                      {dayjs(viewingPurchase.createdAt).format(
                        "DD MMM YYYY, hh:mm A",
                      )}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-black uppercase text-gray-400 block">
                      Raised By
                    </span>
                    <span className="font-bold text-gray-700">
                      {viewingPurchase.raisedBy?.name || "Requester"}
                    </span>
                  </div>

                  {viewingPurchase.approvedBy && (
                    <div>
                      <span className="text-[10px] font-black uppercase text-gray-400 block">
                        Approved By
                      </span>
                      <span className="font-bold text-gray-700">
                        {viewingPurchase.approvedBy?.name}
                      </span>
                    </div>
                  )}
                </div>

                {/* Items Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-50/80 text-[10px] font-black uppercase tracking-wider text-gray-400 border-y border-gray-100">
                        <th className="py-3 px-3">Product Name</th>
                        <th className="py-3 px-2 text-center">Qty</th>
                        <th className="py-3 px-3 text-right">
                          Cost Price (CP)
                        </th>
                        <th className="py-3 px-3 text-right">Subtotal</th>
                        <th className="py-3 px-3 text-center">
                          New Selling Prices
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {viewingPurchase.items?.map((item, idx) => {
                        const unitCp =
                          item.newCostPrice ?? item.previousCostPrice ?? 0;
                        const subtotal = unitCp * (item.quantity || 0);

                        return (
                          <tr key={idx} className="hover:bg-gray-50/40">
                            <td className="py-3 px-3">
                              <span className="font-bold text-gray-800 block">
                                {item.product?.name || "Product"}
                              </span>
                              <span className="text-[10px] font-mono text-gray-400">
                                {item.product?.barcode?.[0]
                                  ? `SKU: ${item.product.barcode[0]}`
                                  : item.product?.measuring || "units"}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-center font-mono font-black text-indigo-600">
                              {item.quantity} {item.product?.measuring || "pcs"}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-gray-700">
                              ₹{formatIndianNumber(unitCp)}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-black text-gray-800">
                              ₹{formatIndianNumber(subtotal)}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {item.priceUpdated ? (
                                <div className="text-[10px] font-mono text-gray-500">
                                  <span>R: ₹{item.newRetailPrice || 0}</span> •{" "}
                                  <span>W: ₹{item.newWholesalePrice || 0}</span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-gray-400">
                                  Unchanged
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Bill Summary Breakdown */}
                <div className="bg-indigo-50/50 rounded-2xl p-5 border border-indigo-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider block">
                      Settlement Breakdown
                    </span>
                    <div className="text-xs text-gray-600 font-mono">
                      <span>Cash Paid: </span>
                      <span className="font-bold text-emerald-600">
                        ₹{formatIndianNumber(viewingPurchase.cashPaid || 0)}
                      </span>
                      <span className="mx-2">•</span>
                      <span>Credit (Udhaar): </span>
                      <span className="font-bold text-amber-600">
                        ₹{formatIndianNumber(viewingPurchase.creditAmount || 0)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">
                      Total Inward Bill
                    </span>
                    <span className="text-2xl font-black text-indigo-600 font-mono">
                      ₹{formatIndianNumber(viewingPurchase.totalAmount || 0)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <Button
                    onClick={() => setViewingPurchase(null)}
                    className="h-10 px-6 rounded-xl font-bold text-xs"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </Modal>

          {/* Payment Modal */}
          <Modal
            open={showPayModal}
            onCancel={() => setShowPayModal(false)}
            footer={null}
            centered
            title={
              <span className="font-black text-base">
                Record Payment to {supplier?.name}
              </span>
            }
          >
            <div className="py-4 space-y-4">
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex justify-between items-center">
                <span className="text-xs font-bold text-gray-600">
                  Pending Market Balance:
                </span>
                <span className="font-mono font-black text-amber-700 text-base">
                  ₹{formatIndianNumber(supplier?.outstanding || 0)}
                </span>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-gray-400 block mb-2">
                  Amount Paying Now:
                </label>
                <InputNumber
                  min={1}
                  value={payAmount}
                  onChange={(val) => setPayAmount(val ?? 0)}
                  className="w-full h-12 rounded-xl font-mono font-black text-base"
                  prefix="₹"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-gray-400 block mb-2">
                  Payment Mode:
                </label>
                <div className="flex gap-3">
                  <Button
                    type={payMode === "CASH" ? "primary" : "default"}
                    onClick={() => setPayMode("CASH")}
                    className={`h-11 flex-1 rounded-xl font-bold ${
                      payMode === "CASH" ? "bg-indigo-600" : ""
                    }`}
                  >
                    Cash
                  </Button>
                  <Button
                    type={payMode === "ONLINE" ? "primary" : "default"}
                    onClick={() => setPayMode("ONLINE")}
                    className={`h-11 flex-1 rounded-xl font-bold ${
                      payMode === "ONLINE" ? "bg-indigo-600" : ""
                    }`}
                  >
                    Online / Bank
                  </Button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Button
                  onClick={() => setShowPayModal(false)}
                  className="rounded-xl h-11 px-6 font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  loading={paying}
                  onClick={handleMakePayment}
                  className="bg-emerald-600 hover:bg-emerald-700 border-none rounded-xl font-bold h-11 px-8 shadow-lg shadow-emerald-100"
                >
                  Authorize Payment & Deduct Balance
                </Button>
              </div>
            </div>
          </Modal>
        </Spin>
      </div>
    </main>
  );
};

export default SupplierDetailPage;
