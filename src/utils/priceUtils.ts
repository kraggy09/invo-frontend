import useCategoriesStore from "../store/categories.store";
import { Product } from "../store/currentBill.store";

type PriceType = "superWholesale" | "wholesale" | "retail";

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
    return { type: "retail", price: product.retailPrice };
  }

  if (billType === "superWholesale") {
    return { type: "superWholesale", price: product.superWholesalePrice };
  } else if (billType === "wholesale" && val < categoryInfo.superWholeSale) {
    return { type: "wholesale", price: product.wholesalePrice };
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
      return { type: "superWholesale", price: product.superWholesalePrice };
    } else if (val < superWholeSale && val >= wholesale) {
      return { type: "wholesale", price: product.wholesalePrice };
    } else {
      return { type: "retail", price: product.retailPrice };
    }
  } else {
    if (product.piece >= superWholeSale) {
      return { type: "superWholesale", price: product.superWholesalePrice };
    } else if (product.piece < superWholeSale && product.piece >= wholesale) {
      return { type: "wholesale", price: product.wholesalePrice };
    } else {
      return { type: "retail", price: product.retailPrice };
    }
  }
};
