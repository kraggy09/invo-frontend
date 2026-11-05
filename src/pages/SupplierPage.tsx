import React, { useState, useMemo } from "react";
import { Button, Input, Table, Modal, Form, InputNumber, Tag } from "antd";
import {
  ShopOutlined,
  PlusOutlined,
  PhoneOutlined,
  SearchOutlined,
  DollarOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { message } from "../utils/antdStatic";
import { useNavigate } from "react-router-dom";
import useSupplierStore, { ISupplier } from "../store/supplier.store";
import apiCaller from "../utils/apiCaller";

const SupplierPage: React.FC = () => {
  const navigate = useNavigate();
  const { suppliers } = useSupplierStore();

  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const filteredSuppliers = useMemo(() => {
    if (!search) return suppliers;
    const lower = search.toLowerCase();
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(lower) ||
        s.phone.toLowerCase().includes(lower),
    );
  }, [suppliers, search]);

  const totalMarketOutstanding = useMemo(() => {
    return suppliers.reduce((acc, s) => acc + (s.outstanding || 0), 0);
  }, [suppliers]);

  const handleAddSupplier = async (values: any) => {
    setSubmitting(true);
    try {
      const res = await apiCaller.post("/suppliers", values);
      if (res.data?.success) {
        message.success("Supplier registered successfully!");
        setShowAddModal(false);
        addForm.resetFields();
      }
    } catch (err: any) {
      console.error(err);
      message.error(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          "Failed to register supplier",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: "Supplier Name",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: ISupplier) => (
        <div
          onClick={() => navigate(`/suppliers/${record._id}`)}
          className="cursor-pointer group py-1"
        >
          <div className="font-black text-gray-800 text-sm group-hover:text-indigo-600 transition-colors">
            {name}
          </div>
          {record.address && (
            <div className="text-[10px] text-gray-400 truncate max-w-xs">
              {record.address}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      render: (phone: string) => (
        <div className="flex items-center gap-1.5 font-mono text-xs text-gray-600">
          <PhoneOutlined className="text-[10px] text-gray-400" />
          <span>{phone}</span>
        </div>
      ),
    },
    {
      title: "Pending Balance (Market Udhaar)",
      dataIndex: "outstanding",
      key: "outstanding",
      sorter: (a: ISupplier, b: ISupplier) =>
        (a.outstanding || 0) - (b.outstanding || 0),
      render: (outstanding: number) => {
        const val = outstanding || 0;
        return (
          <div className="font-mono">
            <span
              className={`font-black text-sm ${
                val > 0
                  ? "text-amber-600 font-bold"
                  : "text-emerald-600 font-medium"
              }`}
            >
              ₹{val.toLocaleString()}
            </span>
          </div>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: ISupplier) => (
        <div className="flex items-center gap-2">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/suppliers/${record._id}`)}
            className="rounded-lg font-bold text-xs text-gray-600 hover:text-indigo-600"
          >
            Ledger
          </Button>
        </div>
      ),
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Stats */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <h1 className="text-2xl font-black text-gray-800 tracking-tight leading-tight">
              Suppliers Directory & Market Udhaar
            </h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
              Track vendor directory, outstanding balances, and purchase
              accounts
            </p>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div>
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">
                  Total Market Outstanding
                </span>
                <span className="text-lg font-black text-amber-600 font-mono">
                  ₹{totalMarketOutstanding.toLocaleString()}
                </span>
              </div>
            </div>

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setShowAddModal(true)}
              className="h-12 px-6 bg-indigo-600 hover:bg-indigo-700 border-none rounded-xl text-xs font-black tracking-wider uppercase shadow-lg shadow-indigo-100"
            >
              Add Supplier
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-gray-100 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <Input
              prefix={<SearchOutlined className="text-gray-400 mr-2" />}
              placeholder="Search supplier by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 w-full sm:w-80 rounded-2xl border-gray-100 bg-gray-50/50 text-xs font-bold"
              allowClear
            />
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">
              {filteredSuppliers.length} Parties Registered
            </span>
          </div>
        </div>

        {/* Suppliers Table */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <Table
            columns={columns}
            dataSource={filteredSuppliers}
            rowKey="_id"
            pagination={{ pageSize: 12 }}
            size="middle"
          />
        </div>

        {/* Add Supplier Modal */}
        <Modal
          open={showAddModal}
          onCancel={() => setShowAddModal(false)}
          footer={null}
          centered
          title={
            <span className="font-black text-base">
              Register New Supplier / Party
            </span>
          }
        >
          <Form
            form={addForm}
            layout="vertical"
            onFinish={handleAddSupplier}
            className="pt-4"
          >
            <Form.Item
              name="name"
              label={
                <span className="font-bold text-xs uppercase tracking-wider text-gray-500">
                  Party Name
                </span>
              }
              rules={[{ required: true, message: "Please enter party name" }]}
            >
              <Input
                placeholder="e.g. Balaji Goods Corp"
                className="h-11 rounded-xl"
              />
            </Form.Item>

            <Form.Item
              name="phone"
              label={
                <span className="font-bold text-xs uppercase tracking-wider text-gray-500">
                  Phone Number
                </span>
              }
              rules={[{ required: true, message: "Please enter phone number" }]}
            >
              <Input
                placeholder="e.g. 9876543210"
                className="h-11 rounded-xl font-mono"
              />
            </Form.Item>

            <Form.Item
              name="address"
              label={
                <span className="font-bold text-xs uppercase tracking-wider text-gray-500">
                  Address / City
                </span>
              }
            >
              <Input.TextArea
                placeholder="e.g. Ring Road, Surat"
                rows={2}
                className="rounded-xl"
              />
            </Form.Item>

            <Form.Item
              name="outstanding"
              label={
                <span className="font-bold text-xs uppercase tracking-wider text-gray-500">
                  Opening Market Outstanding
                </span>
              }
            >
              <InputNumber
                min={0}
                placeholder="0"
                className="w-full h-11 rounded-xl font-mono"
              />
            </Form.Item>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                onClick={() => setShowAddModal(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                className="bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold"
              >
                Save Party
              </Button>
            </div>
          </Form>
        </Modal>
      </div>
    </main>
  );
};

export default SupplierPage;
