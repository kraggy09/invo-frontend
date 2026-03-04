import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { message, Spin, Alert } from "antd";
import useCategoriesStore from "../store/categories.store";
import useProductStore from "../store/product.store";
import apiCaller from "../utils/apiCaller";
import ProductForm, { ProductFormValues } from "../components/ProductForm";

const EditProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { categories } = useCategoriesStore();
  const productFromStore = useProductStore((state) =>
    state.products.find((p) => p._id === id)
  );
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<ProductFormValues | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const categoryOptions = categories.map((cat) => ({
    value: cat.name,
    label: cat.name,
  }));

  useEffect(() => {
    // Priority 1: navigation state (fastest — set when clicking Edit from ProductPage)
    if (location.state) {
      const p = location.state;
      setProduct({
        name: p.name || "",
        measuring: p.measuring || "",
        mrp: p.mrp ?? "",
        costPrice: p.costPrice ?? "",
        retailPrice: p.retailPrice ?? "",
        wholesalePrice: p.wholesalePrice ?? "",
        superWholesalePrice: p.superWholesalePrice ?? "",
        barcode: Array.isArray(p.barcode)
          ? p.barcode[0] || ""
          : p.barcode || "",
        stock: p.stock ?? "",
        packet: p.packet ?? "",
        box: p.box ?? "",
        minQuantity: p.minQuantity ?? 1,
        category: p.category || "",
      });
      setLoading(false);
      return;
    }
    // Priority 2: Zustand store (no network — covers in-app nav without state)
    if (productFromStore) {
      const p = productFromStore;
      setProduct({
        name: p.name || "",
        measuring: p.measuring || "",
        mrp: p.mrp ?? "",
        costPrice: p.costPrice ?? "",
        retailPrice: p.retailPrice ?? "",
        wholesalePrice: p.wholesalePrice ?? "",
        superWholesalePrice: p.superWholesalePrice ?? "",
        barcode: Array.isArray(p.barcode)
          ? String(p.barcode[0] ?? "")
          : String(p.barcode ?? ""),
        stock: p.stock ?? "",
        packet: p.packet ?? "",
        box: p.box ?? "",
        minQuantity: p.minQuantity ?? 1,
        category: p.category || "",
      });
      setLoading(false);
      return;
    }
    // Priority 3: API fetch — covers direct URL, page refresh, shared links
    async function fetchProduct() {
      setLoading(true);
      setFetchError(null);
      try {
        const res = await apiCaller.get(`/products/${id}`);
        console.log("Fetched product:", res.data);
        const p = res.data.product;
        if (!p) {
          setFetchError("Product not found.");
          setLoading(false);
          return;
        }
        setProduct({
          name: p.name || "",
          measuring: p.measuring || "",
          mrp: p.mrp ?? "",
          costPrice: p.costPrice ?? "",
          retailPrice: p.retailPrice ?? "",
          wholesalePrice: p.wholesalePrice ?? "",
          superWholesalePrice: p.superWholesalePrice ?? "",
          barcode: Array.isArray(p.barcode)
            ? p.barcode[0] || ""
            : p.barcode || "",
          stock: p.stock ?? "",
          packet: p.packet ?? "",
          box: p.box ?? "",
          minQuantity: p.minQuantity ?? 1,
          category: p.category || "",
        });
      } catch (err) {
        console.error("Failed to fetch product:", err);
        setFetchError("Failed to fetch product. Please try again.");
      }
      setLoading(false);
    }
    if (id) fetchProduct();
  }, [id, location.state, productFromStore]);

  const handleSubmit = async (values: ProductFormValues) => {
    setSubmitting(true);
    try {
      await apiCaller.put(`/products/${id}`, {
        name: values.name,
        mrp: Number(values.mrp),
        costPrice: Number(values.costPrice),
        measuring: values.measuring,
        retailPrice: Number(values.retailPrice),
        wholesalePrice: Number(values.wholesalePrice),
        superWholesalePrice: Number(values.superWholesalePrice),
        barcode: values.barcode,
        stock: Number(values.stock),
        packet: Number(values.packet),
        box: Number(values.box),
        minQuantity: Number(values.minQuantity),
        category: values.category,
      });
      message.success("Product updated successfully");
      navigate("/products");
    } catch (err: any) {
      message.error(err?.response?.data?.msg || "Failed to update product");
    }
    setSubmitting(false);
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spin size="large" />
      </div>
    );

  if (fetchError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Alert message={fetchError} type="error" showIcon />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <ProductForm
        initialValues={product || undefined}
        onSubmit={handleSubmit}
        loading={submitting}
        categories={categoryOptions}
        mode="edit"
      />
    </div>
  );
};

export default EditProductPage;
