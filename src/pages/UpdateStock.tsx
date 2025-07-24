import { useState, useMemo, useCallback } from "react";
import {
  Card,
  Button,
  InputNumber,
  message,
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
  if (boxSize && boxSize > 0) {
    box = Math.floor(stock / boxSize);
    stock = stock % boxSize;
  }
  if (packetSize && packetSize > 0) {
    packet = Math.floor(stock / packetSize);
    stock = stock % packetSize;
  }
  piece = stock;
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
  const [messageApi, contextHolder] = message.useMessage();

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
      (item) => item.packet > 0 || item.box > 0 || item.piece > 0
    );
    console.log(allProductsValid, "Are all products valid?");

    if (!allProductsValid) {
      messageApi.error("Please enter a valid quantity for each product.");
      return;
    }

    const validItems = requestList.filter(
      (item) => item.piece > 0 || item.packet > 0 || item.box > 0
    );
    if (validItems.length === 0) {
      messageApi.error("Enter quantity for at least one product.");
      return;
    }

    const payLoad = validItems.map((item) => {
      const totalQuantity =
        item.piece + item.packet * item.packetSize + item.box * item.boxSize;
      if (totalQuantity <= 0) {
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
      await apiCaller.post("/products/raise-stock-requests", {
        products: payLoad,
      });
      messageApi.success("Request submitted successfully!");
      setRequestList([]);
      setShowModal(true);
    } catch (err: any) {
      console.error(err);
      messageApi.error(err.response.data.msg || "Submission failed.");
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
      title: "Product",
      key: "name",
      render: (_: any, record: RequestItem) => (
        <div>
          <div className="font-medium capitalize">{record.name}</div>
          <Tag color="processing" className="mt-1 text-xs">
            Stock:{" "}
            {getStockBreakdown(record.stock, record.boxSize, record.packetSize)}
          </Tag>
        </div>
      ),
    },
    {
      title: "Piece",
      key: "piece",
      width: 100,
      render: (_: any, record: RequestItem) => (
        <div className="flex flex-col items-center">
          <InputNumber
            min={0}
            value={record.piece}
            onChange={(val) => updateQuantity(record._id, "piece", val ?? 0)}
            className="w-20"
          />
          {/* Empty span for alignment with Packet/Box */}
          <span
            className="text-xs text-gray-500 mt-1 text-center"
            style={{ visibility: "hidden" }}
          >
            0 /piece
          </span>
        </div>
      ),
    },
    {
      title: "Packet",
      key: "packet",
      width: 100,
      render: (_: any, record: RequestItem) => (
        <div className="flex flex-col items-center">
          <InputNumber
            min={0}
            value={record.packet}
            onChange={(val) => updateQuantity(record._id, "packet", val ?? 0)}
            className="w-20"
          />
          <span className="text-xs text-gray-500 mt-1 text-center">
            {record.packetSize ? `${record.packetSize} /packet` : "\u00A0"}
          </span>
        </div>
      ),
    },
    {
      title: "Box",
      key: "box",
      width: 100,
      render: (_: any, record: RequestItem) => (
        <div className="flex flex-col items-center">
          <InputNumber
            min={0}
            value={record.box}
            onChange={(val) => updateQuantity(record._id, "box", val ?? 0)}
            className="w-20"
          />
          <span className="text-xs text-gray-500 mt-1 text-center">
            {record.boxSize ? `${record.boxSize} /box` : "\u00A0"}
          </span>
        </div>
      ),
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50 p-6 flex justify-center items-start">
      {contextHolder}
      <Card
        className="w-full max-w-5xl shadow-lg"
        bordered
        bodyStyle={{ padding: "24px 24px 0 24px" }}
      >
        <Title level={3} className="text-center mb-6">
          Update Product Stock
        </Title>

        <div className="flex justify-center mb-6">
          <AutoComplete
            style={{ width: 400 }}
            value={search}
            onChange={handleChange}
            onSelect={handleSelect}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder="🔍 Enter product name or barcode"
            allowClear
            autoFocus
            options={suggestions.map((p) => ({
              value: p._id,
              label: (
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{p.name}</span>
                  <span className="text-xs text-gray-500">
                    {p.barcode?.[0]}
                  </span>
                </div>
              ),
            }))}
          />
        </div>

        <Table
          columns={columns}
          dataSource={requestList}
          rowKey="_id"
          pagination={false}
          bordered
          size="middle"
          className="mb-6"
          scroll={{ y: 350 }}
          locale={{ emptyText: "No products added yet." }}
        />

        <div className="flex justify-end mt-4 mb-6">
          <Button
            type="primary"
            icon={<ExclamationCircleOutlined />}
            loading={submitting}
            onClick={handleSubmit}
            size="large"
            disabled={requestList.length === 0}
          >
            Submit Stock Request
          </Button>
        </div>
      </Card>

      <Modal
        open={showModal}
        onCancel={() => setShowModal(false)}
        footer={null}
        title="✅ Request Submitted"
        centered
      >
        <p>
          Your stock update request was successfully submitted for admin
          approval.
        </p>
        <div className="text-right">
          <Button type="primary" onClick={() => setShowModal(false)}>
            OK
          </Button>
        </div>
      </Modal>
    </main>
  );
};

export default UpdateStock;
