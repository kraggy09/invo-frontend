import useCategoriesStore from "../store/categories.store";
import { Product } from "../store/currentBill.store";

export type PriceType = "SUPERWHOLESALE" | "WHOLESALE" | "RETAIL";

export const calculatePriceTag = (
  product: Product,
  val: number,
  billType: PriceType
): { type: PriceType; price: number } => {
  const { categories } = useCategoriesStore.getState();
  console.log(categories, "Categories from heaven");

  const categoryInfo = categories.find((cat) => cat.name === product.category);
  console.log(categoryInfo, "Category info from heaven", product.category);
  if (!categoryInfo) {
    return { type: "RETAIL", price: product.retailPrice };
  }

  if (billType === "SUPERWHOLESALE") {
    return { type: "SUPERWHOLESALE", price: product.superWholesalePrice };
  } else if (billType === "WHOLESALE" && val < categoryInfo.superWholeSale) {
    return { type: "WHOLESALE", price: product.wholesalePrice };
  }

  if (product.category === "null" && val === 1) {
    return { type: product.type as PriceType, price: product.retailPrice };
  } else if (product.category === "null") {
    return { type: product.type as PriceType, price: product.price };
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
