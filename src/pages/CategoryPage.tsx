import { useEffect, useState } from "react";
import useCategoriesStore, { Category } from "../store/categories.store";
import { Card, Modal, Button, Input, Tooltip } from "antd";
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
      okText={initial?._id ? "Update" : "Add"}
      cancelText="Cancel"
      confirmLoading={loading}
      title={
        <span style={{ color: ACCENT }}>
          {initial?._id ? "Edit Category" : "Add Category"}
        </span>
      }
      centered
      maskClosable={false}
      bodyStyle={{ background: "#fff" }}
    >
      <div className="space-y-4 mt-4">
        <Input
          placeholder="Category Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          size="large"
          autoFocus
        />
        <Input
          placeholder="Wholesale"
          value={wholesale}
          onChange={(e) => setWholesale(e.target.value)}
          type="number"
          size="large"
        />
        <Input
          placeholder="Super Wholesale"
          value={superWholeSale}
          onChange={(e) => setSuperWholeSale(e.target.value)}
          type="number"
          size="large"
        />
      </div>
    </Modal>
  );
};

const CategoryPage = () => {
  const { categories, setCategories } = useCategoriesStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch categories from backend (mocked here)
  useEffect(() => {
    async function fetchCategories() {
      setLoading(true);
      // Simulate API
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
      setLoading(false);
    }
    if (categories.length === 0) fetchCategories();
  }, [setCategories, categories.length]);

  // Add or update category
  const handleSubmit = async (cat: Partial<Category>) => {
    setLoading(true);
    if (cat._id) {
      setCategories(
        categories.map((c) => (c._id === cat._id ? { ...c, ...cat } : c))
      );
    } else {
      setCategories([
        ...categories,
        { ...cat, _id: Math.random().toString() } as Category,
      ]);
    }
    setLoading(false);
    setModalOpen(false);
    setSelected(null);
  };

  // Delete category with confirmation
  const handleDelete = (cat: Category) => {
    confirm({
      title: `Delete category "${cat.name}"?`,
      icon: <ExclamationCircleOutlined />,
      content: "This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      centered: true,
      onOk() {
        setCategories(categories.filter((c) => c._id !== cat._id));
        setModalOpen(false);
        setSelected(null);
      },
    });
  };

  return (
    <main className="min-h-screen bg-white p-4 md:p-10 relative">
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
      <div className="flex items-center justify-between max-w-7xl mx-auto mb-10">
        <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">
          Categories
        </h1>
        <Button
          type="primary"
          icon={<PlusOutlined style={{ fontSize: 20 }} />}
          style={{
            background: ACCENT,
            fontWeight: 600,
            height: 44,
            fontSize: 18,
          }}
          onClick={() => {
            setModalOpen(true);
            setSelected(null);
          }}
        >
          Add Category
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
        {categories.map((cat) => (
          <Card
            key={cat._id}
            className="relative group rounded-xl shadow-md border border-gray-200 bg-white hover:shadow-lg transition-all"
            bodyStyle={{ padding: 24, paddingTop: 32 }}
            style={{ borderRadius: 14, minHeight: 180 }}
            actions={[
              <Tooltip title="Edit" key="edit">
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelected(cat);
                    setModalOpen(true);
                  }}
                />
              </Tooltip>,
              <Tooltip title="Delete" key="delete">
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(cat);
                  }}
                />
              </Tooltip>,
            ]}
            onClick={() => {
              setSelected(cat);
              setModalOpen(true);
            }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-3 mx-auto border-2"
              style={{ borderColor: ACCENT }}
            >
              <span
                className="text-xl font-bold capitalize"
                style={{ color: ACCENT }}
              >
                {cat.name[0]}
              </span>
            </div>
            <h2 className="capitalize text-center text-base font-semibold mb-2 text-gray-800 tracking-tight">
              {cat.name}
            </h2>
            <div className="text-sm text-gray-500 w-full text-center space-y-1">
              <div>
                <span>Wholesale:</span>{" "}
                <span className="font-medium">{cat.wholesale}</span>
              </div>
              <div>
                <span>Super Wholesale:</span>{" "}
                <span className="font-medium">{cat.superWholeSale}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
      {/* Floating button removed, now at top right */}
    </main>
  );
};

export default CategoryPage;
