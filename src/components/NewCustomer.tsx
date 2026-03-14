import { useState, useRef, useEffect } from "react";
import {
  Card,
  Input,
  Button,
  Form,
  Typography,
  Space,
  InputRef,
} from "antd";
import { message } from "../utils/antdStatic";
import { ArrowLeftOutlined, PlusOutlined, UserAddOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import useCustomerStore, { ICustomer } from "../store/customer.store";
import apiCaller from "../utils/apiCaller";

const { Title, Text } = Typography;

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
      const res = await apiCaller.post("/customers", values);

      message.success("Customer registry updated successfully");
      navigate("/customers");
    } catch (error: any) {
      message.error(error.response?.data?.message || "Registry initialization failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50/50 p-6">
      <div className="w-full max-w-[480px] animate-in fade-in zoom-in duration-500">
        <div className="flex items-center gap-4 mb-6">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/customers")}
            className="w-10 h-10 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-400 hover:text-indigo-600"
          />
          <div>
            <h1 className="text-xl font-black text-gray-800 tracking-tight leading-none">Create Customer</h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1.5">New Account Registry</p>
          </div>
        </div>

        <div className="bg-white rounded-[32px] shadow-2xl shadow-indigo-100 overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-8 text-white flex items-center gap-6">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-lg">
              <UserAddOutlined className="text-2xl" />
            </div>
            <div>
              <p className="text-[10px] font-black text-indigo-100 uppercase tracking-widest mb-1">Identity Management</p>
              <h2 className="text-xl font-black tracking-tight leading-none">Register New Client</h2>
            </div>
          </div>

          <Form
            layout="vertical"
            form={form}
            onFinish={handleSubmit}
            autoComplete="off"
            requiredMark={false}
            className="p-8"
          >
            <Form.Item
              label={<span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Legal Name</span>}
              name="name"
              rules={[
                { required: true, message: "Identification required." },
                { min: 2, max: 32, message: "2-32 characters permitted." },
              ]}
            >
              <Input
                ref={inputRef}
                placeholder="e.g. Alexander Pierce"
                className="registry-field"
              />
            </Form.Item>

            <Form.Item
              label={<span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Primary Contact</span>}
              name="phone"
              rules={[
                { required: true, message: "Valid mobile required." },
                {
                  pattern: /^[0-9]{10}$/,
                  message: "Standard 10-digit UID expected.",
                },
              ]}
            >
              <Input
                maxLength={10}
                type="tel"
                placeholder="9876543210"
                className="registry-field"
              />
            </Form.Item>

            <Form.Item
              label={<span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Opening Arrears (₹)</span>}
              name="outstanding"
              rules={[
                { required: true, message: "Financial status required." },
                {
                  pattern: /^[0-9]+$/,
                  message: "Numerical parity required.",
                },
              ]}
            >
              <Input
                type="number"
                min={0}
                placeholder="0.00"
                className="registry-field"
              />
            </Form.Item>

            <Form.Item className="pt-4 mb-0">
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<PlusOutlined />}
                className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 border-none rounded-2xl text-base font-black tracking-tight shadow-xl shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                COMMIT TO REGISTRY
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>

      <style>{`
        .registry-field {
          height: 52px !important;
          border-radius: 12px !important;
          border: 2px solid #f1f5f9 !important;
          background: #f8fafc !important;
          font-weight: 700 !important;
          color: #1e293b !important;
          padding: 0 16px !important;
          transition: all 0.3s ease !important;
        }
        .registry-field:focus {
          border-color: #818cf8 !important;
          background: #fff !important;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05) !important;
        }
      `}</style>
    </main>
  );
};

export default NewCustomer;
