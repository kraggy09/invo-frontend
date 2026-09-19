import useCategoriesStore from "../store/categories.store";
import useUserStore from "../store/user.store";
import { Product } from "../store/currentBill.store";

export type PriceType = "SUPERWHOLESALE" | "WHOLESALE" | "RETAIL";

export const calculatePriceTag = (
  product: Product,
  val: number,
  billType: PriceType
): { type: PriceType; price: number } => {
  const pricingMode = useUserStore.getState().user?.shopSettings?.pricingMode;
  if (
    pricingMode === "RETAIL_ONLY" ||
    (pricingMode as string)?.toUpperCase() === "RETAIL_ONLY" ||
    (pricingMode as string)?.toUpperCase() === "RETAIL"
  ) {
    return { type: "RETAIL", price: product.retailPrice };
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
  const categoryInfo = safeCategories.find(
    (cat) => cat && cat.name === product.category
  );

  if (!categoryInfo) {
    return { type: "RETAIL", price: product.retailPrice };
  }

  const { wholesale, superWholeSale } = categoryInfo;

  console.log("Reached here");

  if (val) {
    console.log("Hey i have got the value", val);

    if (val >= superWholeSale) {
      return { type: "SUPERWHOLESALE", price: product.superWholesalePrice };
    } else if (val < superWholeSale && val >= wholesale) {
      return { type: "WHOLESALE", price: product.wholesalePrice };
    } else {
      return { type: "RETAIL", price: product.retailPrice };
    }
  } else {
    if (product.piece >= superWholeSale) {
      return { type: "SUPERWHOLESALE", price: product.superWholesalePrice };
    } else if (product.piece < superWholeSale && product.piece >= wholesale) {
      return { type: "WHOLESALE", price: product.wholesalePrice };
    } else {
      return { type: "RETAIL", price: product.retailPrice };
    }
  }
};
