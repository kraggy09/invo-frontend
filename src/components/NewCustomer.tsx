import { useState, useRef, useEffect } from "react";
import {
  Card,
  Input,
  Button,
  Form,
  message,
  Typography,
  Space,
  InputRef,
} from "antd";
import { ArrowLeftOutlined, PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import useCustomerStore, { Customer } from "../store/customer.store";

const { Title, Text } = Typography;
const ACCENT = "#2563eb";

const NewCustomer = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setCustomers } = useCustomerStore();
  const [form] = Form.useForm();
  const inputRef = useRef<InputRef>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("Failed to create customer");

      const data = await res.json();
      //   setCustomers((prev: Customer[]) => [...prev, data.customer]);
      message.success("Customer created successfully");
      navigate("/customers");
    } catch (error: any) {
      message.error(error.message || "Error creating customer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f9fafb] px-4">
      <Card
        style={{
          width: "100%",
          maxWidth: 400,
          border: "none",
          borderRadius: 12,
          boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
          background: "#fff",
        }}
        bodyStyle={{ padding: "2rem", paddingTop: "1.5rem" }}
      >
        <Space
          align="center"
          style={{
            marginBottom: 24,
            // justifyContent: "space-between",
            width: "100%",
          }}
        >
          <Button
            icon={<ArrowLeftOutlined />}
            type="text"
            onClick={() => navigate("/customers")}
          />
          <Title
            level={4}
            style={{
              margin: 0,
              fontWeight: 700,
              textAlign: "center",
              flex: 1,
              color: "#111",
            }}
          >
            New Customer
          </Title>
        </Space>

        <Form
          layout="vertical"
          form={form}
          onFinish={handleSubmit}
          autoComplete="off"
          requiredMark={false}
        >
          <Form.Item
            label={<Text strong>Name</Text>}
            name="name"
            rules={[
              { required: true, message: "Please enter customer name" },
              { min: 2, max: 32, message: "Name should be 2-32 characters" },
            ]}
          >
            <Input
              ref={inputRef}
              placeholder="e.g. John Doe"
              size="large"
              bordered={false}
              style={{
                borderBottom: "1px solid #dcdcdc",
                borderRadius: 0,
                paddingLeft: 0,
              }}
            />
          </Form.Item>

          <Form.Item
            label={<Text strong>Mobile Number</Text>}
            name="phone"
            rules={[
              { required: true, message: "Please enter phone number" },
              {
                pattern: /^[0-9]{10}$/,
                message: "Use a valid 10-digit mobile number",
              },
            ]}
          >
            <Input
              maxLength={10}
              size="large"
              type="tel"
              placeholder="e.g. 9876543210"
              bordered={false}
              style={{
                borderBottom: "1px solid #dcdcdc",
                borderRadius: 0,
                paddingLeft: 0,
                fontVariantNumeric: "tabular-nums",
              }}
            />
          </Form.Item>

          <Form.Item
            label={<Text strong>Outstanding</Text>}
            name="outstanding"
            rules={[
              { required: true, message: "Enter outstanding amount" },
              {
                pattern: /^[0-9]+$/,
                message: "Should be a positive number",
              },
            ]}
          >
            <Input
              size="large"
              type="number"
              min={0}
              placeholder="e.g. 12000"
              bordered={false}
              style={{
                borderBottom: "1px solid #dcdcdc",
                borderRadius: 0,
                paddingLeft: 0,
              }}
            />
          </Form.Item>

          <Form.Item>
            <Button
              icon={<PlusOutlined />}
              htmlType="submit"
              type="primary"
              loading={loading}
              block
              style={{
                background: ACCENT,
                borderColor: ACCENT,
                height: 42,
                fontSize: 16,
                fontWeight: 600,
                marginTop: 12,
              }}
            >
              Add Customer
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </main>
  );
};

export default NewCustomer;
