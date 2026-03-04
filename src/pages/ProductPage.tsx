import { useMemo, useState } from "react";
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
import { convertToGramorKG, formatIndianNumber } from "../utils";

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
      await apiCaller.delete(`/products/${product._id}`);
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
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Identification</span>,
      key: "id",
      fixed: "left" as const,
      width: 180,
      render: (record: any) => (
        <div className="flex flex-col">
          <span
            className="font-black text-indigo-600 truncate cursor-pointer hover:text-indigo-800 transition-colors"
            onClick={() => navigate(`/products/${record._id}`, { state: record })}
          >
            {record.name}
          </span>
          <span className="text-[10px] font-bold text-gray-400 font-mono tracking-tighter">
            {record.barcode[0]}
          </span>
        </div>
      ),
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Base Value</span>,
      key: "base_value",
      render: (record: any) => (
        <div className="flex flex-col">
          <span className="text-xs font-black text-gray-700">MRP: ₹{record.mrp}</span>
          <span className="text-[10px] font-bold text-green-600">CP: ₹{record.costPrice}</span>
        </div>
      ),
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Trade Rates</span>,
      key: "trade_rates",
      render: (record: any) => (
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-gray-500">RT: ₹{record.retailPrice}</span>
          <span className="text-[10px] font-bold text-gray-500">WS: ₹{record.wholesalePrice}</span>
          <span className="text-[10px] font-bold text-gray-500">SW: ₹{record.superWholesalePrice}</span>

        </div>
      ),
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Inventory Stock</span>,
      key: "inventory",
      render: (record: any) => (
        <div
          className={`inline-flex flex-col items-center px-3 py-1.5 rounded-xl border cursor-pointer transition-all active:scale-95 ${record.stock <= record.minQuantity
            ? "bg-red-50 border-red-100 text-red-600"
            : "bg-green-50/50 border-green-100 text-green-600"
            }`}
          onClick={() => navigate(`/products/updateStock/${record._id}`, { state: record })}
        >
          <span className="text-xs font-black">{record.measuring === "kg" ? convertToGramorKG(record.stock) : record.stock % 1 === 0 ? record.stock : record.stock.toFixed(2)}</span>
          <span className="text-[8px] font-black uppercase tracking-tighter opacity-60">
            Min: {record.minQuantity}
          </span>
        </div>
      ),
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Registry</span>,
      dataIndex: "category",
      key: "category",
      render: (cat: string) => <span className="px-2 py-1 bg-gray-50 border border-gray-100 rounded-lg text-[9px] font-black text-gray-400 uppercase tracking-widest">{cat}</span>,
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</span>,
      key: "actions",
      align: "right" as const,
      width: 100,
      render: (_: any, record: any) => (
        <div className="flex justify-end gap-1">
          <Button
            type="text"
            icon={<EditOutlined className="text-gray-400 group-hover:text-indigo-600" />}
            onClick={() => navigate(`/products/${record._id}`, { state: record })}
            className="group hover:bg-indigo-50 rounded-lg"
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => setDeleteModal({ open: true, product: record })}
            className="hover:bg-red-50 rounded-lg"
          />
        </div>
      ),
    },
  ];

  return (
    <main className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-2xl font-black text-gray-800 tracking-tight leading-tight">Registry Catalog</h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Enterprise Inventory Management</p>
          </div>

          <div className="bg-white px-8 py-5 rounded-[24px] border border-gray-100 shadow-sm flex flex-col items-end group transition-all hover:shadow-indigo-100">
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1 group-hover:text-indigo-400 transition-colors">Cumulative Market Value</p>
            <span className="text-2xl font-black text-indigo-600 tracking-tighter">₹{formatIndianNumber(totalStockValue)}</span>
          </div>
        </div>

        {/* Global Controls Container */}
        <div className="bg-white rounded-[32px] shadow-sm p-4 sm:p-8 mb-8 border border-gray-100">
          <div className="flex flex-col gap-8">
            {/* Horizontal Filter Bar */}
            <div className="w-full overflow-x-auto scrollbar-hide -mx-2 px-2">
              <div className="flex gap-2 whitespace-nowrap">
                <div
                  onClick={() => { setCategory("all"); setCurrentPage(1); }}
                  className={`px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest cursor-pointer transition-all duration-300 border ${category === "all" ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100" : "bg-gray-50 text-gray-500 border-gray-50 hover:bg-gray-100"
                    }`}
                >
                  Global View
                </div>
                {categories.map((cat) => (
                  <div
                    key={cat.name}
                    onClick={() => { setCategory(cat.name); setCurrentPage(1); }}
                    className={`px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest cursor-pointer transition-all duration-300 border ${category === cat.name ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100" : "bg-gray-50 text-gray-500 border-gray-50 hover:bg-gray-100"
                      }`}
                  >
                    {cat.name}
                  </div>
                ))}
              </div>
            </div>

            {/* Functional Tools */}
            <div className="flex flex-col lg:flex-row gap-6 items-end justify-between">
              <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                <div className="flex-1 sm:w-80">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1 block">Catalog Index Search</label>
                  <Input.Search
                    placeholder="Reference name or barcode..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                    className="w-full h-12 rounded-2xl overflow-hidden"
                    allowClear
                  />
                </div>
                <div className="w-full sm:w-52">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1 block">Sequence Order</label>
                  <Select
                    value={sort}
                    onChange={setSort}
                    className="w-full h-12 rounded-2xl"
                    options={[
                      { value: "name", label: "ALPHABETICAL" },
                      { value: "stock", label: "LOW STOCK PRIORITY" },
                    ]}
                  />
                </div>
              </div>
              <div className="flex gap-3 w-full lg:w-auto">
                <Button
                  onClick={() => navigate("/products/updateStock")}
                  className="flex-1 sm:flex-none h-12 px-6 rounded-2xl border-2 border-gray-50 text-[10px] font-black tracking-widest text-gray-500 hover:border-indigo-100 hover:text-indigo-600 transition-all uppercase"
                >
                  Add Stock
                </Button>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => navigate("/newProduct")}
                  className="flex-1 sm:flex-none h-12 px-8 bg-indigo-600 hover:bg-indigo-700 border-none rounded-2xl text-[10px] font-black tracking-widest shadow-xl shadow-indigo-100 uppercase"
                >
                  New Product
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
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
              className: "px-8 py-6"
            }}
            scroll={{ x: 1000 }}
            className="modern-table no-border-table"
          />
        </div>
      </div>

      <Modal
        open={deleteModal.open}
        onCancel={() => setDeleteModal({ open: false })}
        onOk={() => handleDelete(deleteModal.product)}
        okText="CONFIRM DELETE"
        okType="danger"
        cancelText="CANCEL"
        centered
        className="premium-modal"
        title={<span className="text-sm font-black text-gray-800 uppercase tracking-widest">Security Authorization</span>}
      >
        <div className="py-4">
          <p className="text-gray-500 font-medium mb-4">
            Are you sure you want to permanently remove <b className="text-gray-800">{deleteModal.product?.name}</b> from the central catalog?
          </p>
          <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Active Stock</span>
              <span className="text-sm font-black text-red-700">{deleteModal.product?.stock} {deleteModal.product?.measuring}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {deleteModal.product?.barcode?.map((b: any) => (
                <span key={b} className="px-2 py-0.5 bg-white rounded-lg text-[10px] font-black text-red-400 border border-red-100 font-mono">{b}</span>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      <style>{`
        .modern-table .ant-table-thead > tr > th { 
          background: #f8fafc !important; 
          border-bottom: 1px solid #f1f5f9 !important;
          padding: 1.25rem 1rem !important;
        }
        .modern-table .ant-table-tbody > tr > td { 
          padding: 1.25rem 1rem !important;
          border-bottom: 1px solid #f8fafc !important;
        }
        .modern-table .ant-table-row:hover > td { background: #f8fafc !important; }
        .no-border-table .ant-table { background: transparent !important; }
      `}</style>
    </main>
  );
};

export default ProductPage;
