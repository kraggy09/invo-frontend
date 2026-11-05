import { useState, useMemo, useCallback } from "react";
import {
  Button,
  InputNumber,
  Modal,
  Tag,
  AutoComplete,
  Table,
  Select,
  Form,
  Input,
} from "antd";
import {
  ExclamationCircleOutlined,
  DeleteOutlined,
  ShopOutlined,
  PlusOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { message } from "../utils/antdStatic";
import { useNavigate } from "react-router-dom";
import useProductStore from "../store/product.store";
import useSupplierStore, { ISupplier } from "../store/supplier.store";
import apiCaller from "../utils/apiCaller";

function getStockBreakdown(
  stock: number,
  boxSize?: number,
  packetSize?: number
) {
  let box = 0,
    packet = 0,
    piece = 0;

  const isNegative = stock < 0;
  let absStock = Math.abs(stock);

  if (boxSize && boxSize > 0) {
    box = Math.floor(absStock / boxSize);
    absStock = absStock % boxSize;
  }
  if (packetSize && packetSize > 0) {
    packet = Math.floor(absStock / packetSize);
    absStock = absStock % packetSize;
  }
  piece = absStock;

  if (isNegative) {
    return `${box > 0 ? -box : 0} Box, ${packet > 0 ? -packet : 0} Packet, ${piece > 0 ? -piece : 0} Piece`;
  }

  return `${box} Box, ${packet} Packet, ${piece} Piece`;
}

type RequestItem = {
  _id: string;
  name: string;
  stock: number;
  barcode: string[];
  packetSize: number;
  boxSize: number;
  piece: number;
  packet: number;
  box: number;
};

const RaiseSupplierPurchase = () => {
  const navigate = useNavigate();
  const { products } = useProductStore();
  const { suppliers } = useSupplierStore();

  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [requestList, setRequestList] = useState<RequestItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // New Supplier quick-add modal state
  const [showNewSupplierModal, setShowNewSupplierModal] = useState(false);
  const [newSupplierForm] = Form.useForm();
  const [creatingSupplier, setCreatingSupplier] = useState(false);

  const filteredSuppliers = useMemo(() => {
    if (!supplierSearch) return suppliers;
    const lower = supplierSearch.toLowerCase();
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(lower) ||
        s.phone.toLowerCase().includes(lower)
    );
  }, [suppliers, supplierSearch]);

  const productSuggestions = useMemo(() => {
    if (!productSearch) return [];
    const lower = productSearch.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        p.barcode.some((b: any) => String(b).includes(lower))
    );
  }, [productSearch, products]);

  const addProduct = useCallback(
    (product: any) => {
      if (requestList.find((item) => item._id === product._id)) {
        message.warning("Product is already in the list");
        return;
      }

      const newItem: RequestItem = {
        _id: product._id,
        name: product.name,
        stock: product.stock,
        barcode: product.barcode,
        boxSize: product.box,
        packetSize: product.packet,
        piece: 1,
        packet: 0,
        box: 0,
      };

      setRequestList((prev) => [newItem, ...prev]);
      setProductSearch("");
    },
    [requestList]
  );

  const tryAutoAddProduct = useCallback(
    (value: string) => {
      if (!value.trim()) return;
      const lower = value.trim().toLowerCase();
      const matchedProducts = products.filter(
        (p) =>
          p.name.toLowerCase().includes(lower) ||
          p.barcode.some((b: any) => String(b).toLowerCase() === lower)
      );
      if (matchedProducts.length === 1) {
        addProduct(matchedProducts[0]);
      }
    },
    [products, addProduct]
  );

  const updateQuantity = (
    id: string,
    field: "piece" | "packet" | "box",
    value: number
  ) => {
    const newRequests = requestList.map((item) => {
      if (id === item._id) {
        if (field === "box") {
          return { ...item, box: value, packet: 0, piece: 0 };
        } else if (field === "packet") {
          return { ...item, packet: value, piece: 0 };
        } else if (field === "piece") {
          return { ...item, piece: value };
        }
      }
      return item;
    });
    setRequestList(newRequests);
  };

  const removeProduct = (id: string) => {
    setRequestList((list) => list.filter((item) => item._id !== id));
  };

  const handleCreateSupplier = async (values: any) => {
    setCreatingSupplier(true);
    try {
      const res = await apiCaller.post("/suppliers", values);
      if (res.data?.success && res.data?.data?.supplier) {
        message.success("Supplier registered successfully!");
        setSelectedSupplierId(res.data.data.supplier._id);
        setShowNewSupplierModal(false);
        newSupplierForm.resetFields();
      }
    } catch (err: any) {
      console.error(err);
      message.error(err?.response?.data?.message || err?.response?.data?.msg || "Failed to create supplier");
    } finally {
      setCreatingSupplier(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedSupplierId) {
      message.error("Please select a supplier first.");
      return;
    }

    if (requestList.length === 0) {
      message.error("Please add at least one product.");
      return;
    }

    const allProductsValid = requestList.every(
      (item) => item.packet !== 0 || item.box !== 0 || item.piece !== 0
    );

    if (!allProductsValid) {
      message.error("Please enter a valid quantity for each product.");
      return;
    }

    const payload = requestList.map((item) => {
      const totalQuantity =
        item.piece + item.packet * item.packetSize + item.box * item.boxSize;
      return {
        id: item._id,
        quantity: totalQuantity,
      };
    });

    setSubmitting(true);
    try {
      await apiCaller.post("/supplier-purchases", {
        supplierId: selectedSupplierId,
        products: payload,
      });

      message.success("Purchase request submitted to admin/acceptor!");
      setRequestList([]);
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error(err);
      message.error(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          "Failed to submit purchase request"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const selectedSupplier = suppliers.find((s) => s._id === selectedSupplierId);

  const columns = [
    {
      title: "",
      key: "delete",
      width: 50,
      render: (_: any, record: RequestItem) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeProduct(record._id)}
        />
      ),
    },
    {
      title: "Product Detail",
      key: "name",
      render: (_: any, record: RequestItem) => (
        <div className="py-2">
          <div className="font-black text-gray-800 capitalize leading-tight mb-1">{record.name}</div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-gray-400 tracking-wider uppercase">Current:</span>
            <Tag color="indigo" className="text-[10px] font-black rounded-lg border-0 bg-indigo-50 text-indigo-600 m-0 leading-tight py-0.5 px-2">
              {getStockBreakdown(record.stock, record.boxSize, record.packetSize)}
            </Tag>
          </div>
        </div>
      ),
    },
    {
      title: <span className="text-xs font-black uppercase tracking-widest text-gray-400">Piece</span>,
      key: "piece",
      width: 120,
      render: (_: any, record: RequestItem) => (
        <div className="flex flex-col items-center gap-1 py-1">
          <InputNumber
            value={record.piece}
            onChange={(val) => updateQuantity(record._id, "piece", val ?? 0)}
            className="w-24 rounded-lg font-black"
            min={0}
          />
        </div>
      ),
    },
    {
      title: <span className="text-xs font-black uppercase tracking-widest text-gray-400">Packet</span>,
      key: "packet",
      width: 120,
      render: (_: any, record: RequestItem) => (
        <div className="flex flex-col items-center gap-1 py-1">
          <InputNumber
            value={record.packet}
            onChange={(val) => updateQuantity(record._id, "packet", val ?? 0)}
            className={`w-24 rounded-lg font-black ${!record.packetSize && "opacity-20 select-none pointer-events-none"}`}
            disabled={!record.packetSize}
            min={0}
          />
          {record.packetSize > 0 && (
            <span className="text-[10px] font-black text-gray-300 uppercase tracking-tighter">
              {record.packetSize} / pkt
            </span>
          )}
        </div>
      ),
    },
    {
      title: <span className="text-xs font-black uppercase tracking-widest text-gray-400">Box</span>,
      key: "box",
      width: 120,
      render: (_: any, record: RequestItem) => (
        <div className="flex flex-col items-center gap-1 py-1">
          <InputNumber
            value={record.box}
            onChange={(val) => updateQuantity(record._id, "box", val ?? 0)}
            className={`w-24 rounded-lg font-black ${!record.boxSize && "opacity-20 select-none pointer-events-none"}`}
            disabled={!record.boxSize}
            min={0}
          />
          {record.boxSize > 0 && (
            <span className="text-[10px] font-black text-gray-300 uppercase tracking-tighter">
              {record.boxSize} / box
            </span>
          )}
        </div>
      ),
    },
    {
      title: <span className="text-xs font-black uppercase tracking-widest text-gray-400">Total Units</span>,
      key: "totalUnits",
      width: 120,
      render: (_: any, record: RequestItem) => {
        const total = record.piece + record.packet * record.packetSize + record.box * record.boxSize;
        return (
          <div className="font-mono font-black text-indigo-600 text-sm">
            {total}
          </div>
        );
      },
    },
  ];

  return (
    <main className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-50/50">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <h1 className="text-2xl font-black text-gray-800 tracking-tight leading-tight">
              Supplier Purchase Entry
            </h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
              Record purchase bill from supplier
            </p>
          </div>
          <Button
            onClick={() => navigate("/supplier-purchases")}
            className="h-10 px-5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:text-indigo-600 hover:border-indigo-200"
          >
            View Supplier Purchases
          </Button>
        </div>

        {/* Step 1: Select Supplier */}
        <div className="bg-white rounded-[28px] shadow-sm p-6 sm:p-8 mb-6 border border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <ShopOutlined className="text-lg" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-gray-700 m-0">
                  Step 1: Select Supplier / Party
                </h3>
                <p className="text-xs text-gray-400 m-0">
                  Who did you receive these goods from?
                </p>
              </div>
            </div>

            <Button
              icon={<PlusOutlined />}
              onClick={() => setShowNewSupplierModal(true)}
              className="text-xs font-bold rounded-xl border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50"
            >
              Add New Party
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Select
              showSearch
              placeholder="Search supplier by name or phone..."
              value={selectedSupplierId}
              onChange={(val) => setSelectedSupplierId(val)}
              onSearch={(val) => setSupplierSearch(val)}
              filterOption={false}
              className="w-full sm:w-96 h-12"
              options={filteredSuppliers.map((s) => ({
                value: s._id,
                label: (
                  <div className="flex justify-between items-center py-1">
                    <span className="font-bold text-gray-800">{s.name}</span>
                    <span className="font-mono text-xs text-gray-400">{s.phone}</span>
                  </div>
                ),
              }))}
            />

            {selectedSupplier && (
              <div className="flex items-center gap-4 bg-gray-50 px-4 py-2.5 rounded-2xl border border-gray-100 w-full sm:w-auto">
                <div>
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">
                    Current Pending Market Balance:
                  </span>
                  <span className={`text-sm font-black ${selectedSupplier.outstanding > 0 ? "text-amber-600" : "text-gray-700"}`}>
                    ₹{selectedSupplier.outstanding.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Product Manifest Queue */}
        <div className="bg-white rounded-[28px] shadow-sm p-6 sm:p-8 mb-8 border border-gray-100">
          <div className="flex flex-col items-center mb-8">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">
              Step 2: Search & Add Purchased Items
            </label>
            <div className="w-full sm:w-[500px]">
              <AutoComplete
                className="w-full h-14"
                value={productSearch}
                onChange={(val) => {
                  setProductSearch(val);
                  tryAutoAddProduct(val);
                }}
                onSelect={(productId: string) => {
                  const p = products.find((prod) => prod._id === productId);
                  if (p) addProduct(p);
                }}
                onBlur={() => tryAutoAddProduct(productSearch)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") tryAutoAddProduct(productSearch);
                }}
                placeholder="Scan Barcode or Type Product Name..."
                allowClear
                options={productSuggestions.map((p) => ({
                  value: p._id,
                  label: (
                    <div className="flex justify-between items-center py-2 px-1">
                      <div className="flex flex-col">
                        <span className="font-black text-gray-800 capitalize leading-tight">{p.name}</span>
                        <div className="flex items-center gap-3 mt-1.5 font-mono text-[9px] font-black">
                          <span className="text-indigo-400 uppercase tracking-widest">{p.barcode?.[0]}</span>
                          <span className="text-gray-300">|</span>
                          <span className="text-gray-400">CURRENT STOCK: {p.stock}</span>
                        </div>
                      </div>
                      <Tag color="blue" className="text-[10px] font-bold rounded-lg border-0 m-0">
                        {p.measuring}
                      </Tag>
                    </div>
                  ),
                }))}
              />
            </div>
          </div>

          <div className="bg-white rounded-[24px] border border-gray-100 overflow-hidden shadow-sm">
            <Table
              columns={columns}
              dataSource={requestList}
              rowKey="_id"
              pagination={false}
              size="middle"
              scroll={{ x: 750 }}
              locale={{
                emptyText: (
                  <div className="py-20 flex flex-col items-center justify-center grayscale opacity-35">
                    <ExclamationCircleOutlined className="text-4xl text-gray-300 mb-4" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em]">
                      No products added to bill yet
                    </p>
                  </div>
                ),
              }}
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4 pt-4 border-t border-gray-50">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              {requestList.length} unique items selected
            </span>
            <div className="flex gap-4">
              <Button
                onClick={() => setRequestList([])}
                disabled={requestList.length === 0 || submitting}
                className="h-12 px-6 rounded-xl border border-gray-200 text-xs font-bold text-gray-500 hover:text-red-500"
              >
                Clear Queue
              </Button>
              <Button
                type="primary"
                loading={submitting}
                onClick={handleSubmit}
                disabled={requestList.length === 0 || !selectedSupplierId}
                className="h-12 px-10 bg-indigo-600 hover:bg-indigo-700 border-none rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-100"
              >
                Raise Purchase Request
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* New Supplier Modal */}
      <Modal
        open={showNewSupplierModal}
        onCancel={() => setShowNewSupplierModal(false)}
        footer={null}
        centered
        title={<span className="font-black text-base">Add New Party / Supplier</span>}
      >
        <Form
          form={newSupplierForm}
          layout="vertical"
          onFinish={handleCreateSupplier}
          className="pt-4"
        >
          <Form.Item
            name="name"
            label={<span className="font-bold text-xs uppercase tracking-wider text-gray-500">Party Name</span>}
            rules={[{ required: true, message: "Please enter party name" }]}
          >
            <Input placeholder="e.g. Ramesh Trading Co." className="h-11 rounded-xl" />
          </Form.Item>

          <Form.Item
            name="phone"
            label={<span className="font-bold text-xs uppercase tracking-wider text-gray-500">Phone Number</span>}
            rules={[{ required: true, message: "Please enter phone number" }]}
          >
            <Input placeholder="e.g. 9876543210" className="h-11 rounded-xl font-mono" />
          </Form.Item>

          <Form.Item
            name="address"
            label={<span className="font-bold text-xs uppercase tracking-wider text-gray-500">Address / City</span>}
          >
            <Input.TextArea placeholder="e.g. Wholesale Market, Surat" rows={2} className="rounded-xl" />
          </Form.Item>

          <Form.Item
            name="outstanding"
            label={<span className="font-bold text-xs uppercase tracking-wider text-gray-500">Opening Balance (Pending Payment to them)</span>}
          >
            <InputNumber min={0} placeholder="0" className="w-full h-11 rounded-xl font-mono" />
          </Form.Item>

          <div className="flex justify-end gap-3 mt-6">
            <Button onClick={() => setShowNewSupplierModal(false)} className="rounded-xl">
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

      {/* Success Modal */}
      <Modal
        open={showSuccessModal}
        onCancel={() => setShowSuccessModal(false)}
        footer={null}
        centered
        className="text-center"
        width={420}
      >
        <div className="py-8">
          <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-green-100">
            <CheckCircleOutlined className="text-3xl text-green-500" />
          </div>
          <h2 className="text-xl font-black text-gray-800 tracking-tight mb-2">
            Purchase Bill Saved Successfully
          </h2>
          <p className="text-xs text-gray-400 font-medium px-4 mb-8">
            Your purchase entry has been recorded. It can now be verified and approved.
          </p>
          <div className="flex gap-3">
            <Button
              onClick={() => {
                setShowSuccessModal(false);
                setSelectedSupplierId(null);
              }}
              className="h-11 flex-1 rounded-xl font-bold text-xs"
            >
              Raise Another
            </Button>
            <Button
              type="primary"
              onClick={() => {
                setShowSuccessModal(false);
                navigate("/supplier-purchases");
              }}
              className="h-11 flex-1 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold text-xs"
            >
              View Verification
            </Button>
          </div>
        </div>
      </Modal>
    </main>
  );
};

export default RaiseSupplierPurchase;

