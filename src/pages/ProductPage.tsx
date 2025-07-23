import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useProductStore from "../store/product.store";
import useCategoriesStore from "../store/categories.store";
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Tag,
  Modal,
  message,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BarcodeOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import apiCaller from "../utils/apiCaller";

const ACCENT = "#2563eb";

const ProductPage = () => {
  const navigate = useNavigate();
  const { products, setProducts } = useProductStore();
  const { categories } = useCategoriesStore();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState<string>("name");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    product?: any;
  }>({ open: false });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const res = await apiCaller.get("/products/all");
        setProducts(res.data.products || []);
      } catch {
        message.error("Failed to fetch products");
      }
      setLoading(false);
    }
    if (products.length === 0) fetchProducts();
  }, [setProducts, products.length]);

  const filteredProducts = useMemo(() => {
    let arr = [...products];
    if (category !== "all") arr = arr.filter((p) => p.category === category);
    if (search) {
      arr = arr.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.barcode.some((b: any) => String(b).includes(search))
      );
    }
    if (sort === "name") arr = arr.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "stock") arr = arr.sort((a, b) => a.stock - b.stock);
    return arr;
  }, [products, search, category, sort]);

  const pageSize = 10;
  const pagedProducts = useMemo(
    () =>
      filteredProducts.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
      ),
    [filteredProducts, currentPage]
  );

  const totalStockValue = useMemo(() => {
    return filteredProducts.reduce((acc, p) => acc + p.stock * p.costPrice, 0);
  }, [filteredProducts]);

  const handleDelete = async (product: any) => {
    setLoading(true);
    try {
      await apiCaller.delete(`/products/delete/${product._id}`);
      setProducts(products.filter((p) => p._id !== product._id));
      message.success("Product deleted");
    } catch {
      message.error("Failed to delete product");
    }
    setLoading(false);
    setDeleteModal({ open: false });
  };

  const columns = [
    {
      title: "Barcode",
      dataIndex: "barcode",
      key: "barcode",
      render: (barcodes: any[], record: any) => (
        <div>
          <Button
            type="text"
            icon={<BarcodeOutlined />}
            onClick={() => navigate(`/products/barcode/${barcodes[0]}`)}
          >
            {barcodes[0]}
          </Button>
          {barcodes.length > 1 && (
            <Tag color="gold" className="ml-2">
              +{barcodes.length - 1}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: any) => (
        <span
          className="font-semibold capitalize text-blue-700 cursor-pointer hover:underline"
          onClick={() => navigate(`/products/${record._id}`, { state: record })}
        >
          {name}
        </span>
      ),
    },
    {
      title: "MRP",
      dataIndex: "mrp",
      key: "mrp",
      render: (v: number) => `₹${v}`,
    },
    {
      title: "CP",
      dataIndex: "costPrice",
      key: "costPrice",
      render: (v: number) => `₹${v}`,
    },
    {
      title: "RP",
      dataIndex: "retailPrice",
      key: "retailPrice",
      render: (v: number) => `₹${v}`,
    },
    {
      title: "WP",
      dataIndex: "wholesalePrice",
      key: "wholesalePrice",
      render: (v: number) => `₹${v}`,
    },
    {
      title: "SWP",
      dataIndex: "superWholesalePrice",
      key: "superWholesalePrice",
      render: (v: number) => `₹${v}`,
    },
    {
      title: "Stock",
      dataIndex: "stock",
      key: "stock",
      render: (v: number, record: any) => (
        <span
          className={`px-2 rounded-lg font-semibold ${
            v <= record.minQuantity ? "bg-red-500 text-white" : ""
          }`}
          onClick={() =>
            navigate(`/products/updateStock/${record._id}`, { state: record })
          }
          style={{ cursor: "pointer" }}
        >
          {record.measuring === "kg" ? v.toFixed(2) : v}
        </span>
      ),
    },
    { title: "Packet", dataIndex: "packet", key: "packet" },
    { title: "Box", dataIndex: "box", key: "box" },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (cat: string) => <span className="capitalize">{cat}</span>,
    },
    {
      title: "",
      key: "actions",
      render: (_: any, record: any) => (
        <div className="flex gap-2">
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() =>
                navigate(`/products/${record._id}`, { state: record })
              }
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => setDeleteModal({ open: true, product: record })}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <main className="min-h-screen bg-white p-4 md:p-10">
      <Card
        className="mb-6 shadow-md border border-gray-100"
        bodyStyle={{ padding: 24 }}
      >
        {/* Horizontal Category Filter Bar */}
        <div className="w-full overflow-x-auto mb-6 pb-2">
          <div className="flex gap-2 whitespace-nowrap">
            <Tag.CheckableTag
              checked={category === "all"}
              onChange={() => {
                setCategory("all");
                setCurrentPage(1);
              }}
              style={{
                fontWeight: category === "all" ? 700 : 500,
                fontSize: 16,
                padding: "6px 18px",
                borderRadius: 20,
                background: category === "all" ? ACCENT : "#f5f5f5",
                color: category === "all" ? "#fff" : "#222",
                border:
                  category === "all"
                    ? `1.5px solid ${ACCENT}`
                    : "1.5px solid #e5e7eb",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              All
            </Tag.CheckableTag>
            {categories.map((cat) => (
              <Tag.CheckableTag
                key={cat.name}
                checked={category === cat.name}
                onChange={() => {
                  setCategory(cat.name);
                  setCurrentPage(1);
                }}
                style={{
                  fontWeight: category === cat.name ? 700 : 500,
                  fontSize: 16,
                  padding: "6px 18px",
                  borderRadius: 20,
                  background: category === cat.name ? ACCENT : "#f5f5f5",
                  color: category === cat.name ? "#fff" : "#222",
                  border:
                    category === cat.name
                      ? `1.5px solid ${ACCENT}`
                      : "1.5px solid #e5e7eb",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {cat.name}
              </Tag.CheckableTag>
            ))}
          </div>
        </div>
        {/* Search and Sort Controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex gap-2 items-center">
            <Input.Search
              placeholder="Search by name or barcode"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              allowClear
              className="w-56"
            />
            <Select
              value={sort}
              onChange={setSort}
              style={{ width: 120 }}
              options={[
                { value: "name", label: "Sort by Name" },
                { value: "stock", label: "Sort by Stock" },
              ]}
            />
          </div>
          <div className="flex gap-4 items-center">
            <span className="text-lg font-semibold">
              Stock Value:{" "}
              <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">
                {totalStockValue.toFixed(2)}
              </span>
            </span>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              style={{ background: ACCENT }}
              onClick={() => navigate("/newProduct")}
            >
              Add Product
            </Button>
            <Button
              type="default"
              onClick={() => navigate("/products/updateStock")}
            >
              Update Stock
            </Button>
          </div>
        </div>
      </Card>
      <Card className="shadow-md border border-gray-100">
        <Table
          columns={columns}
          dataSource={pagedProducts}
          rowKey="_id"
          pagination={{
            current: currentPage,
            pageSize,
            total: filteredProducts.length,
            onChange: setCurrentPage,
            showSizeChanger: false,
          }}
        />
      </Card>
      <Modal
        open={deleteModal.open}
        onCancel={() => setDeleteModal({ open: false })}
        onOk={() => handleDelete(deleteModal.product)}
        okText="Delete"
        okType="danger"
        cancelText="Cancel"
        centered
        title={
          <span>
            <ExclamationCircleOutlined className="text-red-500 mr-2" />
            Delete Product
          </span>
        }
      >
        <div>
          <p>
            Are you sure you want to delete <b>{deleteModal.product?.name}</b>?
          </p>
          <p>Stock: {deleteModal.product?.stock}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {deleteModal.product?.barcode?.map((b: any) => (
              <Tag color="green" key={b}>
                {b}
              </Tag>
            ))}
          </div>
        </div>
      </Modal>
    </main>
  );
};

export default ProductPage;
