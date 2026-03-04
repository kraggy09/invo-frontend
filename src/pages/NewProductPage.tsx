import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import useCategoriesStore from "../store/categories.store";
import apiCaller from "../utils/apiCaller";
import ProductForm, { ProductFormValues } from "../components/ProductForm";

const NewProductPage = () => {
  const navigate = useNavigate();
  const { categories } = useCategoriesStore();
  const [loading, setLoading] = useState(false);

  const categoryOptions = categories.map((cat) => ({
    value: cat.name,
    label: cat.name,
  }));

  const handleSubmit = async (values: ProductFormValues) => {
    setLoading(true);
    try {
      await apiCaller.post("/products", {
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
      message.success("Product created successfully");
      navigate("/products");
    } catch (err: any) {
      message.error(err?.response?.data?.msg || "Failed to create product");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <ProductForm
        onSubmit={handleSubmit}
        loading={loading}
        categories={categoryOptions}
        mode="create"
      />
    </div>
  );
};

export default NewProductPage;
