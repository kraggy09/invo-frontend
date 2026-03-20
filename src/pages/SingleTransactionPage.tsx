import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Card, Spin, Button, Statistic } from "antd";
import { message } from "../utils/antdStatic";
import { ArrowLeftOutlined, DollarOutlined, PrinterOutlined } from "@ant-design/icons";
import apiCaller from "../utils/apiCaller";
import dayjs from "dayjs";
import useTransactionStore from "../store/transaction.store";
import { useReactToPrint } from "react-to-print";
import TransactionPrint from "../components/TransactionPrint";

const SingleTransactionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;
  const [loading, setLoading] = useState(false);
  const [transaction, setTransaction] = useState<any>(null);
  const [showPrint, setShowPrint] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: contentRef as React.RefObject<HTMLDivElement>,
  });

  const handlePrintClick = () => {
    setShowPrint(true);
    setTimeout(() => {
      handlePrint();
    }, 100);
  };

  // Try the store first — covers in-app navigation without a network round-trip
  const transactionFromStore = useTransactionStore((state) =>
    state.transactions.find((t) => t._id === id)
  );

  useEffect(() => {
    if (transactionFromStore) {
      setTransaction(transactionFromStore);
      return;
    }
    // Fall back to API — covers direct URL, page refresh, shared links
    const fetchTransaction = async () => {
      setLoading(true);
      try {
        const res = await apiCaller.get(`/transactions/${id}`);
        setTransaction(res.data?.data?.transaction);
      } catch (error: any) {
        message.error(error?.response?.data?.message || error?.response?.data?.msg || "Failed to fetch transaction details");
      } finally {
        setLoading(false);
      }
    };
    fetchTransaction();
  }, [id, transactionFromStore]);

  const isPaymentIn = transaction?.paymentIn !== undefined ? transaction.paymentIn : !transaction?.taken;

  return (
    <main className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-50/50 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <Button
            type="text"
            icon={<ArrowLeftOutlined className="text-[10px]" />}
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 font-black text-gray-400 hover:text-indigo-600 transition-all p-0 h-auto uppercase tracking-widest text-[10px]"
          >
            Terminal Root / Previous
          </Button>
          <div className="flex items-center gap-4 sm:gap-6">
            <Button
              type="primary"
              icon={<PrinterOutlined />}
              onClick={handlePrintClick}
              className="h-8 sm:h-10 px-4 sm:px-6 rounded-xl font-black text-[9px] sm:text-[10px] tracking-widest uppercase shadow-md shadow-indigo-100 flex items-center"
            >
              Print Receipt
            </Button>
            <div className="text-right hidden sm:block">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] block">Ledger Insight</span>
              <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest text-right">
                ID: {transaction?.id ? `T-${transaction.id}` : transaction?._id?.slice(-8).toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-40 text-center"><Spin size="large" /></div>
        ) : transaction ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Main Details Card */}
            <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden group">
              <div className="bg-indigo-600 p-8 sm:p-12 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative overflow-hidden">
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500 rounded-full mb-4 border border-indigo-400/30">
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <span className="text-[8px] font-black uppercase tracking-widest">Authorized Entry</span>
                  </div>
                  <h1 className="text-3xl font-black tracking-tighter leading-tight">Ledger Record</h1>
                  <p className="text-[10px] font-black text-indigo-100/50 uppercase tracking-widest mt-1">
                    Synced: {dayjs(transaction.createdAt).format("DD MMM YYYY · hh:mm A")}
                  </p>
                </div>
                <div className={`relative z-10 px-6 py-2 rounded-2xl font-black text-[10px] uppercase tracking-widest border backdrop-blur-md ${!isPaymentIn
                  ? "bg-red-500/20 border-red-500/30 text-red-100"
                  : "bg-green-500/20 border-green-500/30 text-green-100"
                  }`}>
                  {!isPaymentIn ? "Debit Adjustment" : "Credit Addition"}
                </div>

                <div className="absolute top-0 right-0 p-20 opacity-5 group-hover:scale-110 transition-transform duration-1000 rotate-12">
                  <DollarOutlined style={{ fontSize: 240 }} />
                </div>
              </div>

              <div className="p-8 sm:p-10 grid grid-cols-1 sm:grid-cols-2 gap-8 border-b border-gray-50">
                <div>
                  <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest block mb-2">Registry Entity</span>
                  <p className="text-base font-black text-gray-800 tracking-tight capitalize">{transaction.name || "General Revenue Hub"}</p>
                </div>
                <div>
                  <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest block mb-2">Intent Objective</span>
                  <p className="text-base font-bold text-gray-500 capitalize">{transaction.purpose || "Manual Synchronization"}</p>
                </div>
                <div>
                  <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest block mb-2">Authorized Operator</span>
                  <p className="text-base font-black text-indigo-600 tracking-tight">{transaction.approvedBy?.name || "Terminal Admin"}</p>
                </div>
                <div className="sm:text-right">
                  <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest block mb-2">System Hash</span>
                  <p className="text-[10px] font-mono font-bold text-gray-300 break-all">{transaction._id}</p>
                </div>
              </div>

              <div className="p-8 sm:p-10 bg-gray-50/30 grid grid-cols-1 sm:grid-cols-3 gap-8">
                <div>
                  <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest block mb-1">Baseline</span>
                  <p className="text-xl font-black text-gray-400 tracking-tighter">₹{Number(transaction.previousOutstanding || 0).toLocaleString()}</p>
                </div>
                <div className="sm:text-center">
                  <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest block mb-1">Delta Flow</span>
                  <p className={`text-xl font-black tracking-tighter ${!isPaymentIn ? "text-red-500" : "text-green-600"}`}>
                    {isPaymentIn ? "-" : "+"} ₹{Number(transaction.amount || transaction.payment || 0).toLocaleString()}
                  </p>
                </div>
                <div className="sm:text-right">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Finalized Ledger</span>
                  <p className="text-2xl font-black text-gray-800 tracking-tighter">₹{Number(transaction.newOutstanding || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* High Impact Summary */}
            <div className={`p-8 sm:p-10 rounded-[40px] shadow-xl flex items-center justify-between group transition-all hover:scale-[1.02] duration-500 ${!isPaymentIn ? "bg-white border-red-50 border-2" : "bg-white border-green-50 border-2"
              }`}>
              <div>
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] block mb-2 ${!isPaymentIn ? "text-red-400" : "text-green-400"}`}>
                  Registry {!isPaymentIn ? "Debit" : "Credit"}
                </span>
                <h2 className={`text-5xl font-black tracking-tighter leading-none ${!isPaymentIn ? "text-red-600" : "text-green-600"}`}>
                  ₹{Number(transaction.amount || transaction.payment || 0).toLocaleString()}
                </h2>
              </div>
              <div className={`w-20 h-20 rounded-[32px] flex items-center justify-center shadow-xl group-hover:rotate-12 transition-transform duration-500 ${!isPaymentIn ? "bg-red-500 text-white shadow-red-100" : "bg-green-500 text-white shadow-green-100"}`}>
                <DollarOutlined style={{ fontSize: 32 }} />
              </div>
            </div>
          </div>
        ) : (
          <div className="py-40 text-center flex flex-col items-center">
            <div className="w-20 h-20 rounded-[32px] bg-red-50 text-red-500 flex items-center justify-center mb-6">
              <DollarOutlined style={{ fontSize: 32 }} />
            </div>
            <p className="text-sm font-black text-gray-300 uppercase tracking-widest">Ledger Entry Synchronization Failed</p>
          </div>
        )}
      </div>

      {showPrint && transaction && (
        <TransactionPrint
          onClose={() => setShowPrint(false)}
          handlePrint={handlePrintClick}
          contentRef={contentRef}
          transactionData={transaction}
          isPaymentIn={isPaymentIn}
        />
      )}
    </main>
  );
};

export default SingleTransactionPage;
