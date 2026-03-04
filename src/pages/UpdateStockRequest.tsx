import { useState, useMemo } from "react";
import {
  Card,
  Input,
  Button,
  Table,
  InputNumber,
  message,
  Modal,
  Select,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import useProductStore from "../store/product.store";
import apiCaller from "../utils/apiCaller";

const UpdateStockRequest = () => {
  const { products } = useProductStore();
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState<number>(0);
  const [requestList, setRequestList] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const filteredProducts = useMemo(() => {
    if (!search) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.barcode.some((b: any) => String(b).includes(search))
    );
  }, [products, search]);

  const handleAddProduct = () => {
    if (!selectedProduct || quantity <= 0) {
      message.error("Select a product and enter a valid quantity");
      return;
    }
    if (requestList.some((item) => item._id === selectedProduct._id)) {
      message.error("Product already added");
      return;
    }
    setRequestList([...requestList, { ...selectedProduct, quantity }]);
    setSelectedProduct(null);
    setQuantity(0);
    setSearch("");
  };

  const handleRemove = (id: string) => {
    setRequestList(requestList.filter((item) => item._id !== id));
  };

  const handleSubmitRequest = async () => {
    if (requestList.length === 0) {
      message.error("Add at least one product to the request");
      return;
    }
    setSubmitting(true);
    try {
      await apiCaller.post("/stocks/requests", {
        items: requestList.map((item) => ({
          id: item._id,
          quantity: item.quantity,
        })),
      });
      message.success("Stock update request submitted to admin");
      setRequestList([]);
      setShowModal(true);
    } catch {
      message.error("Failed to submit request");
    }
    setSubmitting(false);
  };

  const columns = [
    { title: "Name", dataIndex: "name", key: "name" },
    {
      title: "Barcode",
      dataIndex: "barcode",
      key: "barcode",
      render: (b: any[]) => b[0],
    },
    { title: "Current Stock", dataIndex: "stock", key: "stock" },
    { title: "Quantity", dataIndex: "quantity", key: "quantity" },
    {
      title: "",
      key: "remove",
      render: (_: any, record: any) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemove(record._id)}
        />
      ),
    },
  ];

  return (
    <main className="min-h-screen bg-white flex items-center justify-center p-4">
      <Card className="shadow-lg border border-gray-100 min-w-[350px] max-w-2xl w-full">
        <h1 className="text-2xl font-bold text-center mb-6">
          Raise Stock Update Request
        </h1>
        <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-between">
          <Input.Search
            placeholder="Search product by name or barcode"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
            allowClear
          />
          <Select
            showSearch
            value={selectedProduct?._id || undefined}
            placeholder="Select product"
            style={{ width: 220 }}
            filterOption={false}
            onSearch={setSearch}
            onChange={(id) => {
              const prod = products.find((p) => p._id === id);
              setSelectedProduct(prod);
              setSearch(prod?.name || "");
            }}
            options={filteredProducts.map((p) => ({
              value: p._id,
              label: p.name,
            }))}
          />
          <InputNumber
            min={1}
            value={quantity}
            onChange={(v) => setQuantity(v ?? 0)}
            placeholder="Quantity"
            className="w-32"
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddProduct}
          >
            Add
          </Button>
        </div>
        <Table
          columns={columns}
          dataSource={requestList}
          rowKey="_id"
          pagination={false}
          className="mb-6"
        />
        <div className="flex justify-end">
          <Button
            type="primary"
            onClick={handleSubmitRequest}
            loading={submitting}
            icon={<ExclamationCircleOutlined />}
            disabled={requestList.length === 0}
          >
            Submit Request
          </Button>
        </div>
      </Card>
      <Modal
        open={showModal}
        onCancel={() => setShowModal(false)}
        footer={null}
        centered
        title="Request Submitted"
      >
        <p>
          Your stock update request has been sent to the admin for approval.
        </p>
        <Button type="primary" onClick={() => setShowModal(false)}>
          OK
        </Button>
      </Modal>
    </main>
  );
};

export default UpdateStockRequest;
