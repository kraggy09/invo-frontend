import { useState, useMemo, useCallback, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import {
  Button,
  InputNumber,
  message as antdMessage,
  Modal,
  Tag,
  Typography,
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
import useProductStore from "../store/product.store";
import useSupplierStore from "../store/supplier.store";
import apiCaller from "../utils/apiCaller";

const { Title } = Typography;

function getStockBreakdown(
  stock: number,
  boxSize?: number,
  packetSize?: number,
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

const UpdateStock = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { products } = useProductStore();
  const { suppliers } = useSupplierStore();

  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(
    (location.state as any)?.supplierId || null,
  );
  const [supplierSearch, setSupplierSearch] = useState("");
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [requestList, setRequestList] = useState<RequestItem[]>([]);
  const [messageApi, contextHolder] = antdMessage.useMessage();

  // Quick add supplier modal
  const [showNewSupplierModal, setShowNewSupplierModal] = useState(false);
  const [newSupplierForm] = Form.useForm();
  const [creatingSupplier, setCreatingSupplier] = useState(false);

  const filteredSuppliers = useMemo(() => {
    if (!supplierSearch) return suppliers;
    const lower = supplierSearch.toLowerCase();
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(lower) ||
        s.phone.toLowerCase().includes(lower),
    );
  }, [suppliers, supplierSearch]);

  const selectedSupplier = suppliers.find((s) => s._id === selectedSupplierId);

  const suggestions = useMemo(() => {
    if (!search) return [];
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.barcode.some((b: any) => String(b).includes(search)),
    );
  }, [search, products]);

  const addProduct = useCallback(
    (product: any) => {
      if (requestList.find((item) => item._id === product._id)) {
        messageApi.warning("Product is already in the list");
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
      setSearch("");
    },
    [requestList, messageApi],
  );

  useEffect(() => {
    const stateObj = location.state as any;
    if (stateObj?.supplierId) {
      setSelectedSupplierId(stateObj.supplierId);
    }
    const incomingProd = stateObj?.product || stateObj;
    if (incomingProd && incomingProd._id) {
      addProduct(incomingProd);
    } else if (id && products.length > 0) {
      const p = products.find((prod) => prod._id === id);
      if (p) addProduct(p);
    }
  }, [location.state, id, products, addProduct]);

  const tryAutoAddProduct = useCallback(
    (value: string) => {
      if (!value.trim()) return;
      const lower = value.trim().toLowerCase();
      const matchedProducts = products.filter(
        (p) =>
          p.name.toLowerCase().includes(lower) ||
          p.barcode.some((b: any) => String(b).toLowerCase() === lower),
      );
      if (matchedProducts.length === 1) {
        addProduct(matchedProducts[0]);
      }
    },
    [products, addProduct],
  );

  const handleChange = (value: string) => {
    setSearch(value);
    tryAutoAddProduct(value);
  };

  const handleSelect = (productId: string) => {
    const product = products.find((p) => p._id === productId);
    if (product) {
      addProduct(product);
    }
  };

  const handleBlur = () => {
    tryAutoAddProduct(search);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      tryAutoAddProduct(search);
    }
  };

  const updateQuantity = (
    id: string,
    field: "piece" | "packet" | "box",
    value: number,
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
        messageApi.success("Supplier registered successfully!");
        setSelectedSupplierId(res.data.data.supplier._id);
        setShowNewSupplierModal(false);
        newSupplierForm.resetFields();
      }
    } catch (err: any) {
      console.error(err);
      messageApi.error(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          "Failed to create supplier",
      );
    } finally {
      setCreatingSupplier(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedSupplierId) {
      messageApi.error(
        "Please select from which supplier/party you received the items.",
      );
      return;
    }

    if (requestList.length === 0) {
      messageApi.error("Enter quantity for at least one product.");
      return;
    }

    const allProductsValid = requestList.every(
      (item) => item.packet !== 0 || item.box !== 0 || item.piece !== 0,
    );

    if (!allProductsValid) {
      messageApi.error("Please enter a valid quantity for each product.");
      return;
    }

    const payLoad = requestList.map((item) => {
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
        products: payLoad,
      });

      messageApi.success("Stock inward request submitted to acceptor/admin!");
      setRequestList([]);
      setShowModal(true);
    } catch (err: any) {
      console.error(err);
      messageApi.error(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          "Submission failed.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: "",
      key: "delete",
      width: 50,
      render: (_: any, record: RequestItem) => (
        <Button
          tabIndex={-1}
          type="text"
          danger
          icon={<DeleteOutlined tabIndex={-1} />}
          onClick={() => removeProduct(record._id)}
        />
      ),
    },
    {
      title: "Product Detail",
      key: "name",
      render: (_: any, record: RequestItem) => (
        <div className="py-2">
          <div className="font-black text-gray-800 capitalize leading-tight mb-1">
            {record.name}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-gray-400 tracking-wider uppercase">
              Current:
            </span>
            <Tag
              color="indigo"
              className="text-[10px] font-black rounded-lg border-0 bg-indigo-50 text-indigo-600 m-0 leading-tight py-0.5 px-2"
            >
              {getStockBreakdown(
                record.stock,
                record.boxSize,
                record.packetSize,
              )}
            </Tag>
          </div>
        </div>
      ),
    },
    {
      title: (
        <span className="text-xs font-black uppercase tracking-widest text-gray-400">
          Piece
        </span>
      ),
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
      title: (
        <span className="text-xs font-black uppercase tracking-widest text-gray-400">
          Packet
        </span>
      ),
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
      title: (
        <span className="text-xs font-black uppercase tracking-widest text-gray-400">
          Box
        </span>
      ),
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
      title: (
        <span className="text-xs font-black uppercase tracking-widest text-gray-400">
          Total Units
        </span>
      ),
      key: "totalUnits",
      width: 120,
      render: (_: any, record: RequestItem) => {
        const total =
          record.piece +
          record.packet * record.packetSize +
          record.box * record.boxSize;
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
        {contextHolder}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <h1 className="text-2xl font-black text-gray-800 tracking-tight leading-tight">
              Add Stock
            </h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
              Select Supplier & Add Received Stock
            </p>
          </div>
        </div>

        {/* Supplier Selection Panel */}
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
                  From which party did you receive this stock?
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
                    <span className="font-mono text-xs text-gray-400">
                      {s.phone}
                    </span>
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
                  <span
                    className={`text-sm font-black ${selectedSupplier.outstanding > 0 ? "text-amber-600" : "text-gray-700"}`}
                  >
                    ₹{selectedSupplier.outstanding.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Product Selection Panel */}
        <div className="bg-white rounded-[32px] shadow-sm p-6 sm:p-10 mb-8 border border-gray-100">
          <div className="flex flex-col items-center mb-10">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">
              Step 2: Global SKU Lookup & Quantity Breakdown
            </label>
            <div className="w-full sm:w-[500px] relative group">
              <AutoComplete
                className="w-full h-14"
                value={search}
                onChange={handleChange}
                onSelect={handleSelect}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                placeholder="Scan Barcode or Type Product Name..."
                allowClear
                options={suggestions.map((p) => ({
                  value: p._id,
                  label: (
                    <div className="flex justify-between items-center py-2 px-1">
                      <div className="flex flex-col">
                        <span className="font-black text-gray-800 capitalize leading-tight">
                          {p.name}
                        </span>
                        <div className="flex items-center gap-3 mt-1.5 font-mono text-[9px] font-black">
                          <span className="text-indigo-400 uppercase tracking-widest">
                            {p.barcode?.[0]}
                          </span>
                          <span className="text-gray-300">|</span>
                          <span className="text-gray-400">
                            STOCK: {p.stock} {p.measuring}
                          </span>
                        </div>
                      </div>
                      <Tag
                        color="blue"
                        className="text-[10px] font-bold rounded-lg border-0 m-0"
                      >
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
              scroll={{ x: 800 }}
              className="modern-table no-border-table"
              locale={{
                emptyText: (
                  <div className="py-24 flex flex-col items-center justify-center grayscale opacity-30">
                    <ExclamationCircleOutlined className="text-5xl text-gray-300 mb-6" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
                      No products added yet
                    </p>
                  </div>
                ),
              }}
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center mt-10 gap-4 pt-4 border-t border-gray-50">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              {requestList.length} items added
            </span>
            <div className="flex gap-4">
              <Button
                onClick={() => setRequestList([])}
                disabled={requestList.length === 0 || submitting}
                className="h-14 font-black px-8 rounded-2xl border-2 border-gray-50 text-[10px] font-black tracking-widest text-gray-400 hover:border-red-100 hover:text-red-500 transition-all uppercase"
              >
                Clear List
              </Button>
              <Button
                type="primary"
                loading={submitting}
                onClick={handleSubmit}
                disabled={requestList.length === 0 || !selectedSupplierId}
                className="h-14 bg-indigo-600 border-none font-black px-12 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 text-[10px] tracking-widest uppercase"
              >
                RAISE INWARD REQUEST
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
        title={
          <span className="font-black text-base">Add New Party / Supplier</span>
        }
      >
        <Form
          form={newSupplierForm}
          layout="vertical"
          onFinish={handleCreateSupplier}
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
              placeholder="e.g. Balaji Traders"
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
              placeholder="e.g. Surat, Gujarat"
              rows={2}
              className="rounded-xl"
            />
          </Form.Item>

          <Form.Item
            name="outstanding"
            label={
              <span className="font-bold text-xs uppercase tracking-wider text-gray-500">
                Opening Balance (Pending Payment to them)
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
              onClick={() => setShowNewSupplierModal(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={creatingSupplier}
              className="bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold"
            >
              Save Party
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Success Modal */}
      <Modal
        open={showModal}
        onCancel={() => setShowModal(false)}
        footer={null}
        centered
        className="premium-modal text-center"
        width={420}
        title={null}
      >
        <div className="py-10">
          <div className="w-20 h-20 bg-green-50 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-inner border border-green-100">
            <CheckCircleOutlined className="text-3xl text-green-600" />
          </div>
          <h2 className="text-xl font-black text-gray-800 tracking-tight leading-tight mb-2 uppercase">
            Inward Request Dispatched
          </h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-10 px-6">
            Your stock update request with party details has been submitted for
            cost verification and admin approval.
          </p>
          <Button
            type="primary"
            onClick={() => setShowModal(false)}
            className="h-12 w-full bg-indigo-600 hover:bg-indigo-700 border-none rounded-2xl font-black text-[10px] tracking-widest uppercase"
          >
            Done
          </Button>
        </div>
      </Modal>
    </main>
  );
};

export default UpdateStock;
