import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Form,
  Input,
  InputNumber,
  Button,
  Select,
} from "antd";
import { ArrowLeftOutlined, ShoppingOutlined, PlusOutlined, EditOutlined, CloseOutlined, BarcodeOutlined } from "@ant-design/icons";

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
  category: string;
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
  retailPrice: "",
  wholesalePrice: "",
  superWholesalePrice: "",
  barcode: [],
  stock: "",
  packet: "",
  box: "",
  minQuantity: 1,
  category: "",
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
              {mode === "edit" ? "Catalog Record Modification" : "New Catalog Registration"}
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
                {mode === "edit" ? "Modify Registry Entry" : "Register New Asset"}
              </h2>
            </div>
          </div>

          {/* Form Body */}
          <Form
            form={form}
            layout="vertical"
            onFinish={onSubmit}
            initialValues={{ ...defaultValues, ...initialValues }}
            autoComplete="off"
            requiredMark={false}
            className="p-6 sm:p-10"
          >
            {/* Section: Identification */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                <h3 className="text-[11px] font-black text-gray-800 uppercase tracking-[0.15em]">Identification</h3>
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
                    label={<span className={labelCls}>Barcodes</span>}
                    rules={[{
                      validator: () =>
                        barcodes.length > 0
                          ? Promise.resolve()
                          : Promise.reject("At least one barcode required"),
                    }]}
                  >
                    <div>
                      <div className="flex gap-2">
                        <Input
                          value={barcodeInput}
                          onChange={(e) => setBarcodeInput(e.target.value)}
                          onKeyDown={handleBarcodeKeyDown}
                          placeholder="Type barcode & press Enter"
                          className="product-field flex-1"
                          prefix={<BarcodeOutlined className="text-gray-300 mr-1" />}
                        />
                        <button
                          type="button"
                          onClick={addBarcode}
                          className="h-[52px] px-5 rounded-[14px] bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 cursor-pointer border-none flex items-center gap-2"
                        >
                          <PlusOutlined /> Add
                        </button>
                      </div>
                      {barcodes.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {barcodes.map((bc, idx) => (
                            <div
                              key={idx}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl group/chip hover:bg-indigo-100 transition-all"
                            >
                              <BarcodeOutlined className="text-indigo-400 text-xs" />
                              <span className="text-xs font-black text-indigo-700 tracking-tight font-mono">{bc}</span>
                              <button
                                type="button"
                                onClick={() => removeBarcode(idx)}
                                className="w-5 h-5 rounded-md bg-indigo-200/50 hover:bg-red-100 flex items-center justify-center transition-all cursor-pointer border-none group-hover/chip:bg-red-100"
                              >
                                <CloseOutlined className="text-[8px] text-indigo-400 group-hover/chip:text-red-500" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Form.Item>
                </div>

                <Form.Item
                  label={<span className={labelCls}>Category</span>}
                  name="category"
                  rules={[{ required: true, message: "Category required" }]}
                >
                  <Select
                    showSearch
                    placeholder="Select category"
                    options={categories}
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
                <h3 className="text-[11px] font-black text-gray-800 uppercase tracking-[0.15em]">Pricing Matrix</h3>
              </div>
              <div className="bg-gray-50/50 rounded-[24px] p-5 sm:p-6 border border-gray-50">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1">
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
                </div>
              </div>
            </div>

            {/* Section: Inventory Configuration */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
                <h3 className="text-[11px] font-black text-gray-800 uppercase tracking-[0.15em]">Inventory Configuration</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1">
                <Form.Item
                  label={<span className={labelCls}>Stock</span>}
                  name="stock"
                  rules={[{ required: true, message: "Stock required" }]}
                >
                  <InputNumber min={0} className="product-number" placeholder="0" />
                </Form.Item>
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
                <Form.Item
                  label={<span className={labelCls}>Min Quantity</span>}
                  name="minQuantity"
                  rules={[{ required: true, message: "Min quantity required" }]}
                >
                  <InputNumber min={1} className="product-number" placeholder="1" />
                </Form.Item>
              </div>
            </div>

            {/* Submit */}
            <Form.Item className="pt-2 mb-0">
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={mode === "edit" ? <EditOutlined /> : <PlusOutlined />}
                className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 border-none rounded-2xl text-xs font-black tracking-[0.15em] shadow-xl shadow-indigo-100 transition-all hover:translate-y-[-2px] active:scale-95 uppercase flex items-center justify-center gap-2"
              >
                {mode === "edit" ? "Update Registry Entry" : "Commit to Registry"}
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
    </main>
  );
};

export default ProductForm;
