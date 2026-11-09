import React, { useState, useRef, useEffect } from "react";
import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Spin,
} from "antd";
import toast from "react-hot-toast";
import { useReactToPrint } from "react-to-print";
import {
  DollarOutlined,
  SwapOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  SendOutlined,
  WalletOutlined,
  ShopOutlined,
  FileTextOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import useCustomerStore from "../store/customer.store";
import useSupplierStore, { ISupplier } from "../store/supplier.store";
import apiCaller from "../utils/apiCaller";
import useTransactionStore from "../store/transaction.store";
import TransactionPrint from "./TransactionPrint";
import { generateUUID } from "../utils";
import useUserStore from "../store/user.store";

const NewTransaction: React.FC = () => {
  const [form] = Form.useForm();
  const [isPaymentIn, setIsPaymentIn] = useState(true);
  const [cashOutType, setCashOutType] = useState<"EXPENSE" | "SUPPLIER">("EXPENSE");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<ISupplier | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingSuppliers, setFetchingSuppliers] = useState(false);
  const [fetchingSupplierDetails, setFetchingSupplierDetails] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [printTransactionData, setPrintTransactionData] = useState<any>(null);
  const [idempotencyKey, setIdempotencyKey] = useState(generateUUID());

  const contentRef = useRef<HTMLDivElement>(null);
  const printType = useUserStore((state) => state.user?.shopSettings?.printType) || "THERMAL";
  const pageStyle =
    printType === "A4"
      ? "@page { size: A4 portrait; margin: 10mm; } @media print { body { -webkit-print-color-adjust: exact; } }"
      : "@page { size: 80mm auto; margin: 2mm 2mm; } @media print { body { -webkit-print-color-adjust: exact; } }";

  const handlePrint = useReactToPrint({
    contentRef: contentRef as React.RefObject<HTMLDivElement>,
    pageStyle,
  });
  const transactionId = useTransactionStore((state) => state.transactionId);

  const { customers } = useCustomerStore();
  const { suppliers } = useSupplierStore();

  // Fetch all suppliers from API on mount or when switching to supplier cash out
  const fetchSuppliersFromApi = async () => {
    setFetchingSuppliers(true);
    try {
      const res = await apiCaller.get("/suppliers");
      if (res.data?.success && res.data.data?.suppliers) {
        useSupplierStore.getState().setSuppliers(res.data.data.suppliers);
      }
    } catch (err) {
      console.error("Failed to load suppliers from API:", err);
    } finally {
      setFetchingSuppliers(false);
    }
  };

  useEffect(() => {
    if (!isPaymentIn && cashOutType === "SUPPLIER") {
      fetchSuppliersFromApi();
    }
  }, [isPaymentIn, cashOutType]);

  const handleModeChange = (mode: string) => {
    setIsPaymentIn(mode === "in");
    form.resetFields(["purpose", "name", "amount", "paymentMode"]);
    setSelectedCustomer(null);
    setSelectedSupplier(null);
  };

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find((c) => c._id === customerId);
    if (customer) {
      setSelectedCustomer(customer);
      form.setFieldsValue({ name: customer.name });
    }
  };

  // Fetch fresh supplier details & live outstanding directly from API
  const handleSupplierSelect = async (supplierId: string) => {
    setFetchingSupplierDetails(true);
    try {
      const res = await apiCaller.get(`/suppliers/${supplierId}`);
      if (res.data?.success && res.data.data?.supplier) {
        const liveSupplier: ISupplier = res.data.data.supplier;
        setSelectedSupplier(liveSupplier);
        useSupplierStore.getState().updateSupplier(liveSupplier);
        form.setFieldsValue({
          name: liveSupplier.name,
          amount: liveSupplier.outstanding > 0 ? liveSupplier.outstanding : undefined,
        });
        return;
      }
    } catch (err) {
      console.error("Failed to fetch fresh supplier details from API:", err);
    } finally {
      setFetchingSupplierDetails(false);
    }

    // Fallback to local store if API call fails
    const local = suppliers.find((s) => s._id === supplierId);
    if (local) {
      setSelectedSupplier(local);
      form.setFieldsValue({
        name: local.name,
        amount: local.outstanding > 0 ? local.outstanding : undefined,
      });
    }
  };

  const handlePrintClick = () => {
    setShowPrint(true);
    setTimeout(() => {
      handlePrint();
    }, 100);
  };

  const handleClosePrint = () => {
    setShowPrint(false);
    setPrintTransactionData(null);
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      let response;
      if (isPaymentIn) {
        if (!selectedCustomer) {
          toast.error("Please select a customer");
          setLoading(false);
          return;
        }
        response = await apiCaller.post("/transactions/payments", {
          name: selectedCustomer.name,
          amount: values.amount,
          paymentMode: values.paymentMode,
          customerId: selectedCustomer._id,
          transactionId: transactionId,
          idempotencyKey,
        });
      } else {
        if (cashOutType === "SUPPLIER") {
          if (!selectedSupplier) {
            toast.error("Please select a supplier");
            setLoading(false);
            return;
          }
          response = await apiCaller.post("/transactions", {
            supplierId: selectedSupplier._id,
            name: selectedSupplier.name,
            amount: values.amount,
            paymentMode: values.paymentMode || "CASH",
            purpose: values.purpose || "Supplier Outstanding Payment",
            transactionId: transactionId,
            idempotencyKey,
          });
        } else {
          response = await apiCaller.post("/transactions", {
            name: values.name,
            amount: values.amount,
            purpose: values.purpose,
            paymentMode: values.paymentMode || "CASH",
            transactionId: transactionId,
            idempotencyKey,
          });
        }
      }
      toast.success(
        `${isPaymentIn ? "Payment" : "Transaction"} created successfully!`
      );

      let transactionData = response.data?.data;
      if (transactionData?.transaction?.newTransaction) {
        transactionData = transactionData.transaction.newTransaction;
      } else if (transactionData?.payment?.newTransaction) {
        transactionData = transactionData.payment.newTransaction;
      } else if (transactionData?.transaction) {
        transactionData = transactionData.transaction;
      } else if (transactionData?.payment) {
        transactionData = transactionData.payment;
      } else if (transactionData?.newTransaction) {
        transactionData = transactionData.newTransaction;
      }

      // Update supplier's outstanding locally if applicable
      if (cashOutType === "SUPPLIER" && selectedSupplier && transactionData) {
        const remainingOut =
          transactionData.newOutstanding !== undefined
            ? transactionData.newOutstanding
            : selectedSupplier.outstanding - Number(values.amount);
        useSupplierStore
          .getState()
          .updateOutstanding(selectedSupplier._id, remainingOut);
      }

      if (transactionData) {
        setPrintTransactionData(transactionData);
        setShowPrint(true);
      }

      form.resetFields();
      setSelectedCustomer(null);
      setSelectedSupplier(null);
      setIdempotencyKey(generateUUID());
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to submit transaction"
      );
    } finally {
      setLoading(false);
    }
  };

  const labelCls =
    "text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1";

  return (
    <main className="flex flex-col items-center justify-center p-4 mt-20 sm:p-6 relative overflow-hidden">
      {/* BG decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-600 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-[560px] relative z-10">
        {/* Card */}
        <div className="bg-white rounded-[32px] shadow-2xl shadow-indigo-100/50 overflow-hidden border border-gray-100">
          {/* Header with Transaction ID */}
          <div
            className={`p-8 text-white flex items-center justify-between relative overflow-hidden group transition-colors duration-500 ${isPaymentIn
              ? "bg-gradient-to-r from-emerald-600 to-emerald-700"
              : "bg-gradient-to-r from-orange-600 to-orange-700"
              }`}
          >
            <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000" />
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-lg group-hover:rotate-6 transition-all duration-500">
                {isPaymentIn ? (
                  <ArrowDownOutlined className="text-2xl" />
                ) : (
                  <ArrowUpOutlined className="text-2xl" />
                )}
              </div>
              <div className="relative z-10">
                <p className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-1">
                  {isPaymentIn ? "Payment Inward" : "Cash Outward"}
                </p>
                <h2 className="text-xl font-black tracking-tight leading-none">
                  {isPaymentIn
                    ? "Receive Payment"
                    : cashOutType === "SUPPLIER"
                    ? "Pay Supplier / Party"
                    : "Record General Expense"}
                </h2>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 relative z-10">
              <p className="text-[9px] font-black text-white/60 uppercase tracking-widest leading-none mb-1">
                Txn ID
              </p>
              <p className="text-lg font-black tracking-tight leading-none font-mono">
                #{transactionId}
              </p>
            </div>
          </div>

          {/* Form Body */}
          <div className="px-4">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              autoComplete="off"
              requiredMark={false}
              className="px-6 sm:p-10"
            >
              {/* Primary Mode Toggle: Payment In vs Cash Out */}
              <div className="mb-6">
                <label className={labelCls}>Transaction Mode</label>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => handleModeChange("in")}
                    className={`flex-1 h-12 rounded-xl font-black text-[10px] uppercase tracking-widest border-2 transition-all cursor-pointer flex items-center justify-center gap-2 ${isPaymentIn
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : "bg-gray-50 border-gray-100 text-gray-400 hover:border-gray-200"
                      }`}
                  >
                    <ArrowDownOutlined /> Payment In
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeChange("out")}
                    className={`flex-1 h-12 rounded-xl font-black text-[10px] uppercase tracking-widest border-2 transition-all cursor-pointer flex items-center justify-center gap-2 ${!isPaymentIn
                      ? "bg-orange-50 border-orange-200 text-orange-700"
                      : "bg-gray-50 border-gray-100 text-gray-400 hover:border-gray-200"
                      }`}
                  >
                    <ArrowUpOutlined /> Cash Out
                  </button>
                </div>
              </div>

              {/* Sub-toggle for Cash Out: General Expense vs Supplier Payment */}
              {!isPaymentIn && (
                <div className="mb-6 bg-gray-50/80 p-1.5 rounded-2xl border border-gray-100 flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setCashOutType("EXPENSE");
                      setSelectedSupplier(null);
                      form.resetFields(["name", "amount", "purpose"]);
                    }}
                    className={`flex-1 h-10 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                      cashOutType === "EXPENSE"
                        ? "bg-white text-gray-800 shadow-sm border border-gray-100 font-black"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    <FileTextOutlined /> General Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCashOutType("SUPPLIER");
                      form.resetFields(["name", "amount", "purpose"]);
                    }}
                    className={`flex-1 h-10 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                      cashOutType === "SUPPLIER"
                        ? "bg-white text-indigo-600 shadow-sm border border-indigo-100 font-black"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    <ShopOutlined /> Supplier / Party
                  </button>
                </div>
              )}

              {/* Inward Customer Select */}
              {isPaymentIn ? (
                <>
                  <Form.Item
                    label={<span className={labelCls}>Customer</span>}
                    rules={[
                      {
                        validator: () =>
                          selectedCustomer
                            ? Promise.resolve()
                            : Promise.reject("Please select a customer"),
                      },
                    ]}
                  >
                    <Select
                      showSearch
                      placeholder="Search customer by name"
                      className="txn-select"
                      optionFilterProp="label"
                      value={selectedCustomer?._id || undefined}
                      onChange={handleCustomerSelect}
                      options={customers.map((c) => ({
                        value: c._id,
                        label: c.name,
                      }))}
                      optionRender={(option) => {
                        const customer = customers.find(
                          (c) => c._id === option.value
                        );
                        return (
                          <div className="flex items-center justify-between py-1">
                            <span className="font-bold text-xs capitalize text-gray-700">
                              {customer?.name}
                            </span>
                            <span
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                                (customer?.outstanding || 0) > 0
                                  ? "bg-orange-50 text-orange-600"
                                  : "bg-green-50 text-green-600"
                              }`}
                            >
                              ₹{(customer?.outstanding || 0).toLocaleString()}
                            </span>
                          </div>
                        );
                      }}
                    />
                  </Form.Item>

                  {/* Customer Outstanding display */}
                  {selectedCustomer && (
                    <div
                      className={`rounded-2xl p-4 mb-6 flex items-center justify-between border ${
                        selectedCustomer.outstanding > 0
                          ? "bg-orange-50/50 border-orange-100"
                          : "bg-green-50/50 border-green-100"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                            selectedCustomer.outstanding > 0
                              ? "bg-orange-100 text-orange-600"
                              : "bg-green-100 text-green-600"
                          }`}
                        >
                          <DollarOutlined className="text-sm" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                            Customer Outstanding
                          </p>
                          <p
                            className={`text-lg font-black tracking-tight ${
                              selectedCustomer.outstanding > 0
                                ? "text-orange-600"
                                : "text-green-600"
                            }`}
                          >
                            ₹{selectedCustomer.outstanding.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest capitalize">
                        {selectedCustomer.name}
                      </p>
                    </div>
                  )}
                </>
              ) : cashOutType === "SUPPLIER" ? (
                /* Outward Supplier Select */
                <>
                  <div className="flex items-center justify-between mb-1">
                    <span className={labelCls}>Supplier / Party Name</span>
                    <Button
                      type="link"
                      size="small"
                      icon={<ReloadOutlined spin={fetchingSuppliers} />}
                      onClick={fetchSuppliersFromApi}
                      className="text-[10px] font-bold text-gray-400 hover:text-indigo-600 p-0 h-auto"
                    >
                      Sync Suppliers
                    </Button>
                  </div>
                  <Form.Item
                    rules={[
                      {
                        validator: () =>
                          selectedSupplier
                            ? Promise.resolve()
                            : Promise.reject("Please select a supplier"),
                      },
                    ]}
                  >
                    <Select
                      showSearch
                      loading={fetchingSuppliers || fetchingSupplierDetails}
                      placeholder="Search supplier by name or phone"
                      className="txn-select"
                      optionFilterProp="label"
                      value={selectedSupplier?._id || undefined}
                      onChange={handleSupplierSelect}
                      options={suppliers.map((s) => ({
                        value: s._id,
                        label: `${s.name} (${s.phone})`,
                      }))}
                      optionRender={(option) => {
                        const supplier = suppliers.find(
                          (s) => s._id === option.value
                        );
                        return (
                          <div className="flex items-center justify-between py-1">
                            <span className="font-bold text-xs text-gray-700">
                              {supplier?.name}
                            </span>
                            <span
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                                (supplier?.outstanding || 0) > 0
                                  ? "bg-amber-50 text-amber-600"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              ₹{(supplier?.outstanding || 0).toLocaleString()}
                            </span>
                          </div>
                        );
                      }}
                    />
                  </Form.Item>

                  {/* Supplier Pending Udhaar & Live Details display */}
                  {selectedSupplier && (
                    <div className="rounded-2xl p-4 mb-6 border bg-amber-50/60 border-amber-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-100 text-amber-700">
                            <ShopOutlined className="text-sm" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest">
                                Pending Market Udhaar (You Owe)
                              </p>
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                <CheckCircleOutlined className="text-[9px]" /> API Live
                              </span>
                            </div>
                            <p className="text-lg font-black tracking-tight text-amber-800 font-mono">
                              ₹{(selectedSupplier.outstanding || 0).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                            {selectedSupplier.phone}
                          </p>
                          {selectedSupplier.address && (
                            <p className="text-[10px] text-gray-400 truncate max-w-[140px]">
                              {selectedSupplier.address}
                            </p>
                          )}
                        </div>
                      </div>

                      {selectedSupplier.outstanding > 0 && (
                        <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between">
                          <span className="text-[10px] text-amber-800 font-semibold">
                            Settle entire pending market balance:
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              form.setFieldsValue({
                                amount: selectedSupplier.outstanding,
                              })
                            }
                            className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-wider bg-white px-2 py-1 rounded-md border border-amber-200 shadow-xs cursor-pointer"
                          >
                            Fill ₹{selectedSupplier.outstanding.toLocaleString()}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                /* Outward General Expense Name */
                <Form.Item
                  name="name"
                  label={<span className={labelCls}>Expense Category / Beneficiary</span>}
                  rules={[
                    { required: true, message: "Please enter beneficiary/expense name" },
                  ]}
                >
                  <Input
                    placeholder="e.g. Home Requirement, Electricity, Shop Rent"
                    className="txn-field"
                  />
                </Form.Item>
              )}

              {/* Amount */}
              <Form.Item
                name="amount"
                label={<span className={labelCls}>Amount (₹)</span>}
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
                  className="txn-number"
                  placeholder="0.00"
                  min={1}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) =>
                    value!.replace(/\$\s?|(,*)/g, "") as any
                  }
                />
              </Form.Item>

              {/* Payment Mode or Purpose */}
              {isPaymentIn || cashOutType === "SUPPLIER" ? (
                <Form.Item
                  name="paymentMode"
                  label={<span className={labelCls}>Payment Mode</span>}
                  initialValue="CASH"
                  rules={[
                    { required: true, message: "Please select payment mode" },
                  ]}
                >
                  <Select placeholder="Select mode" className="txn-select">
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
              ) : (
                <Form.Item
                  name="purpose"
                  label={<span className={labelCls}>Expense Reason</span>}
                  rules={[
                    { required: true, message: "Please select purpose" },
                  ]}
                >
                  <Select placeholder="Select purpose" className="txn-select">
                    <Select.Option value="home">Home Requirement</Select.Option>
                    <Select.Option value="rent">Shop Rent</Select.Option>
                    <Select.Option value="electricity">Electricity / Utility</Select.Option>
                    <Select.Option value="salary">Staff Salary / Advance</Select.Option>
                    <Select.Option value="tea_snacks">Tea & Refreshments</Select.Option>
                    <Select.Option value="other">Other</Select.Option>
                  </Select>
                </Form.Item>
              )}

              {/* Submit */}
              <Form.Item className="pt-2 mb-0">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={<SendOutlined />}
                  className={`w-full h-14 border-none rounded-2xl text-xs font-black tracking-[0.15em] shadow-xl transition-all hover:translate-y-[-2px] active:scale-95 uppercase flex items-center justify-center gap-2 ${isPaymentIn
                    ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100"
                    : "bg-orange-600 hover:bg-orange-700 shadow-orange-100"
                    }`}
                >
                  {isPaymentIn
                    ? "Receive Payment"
                    : cashOutType === "SUPPLIER"
                    ? "Pay Supplier & Deduct Balance"
                    : "Record Expense"}
                </Button>
              </Form.Item>
            </Form>
          </div>
        </div>
      </div>

      <style>{`
        .txn-field {
          height: 52px !important;
          border-radius: 14px !important;
          border: 2px solid #f1f5f9 !important;
          background: #f8fafc !important;
          font-weight: 700 !important;
          color: #1e293b !important;
          padding: 0 20px !important;
          transition: all 0.3s ease !important;
          width: 100% !important;
          font-size: 14px !important;
        }
        .txn-field:hover { border-color: #e2e8f0 !important; }
        .txn-field:focus, .txn-field.ant-input-focused {
          border-color: #818cf8 !important;
          background: #fff !important;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05) !important;
        }

        .txn-number {
          width: 100% !important;
          height: 52px !important;
          border-radius: 14px !important;
          border: 2px solid #f1f5f9 !important;
          background: #f8fafc !important;
          transition: all 0.3s ease !important;
        }
        .txn-number:hover { border-color: #e2e8f0 !important; }
        .txn-number.ant-input-number-focused,
        .txn-number:focus-within {
          border-color: #818cf8 !important;
          background: #fff !important;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05) !important;
        }
        .txn-number .ant-input-number-handler-wrap { display: none !important; }
        .txn-number .ant-input-number-input-wrap { height: 100% !important; }
        .txn-number .ant-input-number-input {
          height: 48px !important;
          padding: 0 20px !important;
          font-weight: 700 !important;
          font-size: 14px !important;
        }

        .txn-select .ant-select-selector {
          height: 52px !important;
          border-radius: 14px !important;
          border: 2px solid #f1f5f9 !important;
          background: #f8fafc !important;
          padding: 0 20px !important;
          padding-right: 36px !important;
          display: flex !important;
          align-items: center !important;
          transition: all 0.3s ease !important;
        }
        .txn-select .ant-select-selector:hover { border-color: #e2e8f0 !important; }
        .txn-select.ant-select-focused .ant-select-selector {
          border-color: #818cf8 !important;
          background: #fff !important;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05) !important;
        }
        .txn-select .ant-select-selection-item,
        .txn-select .ant-select-selection-placeholder {
          font-weight: 700 !important;
          font-size: 14px !important;
          line-height: 48px !important;
          padding-inline-start: 0 !important;
          padding-inline-end: 0 !important;
        }
        .txn-select .ant-select-selection-search {
          inset-inline-start: 20px !important;
          inset-inline-end: 36px !important;
        }
        .txn-select .ant-select-selection-search-input {
          height: 48px !important;
          font-weight: 700 !important;
          font-size: 14px !important;
        }
        .txn-select .ant-select-arrow {
          inset-inline-end: 16px !important;
        }
      `}</style>

      {/* Hidden print container */}
      {showPrint && printTransactionData && (
        <TransactionPrint
          onClose={handleClosePrint}
          contentRef={contentRef}
          handlePrint={handlePrint}
          transactionData={printTransactionData}
          isPaymentIn={isPaymentIn}
        />
      )}
    </main>
  );
};

export default NewTransaction;
