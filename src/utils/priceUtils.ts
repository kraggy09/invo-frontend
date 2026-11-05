import useCategoriesStore from "../store/categories.store";
import useUserStore from "../store/user.store";

export type PriceType = "SUPERWHOLESALE" | "WHOLESALE" | "RETAIL";

export interface PriceCalculableProduct {
  retailPrice: number;
  wholesalePrice?: number;
  superWholesalePrice?: number;
  category?: string | any;
  piece?: number;
  [key: string]: any;
}

export const calculatePriceTag = (
  product: PriceCalculableProduct,
  val?: number,
  billType?: PriceType,
): { type: PriceType; price: number } => {
  const pricingMode = useUserStore.getState().user?.shopSettings?.pricingMode;
  if (
    pricingMode === "RETAIL_ONLY" ||
    (pricingMode as string)?.toUpperCase() === "RETAIL_ONLY" ||
    (pricingMode as string)?.toUpperCase() === "RETAIL"
  ) {
    return { type: "RETAIL", price: product.retailPrice };
  }

  if (billType === "WHOLESALE") {
    return {
      type: "WHOLESALE",
      price: product.wholesalePrice || product.retailPrice,
    };
  }

  if (billType === "SUPERWHOLESALE") {
    return {
      type: "SUPERWHOLESALE",
      price: product.superWholesalePrice || product.retailPrice,
    };
  }

  if (
    !product.category ||
    product.category === "null" ||
    product.category === "none"
  ) {
    return { type: "RETAIL", price: product.retailPrice };
  }

  const { categories } = useCategoriesStore.getState();
  const safeCategories = Array.isArray(categories) ? categories : [];
  const categoryName =
    typeof product.category === "object" && product.category !== null
      ? (product.category as any).name
      : product.category;

  const categoryInfo = safeCategories.find(
    (cat) =>
      cat &&
      (cat.name === categoryName ||
        cat.name?.toLowerCase() === categoryName?.toString().toLowerCase() ||
        cat._id === categoryName),
  );

  if (!categoryInfo) {
    return { type: "RETAIL", price: product.retailPrice };
  }

  const superWholeSale = Number(categoryInfo.superWholeSale);
  const wholesale = Number(categoryInfo.wholesale);

  const units = val != null ? val : product.piece || 0;

  if (!isNaN(superWholeSale) && units >= superWholeSale) {
    return {
      type: "SUPERWHOLESALE",
      price: product.superWholesalePrice || product.retailPrice,
    };
  } else if (!isNaN(wholesale) && units >= wholesale) {
    return {
      type: "WHOLESALE",
      price: product.wholesalePrice || product.retailPrice,
    };
  } else {
    return { type: "RETAIL", price: product.retailPrice };
  }
};
