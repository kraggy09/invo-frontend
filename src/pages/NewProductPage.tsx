import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { message } from "../utils/antdStatic";
import useCategoriesStore from "../store/categories.store";
import useUserStore from "../store/user.store";
import apiCaller from "../utils/apiCaller";
import ProductForm, { ProductFormValues } from "../components/ProductForm";
import { generateUUID } from "../utils";

const NewProductPage = () => {
  const navigate = useNavigate();
  const { categories } = useCategoriesStore();
  const [loading, setLoading] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(generateUUID());

  const categoryOptions = (categories || [])
    .filter(Boolean)
    .filter((cat) => cat.name && cat.name !== "null")
    .map((cat) => ({
      value: cat.name,
      label: cat.name,
    }));

  const handleSubmit = async (values: ProductFormValues) => {
    setLoading(true);
    try {
      const res = await apiCaller.post("/products", {
        name: values.name,
        mrp: Number(values.mrp),
        costPrice: Number(values.costPrice),
        measuring: values.measuring,
        retailPrice: Number(values.retailPrice),
        wholesalePrice: Number(values.wholesalePrice),
        superWholesalePrice: Number(values.superWholesalePrice),
        barcode: values.barcode,
        isAutoBarcode: values.isAutoBarcode,
        stock: Number(values.stock),
        packet: Number(values.packet),
        box: Number(values.box),
        minQuantity: Number(values.minQuantity),
        category: values.category,
        supplierId: values.supplierId || undefined,
        paymentMode: values.paymentMode || "CASH",
        idempotencyKey,
      });

      // Synchronize updated shop currentBarcode if returned by backend
      const updatedBarcode = res.data?.data?.currentBarcode;
      if (updatedBarcode) {
        const currentUser = useUserStore.getState().user;
        if (currentUser) {
          useUserStore.getState().setUser({
            ...currentUser,
            shopSettings: {
              ...currentUser.shopSettings,
              currentBarcode: updatedBarcode,
            },
          });
        }
      }

      message.success(res.data?.msg || "Product created successfully");
      setIdempotencyKey(generateUUID());
      navigate("/products");
    } catch (err: any) {
      message.error(err?.response?.data?.msg || "Failed to create product");
    }
    setLoading(false);
  };

  return (
    <div className="bg-gray-50/50">
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
