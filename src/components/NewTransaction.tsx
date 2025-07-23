import React, { useState } from "react";
import {
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Switch,
  Typography,
  Space,
  Tag,
  AutoComplete,
  Row,
  Col,
  Divider,
  message,
} from "antd";
import {
  DollarOutlined,
  UserOutlined,
  CreditCardOutlined,
  FileTextOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;

// Dummy data
const dummyCustomers = [
  { id: 1, name: "John Doe", outstanding: 1500 },
  { id: 2, name: "Jane Smith", outstanding: 2300 },
  { id: 3, name: "Mike Johnson", outstanding: 800 },
  { id: 4, name: "Sarah Wilson", outstanding: 0 },
  { id: 5, name: "David Brown", outstanding: 4500 },
];

const NewTransaction: React.FC = () => {
  const [form] = Form.useForm();
  const [isPaymentIn, setIsPaymentIn] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [transactionId] = useState("T-1001");

  const handleModeChange = (checked: boolean) => {
    setIsPaymentIn(checked);
    form.resetFields(["purpose"]);
    setSelectedCustomer(null);
  };

  const handleCustomerSearch = (value: string) => {
    return dummyCustomers
      .filter((customer) =>
        customer.name.toLowerCase().includes(value.toLowerCase())
      )
      .map((customer) => ({
        value: customer.name,
        label: (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>{customer.name}</span>
            <Tag color={customer.outstanding > 0 ? "orange" : "green"}>
              ₹{customer.outstanding}
            </Tag>
          </div>
        ),
        customer,
      }));
  };

  const handleCustomerSelect = (value: string, option: any) => {
    setSelectedCustomer(option.customer);
    form.setFieldsValue({ name: value });
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    console.log("Form values:", values);
    console.log("Selected customer:", selectedCustomer);
    console.log("Transaction type:", isPaymentIn ? "Payment In" : "Cash Out");

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      message.success(
        `${isPaymentIn ? "Payment" : "Transaction"} created successfully!`
      );
    }, 1500);
  };

  const handleRefresh = () => {
    console.log("Refreshing data...");
    message.info("Data refreshed");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f7fa",
        padding: "24px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Card
        style={{
          width: "100%",
          maxWidth: 600,
          borderRadius: 12,
          boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
        }}
        bodyStyle={{ padding: "32px" }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Title level={2} style={{ marginBottom: 8 }}>
            {isPaymentIn ? "New Payment" : "New Transaction"}
          </Title>
          <Text type="secondary">Create a new financial transaction</Text>
        </div>

        {/* Transaction ID and Refresh */}
        <Row
          justify="space-between"
          align="middle"
          style={{ marginBottom: 24 }}
        >
          <Col>
            <Space>
              <Text strong>Transaction ID:</Text>
              <Tag color="green" style={{ fontSize: 14 }}>
                {transactionId}
              </Tag>
            </Space>
          </Col>
          <Col>
            <Button
              type="text"
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
            >
              Refresh
            </Button>
          </Col>
        </Row>

        {/* Mode Toggle */}
        <Card
          size="small"
          style={{
            marginBottom: 24,
            background: "#fafafa",
            border: "1px solid #e8e8e8",
          }}
        >
          <Row justify="space-between" align="middle">
            <Col>
              <Space>
                <Switch
                  checked={isPaymentIn}
                  onChange={handleModeChange}
                  checkedChildren="Payment In"
                  unCheckedChildren="Cash Out"
                  style={{ minWidth: 120 }}
                />
                <Text
                  strong
                  style={{ color: isPaymentIn ? "#52c41a" : "#ff4d4f" }}
                >
                  {isPaymentIn ? "Receiving Payment" : "Making Payment"}
                </Text>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Form */}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          size="large"
        >
          {/* Customer Name */}
          <Form.Item
            name="name"
            label="Customer Name"
            rules={[{ required: true, message: "Please enter customer name" }]}
          >
            <AutoComplete
              placeholder="Search and select customer"
              options={[]}
              onSearch={(value) => {
                const options = handleCustomerSearch(value);
                form.setFieldsValue({
                  name: { options },
                });
              }}
              onSelect={handleCustomerSelect}
              prefix={<UserOutlined />}
            />
          </Form.Item>

          {/* Amount */}
          <Form.Item
            name="amount"
            label="Amount"
            rules={[
              { required: true, message: "Please enter amount" },
              {
                type: "number",
                min: 1,
                message: "Amount must be greater than 0",
              },
            ]}
          >
            <InputNumber
              style={{ width: "100%" }}
              placeholder="Enter amount"
              prefix="₹"
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
            />
          </Form.Item>

          {/* Purpose */}
          <Form.Item
            name="purpose"
            label="Purpose"
            rules={[{ required: true, message: "Please select purpose" }]}
          >
            {isPaymentIn ? (
              <Input value="Payment" disabled prefix={<FileTextOutlined />} />
            ) : (
              <Select
                placeholder="Select purpose"
                prefix={<FileTextOutlined />}
              >
                <Option value="home">Home Purpose</Option>
                <Option value="party">Party Payment</Option>
                <Option value="cash">Cash Requirement</Option>
                <Option value="other">Other</Option>
              </Select>
            )}
          </Form.Item>

          {/* Outstanding (only for Payment In) */}
          {isPaymentIn && selectedCustomer && (
            <Form.Item label="Outstanding Amount">
              <Input
                value={`₹${selectedCustomer.outstanding.toLocaleString()}`}
                disabled
                prefix={<DollarOutlined />}
                style={{
                  color:
                    selectedCustomer.outstanding > 0 ? "#fa8c16" : "#52c41a",
                  fontWeight: "bold",
                }}
              />
            </Form.Item>
          )}

          {/* Payment Mode (only for Payment In) */}
          {isPaymentIn && (
            <Form.Item
              name="paymentMode"
              label="Payment Mode"
              rules={[
                { required: true, message: "Please select payment mode" },
              ]}
            >
              <Select
                placeholder="Select payment mode"
                prefix={<CreditCardOutlined />}
              >
                <Option value="cash">Cash</Option>
                <Option value="online">Online Transfer</Option>
                <Option value="card">Card Payment</Option>
                <Option value="cheque">Cheque</Option>
              </Select>
            </Form.Item>
          )}

          <Divider />

          {/* Submit Button */}
          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              style={{
                width: "100%",
                height: 50,
                fontSize: 16,
                fontWeight: "bold",
                background: isPaymentIn ? "#52c41a" : "#ff4d4f",
                borderColor: isPaymentIn ? "#52c41a" : "#ff4d4f",
              }}
            >
              Create {isPaymentIn ? "Payment" : "Transaction"}
            </Button>
          </Form.Item>
        </Form>

        {/* Summary Card */}
        {selectedCustomer && isPaymentIn && (
          <Card
            size="small"
            style={{
              marginTop: 16,
              background: "#f6ffed",
              border: "1px solid #b7eb8f",
            }}
          >
            <Text strong>Customer Summary:</Text>
            <div style={{ marginTop: 8 }}>
              <Text>{selectedCustomer.name} • </Text>
              <Text
                type={selectedCustomer.outstanding > 0 ? "warning" : "success"}
              >
                Outstanding: ₹{selectedCustomer.outstanding.toLocaleString()}
              </Text>
            </div>
          </Card>
        )}
      </Card>
    </div>
  );
};

export default NewTransaction;
