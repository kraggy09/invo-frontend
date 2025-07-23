import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Tabs,
  Table,
  Statistic,
  Input,
  Button,
  message,
  Spin,
  Tooltip,
} from "antd";
import {
  ArrowLeftOutlined,
  EyeOutlined,
  LockOutlined,
} from "@ant-design/icons";
import apiCaller from "../utils/apiCaller";
import dayjs from "dayjs";

const ACCENT = "#2563eb";

const IndividualCustomerPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(true);
  const [pin, setPin] = useState("");
  const [tab, setTab] = useState("bills");
  const [days] = useState(7);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCustomer() {
      setLoading(true);
      setError(null);
      try {
        const res = await apiCaller.get(`/customers/get-customer/${id}`);
        setCustomer(res.data.data.customer);
        console.log(res.data.data.customer, "This is the customer data");
      } catch (err: any) {
        setError("Failed to fetch customer details");
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchCustomer();
  }, [id]);

  // useEffect(() => {
  //   async function fetchData() {
  //     setLoading(true);
  //     setError(null);
  //     try {
  //       const res = await apiCaller.post("/getCustomerData", {
  //         days,
  //         customerId: id,
  //       });
  //       setData(res.data);
  //     } catch (err: any) {
  //       setError("Failed to fetch customer data");
  //     } finally {
  //       setLoading(false);
  //     }
  //   }
  //   if (id) fetchData();
  // }, [id, days]);

  const billColumns = [
    {
      title: "Bill Id",
      dataIndex: "id",
      key: "id",
      render: (id: string) => (
        <span className="font-mono text-xs bg-gray-50 px-2 py-1 rounded">
          {id}
        </span>
      ),
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (v: string) =>
        v ? (
          <span>
            {dayjs(v).format("DD/MM/YYYY")}
            <span className="text-gray-400 text-xs block">
              {dayjs(v).format("hh:mm A")}
            </span>
          </span>
        ) : (
          "-"
        ),
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      render: (v: number) => (
        <span className="font-semibold text-blue-700">₹{v}</span>
      ),
    },
    {
      title: "Outstanding",
      dataIndex: "outstanding",
      key: "outstanding",
      render: (v: number) => (
        <span className="font-semibold text-orange-600">{v}</span>
      ),
    },
    {
      title: "Payment",
      dataIndex: "payment",
      key: "payment",
      render: (v: number) => (
        <span className="font-semibold text-green-700">₹{v}</span>
      ),
    },
    {
      title: "",
      key: "view",
      render: (_: any, record: any) => (
        <Tooltip title="View Bill">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/bills/${record.id}`)}
          />
        </Tooltip>
      ),
    },
  ];

  const transactionColumns = [
    {
      title: "Trans. Id",
      dataIndex: "id",
      key: "id",
      render: (id: string) => (
        <span className="font-mono text-xs bg-gray-50 px-2 py-1 rounded">
          {id}
        </span>
      ),
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (v: string) =>
        v ? (
          <span>
            {dayjs(v).format("DD/MM/YYYY")}
            <span className="text-gray-400 text-xs block">
              {dayjs(v).format("hh:mm A")}
            </span>
          </span>
        ) : (
          "-"
        ),
    },
    {
      title: "Purpose",
      dataIndex: "purpose",
      key: "purpose",
      render: (v: string) => <span className="capitalize">{v || "-"}</span>,
    },
    {
      title: "Payment",
      dataIndex: "amount",
      key: "amount",
      render: (v: number) => (
        <span className="font-semibold text-green-700">₹{v}</span>
      ),
    },
    {
      title: "Prev. Outstanding",
      dataIndex: "previousOutstanding",
      key: "previousOutstanding",
      render: (v: number) => <span className="text-gray-500">{v}</span>,
    },
    {
      title: "New Outstanding",
      dataIndex: "newOutstanding",
      key: "newOutstanding",
      render: (v: number) => <span className="text-gray-700">{v}</span>,
    },
    {
      title: "",
      key: "view",
      render: (_: any, record: any) => (
        <Tooltip title="View Transaction">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/transactions/${record.id}`)}
          />
        </Tooltip>
      ),
    },
  ];

  const handlePinSubmit = () => {
    if (pin === "1234") {
      setLocked(false);
      setPin("");
    } else {
      message.error("Incorrect PIN");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-red-500">
        <p>{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white p-4 md:p-10">
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate("/customers")}
        className="mb-4"
      >
        Back to Customers
      </Button>
      <div className="max-w-3xl mx-auto">
        <Card
          className="mb-8 shadow-md border border-gray-100"
          bodyStyle={{ padding: 24 }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2 text-gray-800 capitalize">
                {customer?.name}
              </h2>
              <div className="text-gray-500 mb-1">
                Mobile: <span className="font-mono">{customer?.phone}</span>
              </div>
              <div className="text-gray-500 mb-1">
                Customer ID: <span className="font-mono">{customer?._id}</span>
              </div>
            </div>
            <Statistic
              title={<span className="text-gray-500">Outstanding</span>}
              value={customer?.outstanding || 0}
              prefix="₹"
              valueStyle={{ color: ACCENT, fontWeight: 700, fontSize: 28 }}
              className="min-w-[160px]"
            />
          </div>
        </Card>
        <Card className="shadow-md border border-gray-100">
          <Tabs
            activeKey={tab}
            onChange={setTab}
            items={[
              {
                key: "bills",
                label: "Bills",
                children: (
                  <Table
                    columns={billColumns}
                    dataSource={customer?.bills || []}
                    rowKey="id"
                    pagination={{ pageSize: 5 }}
                    className="modern-table"
                  />
                ),
              },
              {
                key: "transactions",
                label: "Transactions",
                children: (
                  <Table
                    columns={transactionColumns}
                    dataSource={customer?.transactions || []}
                    rowKey="id"
                    pagination={{ pageSize: 5 }}
                    className="modern-table"
                  />
                ),
              },
              // OPTIONAL: Enable analytics protected by PIN
              {
                key: "analytics",
                label: "Analytics",
                children: locked ? (
                  <Card className="max-w-md mx-auto mt-10 text-center">
                    <LockOutlined style={{ fontSize: 32, color: ACCENT }} />
                    <div className="font-semibold text-gray-700 mt-4 mb-2">
                      Enter Admin PIN to view analytics
                    </div>
                    <Input.Password
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      placeholder="Enter PIN"
                      style={{ width: 180, marginBottom: 12 }}
                      onPressEnter={handlePinSubmit}
                    />
                    <Button
                      type="primary"
                      onClick={handlePinSubmit}
                      style={{ background: ACCENT }}
                    >
                      Unlock
                    </Button>
                  </Card>
                ) : (
                  <div>Analytics content goes here.</div>
                ),
              },
            ]}
          />
        </Card>
      </div>
    </main>
  );
};

export default IndividualCustomerPage;
