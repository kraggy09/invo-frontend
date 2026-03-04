import { useEffect, useState } from "react";
import useCategoriesStore, { Category } from "../store/categories.store";
import { Card, Modal, Button, Input, Tooltip, message } from "antd";
import apiCaller from "../utils/apiCaller";
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";

const { confirm } = Modal;

const ACCENT = "#2563eb"; // blue-600

const CategoryModal = ({
  open,
  onClose,
  onSubmit,
  initial,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (cat: Partial<Category>) => void;
  initial?: Partial<Category>;
  loading?: boolean;
}) => {
  const [name, setName] = useState(initial?.name || "");
  const [wholesale, setWholesale] = useState(initial?.wholesale || "");
  const [superWholeSale, setSuperWholeSale] = useState(
    initial?.superWholeSale || ""
  );

  useEffect(() => {
    setName(initial?.name || "");
    setWholesale(initial?.wholesale || "");
    setSuperWholeSale(initial?.superWholeSale || "");
  }, [initial, open]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={() =>
        onSubmit({
          name,
          wholesale: Number(wholesale),
          superWholeSale: Number(superWholeSale),
          _id: initial?._id,
        })
      }
      okText={initial?._id ? "Update Category" : "Add Category"}
      cancelText="Cancel"
      confirmLoading={loading}
      title={
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 p-2 rounded-lg">
            {initial?._id ? <EditOutlined className="text-indigo-600" /> : <PlusOutlined className="text-indigo-600" />}
          </div>
          <span className="text-lg font-black text-gray-800 tracking-tight">
            {initial?._id ? "Edit Category" : "Add New Category"}
          </span>
        </div>
      }
      centered
      maskClosable={false}
      width={400}
      okButtonProps={{
        className: "bg-indigo-600 border-indigo-600 font-bold rounded-lg h-9 hover:bg-indigo-700 transition-all"
      }}
      cancelButtonProps={{
        className: "rounded-lg font-bold h-9"
      }}
    >
      <div className="space-y-6 mt-8 py-2">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block">Category Name</label>
          <Input
            placeholder="e.g. Beverages, Snacks..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl h-11 font-bold"
            autoFocus
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block">Wholesale %</label>
            <Input
              placeholder="0.00"
              value={wholesale}
              onChange={(e) => setWholesale(e.target.value)}
              type="number"
              className="rounded-xl h-11 font-bold"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block">Super WS %</label>
            <Input
              placeholder="0.00"
              value={superWholeSale}
              onChange={(e) => setSuperWholeSale(e.target.value)}
              type="number"
              className="rounded-xl h-11 font-bold"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};

const CategoryPage = () => {
  const { categories, setCategories } = useCategoriesStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchCategories() {
      setLoading(true);
      try {
        const res = await apiCaller.get("/categories");
        setCategories(res.data.categories || []);
      } catch (err) {
        console.error("Failed to sync registry categories", err);
      } finally {
        setLoading(false);
      }
    }
    if (categories.length === 0) fetchCategories();
  }, [setCategories, categories.length]);

  const handleSubmit = async (cat: Partial<Category>) => {
    setLoading(true);
    try {
      if (cat._id && !cat._id.includes(".")) {
        await apiCaller.put(`/categories/${cat._id}`, cat);
        setCategories(categories.map((c) => (c._id === cat._id ? { ...c, ...cat } : c)));
      } else {
        const res = await apiCaller.post("/categories", cat);
        setCategories([...categories, res.data.category]);
      }
      message.success("Registry partition updated");
      setModalOpen(false);
      setSelected(null);
    } catch (err) {
      message.error("Registry write operation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (cat: Category) => {
    confirm({
      title: `Decommission Category: ${cat.name}`,
      icon: <ExclamationCircleOutlined className="text-red-500" />,
      content: "All associated data will be archived. Confirm deletion?",
      okText: "REJECT",
      okType: "danger",
      cancelText: "CANCEL",
      centered: true,
      okButtonProps: { className: "rounded-lg font-black" },
      cancelButtonProps: { className: "rounded-lg font-black" },
      async onOk() {
        try {
          await apiCaller.delete(`/categories/${cat._id}`);
          setCategories(categories.filter((c) => c._id !== cat._id));
          message.success("Category archived from registry");
        } catch (err) {
          message.error("Archeve operation aborted");
        }
      },
    });
  };

  return (
    <main className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto">
        <CategoryModal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelected(null);
          }}
          onSubmit={handleSubmit}
          initial={selected || undefined}
          loading={loading}
        />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-2xl font-black text-gray-800 tracking-tight leading-tight">Taxonomy Management</h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Cross-Catalog Logical Partitions</p>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setModalOpen(true);
              setSelected(null);
            }}
            className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 border-none rounded-2xl text-[10px] font-black tracking-widest shadow-xl shadow-indigo-100 uppercase w-full sm:w-auto"
          >
            Create Partition
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <div
              key={cat._id}
              className="group bg-white rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-indigo-100 transition-all duration-500 overflow-hidden cursor-pointer flex flex-col items-center p-8 relative"
              onClick={() => {
                setSelected(cat);
                setModalOpen(true);
              }}
            >
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all">
                <div className="flex gap-1">
                  <Button
                    type="text"
                    icon={<EditOutlined className="text-gray-400 hover:text-indigo-600" />}
                    onClick={(e) => { e.stopPropagation(); setSelected(cat); setModalOpen(true); }}
                    className="w-8 h-8 rounded-lg hover:bg-indigo-50 flex items-center justify-center p-0"
                  />
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={(e) => { e.stopPropagation(); handleDelete(cat); }}
                    className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center p-0"
                  />
                </div>
              </div>

              <div className="w-20 h-20 rounded-[32px] bg-indigo-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner border border-indigo-100 grayscale hover:grayscale-0">
                <span className="text-3xl font-black text-indigo-600">
                  {cat.name[0].toUpperCase()}
                </span>
              </div>

              <h2 className="text-lg font-black text-gray-800 capitalize tracking-tighter mb-6 text-center">
                {cat.name}
              </h2>

              <div className="w-full space-y-3 bg-gray-50/50 p-5 rounded-2.5xl border border-gray-50">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Wholesale Partition</span>
                  <span className="text-xs font-black text-indigo-600">{cat.wholesale}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Super Wholesale Partition</span>
                  <span className="text-xs font-black text-indigo-600">{cat.superWholeSale}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};

export default CategoryPage;
