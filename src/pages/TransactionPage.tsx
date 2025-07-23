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

const { Title, Text } = Typography;

// Dummy data for demonstration
const dummyTransactions = [
  {
    _id: "1",
    name: "John Doe",
    amount: 5000,
    previousOutstanding: 15000,
    newOutstanding: 10000,
    paymentMode: "cash",
    createdAt: "2024-07-23T10:30:00.000Z",
  },
  {
    _id: "2",
    name: "Jane Smith",
    amount: 8500,
    previousOutstanding: 12000,
    newOutstanding: 3500,
    paymentMode: "online",
    createdAt: "2024-07-23T14:45:00.000Z",
  },
  {
    _id: "3",
    name: "Mike Johnson",
    amount: 3200,
    previousOutstanding: 7800,
    newOutstanding: 4600,
    paymentMode: "card",
    createdAt: "2024-07-23T16:20:00.000Z",
  },
];

const TransactionPage: React.FC = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const user = useUserStore((user) => user.user);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      // Replace with actual API call
      // const res = await apiCaller.get(apiUrl + "/getTransactionForApproval");
      // setTransactions(res.data.transactions);

      // Using dummy data for now
      setTimeout(() => {
        setTransactions(dummyTransactions);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error(error);
      setLoading(false);
      message.error("Failed to fetch transactions");
    }
  };

  const approveTransaction = async (id: string) => {
    setLoading(true);
    try {
      // const res = await apiCaller.post(apiUrl + "/approveTransaction", { id });
      // message.success(res.data.msg);

      // Simulate API call
      setTimeout(() => {
        message.success("Transaction approved successfully");
        setTransactions((prev) => prev.filter((tr) => tr._id !== id));
        setLoading(false);
        // dispatch(fetchCustomers());
        // dispatch(fetchDailyReport());
      }, 1000);
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
      // const res = await apiCaller.post(apiUrl + "/rejectTransaction", { id });
      // message.success(res.data.msg);

      // Simulate API call
      setTimeout(() => {
        message.success("Transaction rejected successfully");
        setTransactions((prev) => prev.filter((tr) => tr._id !== id));
        setLoading(false);
        // dispatch(fetchCustomers());
        // dispatch(fetchDailyReport());
      }, 1000);
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
    <div
      style={{
        padding: "24px",
        background: "#f0f2f5",
        minHeight: "100vh",
      }}
    >
      <Spin spinning={loading} size="large">
        {/* Header with Integrated Add Button */}
        <div
          style={{
            marginBottom: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <Title level={2} style={{ marginBottom: 8 }}>
              Pending Transactions
            </Title>
            <Text type="secondary">
              Review and approve payment transactions
            </Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/new-transaction")}
            style={{
              background: "#1677ff", // Soft primary blue
              borderColor: "#1677ff",
              height: 40,
            }}
          >
            Create New Transaction
          </Button>
        </div>

        {/* Transactions Grid */}
        {transactions && transactions.length > 0 ? (
          <Row gutter={[16, 16]}>
            {transactions.map((transaction) => (
              <Col xs={24} sm={12} lg={8} xl={6} key={transaction._id}>
                <Badge.Ribbon
                  text="Pending Approval"
                  color="orange"
                  style={{ fontSize: 12 }}
                >
                  <Card
                    style={{
                      height: "100%",
                      borderRadius: 12,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      border: "1px solid #f0f0f0", // Subtle border for professionalism
                    }}
                    bodyStyle={{ padding: "20px" }}
                  >
                    {/* Header */}
                    <div style={{ textAlign: "center", marginBottom: 16 }}>
                      <ExclamationCircleOutlined
                        style={{
                          fontSize: 24,
                          color: "#fa8c16",
                          marginBottom: 8,
                        }}
                      />
                      <div>
                        <Text strong style={{ fontSize: 16 }}>
                          Payment Pending
                        </Text>
                      </div>
                      <Title
                        level={3}
                        style={{ margin: "8px 0", color: "#1677ff" }} // Soft blue for amount
                      >
                        {formatCurrency(transaction.amount)}
                      </Title>
                    </div>

                    {/* Outstanding Info */}
                    <Row gutter={16} style={{ marginBottom: 16 }}>
                      <Col span={12}>
                        <Statistic
                          title="Current Outstanding"
                          value={transaction.previousOutstanding}
                          formatter={(value) => formatCurrency(Number(value))}
                          valueStyle={{ fontSize: 14, color: "#f5222d" }} // Red for current
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title="Future Outstanding"
                          value={transaction.newOutstanding}
                          formatter={(value) => formatCurrency(Number(value))}
                          valueStyle={{
                            fontSize: 14,
                            color:
                              transaction.newOutstanding <
                              transaction.previousOutstanding
                                ? "#52c41a" // Green if reduced
                                : "#f5222d", // Red if not
                          }}
                        />
                      </Col>
                    </Row>

                    {/* Transaction Details */}
                    <div style={{ marginBottom: 16 }}>
                      <Space
                        direction="vertical"
                        size="small"
                        style={{ width: "100%" }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <Text type="secondary">
                            <UserOutlined /> Customer:
                          </Text>
                          <Text strong style={{ textTransform: "capitalize" }}>
                            {transaction.name}
                          </Text>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <Text type="secondary">
                            <CalendarOutlined /> Date & Time:
                          </Text>
                          <Text>
                            {calculateDate(new Date(transaction.createdAt))}{" "}
                            {calculateTime(new Date(transaction.createdAt))}
                          </Text>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Text type="secondary">
                            <CreditCardOutlined /> Method:
                          </Text>
                          <Tag
                            color={getPaymentModeColor(transaction.paymentMode)}
                          >
                            {transaction.paymentMode.toUpperCase()}
                          </Tag>
                        </div>
                      </Space>
                    </div>

                    {/* Action Buttons */}
                    {user && (
                      <Row gutter={8}>
                        <Col span={12}>
                          <Popconfirm
                            title="Reject Transaction"
                            description="Are you sure you want to reject this transaction?"
                            onConfirm={() => rejectTransaction(transaction._id)}
                            okText="Yes, Reject"
                            cancelText="Cancel"
                            okButtonProps={{ danger: true }}
                          >
                            <Button
                              danger
                              block
                              icon={<CloseOutlined />}
                              style={{ height: 40 }}
                            >
                              Reject
                            </Button>
                          </Popconfirm>
                        </Col>
                        <Col span={12}>
                          <Popconfirm
                            title="Approve Transaction"
                            description="Are you sure you want to approve this transaction?"
                            onConfirm={() =>
                              approveTransaction(transaction._id)
                            }
                            okText="Yes, Approve"
                            cancelText="Cancel"
                            okButtonProps={{
                              style: {
                                background: "#52c41a",
                                borderColor: "#52c41a",
                              },
                            }}
                          >
                            <Button
                              type="primary"
                              block
                              icon={<CheckOutlined />}
                              style={{
                                height: 40,
                                background: "#52c41a",
                                borderColor: "#52c41a",
                              }}
                            >
                              Approve
                            </Button>
                          </Popconfirm>
                        </Col>
                      </Row>
                    )}
                  </Card>
                </Badge.Ribbon>
              </Col>
            ))}
          </Row>
        ) : (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div>
                  <Text strong style={{ fontSize: 16 }}>
                    All payments are processed
                  </Text>
                  <br />
                  <Text type="secondary">
                    No pending transactions to review
                  </Text>
                  <div style={{ marginTop: 8 }}>
                    <CheckOutlined style={{ color: "#52c41a", fontSize: 24 }} />
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
