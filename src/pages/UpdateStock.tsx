import { useState, useMemo, useCallback } from "react";
import {
  Card,
  Button,
  InputNumber,
  message as antdMessage,
  Modal,
  Tag,
  Typography,
  AutoComplete,
  Table,
} from "antd";
import { ExclamationCircleOutlined, DeleteOutlined } from "@ant-design/icons";
import useProductStore from "../store/product.store";
import apiCaller from "../utils/apiCaller";

const { Title } = Typography;

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

const UpdateStock = () => {
  const { products } = useProductStore();
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [requestList, setRequestList] = useState<RequestItem[]>([]);
  const [messageApi, contextHolder] = antdMessage.useMessage();

  const suggestions = useMemo(() => {
    if (!search) return [];
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.barcode.some((b: any) => String(b).includes(search))
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
    [requestList]
  );

  const tryAutoAddProduct = useCallback(
    (value: string) => {
      const lower = value.trim().toLowerCase();
      const matched = products.find(
        (p) =>
          p.name.toLowerCase() === lower ||
          p.barcode.some((b: any) => String(b).toLowerCase() === lower)
      );
      if (matched) {
        addProduct(matched);
      }
    },
    [products, addProduct]
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
    value: number
  ) => {
    setRequestList((list) =>
      list.map((item) => (item._id === id ? { ...item, [field]: value } : item))
    );
  };

  const removeProduct = (id: string) => {
    setRequestList((list) => list.filter((item) => item._id !== id));
  };

  const handleSubmit = async () => {
    console.log(requestList, "This is the request list");
    const allProductsValid = requestList.every(
      (item) => item.packet !== 0 || item.box !== 0 || item.piece !== 0
    );
    console.log(allProductsValid, "Are all products valid?");

    if (!allProductsValid) {
      messageApi.error("Please enter a valid quantity for each product.");
      return;
    }

    const validItems = requestList.filter(
      (item) => item.piece !== 0 || item.packet !== 0 || item.box !== 0
    );
    if (validItems.length === 0) {
      messageApi.error("Enter quantity for at least one product.");
      return;
    }

    const payLoad = validItems.map((item) => {
      const totalQuantity =
        item.piece + item.packet * item.packetSize + item.box * item.boxSize;
      if (totalQuantity === 0) {
        messageApi.error(
          `Invalid quantity for ${item.name}. Please enter a valid quantity.`
        );
        return null;
      }
      return {
        id: item._id,
        quantity: totalQuantity,
      };
    });
    console.log(payLoad, "This is the payload to be sent");

    setSubmitting(true);
    try {
      await apiCaller.post("/stocks/requests", {
        products: payLoad,
      });
      messageApi.success("Request submitted successfully!");
      setRequestList([]);
      setShowModal(true);
    } catch (err: any) {
      console.error(err);
      messageApi.error(err?.response?.data?.message || err?.response?.data?.msg || "Submission failed.");
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
          />
          {record.boxSize > 0 && (
            <span className="text-[10px] font-black text-gray-300 uppercase tracking-tighter">
              {record.boxSize} / box
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <main className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-50/50">
      <div className="max-w-6xl mx-auto">
        {contextHolder}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-2xl font-black text-gray-800 tracking-tight leading-tight">Stock Logistics</h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Multi-Node Inventory Adjustment Terminal</p>
          </div>
        </div>

        <div className="bg-white rounded-[32px] shadow-sm p-6 sm:p-10 mb-8 border border-gray-100">
          <div className="flex flex-col items-center mb-10">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Global SKU Lookup</label>
            <div className="w-full sm:w-[500px] relative group">
              <AutoComplete
                className="w-full h-14"
                value={search}
                onChange={handleChange}
                onSelect={handleSelect}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                placeholder="Scan Registry or Type Identifier..."
                allowClear
                autoFocus
                options={suggestions.map((p) => ({
                  value: p._id,
                  label: (
                    <div className="flex justify-between items-center py-2 px-1">
                      <div className="flex flex-col">
                        <span className="font-black text-gray-800 capitalize leading-tight">{p.name}</span>
                        <div className="flex items-center gap-3 mt-1.5 font-mono text-[9px] font-black">
                          <span className="text-indigo-400 uppercase tracking-widest">{p.barcode?.[0]}</span>
                          <span className="text-gray-300">|</span>
                          <span className="text-gray-400">STOCK: {p.stock} {p.measuring}</span>
                        </div>
                      </div>
                      {p.mrp !== undefined && (
                        <div className="flex flex-col items-end ml-4 shrink-0">
                          <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">MRP</span>
                          <span className="font-black text-indigo-600 text-sm">₹{p.mrp}</span>
                        </div>
                      )}
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
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Adjustment Queue Manifested Empty</p>
                  </div>
                )
              }}
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end mt-10 gap-4">
            <Button
              onClick={() => setRequestList([])}
              disabled={requestList.length === 0 || submitting}
              className="h-14 font-black px-8 rounded-2xl border-2 border-gray-50 text-[10px] font-black tracking-widest text-gray-400 hover:border-red-100 hover:text-red-500 transition-all uppercase order-2 sm:order-1"
            >
              PURGE QUEUE
            </Button>
            <Button
              type="primary"
              loading={submitting}
              onClick={handleSubmit}
              disabled={requestList.length === 0}
              className="h-14 bg-indigo-600 border-none font-black px-12 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 order-1 sm:order-2 text-[10px] tracking-widest uppercase"
            >
              COMMIT ADJUSTMENTS
            </Button>
          </div>
        </div>
      </div>

      <Modal
        open={showModal}
        onCancel={() => setShowModal(false)}
        footer={null}
        centered
        className="premium-modal text-center"
        width={400}
        title={null}
      >
        <div className="py-10">
          <div className="w-20 h-20 bg-green-50 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-inner border border-green-100">
            <ExclamationCircleOutlined className="text-3xl text-green-600 rotate-180" />
          </div>
          <h2 className="text-xl font-black text-gray-800 tracking-tight leading-tight mb-2 uppercase">Logistics Synchronized</h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-10 px-8">Your stock update request has been successfully committed to the verification queue.</p>
          <Button
            type="primary"
            onClick={() => setShowModal(false)}
            className="h-12 w-full bg-indigo-600 hover:bg-indigo-700 border-none rounded-2xl font-black text-[10px] tracking-widest uppercase"
          >
            DISMISS TERMINAL
          </Button>
        </div>
      </Modal>

      <style>{`
        .modern-table .ant-table-thead > tr > th { 
          background: #f8fafc !important; 
          border-bottom: 1px solid #f1f5f9 !important;
          padding: 1.25rem !important;
        }
        .modern-table .ant-table-tbody > tr > td { 
          padding: 1rem 1.25rem !important;
          border-bottom: 1px solid #f8fafc !important;
        }
        .modern-table .ant-table-row:hover > td { background: #f8fafc !important; }
        .no-border-table .ant-table { background: transparent !important; }
      `}</style>
    </main>
  );
};

export default UpdateStock;
