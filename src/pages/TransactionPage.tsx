import React, { useState } from "react";
import {
  Button,
  Spin,
  Popconfirm,
} from "antd";
import { message } from "../utils/antdStatic";
import {
  CheckOutlined,
  PlusOutlined,
  CreditCardOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import useUserStore from "../store/user.store";
import apiCaller from "../utils/apiCaller";
import useTransactionStore from "../store/transaction.store";

const TransactionPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const user = useUserStore((user) => user.user);

  // Use global store for realtime approvals
  const transactions = useTransactionStore((state) => state.transactionApprovals);

  const approveTransaction = async (id: string) => {
    setLoading(true);
    try {
      const res = await apiCaller.post(`/transactions/${id}/approve`);
      message.success(res.data.msg || "Transaction approved successfully");
      // Removals from list will be handled automatically by socket events
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
          className: "font-bold"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const rejectTransaction = async (id: string) => {
    setLoading(true);
    try {
      const res = await apiCaller.post(`/transactions/${id}/reject`);
      message.success(res.data.msg || "Transaction rejected successfully");
      // Removals from list will be handled automatically by socket events
    } catch (error: any) {
      console.error(error);
      message.error(error?.response?.data?.message || error?.response?.data?.msg || "Failed to reject transaction");
    } finally {
      setLoading(false);
    }
  };

  const getPaymentModeColor = (mode: string) => {
    switch (mode.toLowerCase()) {
      case "cash":
        return "green";
      case "online":
        return "blue";
      case "card":
        return "geekblue";
      default:
        return "default";
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  return (
    <main className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Spin spinning={loading} size="large">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
            <div>
              <h1 className="text-2xl font-black text-gray-800 tracking-tight leading-tight">Verification Queue</h1>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Authorized Ledger Approvals</p>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="hidden lg:flex flex-col items-end px-6 border-r border-gray-100">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Awaiting Review</span>
                <span className="text-xl font-black text-indigo-600">{transactions?.length} LOGS</span>
              </div>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate("/new-transaction")}
                className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 border-none rounded-xl text-[10px] font-black tracking-widest shadow-lg shadow-indigo-100 uppercase flex-1 md:flex-none"
              >
                Create Entry
              </Button>
            </div>
          </div>

          {transactions && transactions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {transactions.map((transaction) => (
                <div key={transaction._id} className="group bg-white rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-indigo-100 transition-all duration-500 overflow-hidden relative">
                  <div className="absolute top-4 right-4 z-20">
                    <span className="px-3 py-1 bg-orange-50 text-orange-600 text-[9px] font-black uppercase rounded-full border border-orange-100">Pending Approval</span>
                  </div>

                  {/* Header Visual */}
                  <div className="bg-gray-50/50 p-8 text-center border-b border-gray-50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 grayscale opacity-20 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" />
                    <div className="relative z-10">
                      <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-gray-100 mx-auto flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <CreditCardOutlined className="text-2xl text-indigo-500" />
                      </div>
                      <h3 className="text-2xl font-black text-gray-800 tracking-tighter">₹{transaction.amount.toLocaleString()}</h3>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Transaction Value</p>
                    </div>
                  </div>

                  <div className="p-8">
                    {/* Customer Info */}
                    <div className="flex items-center gap-3 mb-6 relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-200">
                        {transaction.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0 pr-16">
                        <p className="text-sm font-black text-gray-800 truncate capitalize tracking-tight">{transaction.name}</p>
                        <div className="flex items-center gap-1 mt-0.5 text-indigo-500">
                          <ClockCircleOutlined className="text-[10px]" />
                          <p className="text-[10px] font-bold uppercase tracking-widest leading-none">
                            {dayjs(transaction.createdAt).format("h:mm A")}
                          </p>
                        </div>
                      </div>

                      {/* Optional right-aligned date */}
                      <div className="absolute top-1 right-0 text-right">
                        <p className="text-[8px] font-black text-black uppercase tracking-widest">{dayjs(transaction.createdAt).format("DD MMM YYYY")}</p>
                      </div>
                    </div>

                    {/* Ledger Impact */}
                    {transaction.previousOutstanding !== undefined && transaction.newOutstanding !== undefined ? (
                      <div className="grid grid-cols-2 gap-3 mb-8">
                        <div className="bg-gray-50 rounded-2xl p-3 border border-gray-50">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Current</p>
                          <p className="text-xs font-black text-gray-700">₹{transaction.previousOutstanding.toLocaleString()}</p>
                        </div>
                        <div className={`rounded-2xl p-3 border ${transaction.newOutstanding < transaction.previousOutstanding ? "bg-green-50/50 border-green-100" : "bg-red-50/50 border-red-100"}`}>
                          <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${transaction.newOutstanding < transaction.previousOutstanding ? "text-green-500" : "text-red-500"}`}>Target</p>
                          <p className={`text-xs font-black ${transaction.newOutstanding < transaction.previousOutstanding ? "text-green-700" : "text-red-700"}`}>₹{transaction.newOutstanding.toLocaleString()}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-2xl p-3 border border-gray-50 mb-8">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Impact</p>
                        <p className="text-xs font-black text-gray-700">Not Applicable</p>
                      </div>
                    )}

                    {/* Actions */}
                    {user && (
                      <div className="grid grid-cols-2 gap-3">
                        <Popconfirm
                          title="Verify Rejection"
                          description="Discard this ledger entry?"
                          onConfirm={() => rejectTransaction(transaction._id)}
                          okButtonProps={{ danger: true, className: "rounded-lg font-black" }}
                          cancelButtonProps={{ className: "rounded-lg font-black" }}
                        >
                          <Button className="h-11 rounded-1.5xl border-gray-100 text-gray-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50 text-[10px] font-black tracking-widest transition-all">
                            REJECT
                          </Button>
                        </Popconfirm>
                        <Popconfirm
                          title="Authorize Entry"
                          description="Commit this payment to ledger?"
                          onConfirm={() => approveTransaction(transaction._id)}
                          okButtonProps={{ className: "bg-indigo-600 rounded-lg font-black" }}
                          cancelButtonProps={{ className: "rounded-lg font-black" }}
                        >
                          <Button type="primary" className="h-11 rounded-1.5xl bg-indigo-600 hover:bg-indigo-700 border-none text-[10px] font-black tracking-widest shadow-lg shadow-indigo-100 transition-all">
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
            <div className="bg-white rounded-[40px] p-20 text-center border border-gray-100 shadow-sm max-w-2xl mx-auto animate-in fade-in zoom-in duration-700">
              <div className="w-24 h-24 bg-indigo-50 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-inner">
                <CheckOutlined className="text-4xl text-indigo-500" />
              </div>
              <h2 className="text-2xl font-black text-gray-800 tracking-tight leading-tight mb-2">Queue Fully Synchronized</h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-10">No pending ledger approvals found at this terminal</p>
              <Button
                onClick={() => navigate("/dashboard")}
                className="h-12 px-8 rounded-2xl border-2 border-gray-100 text-[10px] font-black tracking-widest text-gray-500 hover:border-indigo-100 hover:text-indigo-600 transition-all"
              >
                RETURN TO DASHBOARD
              </Button>
            </div>
          )}
        </Spin>
      </div>
    </main>
  );
};

export default TransactionPage;
