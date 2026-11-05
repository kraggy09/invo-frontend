import PriceHistoryModal from "../components/PriceHistoryModal";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useProductStore from "../store/product.store";
import useCategoriesStore from "../store/categories.store";
import {
  Card,
  Table,
  Button,
  Input,
  InputNumber,
  Select,
  Tag,
  Modal,
  Tooltip,
} from "antd";
import { message } from "../utils/antdStatic";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BarcodeOutlined,
  ExclamationCircleOutlined,
  RiseOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import apiCaller from "../utils/apiCaller";
import { convertToGramorKG, formatIndianNumber } from "../utils";
import useUserStore from "../store/user.store";

const ACCENT = "#2563eb";

const ProductPage = () => {
  const navigate = useNavigate();
  const { products, setProducts } = useProductStore();
  const { categories } = useCategoriesStore();
  const { user } = useUserStore();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState<string>("name");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    product?: any;
  }>({ open: false });
  const [loading, setLoading] = useState(false);
  const [priceHistoryModal, setPriceHistoryModal] = useState<{ open: boolean; product?: any }>({ open: false });
  const [quickReconcileModal, setQuickReconcileModal] = useState<{
    open: boolean;
    product?: any;
    actualStock: number;
    reason: string;
  }>({
    open: false,
    actualStock: 0,
    reason: "Physical Stock Audit Count",
  });
  const [reconciling, setReconciling] = useState(false);

  const canSeeExtraData = user?.roles?.some((role) =>
    ["ADMIN", "SUPER_ADMIN", "CREATOR"].includes(role)
  );

  const handleQuickReconcile = async () => {
    if (!quickReconcileModal.product) return;
    setReconciling(true);
    try {
      const res = await apiCaller.post("/stocks/reconcile", {
        items: [
          {
            productId: quickReconcileModal.product._id,
            actualStock: quickReconcileModal.actualStock,
            reason: quickReconcileModal.reason,
          },
        ],
      });
      if (res.data?.success) {
        message.success(
          `Stock reconciled for ${quickReconcileModal.product.name} to ${quickReconcileModal.actualStock}`
        );
        setProducts(
          products.map((p) =>
            p._id === quickReconcileModal.product._id
              ? { ...p, stock: quickReconcileModal.actualStock }
              : p
          )
        );
        setQuickReconcileModal({
          open: false,
          actualStock: 0,
          reason: "Physical Stock Audit Count",
        });
      }
    } catch (err: any) {
      console.error(err);
      message.error(err?.response?.data?.message || "Failed to reconcile stock");
    } finally {
      setReconciling(false);
    }
  };

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
    if (canSeeExtraData) {
      return filteredProducts.reduce((acc, p) => acc + p.stock * p.costPrice, 0);
    }
    return 0;
  }, [filteredProducts]);

  const handleDelete = async (product: any) => {
    setLoading(true);
    try {
      await apiCaller.delete(`/products/${product._id}`);
      // Rely entirely on global socket handler to update global state and show success message
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
      width: 280,
      render: (record: any) => (
        <div className="flex flex-col">
          <span
            className="font-black text-indigo-600 truncate cursor-pointer hover:text-indigo-800 transition-colors"
            onClick={() => {
              if (canSeeExtraData) {
                navigate(`/products/${record._id}`, { state: record })
              } else {
                message.info("You are not authorised to edit the product")
              }
            }}
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
          {canSeeExtraData && <span className="text-[10px] font-bold text-green-600">CP: ₹{record.costPrice}</span>}  </div>
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
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</span>,
      dataIndex: "category",
      key: "category",
      render: (cat: string) => <span className="px-2 py-1 bg-gray-50 border border-gray-100 rounded-lg text-[9px] font-black text-gray-400 uppercase tracking-widest">{cat}</span>,
    },

    ...(
      canSeeExtraData
        ? [{
          title: (
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Actions
            </span>
          ),
          key: "actions",
          // align: "right",
          width: 140,
          render: (_: any, record: any) => (
            <div className="flex justify-end gap-1">
              <Tooltip title="Reconcile Product Stock">
                <Button
                  type="text"
                  className="text-amber-600 hover:text-amber-800"
                  icon={<SafetyCertificateOutlined />}
                  onClick={() =>
                    setQuickReconcileModal({
                      open: true,
                      product: record,
                      actualStock: record.stock < 0 ? 0 : record.stock,
                      reason: "Physical Stock Audit Count",
                    })
                  }
                />
              </Tooltip>
              <Tooltip title="Price Fluctuation History">
                <Button
                  type="text"
                  className="text-indigo-600 hover:text-indigo-800"
                  icon={<RiseOutlined />}
                  onClick={() =>
                    setPriceHistoryModal({ open: true, product: record })
                  }
                />
              </Tooltip>
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() =>
                  navigate(`/products/${record._id}`, { state: record })
                }
              />
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() =>
                  setDeleteModal({ open: true, product: record })
                }
              />
            </div>
          ),
        }]
        : []
    )
  ];

  return (
    <main className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-2xl font-black text-gray-800 tracking-tight leading-tight">Products & Stock</h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Manage shop products and stock</p>
          </div>

          {canSeeExtraData && <div className="bg-white px-8 py-5 rounded-[24px] border border-gray-100 shadow-sm flex flex-col items-end group transition-all hover:shadow-indigo-100">
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1 group-hover:text-indigo-400 transition-colors">Total Stock Value</p>
            <span className="text-2xl font-black text-indigo-600 tracking-tighter">₹{formatIndianNumber(totalStockValue)}</span>
          </div>}
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
                  All Products
                </div>
                {(categories || [])
                  .filter((c) => c && c.name && c.name !== "null")
                  .map((cat) => (
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
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1 block">Search Products</label>
                  <Input.Search
                    placeholder="Reference name or barcode..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                    className="w-full h-12 rounded-2xl overflow-hidden"
                    allowClear
                  />
                </div>
                <div className="w-full sm:w-52">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1 block">Sort By</label>
                  <Select
                    value={sort}
                    onChange={setSort}
                    className="w-full h-12 rounded-2xl"
                    options={[
                      { value: "name", label: "Name (A-Z)" },
                      { value: "stock", label: "Low Stock First" },
                    ]}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-3 w-full lg:w-auto">
                {canSeeExtraData && (
                  <Button
                    icon={<SafetyCertificateOutlined />}
                    onClick={() => navigate("/products/reconcile")}
                    className="flex-1 sm:flex-none h-12 px-6 rounded-2xl border-2 border-indigo-100 bg-indigo-50/50 text-[10px] font-black tracking-widest text-indigo-700 hover:bg-indigo-100 hover:text-indigo-900 transition-all uppercase"
                  >
                    Reconcile Stock
                  </Button>
                )}
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
        okText="Delete"
        okType="danger"
        cancelText="Cancel"
        centered
        className="premium-modal"
        title={<span className="text-sm font-black text-gray-800 uppercase tracking-widest">Delete Product</span>}
      >
        <div className="py-4">
          <p className="text-gray-500 font-medium mb-4">
            Are you sure you want to permanently delete <b className="text-gray-800">{deleteModal.product?.name}</b>?
          </p>
          <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Current Stock</span>
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
      <PriceHistoryModal
        open={priceHistoryModal.open}
        productId={priceHistoryModal.product?._id || null}
        productName={priceHistoryModal.product?.name}
        onClose={() => setPriceHistoryModal({ open: false })}
      />

      {/* Quick Reconcile Modal for individual product */}
      <Modal
        open={quickReconcileModal.open}
        onCancel={() =>
          setQuickReconcileModal({
            open: false,
            actualStock: 0,
            reason: "Physical Stock Audit Count",
          })
        }
        title={
          <div className="flex items-center gap-2 font-black text-base text-gray-900">
            <SafetyCertificateOutlined className="text-amber-500" />
            <span>Reconcile Stock • {quickReconcileModal.product?.name}</span>
          </div>
        }
        footer={null}
        centered
        width={480}
      >
        {quickReconcileModal.product && (
          <div className="py-4 space-y-4">
            <div className="grid grid-cols-3 gap-3 bg-gray-50 p-3.5 rounded-2xl border border-gray-100 text-xs">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Current Stock
                </span>
                <span
                  className={`font-mono font-black text-sm ${
                    quickReconcileModal.product.stock < 0
                      ? "text-red-600"
                      : "text-gray-800"
                  }`}
                >
                  {quickReconcileModal.product.stock}{" "}
                  {quickReconcileModal.product.measuring}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Cost Price
                </span>
                <span className="font-mono font-black text-xs text-gray-800">
                  ₹{quickReconcileModal.product.costPrice || 0}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Retail Price
                </span>
                <span className="font-mono font-black text-xs text-gray-800">
                  ₹{quickReconcileModal.product.retailPrice || 0}
                </span>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-black text-gray-600 uppercase tracking-wider block mb-1.5">
                Actual Physical Stock Count:
              </label>
              <InputNumber
                min={0}
                step={quickReconcileModal.product.measuring === "kg" ? 0.05 : 1}
                value={quickReconcileModal.actualStock}
                onChange={(val) =>
                  setQuickReconcileModal((prev) => ({
                    ...prev,
                    actualStock: val !== null ? val : 0,
                  }))
                }
                className="w-full h-11 text-base font-mono font-black rounded-xl"
              />
            </div>

            {/* Live calculation info */}
            {(() => {
              const diff =
                quickReconcileModal.actualStock -
                quickReconcileModal.product.stock;
              const valueImpact =
                diff * (quickReconcileModal.product.costPrice || 0);

              return (
                <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs font-bold">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase block">
                      Discrepancy (Variance)
                    </span>
                    <span
                      className={`font-mono text-sm ${
                        diff < 0 ? "text-red-600" : diff > 0 ? "text-emerald-600" : "text-gray-600"
                      }`}
                    >
                      {diff > 0 ? `+${diff}` : diff} {quickReconcileModal.product.measuring}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-400 uppercase block">
                      Cost Impact
                    </span>
                    <span
                      className={`font-mono text-sm ${
                        valueImpact < 0
                          ? "text-red-600"
                          : valueImpact > 0
                          ? "text-emerald-600"
                          : "text-gray-600"
                      }`}
                    >
                      {valueImpact > 0
                        ? `+₹${valueImpact.toLocaleString()}`
                        : `-₹${Math.abs(valueImpact).toLocaleString()}`}
                    </span>
                  </div>
                </div>
              );
            })()}

            <div>
              <label className="text-[11px] font-black text-gray-600 uppercase tracking-wider block mb-1.5">
                Audit Reason:
              </label>
              <Select
                value={quickReconcileModal.reason}
                onChange={(val) =>
                  setQuickReconcileModal((prev) => ({ ...prev, reason: val }))
                }
                className="w-full h-10 text-xs font-semibold"
                options={[
                  { value: "Physical Stock Audit Count", label: "Physical Stock Audit Count" },
                  { value: "Damaged / Broken Items", label: "Damaged / Broken Items" },
                  { value: "Shrinkage / Unrecorded Loss", label: "Shrinkage / Unrecorded Loss" },
                  { value: "Negative Stock Correction", label: "Negative Stock Correction" },
                  { value: "Counting Discrepancy Correction", label: "Counting Discrepancy Correction" },
                  { value: "Found Unrecorded Stock", label: "Found Unrecorded Stock" },
                ]}
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <Button
                onClick={() =>
                  setQuickReconcileModal({
                    open: false,
                    actualStock: 0,
                    reason: "Physical Stock Audit Count",
                  })
                }
                className="rounded-xl font-bold"
              >
                Cancel
              </Button>
              <Button
                type="primary"
                loading={reconciling}
                onClick={handleQuickReconcile}
                className="h-10 px-6 bg-green-600 hover:bg-green-700 border-none rounded-xl font-black text-xs uppercase tracking-wider"
              >
                Apply Reconciliation
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </main>
  );
};

export default ProductPage;
