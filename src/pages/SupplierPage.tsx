import React, { useState, useMemo, useEffect, useRef } from "react";
import { Button, Input, Table, Modal, Form, InputNumber, Select } from "antd";
import {
  ShopOutlined,
  PlusOutlined,
  PhoneOutlined,
  SearchOutlined,
  DollarOutlined,
  EyeOutlined,
  ReloadOutlined,
  WalletOutlined,
  SwapOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { message } from "../utils/antdStatic";
import { useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import useSupplierStore, { ISupplier } from "../store/supplier.store";
import apiCaller from "../utils/apiCaller";
import TransactionPrint from "../components/TransactionPrint";
import { generateUUID } from "../utils";
import useUserStore from "../store/user.store";

const SupplierPage: React.FC = () => {
  const navigate = useNavigate();
  const { suppliers } = useSupplierStore();

  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);

  // Pay Modal State
  const [payingSupplier, setPayingSupplier] = useState<ISupplier | null>(null);
  const [payForm] = Form.useForm();
  const [paying, setPaying] = useState(false);

  // Print State
  const [showPrint, setShowPrint] = useState(false);
  const [printTransactionData, setPrintTransactionData] = useState<any>(null);

  const contentRef = useRef<HTMLDivElement>(null);
  const printType =
    useUserStore((state) => state.user?.shopSettings?.printType) || "THERMAL";
  const pageStyle =
    printType === "A4"
      ? "@page { size: A4 portrait; margin: 10mm; } @media print { body { -webkit-print-color-adjust: exact; } }"
      : "@page { size: 80mm auto; margin: 2mm 2mm; } @media print { body { -webkit-print-color-adjust: exact; } }";

  const handlePrint = useReactToPrint({
    contentRef: contentRef as React.RefObject<HTMLDivElement>,
    pageStyle,
  });

  const fetchSuppliers = async () => {
    setLoadingSuppliers(true);
    try {
      const res = await apiCaller.get("/suppliers");
      if (res.data?.success && res.data.data?.suppliers) {
        useSupplierStore.getState().setSuppliers(res.data.data.suppliers);
      }
    } catch (err: any) {
      console.error("Failed to fetch suppliers:", err);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

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
        fetchSuppliers();
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

  const handleOpenPayModal = (supplier: ISupplier) => {
    setPayingSupplier(supplier);
    payForm.resetFields();
    payForm.setFieldsValue({
      amount: supplier.outstanding > 0 ? supplier.outstanding : undefined,
      paymentMode: "CASH",
      purpose: "Supplier Outstanding Payment",
    });
  };

  const handleMakePayment = async (values: any) => {
    if (!payingSupplier) return;
    setPaying(true);
    try {
      const txIdRes = await apiCaller.get("/transactions/latest-id");
      const transactionId = txIdRes.data?.data?.transactionId ?? 0;

      const res = await apiCaller.post("/transactions", {
        supplierId: payingSupplier._id,
        name: payingSupplier.name,
        amount: values.amount,
        paymentMode: values.paymentMode || "CASH",
        purpose: values.purpose || "Supplier Outstanding Payment",
        transactionId,
        idempotencyKey: generateUUID(),
      });

      if (res.data?.success) {
        message.success(
          `Payment of ₹${Number(values.amount).toLocaleString()} to ${payingSupplier.name} recorded!`,
        );

        let txData = res.data?.data;
        if (txData?.transaction?.newTransaction) {
          txData = txData.transaction.newTransaction;
        } else if (txData?.transaction) {
          txData = txData.transaction;
        } else if (txData?.newTransaction) {
          txData = txData.newTransaction;
        }

        if (txData?.newOutstanding !== undefined) {
          useSupplierStore
            .getState()
            .updateOutstanding(payingSupplier._id, txData.newOutstanding);
        }

        setPayingSupplier(null);
        payForm.resetFields();

        if (txData) {
          setPrintTransactionData(txData);
          setShowPrint(true);
        }
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      message.error(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          "Failed to record payment",
      );
    } finally {
      setPaying(false);
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
            type="primary"
            icon={<DollarOutlined />}
            onClick={() => handleOpenPayModal(record)}
            className="rounded-lg font-bold text-xs bg-emerald-600 hover:bg-emerald-700 border-none shadow-xs"
          >
            Pay Party
          </Button>
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
              Track vendor directory, outstanding balances, and purchase accounts
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
              icon={<ReloadOutlined spin={loadingSuppliers} />}
              onClick={fetchSuppliers}
              className="h-12 px-4 rounded-xl text-xs font-bold border-gray-200 text-gray-600 hover:text-indigo-600"
              title="Refresh from API"
            >
              Sync
            </Button>

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
            loading={loadingSuppliers}
            pagination={{ pageSize: 12 }}
            size="middle"
          />
        </div>

        {/* Pay Supplier Modal */}
        <Modal
          open={!!payingSupplier}
          onCancel={() => {
            setPayingSupplier(null);
            payForm.resetFields();
          }}
          footer={null}
          centered
          title={
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm">
                <DollarOutlined />
              </span>
              <div>
                <span className="font-black text-base text-gray-800">
                  Record Payment to Party
                </span>
                <p className="text-[10px] text-gray-400 font-semibold m-0">
                  Creates an official supplier payment transaction and updates udhaar
                </p>
              </div>
            </div>
          }
        >
          {payingSupplier && (
            <Form
              form={payForm}
              layout="vertical"
              onFinish={handleMakePayment}
              className="pt-4"
            >
              {/* Supplier Info Overview Box */}
              <div className="rounded-2xl p-4 mb-5 border bg-amber-50/60 border-amber-200">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase text-amber-700 tracking-wider block">
                      Supplier / Party
                    </span>
                    <span className="text-base font-black text-gray-800">
                      {payingSupplier.name}
                    </span>
                    <span className="text-xs text-gray-500 font-mono block">
                      {payingSupplier.phone}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black uppercase text-amber-700 tracking-wider block">
                      Current Market Udhaar
                    </span>
                    <span className="text-xl font-black font-mono text-amber-700">
                      ₹{(payingSupplier.outstanding || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                {payingSupplier.outstanding > 0 && (
                  <div className="mt-3 pt-2 border-t border-amber-200/60 flex items-center justify-between">
                    <span className="text-[10px] text-amber-800 font-medium">
                      Want to settle full outstanding?
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        payForm.setFieldsValue({
                          amount: payingSupplier.outstanding,
                        })
                      }
                      className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-wider bg-white px-2 py-1 rounded-md border border-amber-200 cursor-pointer"
                    >
                      Fill ₹{payingSupplier.outstanding.toLocaleString()}
                    </button>
                  </div>
                )}
              </div>

              {/* Amount */}
              <Form.Item
                name="amount"
                label={
                  <span className="font-bold text-xs uppercase tracking-wider text-gray-600">
                    Payment Amount (₹)
                  </span>
                }
                rules={[
                  { required: true, message: "Please enter payment amount" },
                  {
                    type: "number",
                    min: 1,
                    message: "Amount must be greater than 0",
                  },
                ]}
              >
                <InputNumber
                  className="w-full h-12 rounded-xl font-mono text-base font-bold"
                  placeholder="0.00"
                  min={1}
                  formatter={(val) =>
                    `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(val) => val!.replace(/\$\s?|(,*)/g, "") as any}
                />
              </Form.Item>

              {/* Payment Mode */}
              <Form.Item
                name="paymentMode"
                label={
                  <span className="font-bold text-xs uppercase tracking-wider text-gray-600">
                    Payment Mode
                  </span>
                }
                initialValue="CASH"
                rules={[
                  { required: true, message: "Please select payment mode" },
                ]}
              >
                <Select className="h-11 rounded-xl">
                  <Select.Option value="CASH">
                    <div className="flex items-center gap-2">
                      <WalletOutlined /> Cash
                    </div>
                  </Select.Option>
                  <Select.Option value="ONLINE">
                    <div className="flex items-center gap-2">
                      <SwapOutlined /> Online / UPI / Bank
                    </div>
                  </Select.Option>
                </Select>
              </Form.Item>

              {/* Purpose */}
              <Form.Item
                name="purpose"
                label={
                  <span className="font-bold text-xs uppercase tracking-wider text-gray-600">
                    Remarks / Purpose
                  </span>
                }
                initialValue="Supplier Outstanding Payment"
              >
                <Input className="h-11 rounded-xl" />
              </Form.Item>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  onClick={() => {
                    setPayingSupplier(null);
                    payForm.resetFields();
                  }}
                  className="rounded-xl h-11 px-5"
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={paying}
                  className="bg-emerald-600 hover:bg-emerald-700 border-none rounded-xl font-bold h-11 px-6 shadow-md shadow-emerald-100"
                >
                  Pay & Print Voucher
                </Button>
              </div>
            </Form>
          )}
        </Modal>

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

        {/* Hidden thermal print container */}
        {showPrint && printTransactionData && (
          <TransactionPrint
            onClose={() => {
              setShowPrint(false);
              setPrintTransactionData(null);
            }}
            contentRef={contentRef}
            handlePrint={handlePrint}
            transactionData={printTransactionData}
            isPaymentIn={false}
          />
        )}
      </div>
    </main>
  );
};

export default SupplierPage;
