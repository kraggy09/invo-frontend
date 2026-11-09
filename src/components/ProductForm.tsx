import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Form,
  Input,
  InputNumber,
  Button,
  Select,
  Radio,
  Modal,
} from "antd";
import { ArrowLeftOutlined, ShoppingOutlined, PlusOutlined, EditOutlined, CloseOutlined, BarcodeOutlined, ShopOutlined } from "@ant-design/icons";
import useUserStore from "../store/user.store";
import useSupplierStore from "../store/supplier.store";
import apiCaller from "../utils/apiCaller";
import { formatIndianNumber } from "../utils";
import { message } from "../utils/antdStatic";

export type ProductFormValues = {
  name: string;
  measuring: string;
  mrp: number | string;
  costPrice: number | string;
  retailPrice: number | string;
  wholesalePrice: number | string;
  superWholesalePrice: number | string;
  barcode: string[];
  stock: number | string;
  packet: number | string;
  box: number | string;
  minQuantity: number | string;
  category: string | null;
  supplierId?: string | null;
  paymentMode?: "CASH" | "CREDIT";
  cashPaid?: number;
  isAutoBarcode?: boolean;
};

interface ProductFormProps {
  initialValues?: Partial<ProductFormValues>;
  onSubmit: (values: ProductFormValues) => void;
  loading?: boolean;
  categories: { value: string; label: string }[];
  mode?: "create" | "edit";
}

const defaultValues: ProductFormValues = {
  name: "",
  measuring: "",
  mrp: "",
  costPrice: "",
  retailPrice: 0,
  wholesalePrice: 0,
  superWholesalePrice: 0,
  barcode: [],
  stock: 0,
  packet: 0,
  box: 0,
  minQuantity: 1,
  category: null,
  supplierId: null,
  paymentMode: "CASH",
};

const ProductForm = ({
  initialValues,
  onSubmit,
  loading,
  categories,
  mode = "create",
}: ProductFormProps) => {
  const [form] = Form.useForm<ProductFormValues>();
  const navigate = useNavigate();
  const [barcodes, setBarcodes] = useState<string[]>([]);
  const [barcodeInput, setBarcodeInput] = useState("");

  const { user } = useUserStore();
  const isAdmin =
    user?.roles?.some((role) =>
      ["SUPER_ADMIN", "ADMIN", "CREATOR"].includes(role),
    ) || false;

  const { suppliers } = useSupplierStore();
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [newSupplierForm] = Form.useForm();
  const [creatingSupplier, setCreatingSupplier] = useState(false);

  const userShopBarcode = useUserStore((state) => state.user?.shopSettings?.currentBarcode);
  const [currentAutoBarcode, setCurrentAutoBarcode] = useState<number | null>(userShopBarcode || null);
  const [fetchingBarcode, setFetchingBarcode] = useState(false);
  const [isAutoBarcodeUsed, setIsAutoBarcodeUsed] = useState(false);
  const [showConfigBarcodeModal, setShowConfigBarcodeModal] = useState(false);
  const [newBarcodeVal, setNewBarcodeVal] = useState<number | null>(null);
  const [updatingBarcodeSetting, setUpdatingBarcodeSetting] = useState(false);

  useEffect(() => {
    if (mode === "create") {
      setFetchingBarcode(true);
      apiCaller
        .get("/products/next-barcode")
        .then((res) => {
          if (res.data?.success && res.data?.data?.currentBarcode) {
            setCurrentAutoBarcode(res.data.data.currentBarcode);
          }
        })
        .catch(() => {
          if (userShopBarcode) setCurrentAutoBarcode(userShopBarcode);
        })
        .finally(() => setFetchingBarcode(false));
    }
  }, [mode, userShopBarcode]);

  const handleUseAutoBarcode = () => {
    const bc = currentAutoBarcode || 1000;
    const bcStr = String(bc);
    if (!barcodes.includes(bcStr)) {
      const next = [...barcodes, bcStr];
      setBarcodes(next);
      form.setFieldsValue({ barcode: next });
      setIsAutoBarcodeUsed(true);
      message.success(`Assigned auto barcode #${bc}`);
    }
  };

  const handleUpdateCurrentBarcodeSetting = async () => {
    if (!newBarcodeVal || newBarcodeVal <= 0) {
      message.warning("Please enter a valid barcode number");
      return;
    }
    setUpdatingBarcodeSetting(true);
    try {
      const res = await apiCaller.put("/shop/settings", {
        settings: { currentBarcode: newBarcodeVal },
      });
      if (res.data?.success) {
        setCurrentAutoBarcode(newBarcodeVal);
        const currentUser = useUserStore.getState().user;
        if (currentUser) {
          useUserStore.getState().setUser({
            ...currentUser,
            shopSettings: {
              ...currentUser.shopSettings,
              currentBarcode: newBarcodeVal,
            },
          });
        }
        setShowConfigBarcodeModal(false);
        message.success(`Shop auto barcode sequence updated to #${newBarcodeVal}`);
      }
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Failed to update barcode setting");
    } finally {
      setUpdatingBarcodeSetting(false);
    }
  };

  const watchedStock = Form.useWatch("stock", form);
  const watchedCostPrice = Form.useWatch("costPrice", form);
  const watchedSupplierId = Form.useWatch("supplierId", form);

  const totalInwardValue = (Number(watchedStock) || 0) * (Number(watchedCostPrice) || 0);

  useEffect(() => {
    if (suppliers.length === 0) {
      apiCaller.get("/suppliers").then((res) => {
        if (res.data?.success && res.data?.data?.suppliers) {
          useSupplierStore.getState().setSuppliers(res.data.data.suppliers);
        }
      }).catch(console.error);
    }
  }, [suppliers.length]);

  const handleCreateSupplier = async (values: any) => {
    setCreatingSupplier(true);
    try {
      const res = await apiCaller.post("/suppliers", values);
      if (res.data?.success && res.data?.data?.supplier) {
        useSupplierStore.getState().addSupplier(res.data.data.supplier);
        form.setFieldValue("supplierId", res.data.data.supplier._id);
        setShowSupplierModal(false);
        newSupplierForm.resetFields();
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setCreatingSupplier(false);
    }
  };

  const pricingMode = useUserStore(
    (state) => state.user?.shopSettings?.pricingMode
  );
  const isRetailOnly =
    pricingMode === "RETAIL_ONLY" ||
    (pricingMode as string)?.toUpperCase() === "RETAIL_ONLY" ||
    (pricingMode as string)?.toUpperCase() === "RETAIL";

  const handleFinish = (values: any) => {
    const isAutoUsed = Boolean(
      isAutoBarcodeUsed ||
      (currentAutoBarcode && barcodes.includes(String(currentAutoBarcode)))
    );

    const finalValues: ProductFormValues = {
      ...values,
      barcode: barcodes,
      isAutoBarcode: isAutoUsed,
      category:
        values.category && values.category.trim() !== "" && values.category !== "null"
          ? values.category
          : null,
      retailPrice: Number(values.retailPrice) || 0,
      wholesalePrice: isRetailOnly
        ? Number(values.retailPrice) || 0
        : Number(values.wholesalePrice) || 0,
      superWholesalePrice: isRetailOnly
        ? Number(values.retailPrice) || 0
        : Number(values.superWholesalePrice) || 0,
      packet: isRetailOnly ? 0 : Number(values.packet) || 0,
      box: isRetailOnly ? 0 : Number(values.box) || 0,
      stock: Number(values.stock) || 0,
      minQuantity: Number(values.minQuantity) || 1,
      supplierId: values.supplierId || null,
      paymentMode: values.paymentMode || "CASH",
    };
    onSubmit(finalValues);
  };

  useEffect(() => {
    const merged = { ...defaultValues, ...initialValues };
    // Normalize barcode to array
    const bc = merged.barcode;
    const arr = Array.isArray(bc) ? bc.map(String) : bc ? [String(bc)] : [];
    setBarcodes(arr);
    form.setFieldsValue({ ...merged, barcode: arr });
  }, [initialValues, form]);

  const addBarcode = () => {
    const val = barcodeInput.trim();
    if (!val) return;
    if (barcodes.includes(val)) {
      setBarcodeInput("");
      return;
    }
    const next = [...barcodes, val];
    setBarcodes(next);
    form.setFieldsValue({ barcode: next });
    setBarcodeInput("");
  };

  const removeBarcode = (idx: number) => {
    const next = barcodes.filter((_, i) => i !== idx);
    setBarcodes(next);
    form.setFieldsValue({ barcode: next });
  };

  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addBarcode();
    }
  };

  const labelCls = "text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1";

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50/50 p-4 sm:p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-600 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-[720px] relative z-10">
        {/* Back button + Title */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate("/products")}
            className="w-10 h-10 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:border-indigo-200 transition-all cursor-pointer"
          >
            <ArrowLeftOutlined />
          </button>
          <div>
            <h1 className="text-xl font-black text-gray-800 tracking-tight leading-none">
              {mode === "edit" ? "Edit Product" : "Create Product"}
            </h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1.5">
              {mode === "edit" ? "Edit product details" : "Add new product details"}
            </p>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-[32px] shadow-2xl shadow-indigo-100/50 overflow-hidden border border-gray-100">
          {/* Gradient Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-8 text-white flex items-center gap-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000" />
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-lg group-hover:rotate-6 transition-all duration-500">
              {mode === "edit" ? <EditOutlined className="text-2xl" /> : <ShoppingOutlined className="text-2xl" />}
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black text-indigo-100 uppercase tracking-widest mb-1">Inventory Management</p>
              <h2 className="text-xl font-black tracking-tight leading-none">
                {mode === "edit" ? "Edit Product" : "Add New Product"}
              </h2>
            </div>
          </div>

          {/* Form Body */}
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFinish}
            initialValues={{ ...defaultValues, ...initialValues }}
            autoComplete="off"
            requiredMark={false}
            className="p-6 sm:p-10"
          >
            {/* Section: Identification */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                <h3 className="text-[11px] font-black text-gray-800 uppercase tracking-[0.15em]">Product Details</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                <Form.Item
                  label={<span className={labelCls}>Product Name</span>}
                  name="name"
                  rules={[{ required: true, message: "Product name required" }]}
                >
                  <Input placeholder="e.g. Dairy Milk Silk" className="product-field" autoFocus />
                </Form.Item>
                <Form.Item
                  label={<span className={labelCls}>Measuring Type</span>}
                  name="measuring"
                  rules={[{ required: true, message: "Measuring unit required" }]}
                >
                  <Select
                    placeholder="Select unit"
                    className="product-select"
                    options={[
                      { value: "kg", label: "Kilogram" },
                      { value: "piece", label: "Pieces" },
                    ]}
                  />
                </Form.Item>

                {/* Barcode chip input — spans full width */}
                <div className="sm:col-span-2">
                  <Form.Item
                    name="barcode"
                    label={
                      <div className="flex items-center justify-between w-full">
                        <span className={labelCls}>Barcodes</span>
                        {mode === "create" && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg flex items-center gap-1">
                              <span>Shop Auto Barcode:</span>
                              <span className="font-mono text-indigo-700">#{currentAutoBarcode ?? (fetchingBarcode ? "..." : 1000)}</span>
                            </span>
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => {
                                  setNewBarcodeVal(currentAutoBarcode ?? 1000);
                                  setShowConfigBarcodeModal(true);
                                }}
                                title="Configure shop starting barcode sequence"
                                className="text-gray-400 hover:text-indigo-600 cursor-pointer bg-transparent border-none p-0 flex items-center transition-colors"
                              >
                                <EditOutlined className="text-xs" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    }
                    rules={[{
                      validator: () =>
                        barcodes.length > 0
                          ? Promise.resolve()
                          : Promise.reject("At least one barcode required"),
                    }]}
                  >
                    <div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                          value={barcodeInput}
                          onChange={(e) => setBarcodeInput(e.target.value)}
                          onKeyDown={handleBarcodeKeyDown}
                          placeholder="Type or scan product barcode & press Enter"
                          className="product-field flex-1"
                          prefix={<BarcodeOutlined className="text-gray-300 mr-1" />}
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={addBarcode}
                            className="h-[52px] px-5 rounded-[14px] bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 cursor-pointer border-none flex items-center gap-2 shadow-sm"
                          >
                            <PlusOutlined /> Add
                          </button>
                          {mode === "create" && (
                            <button
                              type="button"
                              onClick={handleUseAutoBarcode}
                              disabled={fetchingBarcode || barcodes.includes(String(currentAutoBarcode ?? 1000))}
                              className={`h-[52px] px-4 rounded-[14px] font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 cursor-pointer flex items-center gap-2 border ${
                                barcodes.includes(String(currentAutoBarcode ?? 1000))
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 opacity-80 cursor-default"
                                  : "bg-emerald-600 hover:bg-emerald-700 text-white border-transparent shadow-lg shadow-emerald-100"
                              }`}
                              title="Assign next shop-wide auto barcode sequence"
                            >
                              <BarcodeOutlined />
                              {barcodes.includes(String(currentAutoBarcode ?? 1000))
                                ? `Auto #${currentAutoBarcode ?? 1000} Added`
                                : `Auto Barcode (#${currentAutoBarcode ?? (fetchingBarcode ? "..." : 1000)})`}
                            </button>
                          )}
                        </div>
                      </div>
                      {barcodes.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {barcodes.map((bc, idx) => {
                            const isAuto = Boolean(currentAutoBarcode && String(currentAutoBarcode) === bc);
                            return (
                              <div
                                key={idx}
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl group/chip transition-all ${
                                  isAuto
                                    ? "bg-emerald-50 border border-emerald-200"
                                    : "bg-indigo-50 border border-indigo-100 hover:bg-indigo-100"
                                }`}
                              >
                                <BarcodeOutlined className={isAuto ? "text-emerald-500 text-xs" : "text-indigo-400 text-xs"} />
                                <span className={`text-xs font-black tracking-tight font-mono ${isAuto ? "text-emerald-700" : "text-indigo-700"}`}>
                                  {bc}
                                </span>
                                {isAuto && (
                                  <span className="text-[9px] font-black px-1.5 py-0.5 bg-emerald-200/60 text-emerald-800 rounded uppercase tracking-wider">
                                    Shop Auto
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => removeBarcode(idx)}
                                  className="w-5 h-5 rounded-md bg-indigo-200/50 hover:bg-red-100 flex items-center justify-center transition-all cursor-pointer border-none group-hover/chip:bg-red-100"
                                >
                                  <CloseOutlined className="text-[8px] text-indigo-400 group-hover/chip:text-red-500" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </Form.Item>
                </div>

                <Form.Item
                  label={<span className={labelCls}>Category (Optional)</span>}
                  name="category"
                >
                  <Select
                    showSearch
                    allowClear
                    placeholder="Select category (or none)"
                    options={[
                      { value: "", label: "(None / Uncategorized)" },
                      ...categories,
                    ]}
                    optionFilterProp="label"
                    className="product-select"
                  />
                </Form.Item>
              </div>
            </div>

            {/* Section: Pricing Matrix */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-6 bg-green-500 rounded-full" />
                <h3 className="text-[11px] font-black text-gray-800 uppercase tracking-[0.15em]">
                  {isRetailOnly ? "Pricing" : "Pricing Matrix"}
                </h3>
              </div>
              <div className="bg-gray-50/50 rounded-[24px] p-5 sm:p-6 border border-gray-50">
                <div
                  className={`grid grid-cols-1 sm:grid-cols-2 ${
                    isRetailOnly ? "lg:grid-cols-3" : "lg:grid-cols-3"
                  } gap-x-6 gap-y-1`}
                >
                  <Form.Item
                    label={<span className={labelCls}>MRP (₹)</span>}
                    name="mrp"
                    rules={[{ required: true, message: "MRP required" }]}
                  >
                    <InputNumber min={0} className="product-number" placeholder="0.00" />
                  </Form.Item>
                  <Form.Item
                    label={<span className={labelCls}>Cost Price (₹)</span>}
                    name="costPrice"
                    rules={[{ required: true, message: "Cost price required" }]}
                  >
                    <InputNumber min={0} className="product-number" placeholder="0.00" />
                  </Form.Item>
                  <Form.Item
                    label={<span className={labelCls}>Retail Price (₹)</span>}
                    name="retailPrice"
                    rules={[{ required: true, message: "Retail price required" }]}
                  >
                    <InputNumber min={0} className="product-number" placeholder="0.00" />
                  </Form.Item>
                  {!isRetailOnly && (
                    <>
                      <Form.Item
                        label={<span className={labelCls}>Wholesale (₹)</span>}
                        name="wholesalePrice"
                        rules={[{ required: true, message: "Wholesale price required" }]}
                      >
                        <InputNumber min={0} className="product-number" placeholder="0.00" />
                      </Form.Item>
                      <Form.Item
                        label={<span className={labelCls}>Super WS (₹)</span>}
                        name="superWholesalePrice"
                        rules={[{ required: true, message: "Super wholesale price required" }]}
                      >
                        <InputNumber min={0} className="product-number" placeholder="0.00" />
                      </Form.Item>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Section: Inventory Configuration */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
                <h3 className="text-[11px] font-black text-gray-800 uppercase tracking-[0.15em]">Inventory Configuration</h3>
              </div>
              <div
                className={`grid grid-cols-2 ${
                  isRetailOnly ? "sm:grid-cols-2" : "sm:grid-cols-4"
                } gap-x-6 gap-y-1`}
              >
                <Form.Item
                  label={<span className={labelCls}>Stock</span>}
                  name="stock"
                  rules={[{ required: true, message: "Stock required" }]}
                  tooltip={mode === "edit" ? "Stock cannot be manipulated directly while editing. Please generate an inventory request." : undefined}
                >
                  <InputNumber
                    min={0}
                    className="product-number"
                    placeholder="0"
                    disabled={mode === "edit"}
                  />
                </Form.Item>
                {!isRetailOnly && (
                  <>
                    <Form.Item
                      label={<span className={labelCls}>Packet Size</span>}
                      name="packet"
                      rules={[{ required: true, message: "Packet size required" }]}
                    >
                      <InputNumber min={0} className="product-number" placeholder="0" />
                    </Form.Item>
                    <Form.Item
                      label={<span className={labelCls}>Box Size</span>}
                      name="box"
                      rules={[{ required: true, message: "Box size required" }]}
                    >
                      <InputNumber min={0} className="product-number" placeholder="0" />
                    </Form.Item>
                  </>
                )}
                <Form.Item
                  label={<span className={labelCls}>Min Quantity</span>}
                  name="minQuantity"
                  rules={[{ required: true, message: "Min quantity required" }]}
                >
                  <InputNumber min={1} className="product-number" placeholder="1" />
                </Form.Item>
              </div>
            </div>

            {mode === "create" && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                      <ShopOutlined />
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-gray-800 tracking-wider uppercase">
                        Supplier & Acquisition (Optional)
                      </h2>
                      <p className="text-[10px] font-bold text-gray-400 m-0">
                        Link initial stock acquisition to a supplier & record cash/credit payment
                      </p>
                    </div>
                  </div>
                  <Button
                    type="dashed"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => setShowSupplierModal(true)}
                    className="rounded-xl text-xs font-bold text-emerald-600 border-emerald-300"
                  >
                    Quick Add Supplier
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Form.Item
                    label={<span className={labelCls}>Supplier / Vendor</span>}
                    name="supplierId"
                  >
                    <Select
                      showSearch
                      allowClear
                      placeholder="Select a supplier"
                      optionFilterProp="label"
                      className="product-select"
                      options={suppliers.map((s) => ({
                        value: s._id,
                        label: `${s.name} (${s.phone}) - Udhaar: ₹${formatIndianNumber(s.outstanding || 0)}`,
                      }))}
                    />
                  </Form.Item>

                  {watchedSupplierId && totalInwardValue > 0 && (
                    <Form.Item
                      label={<span className={labelCls}>Payment Mode</span>}
                      name="paymentMode"
                      initialValue="CASH"
                    >
                      <Radio.Group buttonStyle="solid" className="w-full flex h-[52px] items-center">
                        <Radio.Button value="CASH" className="flex-1 text-center font-bold h-full flex items-center justify-center rounded-l-xl">
                          Cash (Paid now)
                        </Radio.Button>
                        <Radio.Button value="CREDIT" className="flex-1 text-center font-bold h-full flex items-center justify-center rounded-r-xl">
                          Credit (Udhaar)
                        </Radio.Button>
                      </Radio.Group>
                    </Form.Item>
                  )}
                </div>

                {watchedSupplierId && totalInwardValue > 0 && (
                  <div className="space-y-2">
                    <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-black text-emerald-800 uppercase tracking-wider">
                          Initial Stock Inward Value
                        </div>
                        <div className="text-[11px] font-medium text-emerald-600">
                          {Number(watchedStock)} items × ₹{Number(watchedCostPrice)} cost price
                        </div>
                      </div>
                      <div className="text-xl font-black text-emerald-700 font-mono">
                        ₹{formatIndianNumber(totalInwardValue)}
                      </div>
                    </div>

                    {!isAdmin ? (
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-[11px] font-bold flex items-center gap-2">
                        <span>ℹ️</span>
                        <span>
                          As a staff member, submitting will create an <b>accepted supplier purchase request</b> awaiting Admin approval. Product stock will be 0 until approved.
                        </span>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[11px] font-bold flex items-center gap-2">
                        <span>✓</span>
                        <span>
                          As an admin, this will create an <b>approved purchase</b> and immediately update product stock and supplier ledger.
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {!watchedSupplierId && Number(watchedStock) > 0 && !isAdmin && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-[11px] font-bold flex items-center gap-2">
                    <span>ℹ️</span>
                    <span>
                      Stock entered without a supplier will be submitted as an <b>inventory request</b> awaiting Admin approval. Product stock will be 0 until approved.
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Submit */}
            <Form.Item className="pt-2 mb-0">
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={mode === "edit" ? <EditOutlined /> : <PlusOutlined />}
                className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 border-none rounded-2xl text-xs font-black tracking-[0.15em] shadow-xl shadow-indigo-100 transition-all hover:translate-y-[-2px] active:scale-95 uppercase flex items-center justify-center gap-2"
              >
                {mode === "edit" ? "Update Product" : "Save Product"}
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>

      <style>{`
        .product-field {
          height: 52px !important;
          border-radius: 14px !important;
          border: 2px solid #f1f5f9 !important;
          background: #f8fafc !important;
          font-weight: 700 !important;
          color: #1e293b !important;
          padding: 0 16px !important;
          transition: all 0.3s ease !important;
          width: 100% !important;
        }
        .product-field:hover {
          border-color: #e2e8f0 !important;
        }
        .product-field:focus {
          border-color: #818cf8 !important;
          background: #fff !important;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05) !important;
        }
        .product-number {
          width: 100% !important;
          height: 52px !important;
          border-radius: 14px !important;
          border: 2px solid #f1f5f9 !important;
          background: #f8fafc !important;
          font-weight: 700 !important;
          color: #1e293b !important;
          transition: all 0.3s ease !important;
        }
        .product-number:hover {
          border-color: #e2e8f0 !important;
        }
        .product-number.ant-input-number-focused,
        .product-number:focus-within {
          border-color: #818cf8 !important;
          background: #fff !important;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05) !important;
        }
        .product-number .ant-input-number-input {
          height: 48px !important;
          padding: 0 16px !important;
          font-weight: 700 !important;
        }
        .product-select .ant-select-selector {
          height: 52px !important;
          border-radius: 14px !important;
          border: 2px solid #f1f5f9 !important;
          background: #f8fafc !important;
          padding: 0 16px !important;
          display: flex !important;
          align-items: center !important;
          transition: all 0.3s ease !important;
        }
        .product-select .ant-select-selector:hover {
          border-color: #e2e8f0 !important;
        }
        .product-select.ant-select-focused .ant-select-selector {
          border-color: #818cf8 !important;
          background: #fff !important;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05) !important;
        }
        .product-select .ant-select-selection-item,
        .product-select .ant-select-selection-placeholder {
          font-weight: 700 !important;
          line-height: 48px !important;
        }
      `}</style>

      {/* Quick Add Supplier Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3 py-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
              <ShopOutlined />
            </div>
            <div>
              <div className="text-base font-black text-gray-800">Register New Supplier</div>
              <div className="text-[10px] font-bold text-gray-400">Add vendor to catalog instantly</div>
            </div>
          </div>
        }
        open={showSupplierModal}
        onCancel={() => setShowSupplierModal(false)}
        footer={null}
        destroyOnClose
        centered
      >
        <Form
          form={newSupplierForm}
          layout="vertical"
          onFinish={handleCreateSupplier}
          className="pt-2"
        >
          <Form.Item
            label={<span className="text-xs font-black text-gray-600 uppercase">Supplier Name</span>}
            name="name"
            rules={[{ required: true, message: "Supplier name is required" }]}
          >
            <Input placeholder="e.g. Ramesh Trading Co." className="h-11 rounded-xl font-bold" />
          </Form.Item>

          <Form.Item
            label={<span className="text-xs font-black text-gray-600 uppercase">Phone Number</span>}
            name="phone"
            rules={[
              { required: true, message: "Phone number is required" },
              { pattern: /^[0-9]{10}$/, message: "Enter a valid 10-digit phone number" },
            ]}
          >
            <Input placeholder="e.g. 9876543210" maxLength={10} className="h-11 rounded-xl font-bold" />
          </Form.Item>

          <Form.Item
            label={<span className="text-xs font-black text-gray-600 uppercase">Address (Optional)</span>}
            name="address"
          >
            <Input.TextArea placeholder="Shop / Market address" rows={2} className="rounded-xl font-medium" />
          </Form.Item>

          <div className="flex justify-end gap-3 pt-3">
            <Button onClick={() => setShowSupplierModal(false)} className="rounded-xl font-bold">
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={creatingSupplier}
              className="bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold"
            >
              Save Supplier
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Modal for Configuring Shop Starting Auto Barcode */}
      <Modal
        open={showConfigBarcodeModal}
        onCancel={() => setShowConfigBarcodeModal(false)}
        onOk={handleUpdateCurrentBarcodeSetting}
        confirmLoading={updatingBarcodeSetting}
        okText="SAVE BARCODE SEQUENCE"
        cancelText="CANCEL"
        centered
        width={420}
        title={
          <div className="flex items-center gap-3">
            <div className="bg-indigo-50 p-2.5 rounded-xl border border-indigo-100">
              <BarcodeOutlined className="text-indigo-600 text-xl" />
            </div>
            <div>
              <span className="text-sm font-black text-gray-800 uppercase tracking-widest block">Shop Auto Barcode</span>
              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em]">Sequence Configuration</span>
            </div>
          </div>
        }
        okButtonProps={{
          className: "bg-indigo-600 border-none font-black rounded-xl h-12 hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all uppercase px-6"
        }}
        cancelButtonProps={{
          className: "rounded-xl font-black h-12 border-gray-100 text-gray-400 uppercase"
        }}
      >
        <div className="py-6 space-y-4">
          <p className="text-xs text-gray-500">
            Set the next auto-incrementing barcode sequence number for your shop. When creating new products without packaging barcodes, this number will be assigned and automatically incremented by 1.
          </p>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Next Barcode Number</label>
            <InputNumber
              min={1}
              value={newBarcodeVal}
              onChange={(v) => setNewBarcodeVal(v ? Number(v) : null)}
              className="w-full rounded-2xl h-12 flex items-center font-black border-2 border-gray-100 px-2"
              placeholder="e.g. 1000"
            />
          </div>
        </div>
      </Modal>
    </main>
  );
};

export default ProductForm;
