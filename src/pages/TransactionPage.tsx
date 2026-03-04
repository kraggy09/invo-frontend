import React, { useEffect, useState } from "react";
import {
  Card,
  Button,
  Empty,
  Typography,
  Row,
  Col,
  Space,
  Tag,
  Statistic,
  Spin,
  message,
  Popconfirm,
  Badge,
} from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  PlusOutlined,
  UserOutlined,
  CalendarOutlined,
  CreditCardOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { calculateDate, calculateTime } from "../utils/bill.util";
import useUserStore from "../store/user.store";
import apiCaller from "../utils/apiCaller";

const { Title, Text } = Typography;


const TransactionPage: React.FC = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const user = useUserStore((user) => user.user);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await apiCaller.get("/transactions/approvals");
      setTransactions(res.data.transactions);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
      message.error("Failed to fetch transactions");
    }
  };

  const approveTransaction = async (id: string) => {
    setLoading(true);
    try {
      const res = await apiCaller.post(`/transactions/${id}/approve`);
      message.success(res.data.msg || "Transaction approved successfully");
      setTransactions((prev) => prev.filter((tr) => tr._id !== id));
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      console.error(error);
      if (error.response?.data?.customer?.outstanding) {
        message.error({
          content: (
            <div>
              <div>
                Current outstanding: ₹{error.response.data.customer.outstanding}
              </div>
              <div>{error.response.data.msg}</div>
            </div>
          ),
          duration: 5,
        });
      } else {
        message.error("Failed to approve transaction");
      }
    }
  };

  const rejectTransaction = async (id: string) => {
    setLoading(true);
    try {
      const res = await apiCaller.post(`/transactions/${id}/reject`);
      message.success(res.data.msg || "Transaction rejected successfully");
      setTransactions((prev) => prev.filter((tr) => tr._id !== id));
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error(error);
      message.error("Failed to reject transaction");
    }
  };

  const getPaymentModeColor = (mode: string) => {
    switch (mode.toLowerCase()) {
      case "cash":
        return "green";
      case "online":
        return "blue";
      case "card":
        return "geekblue"; // Softer blue-purple for professionalism
      default:
        return "default";
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-50/50">
      <Spin spinning={loading} size="large">
        {/* Header with Integrated Add Button */}
        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 mb-8 border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <h1 className="text-2xl font-black text-gray-800 tracking-tight">Pending Transactions</h1>
            <p className="text-gray-500 text-sm mt-0.5">Review and approve payment transactions</p>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/new-transaction")}
            className="w-full sm:w-auto h-11 bg-indigo-600 border-indigo-600 font-bold px-6 rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
          >
            Create New Transaction
          </Button>
        </div>

        {/* Transactions Grid */}
        {transactions && transactions.length > 0 ? (
          <Row gutter={[20, 20]}>
            {transactions.map((transaction) => (
              <Col xs={24} sm={12} lg={8} xl={6} key={transaction._id}>
                <Badge.Ribbon
                  text="Pending Approval"
                  color="orange"
                  className="font-bold tracking-wider px-3"
                >
                  <Card
                    className="h-full rounded-2xl border-0 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
                    bodyStyle={{ padding: "0" }}
                  >
                    {/* Header Section */}
                    <div className="p-6 text-center bg-gray-50/50 border-b border-gray-100">
                      <div className="bg-orange-100 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <ExclamationCircleOutlined className="text-orange-500 text-2xl" />
                      </div>
                      <p className="text-xs font-black text-orange-500 uppercase tracking-widest mb-1">Payment Pending</p>
                      <h3 className="text-2xl font-black text-indigo-600 tracking-tight">
                        {formatCurrency(transaction.amount)}
                      </h3>
                    </div>

                    <div className="p-6">
                      {/* Outstanding Info */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-red-50 p-3 rounded-xl border border-red-100">
                          <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Current</p>
                          <p className="text-sm font-bold text-red-700">{formatCurrency(transaction.previousOutstanding)}</p>
                        </div>
                        <div className={`p-3 rounded-xl border ${transaction.newOutstanding < transaction.previousOutstanding
                          ? "bg-green-50 border-green-100"
                          : "bg-red-50 border-red-100"
                          }`}>
                          <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${transaction.newOutstanding < transaction.previousOutstanding
                            ? "text-green-400"
                            : "text-red-400"
                            }`}>After</p>
                          <p className={`text-sm font-bold ${transaction.newOutstanding < transaction.previousOutstanding
                            ? "text-green-700"
                            : "text-red-700"
                            }`}>{formatCurrency(transaction.newOutstanding)}</p>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="space-y-3 mb-6">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400 font-medium">Customer</span>
                          <span className="font-black text-gray-700 capitalize">{transaction.name}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400 font-medium">Date</span>
                          <span className="font-bold text-gray-600">
                            {calculateDate(new Date(transaction.createdAt))}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400 font-medium">Method</span>
                          <Tag
                            color={getPaymentModeColor(transaction.paymentMode)}
                            className="mr-0 rounded-lg font-bold border-0 px-3 uppercase text-[10px]"
                          >
                            {transaction.paymentMode}
                          </Tag>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {user && (
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <Popconfirm
                            title="Reject Transaction"
                            description="Are you sure you want to reject this transaction?"
                            onConfirm={() => rejectTransaction(transaction._id)}
                            okText="Yes, Reject"
                            cancelText="Cancel"
                            okButtonProps={{ danger: true, className: "rounded-lg" }}
                            cancelButtonProps={{ className: "rounded-lg" }}
                          >
                            <Button
                              danger
                              className="w-full h-10 font-bold rounded-xl flex items-center justify-center gap-1"
                              icon={<CloseOutlined />}
                            >
                              Reject
                            </Button>
                          </Popconfirm>
                          <Popconfirm
                            title="Approve Transaction"
                            description="Are you sure you want to approve this transaction?"
                            onConfirm={() => approveTransaction(transaction._id)}
                            okText="Yes, Approve"
                            cancelText="Cancel"
                            okButtonProps={{
                              className: "bg-green-600 border-green-600 hover:bg-green-700 rounded-lg"
                            }}
                            cancelButtonProps={{ className: "rounded-lg" }}
                          >
                            <Button
                              type="primary"
                              className="w-full h-10 font-bold rounded-xl bg-green-600 border-green-600 hover:bg-green-700 flex items-center justify-center gap-1"
                              icon={<CheckOutlined />}
                            >
                              Approve
                            </Button>
                          </Popconfirm>
                        </div>
                      )}
                    </div>
                  </Card>
                </Badge.Ribbon>
              </Col>
            ))}
          </Row>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-100">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div className="mt-4">
                  <p className="text-lg font-black text-gray-800">No Pending Approvals</p>
                  <p className="text-gray-500">All transactions are currently up to date.</p>
                  <div className="mt-6 inline-flex p-4 bg-green-50 rounded-full">
                    <CheckOutlined className="text-green-500 text-3xl" />
                  </div>
                </div>
              }
            />
          </div>
        )}
      </Spin>
    </div>
  );
};

export default TransactionPage;
