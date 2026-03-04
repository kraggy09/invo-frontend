import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Card, Spin, Button, message, Statistic } from "antd";
import { ArrowLeftOutlined, DollarOutlined } from "@ant-design/icons";
import apiCaller from "../utils/apiCaller";
import dayjs from "dayjs";
import useTransactionStore from "../store/transaction.store";

const SingleTransactionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;
  const [loading, setLoading] = useState(false);
  const [transaction, setTransaction] = useState<any>(null);

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
      } catch (error) {
        message.error("Failed to fetch transaction details");
      } finally {
        setLoading(false);
      }
    };
    fetchTransaction();
  }, [id, transactionFromStore]);

  return (
    <div className="p-6 min-h-screen bg-white">
      {/* Back Button */}
      <button
        onClick={() => {
          if (from === "daily-report") navigate("/daily-report");
          else if (from === "bill") navigate("/bills");
          else navigate("/daily-report");
        }}
        className="mb-6 flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors text-sm font-medium focus:outline-none"
        style={{
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
        }}
      >
        <ArrowLeftOutlined />
        {from === "bill" ? "Back to Bills" : "Back to Daily Report"}
      </button>
      {loading ? (
        <Spin size="large" className="block mx-auto mt-32" />
      ) : transaction ? (
        <div className="max-w-xl mx-auto">
          <Card
            title={
              <span className="text-lg font-semibold text-blue-700">
                Transaction Details
              </span>
            }
            bordered={false}
            className="shadow-lg border-0 mb-8"
            style={{ borderRadius: 18 }}
            bodyStyle={{ padding: 24 }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 mb-6">
              <div>
                <div className="text-xs text-gray-500 mb-1 font-medium">
                  Transaction ID
                </div>
                <div className="text-base text-gray-900 font-semibold">
                  {transaction.id || transaction._id}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1 font-medium">
                  Date
                </div>
                <div className="text-base text-gray-900">
                  {transaction.createdAt
                    ? dayjs(transaction.createdAt).format("DD/MM/YYYY")
                    : "-"}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1 font-medium">
                  Time
                </div>
                <div className="text-base text-gray-900">
                  {transaction.createdAt
                    ? dayjs(transaction.createdAt).format("hh:mm:ss A")
                    : "-"}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1 font-medium">
                  Purpose
                </div>
                <div className="text-base text-gray-900">
                  {transaction.purpose || "-"}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1 font-medium">
                  Name
                </div>
                <div className="text-base text-gray-900">
                  {transaction.name || "-"}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1 font-medium">
                  Previous Outstanding
                </div>
                <div className="text-base text-blue-700 font-bold">
                  ₹{transaction.previousOutstanding ?? "-"}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1 font-medium">
                  Payment
                </div>
                <div className="text-base text-green-700 font-bold">
                  ₹{transaction.amount ?? transaction.payment ?? "-"}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1 font-medium">
                  New Outstanding
                </div>
                <div className="text-base text-red-600 font-bold">
                  ₹{transaction.newOutstanding ?? "-"}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1 font-medium">
                  Type
                </div>
                <div className="text-base font-semibold">
                  {transaction.taken === true ? (
                    <span className="text-orange-600">Out</span>
                  ) : transaction.taken === false ? (
                    <span className="text-green-600">In</span>
                  ) : (
                    <span className="text-gray-500">-</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1 font-medium">
                  {transaction.purpose === "Payment" ? "Received By" : "Approved By"}
                </div>
                <div className="text-base text-gray-900 font-medium">
                  {transaction.approvedBy?.name ?? "-"}
                </div>
              </div>
            </div>
            <Statistic
              title="Total Payment"
              value={transaction.amount ?? transaction.payment ?? 0}
              prefix={<DollarOutlined />}
              valueStyle={{ color: "#389e0d", fontWeight: 700 }}
            />
          </Card>
        </div>
      ) : (
        <div className="text-center text-gray-400 mt-32 text-base">
          No transaction found.
        </div>
      )}
    </div>
  );
};

export default SingleTransactionPage;
