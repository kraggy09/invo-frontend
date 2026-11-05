import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Spin,
  Popconfirm,
  Tabs,
  Badge,
  Modal,
  Input,
  Tag,
} from "antd";
import { message } from "../utils/antdStatic";
import {
  CheckOutlined,
  PlusOutlined,
  CreditCardOutlined,
  ClockCircleOutlined,
  RollbackOutlined,
  FileTextOutlined,
  EyeOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import useUserStore from "../store/user.store";
import apiCaller from "../utils/apiCaller";
import useTransactionStore from "../store/transaction.store";
import useReturnBillStore, { ReturnBill } from "../store/returnBill.store";

const TransactionPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("transactions");
  const [rejectingReturnId, setRejectingReturnId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  const navigate = useNavigate();
  const user = useUserStore((user) => user.user);

  // Global stores for real-time approvals
  const transactions = useTransactionStore((state) => state.transactionApprovals);
  const pendingReturns = useReturnBillStore((state) => state.pendingReturnBills);
  const setPendingReturnBills = useReturnBillStore((state) => state.setPendingReturnBills);
  const removePendingReturnBill = useReturnBillStore((state) => state.removePendingReturnBill);
  const updateReturnBill = useReturnBillStore((state) => state.updateReturnBill);

  const hasAdminAccess = user && user.roles?.some((role) =>
    ["SUPER_ADMIN", "ADMIN", "CREATOR"].includes(role)
  );

  // Fetch pending returns if store is empty on direct visit
  const fetchPendingReturns = useCallback(async () => {
    try {
      const res = await apiCaller.get("/return-bills", {
        params: { status: "PENDING", limit: 100 },
      });
      if (res.data?.success && res.data?.data?.returnBills) {
        setPendingReturnBills(res.data.data.returnBills);
      }
    } catch (err) {
      console.error("Failed to fetch pending return bills:", err);
    }
  }, [setPendingReturnBills]);

  useEffect(() => {
    fetchPendingReturns();
  }, [fetchPendingReturns]);

  // Approve Transaction
  const approveTransaction = async (id: string) => {
    setLoading(true);
    try {
      const res = await apiCaller.post(`/transactions/${id}/approve`);
      message.success(res.data.msg || "Transaction approved successfully");
    } catch (error: any) {
      console.error(error);
      if (error.response?.data?.data?.customer?.outstanding !== undefined) {
        const { customer, transaction } = error.response.data.data;
        message.error({
          content: (
            <div className="flex flex-col gap-1.5 py-1">
              <div className="font-black text-red-600 text-sm tracking-tight leading-tight mb-1">
                {error.response.data.msg || "Outstanding mismatch detected"}
              </div>
              <div className="flex justify-between items-center bg-gray-50 rounded-lg p-2 border border-gray-100">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Expected</span>
                <span className="font-mono font-black text-gray-500 line-through">₹{transaction.previousOutstanding}</span>
              </div>
              <div className="flex justify-between items-center bg-red-50 rounded-lg p-2 border border-red-100">
                <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Actual (Now)</span>
                <span className="font-mono font-black text-red-600">₹{customer.outstanding}</span>
              </div>
              <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center mt-2.5">
                Reject this log and request a new one
              </div>
            </div>
          ),
          duration: 8,
          className: "custom-error-message",
        });
      } else {
        message.error({
          content: error.response?.data?.msg || "Failed to approve transaction",
          className: "font-bold",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Reject Transaction
  const rejectTransaction = async (id: string) => {
    setLoading(true);
    try {
      const res = await apiCaller.post(`/transactions/${id}/reject`);
      message.success(res.data.msg || "Transaction rejected successfully");
    } catch (error: any) {
      console.error(error);
      message.error(error?.response?.data?.message || error?.response?.data?.msg || "Failed to reject transaction");
    } finally {
      setLoading(false);
    }
  };

  // Approve Return Bill
  const approveReturn = async (id: string) => {
    setLoading(true);
    try {
      const res = await apiCaller.post(`/return-bills/${id}/approve`);
      message.success(res.data?.msg || res.data?.message || "Return bill approved successfully");
      removePendingReturnBill(id);
      if (res.data?.data?.returnBill) {
        updateReturnBill(res.data.data.returnBill);
      }
    } catch (error: any) {
      console.error(error);
      if (error.response?.data?.data?.customer?.outstanding !== undefined) {
        const { customer, returnBill } = error.response.data.data;
        message.error({
          content: (
            <div className="flex flex-col gap-1.5 py-1">
              <div className="font-black text-red-600 text-sm tracking-tight leading-tight mb-1">
                {error.response.data.msg || "Outstanding mismatch detected"}
              </div>
              <div className="flex justify-between items-center bg-gray-50 rounded-lg p-2 border border-gray-100">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Expected</span>
                <span className="font-mono font-black text-gray-500 line-through">₹{returnBill?.previousOutstanding}</span>
              </div>
              <div className="flex justify-between items-center bg-red-50 rounded-lg p-2 border border-red-100">
                <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Actual (Now)</span>
                <span className="font-mono font-black text-red-600">₹{customer.outstanding}</span>
              </div>
              <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center mt-2.5">
                Reject this return bill and create a new return request
              </div>
            </div>
          ),
          duration: 8,
          className: "custom-error-message",
        });
        fetchPendingReturns();
      } else {
        message.error({
          content: error.response?.data?.msg || error.response?.data?.message || "Failed to approve return bill",
          className: "font-bold",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Open Reject Return Modal
  const openRejectReturnModal = (id: string) => {
    setRejectingReturnId(id);
    setRejectionReason("");
    setIsRejectModalOpen(true);
  };

  // Confirm Reject Return Bill
  const confirmRejectReturn = async () => {
    if (!rejectingReturnId) return;
    setLoading(true);
    try {
      const res = await apiCaller.post(`/return-bills/${rejectingReturnId}/reject`, {
        reason: rejectionReason || "Rejected by admin",
      });
      message.success(res.data?.msg || res.data?.message || "Return bill rejected successfully");
      removePendingReturnBill(rejectingReturnId);
      if (res.data?.data?.returnBill) {
        updateReturnBill(res.data.data.returnBill);
      }
      setIsRejectModalOpen(false);
      setRejectingReturnId(null);
    } catch (error: any) {
      console.error(error);
      message.error(error?.response?.data?.message || "Failed to reject return bill");
    } finally {
      setLoading(false);
    }
  };

  const totalPending = (transactions?.length || 0) + (pendingReturns?.length || 0);

  return (
    <main className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Spin spinning={loading} size="large">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100/80 rounded-full mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest text-indigo-700">Approvals Hub</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-800 tracking-tight leading-tight">Pending Approvals</h1>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                Review and approve pending payments and customer return bills
              </p>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="hidden sm:flex flex-col items-end px-6 border-r border-gray-200">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Action Required</span>
                <span className="text-xl font-black text-indigo-600">{totalPending} PENDING</span>
              </div>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate("/new-transaction")}
                className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 border-none rounded-xl text-[10px] font-black tracking-widest shadow-lg shadow-indigo-100 uppercase flex-1 md:flex-none"
              >
                New Transaction
              </Button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white rounded-3xl p-3 border border-gray-100 shadow-xs mb-8">
            <Tabs
              activeKey={activeTab}
              onChange={(key) => setActiveTab(key)}
              className="custom-approval-tabs"
              items={[
                {
                  key: "transactions",
                  label: (
                    <span className="flex items-center gap-2 px-3 py-1 font-black text-xs uppercase tracking-wider">
                      <CreditCardOutlined />
                      <span>Transactions</span>
                      <Badge
                        count={transactions?.length || 0}
                        overflowCount={99}
                        className="ml-1"
                        style={{ backgroundColor: activeTab === "transactions" ? "#4f46e5" : "#9ca3af" }}
                      />
                    </span>
                  ),
                },
                {
                  key: "returns",
                  label: (
                    <span className="flex items-center gap-2 px-3 py-1 font-black text-xs uppercase tracking-wider">
                      <RollbackOutlined />
                      <span>Return Bills</span>
                      <Badge
                        count={pendingReturns?.length || 0}
                        overflowCount={99}
                        className="ml-1"
                        style={{ backgroundColor: activeTab === "returns" ? "#ea580c" : "#9ca3af" }}
                      />
                    </span>
                  ),
                },
              ]}
            />
          </div>

          {/* TAB 1: TRANSACTIONS */}
          {activeTab === "transactions" && (
            <div>
              {transactions && transactions.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction._id}
                      className="group bg-white rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-indigo-100 transition-all duration-500 overflow-hidden relative"
                    >
                      <div className="absolute top-4 right-4 z-20">
                        <span className="px-3 py-1 bg-orange-50 text-orange-600 text-[9px] font-black uppercase rounded-full border border-orange-100">
                          Pending Approval
                        </span>
                      </div>

                      {/* Header Visual */}
                      <div className="bg-gray-50/50 p-8 text-center border-b border-gray-50 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 grayscale opacity-20 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" />
                        <div className="relative z-10">
                          <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-gray-100 mx-auto flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <CreditCardOutlined className="text-2xl text-indigo-500" />
                          </div>
                          <h3 className="text-2xl font-black text-gray-800 tracking-tighter">
                            ₹{transaction.amount.toLocaleString()}
                          </h3>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Amount</p>
                        </div>
                      </div>

                      <div className="p-8">
                        {/* Customer Info */}
                        <div className="flex items-center gap-3 mb-6 relative">
                          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-200">
                            {transaction.name?.charAt(0).toUpperCase() || "C"}
                          </div>
                          <div className="flex-1 min-w-0 pr-16">
                            <p className="text-sm font-black text-gray-800 truncate capitalize tracking-tight">
                              {transaction.name}
                            </p>
                            <div className="flex items-center gap-1 mt-0.5 text-indigo-500">
                              <ClockCircleOutlined className="text-[10px]" />
                              <p className="text-[10px] font-bold uppercase tracking-widest leading-none">
                                {dayjs(transaction.createdAt).format("h:mm A")}
                              </p>
                            </div>
                          </div>

                          <div className="absolute top-1 right-0 text-right">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                              {dayjs(transaction.createdAt).format("DD MMM YYYY")}
                            </p>
                          </div>
                        </div>

                        {/* Ledger Impact */}
                        {transaction.previousOutstanding !== undefined && transaction.newOutstanding !== undefined ? (
                          <div className="grid grid-cols-2 gap-3 mb-8">
                            <div className="bg-gray-50 rounded-2xl p-3 border border-gray-50">
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Old Balance</p>
                              <p className="text-xs font-black text-gray-700">₹{transaction.previousOutstanding.toLocaleString()}</p>
                            </div>
                            <div
                              className={`rounded-2xl p-3 border ${
                                transaction.newOutstanding < transaction.previousOutstanding
                                  ? "bg-green-50/50 border-green-100"
                                  : "bg-red-50/50 border-red-100"
                              }`}
                            >
                              <p
                                className={`text-[9px] font-black uppercase tracking-widest mb-1 ${
                                  transaction.newOutstanding < transaction.previousOutstanding ? "text-green-500" : "text-red-500"
                                }`}
                              >
                                New Balance
                              </p>
                              <p
                                className={`text-xs font-black ${
                                  transaction.newOutstanding < transaction.previousOutstanding ? "text-green-700" : "text-red-700"
                                }`}
                              >
                                ₹{transaction.newOutstanding.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gray-50 rounded-2xl p-3 border border-gray-50 mb-8">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Impact</p>
                            <p className="text-xs font-black text-gray-700">Not Applicable</p>
                          </div>
                        )}

                        {/* Actions */}
                        {hasAdminAccess && (
                          <div className="grid grid-cols-2 gap-3">
                            <Popconfirm
                              title="Reject Transaction"
                              description="Are you sure you want to reject this transaction?"
                              onConfirm={() => rejectTransaction(transaction._id)}
                              okButtonProps={{ danger: true, className: "rounded-lg font-black" }}
                              cancelButtonProps={{ className: "rounded-lg font-black" }}
                            >
                              <Button className="h-11 rounded-1.5xl border-gray-100 text-gray-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50 text-[10px] font-black tracking-widest transition-all">
                                REJECT
                              </Button>
                            </Popconfirm>
                            <Popconfirm
                              title="Approve Transaction"
                              description="Are you sure you want to approve this transaction?"
                              onConfirm={() => approveTransaction(transaction._id)}
                              okButtonProps={{ className: "bg-indigo-600 rounded-lg font-black" }}
                              cancelButtonProps={{ className: "rounded-lg font-black" }}
                            >
                              <Button
                                type="primary"
                                className="h-11 rounded-1.5xl bg-indigo-600 hover:bg-indigo-700 border-none text-[10px] font-black tracking-widest shadow-lg shadow-indigo-100 transition-all"
                              >
                                APPROVE
                              </Button>
                            </Popconfirm>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-[40px] p-16 sm:p-20 text-center border border-gray-100 shadow-sm max-w-2xl mx-auto animate-in fade-in zoom-in duration-700">
                  <div className="w-20 h-20 bg-indigo-50 rounded-[28px] flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <CheckOutlined className="text-3xl text-indigo-500" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-800 tracking-tight leading-tight mb-2">No Pending Transactions</h2>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-8">
                    All payment transactions have been reviewed and approved
                  </p>
                  <Button
                    onClick={() => navigate("/")}
                    className="h-12 px-8 rounded-2xl border-2 border-gray-100 text-[10px] font-black tracking-widest text-gray-500 hover:border-indigo-100 hover:text-indigo-600 transition-all"
                  >
                    BACK TO DASHBOARD
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: RETURN BILLS */}
          {activeTab === "returns" && (
            <div>
              {pendingReturns && pendingReturns.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {pendingReturns.map((rb: ReturnBill) => {
                    const customerName = rb.customer?.name || "Customer";
                    const originalBillId = rb.originalBill?.id || rb.originalBill;
                    const isAdjustment = rb.paymentMode === "ADJUSTMENT";
                    const customerCurrentOutstanding = rb.customer?.outstanding;
                    const expectedOutstanding = rb.previousOutstanding;
                    const hasMismatch =
                      customerCurrentOutstanding !== undefined &&
                      expectedOutstanding !== undefined &&
                      Math.abs(Number(customerCurrentOutstanding) - Number(expectedOutstanding)) > 0.001;
                    const oldOutstanding = customerCurrentOutstanding ?? expectedOutstanding ?? 0;
                    const projectedOutstanding = isAdjustment ? oldOutstanding - rb.totalAmount : oldOutstanding;

                    return (
                      <div
                        key={rb._id}
                        className="group bg-white rounded-[32px] border border-orange-100 shadow-sm hover:shadow-xl hover:shadow-orange-100 transition-all duration-500 overflow-hidden relative flex flex-col justify-between"
                      >
                        <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5">
                          <Tag color="orange" className="font-black text-[9px] uppercase tracking-widest rounded-full border-0 px-2.5 py-0.5">
                            Pending Return
                          </Tag>
                        </div>

                        {/* Visual Header */}
                        <div className="bg-orange-50/40 p-7 text-center border-b border-orange-50 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100/50 rounded-full -mr-16 -mt-16 opacity-30 group-hover:scale-110 transition-transform duration-700" />
                          <div className="relative z-10">
                            <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-orange-100 mx-auto flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                              <RollbackOutlined className="text-2xl text-orange-500" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-800 tracking-tighter">
                              ₹{rb.totalAmount.toLocaleString()}
                            </h3>
                            <div className="flex items-center justify-center gap-2 mt-1">
                              <span className="text-[10px] font-black text-orange-600 bg-orange-100/60 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                {rb.paymentMode}
                              </span>
                              <span className="text-[10px] font-bold text-gray-400">
                                #{rb.id ? `R-${rb.id}` : rb._id.slice(-6)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-6 flex-1 flex flex-col justify-between">
                          <div>
                            {/* Customer & Timestamp */}
                            <div className="flex items-center gap-3 mb-5 relative">
                              <div className="w-11 h-11 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center text-white font-black shadow-md shadow-orange-200">
                                {customerName.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0 pr-12">
                                <p className="text-sm font-black text-gray-800 truncate capitalize tracking-tight">
                                  {customerName}
                                </p>
                                <p className="text-[10px] font-bold text-gray-400">
                                  {rb.customer?.phone || "No phone"}
                                </p>
                              </div>
                              <div className="absolute top-0 right-0 text-right">
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                                  {dayjs(rb.createdAt).format("DD MMM")}
                                </p>
                                <p className="text-[8px] font-bold text-gray-400">
                                  {dayjs(rb.createdAt).format("h:mm A")}
                                </p>
                              </div>
                            </div>

                            {/* Original Bill & Items Meta */}
                            <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100 mb-4 flex items-center justify-between">
                              <div>
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Original Bill</span>
                                <span className="text-xs font-black text-indigo-600">
                                  {originalBillId ? `#B-${originalBillId}` : "N/A"}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Items Returned</span>
                                <span className="text-xs font-black text-gray-700">
                                  {rb.items?.length || 0} product{(rb.items?.length || 0) > 1 ? "s" : ""}
                                </span>
                              </div>
                            </div>

                            {/* Returned Products Summary */}
                            <div className="space-y-1.5 mb-5 max-h-28 overflow-y-auto pr-1">
                              {rb.items?.map((item: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between text-xs py-1 border-b border-gray-50 last:border-none"
                                >
                                  <span className="font-bold text-gray-700 truncate capitalize max-w-[140px]" title={item.product?.name}>
                                    {item.product?.name || "Product"}
                                  </span>
                                  <span className="font-black text-gray-500 whitespace-nowrap">
                                    {item.quantityReturned} × ₹{item.returnPrice}
                                  </span>
                                </div>
                              ))}
                            </div>

                            {/* Balance Impact */}
                            {isAdjustment ? (
                              <div className="grid grid-cols-2 gap-2 mb-4">
                                <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-100">
                                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Customer Balance</p>
                                  <p className="text-xs font-black text-gray-700">₹{oldOutstanding.toLocaleString()}</p>
                                </div>
                                <div className="bg-green-50/60 rounded-xl p-2.5 border border-green-100">
                                  <p className="text-[8px] font-black text-green-600 uppercase tracking-widest mb-0.5">Projected Balance</p>
                                  <p className="text-xs font-black text-green-700">₹{projectedOutstanding.toLocaleString()}</p>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-blue-50/60 rounded-xl p-2.5 border border-blue-100 mb-4 text-center">
                                <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest mb-0.5">Refund Method</p>
                                <p className="text-xs font-black text-blue-700">Cash Payout (Customer Ledger Unchanged)</p>
                              </div>
                            )}

                            {/* Outstanding Mismatch Warning */}
                            {hasMismatch && (
                              <div className="bg-red-50 border border-red-200 rounded-2xl p-3 mb-4 animate-in fade-in">
                                <div className="flex items-center gap-1.5 text-red-600 font-black text-[10px] uppercase tracking-wider mb-1.5">
                                  <CloseCircleOutlined />
                                  <span>Outstanding Mismatch Detected</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-bold bg-white/80 rounded-xl p-2 border border-red-100 mb-2">
                                  <div>
                                    <span className="text-[8px] text-gray-400 block uppercase tracking-wider">Expected</span>
                                    <span className="text-gray-500 line-through font-mono">₹{expectedOutstanding}</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-[8px] text-red-400 block uppercase tracking-wider">Actual (Now)</span>
                                    <span className="text-red-600 font-black font-mono">₹{customerCurrentOutstanding}</span>
                                  </div>
                                </div>
                                <p className="text-[9px] font-bold text-red-700 m-0 text-center leading-normal">
                                  Reject this return bill and create a new return request
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div>
                            {hasAdminAccess ? (
                              hasMismatch ? (
                                <div className="flex flex-col gap-2">
                                  <Button
                                    danger
                                    type="primary"
                                    onClick={() => {
                                      setRejectingReturnId(rb._id);
                                      setRejectionReason(
                                        `Customer outstanding mismatch (Expected: ₹${expectedOutstanding}, Actual: ₹${customerCurrentOutstanding})`
                                      );
                                      setIsRejectModalOpen(true);
                                    }}
                                    className="h-11 rounded-1.5xl bg-red-600 hover:bg-red-700 text-white text-[10px] font-black tracking-widest shadow-md shadow-red-100 transition-all uppercase"
                                  >
                                    REJECT RETURN BILL
                                  </Button>
                                </div>
                              ) : (
                                <div className="grid grid-cols-2 gap-2.5">
                                  <Button
                                    onClick={() => openRejectReturnModal(rb._id)}
                                    className="h-11 rounded-1.5xl border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-200 hover:bg-red-50 text-[10px] font-black tracking-widest transition-all"
                                  >
                                    REJECT
                                  </Button>
                                  <Popconfirm
                                    title="Approve Return Bill"
                                    description="This will restore product inventory and update customer ledger balance."
                                    onConfirm={() => approveReturn(rb._id)}
                                    okButtonProps={{ className: "bg-orange-500 rounded-lg font-black" }}
                                    cancelButtonProps={{ className: "rounded-lg font-black" }}
                                  >
                                    <Button
                                      type="primary"
                                      className="h-11 rounded-1.5xl bg-orange-500 hover:bg-orange-600 border-none text-[10px] font-black tracking-widest shadow-lg shadow-orange-100 transition-all"
                                    >
                                      APPROVE
                                    </Button>
                                  </Popconfirm>
                                </div>
                              )
                            ) : (
                              <div className="text-center py-2 bg-gray-50 rounded-xl border border-gray-100">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Awaiting Admin Approval</span>
                              </div>
                            )}

                            <Button
                              type="text"
                              icon={<EyeOutlined />}
                              onClick={() => navigate(`/return-bills/${rb._id}`)}
                              className="w-full mt-2 text-[9px] font-black text-gray-400 hover:text-indigo-600 uppercase tracking-widest h-8"
                            >
                              View Full Invoice
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-[40px] p-16 sm:p-20 text-center border border-gray-100 shadow-sm max-w-2xl mx-auto animate-in fade-in zoom-in duration-700">
                  <div className="w-20 h-20 bg-orange-50 rounded-[28px] flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <CheckOutlined className="text-3xl text-orange-500" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-800 tracking-tight leading-tight mb-2">No Pending Return Bills</h2>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-8">
                    All customer return requests have been approved or processed
                  </p>
                  <Button
                    onClick={() => navigate("/returns")}
                    className="h-12 px-8 rounded-2xl border-2 border-gray-100 text-[10px] font-black tracking-widest text-gray-500 hover:border-orange-100 hover:text-orange-600 transition-all"
                  >
                    GO TO RETURN CENTER
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Modal for Rejecting Return Bill */}
          <Modal
            title={<span className="font-black text-base">Reject Return Bill</span>}
            open={isRejectModalOpen}
            onOk={confirmRejectReturn}
            onCancel={() => {
              setIsRejectModalOpen(false);
              setRejectingReturnId(null);
            }}
            okText="Confirm Reject"
            okButtonProps={{ danger: true, className: "font-black rounded-lg" }}
            cancelButtonProps={{ className: "font-black rounded-lg" }}
          >
            <p className="text-xs text-gray-500 mb-3">
              Please enter an optional reason for rejecting this return bill. The items on the original bill will become eligible for return again.
            </p>
            <Input.TextArea
              rows={3}
              placeholder="e.g. Items returned were damaged or packaging missing"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="rounded-xl font-medium"
            />
          </Modal>
        </Spin>
      </div>
    </main>
  );
};

export default TransactionPage;
