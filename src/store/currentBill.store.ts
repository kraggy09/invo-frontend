import { create } from "zustand";
import { Customer } from "./customer.store";
import { IProduct } from "./product.store";
import { calculatePriceTag } from "../utils/priceUtils";

export type PurchasedProduct = {
  id: string;
  packetQuantity: number;
  boxQuantity: number;
  wholesalePrice: number;
  retailPrice: number;
  superWholesalePrice: number;
  measuring: "kg" | "pieces";
  barcode: number[];
  name: string;
  price: number;
  mrp: number;
  type: "superWholesale" | "wholesale" | "retail";
  piece: number;
  packet: number;
  box: number;
  discount: number;
  total: number;
  category: string;
  hi: string;
  stock: number;
};

export class Product implements PurchasedProduct {
  id: string;
  packetQuantity: number;
  boxQuantity: number;
  wholesalePrice: number;
  retailPrice: number;
  superWholesalePrice: number;
  measuring: "kg" | "pieces";
  barcode: number[];
  name: string;
  price: number;
  mrp: number;
  type: "superWholesale" | "wholesale" | "retail";
  piece: number;
  packet: number;
  box: number;
  discount: number;
  total: number;
  category: string;
  hi: string;
  stock: number;

  constructor(
    id: string,
    packetQuantity: number,
    boxQuantity: number,
    wholesalePrice: number,
    retailPrice: number,
    superWholesalePrice: number,
    measuring: "kg" | "pieces",
    barcode: number[],
    name: string,
    price: number,
    mrp: number,
    type: "superWholesale" | "wholesale" | "retail",
    piece: number,
    packet: number,
    box: number,
    discount: number,
    total: number,
    category: string,
    hi: string,
    stock: number
  ) {
    this.id = id;
    this.boxQuantity = boxQuantity;
    this.packetQuantity = packetQuantity;
    this.retailPrice = retailPrice;
    this.barcode = barcode;
    this.measuring = measuring;
    this.wholesalePrice = wholesalePrice;
    this.superWholesalePrice = superWholesalePrice;
    this.name = name;
    this.price = price;
    this.mrp = mrp;
    this.type = type;
    this.piece = piece;
    this.packet = packet;
    this.box = box;
    this.discount = discount;
    this.total = total;
    this.category = category;
    this.hi = hi;
    this.stock = stock;
  }
}

type Bill = {
  id: string;
  idx: number;
  total: number;
  purchased: PurchasedProduct[];
  customer: Customer | null;
  discount: number;
};

type BillingStore = {
  bills: Bill[];
  billingId: number;
  addBill: (bill: Bill) => void;
  removeBill: (id: string) => void;
  setBillingId: (id: number) => void;
  currentBillingId: number;
  setCurrentBillingId: (id: number) => void;
  initialBills: (bills: Bill[]) => void;
  setCustomerForBill: (customer: Customer | null, id: string) => void;
  addProduct: (product: IProduct, id: string) => void;
  removeProductFromBill: (productId: string, billId: number) => void;
  updateProductPrice: (
    productId: string,
    billId: number,
    priceType: "superWholesale" | "wholesale" | "retail"
  ) => void;
  updateProductQuantities: (
    productId: string,
    billId: string,
    quantities: {
      piece?: number;
      packet?: number;
      box?: number;
      discount?: number;
    }
  ) => void;
};

const useCurrentBillStore = create<BillingStore>((set) => {
  // Get categories from the categories store

  return {
    bills: [],
    billingId: 1,
    addBill: (bill) => set((state) => ({ bills: [...state.bills, bill] })),
    initialBills: (bills: Bill[]) => set(() => ({ bills: bills })),
    removeBill: (id) =>
      set((state) => {
        const idx = state.bills.findIndex((bill) => bill.id === id);
        const updatedBills = state.bills.filter((bill) => bill.id !== id);
        let removedId = Number(id);
        // Shift IDs backward
        for (let i = idx; i < updatedBills.length; i++) {
          updatedBills[i].id = removedId + "";
          removedId++;
        }

        return { bills: updatedBills };
      }),
    setBillingId: (id) => set(() => ({ billingId: id })),
    currentBillingId: 0,
    setCurrentBillingId: (id) => set(() => ({ currentBillingId: id })),
    setCustomerForBill: (customer: Customer | null, id: string) => {
      set((state) => {
        const bills = [...state.bills];
        const billIndex = bills.findIndex((bill) => bill.id === id);

        if (billIndex === -1) return state;

        bills[billIndex].customer = customer;
        return { bills };
      });
    },
    addProduct: (product: IProduct, id: string) => {
      const newProduct = new Product(
        product._id,
        product.packet,
        product.box,
        product.wholesalePrice,
        product.retailPrice,
        product.superWholesalePrice,
        product.measuring,
        product.barcode,
        product.name,
        product.retailPrice,
        product.mrp,
        "retail",
        1,
        0,
        0,
        0,
        0,
        product.category,
        product.hi,
        product.stock
      );

      set((state) => {
        const bills = [...state.bills];
        const billIndex = bills.findIndex((bill) => bill.id === id);

        if (billIndex === -1) return state;

        const existingProductIndex = bills[billIndex].purchased.findIndex(
          (p) => p.id === product._id
        );

        if (existingProductIndex !== -1) {
          const currentProduct =
            bills[billIndex].purchased[existingProductIndex];
          currentProduct.piece += 1;

          // Calculate total pieces
          const totalPieces =
            currentProduct.piece +
            currentProduct.box * currentProduct.boxQuantity +
            currentProduct.packet * currentProduct.packetQuantity;

          // Get price tag based on total pieces
          const priceTag = calculatePriceTag(
            currentProduct,
            totalPieces,
            "retail"
          );

          // Update product type and price
          currentProduct.type = priceTag.type;
          currentProduct.price = priceTag.price;

          // Calculate total
          currentProduct.total = totalPieces * currentProduct.price;
          bills[billIndex].purchased[existingProductIndex] = currentProduct;
        } else {
          // For new products, calculate initial price tag
          const priceTag = calculatePriceTag(newProduct, 1, "retail");
          newProduct.type = priceTag.type;
          newProduct.price = priceTag.price;
          newProduct.total = newProduct.price; // Since piece is 1 and others are 0

          console.log(newProduct, "We are pushing this");
          bills[billIndex].purchased.push(newProduct);
        }

        bills[billIndex].total = bills[billIndex].purchased.reduce(
          (sum, product) => sum + product.total,
          0
        );

        return { bills };
      });
    },
    removeProductFromBill: (productId: string, billId: number) => {
      set((state) => {
        const idx = state.bills.findIndex(
          (bill) => bill.id === billId.toString()
        );
        state.bills[idx].purchased = state.bills[idx].purchased.filter(
          (product) => product.id !== productId
        );
        state.bills[idx].total = state.bills[idx].purchased.reduce(
          (sum, product) => sum + product.total,
          0
        );
        return { bills: state.bills };
      });
    },
    updateProductPrice: (
      productId: string,
      billId: number,
      priceType: "superWholesale" | "wholesale" | "retail"
    ) => {
      set((state) => {
        const idx = state.bills.findIndex(
          (bill) => bill.id === billId.toString()
        );
        const productIdx = state.bills[idx].purchased.findIndex(
          (product) => product.id === productId
        );
        if (productIdx !== -1) {
          const currentProduct = state.bills[idx].purchased[productIdx];
          currentProduct.type = priceType;
          currentProduct.price =
            priceType === "superWholesale"
              ? currentProduct.superWholesalePrice
              : priceType === "wholesale"
              ? currentProduct.wholesalePrice
              : currentProduct.retailPrice;
          currentProduct.total =
            currentProduct.piece * currentProduct.price +
            currentProduct.box *
              currentProduct.boxQuantity *
              currentProduct.price +
            currentProduct.packet *
              currentProduct.packetQuantity *
              currentProduct.price;
        }
        state.bills[idx].total = state.bills[idx].purchased.reduce(
          (sum, product) => sum + product.total,
          0
        );
        return { bills: state.bills };
      });
    },
    updateProductQuantities: (
      productId: string,
      billId: string,
      quantities: {
        piece?: number;
        packet?: number;
        box?: number;
        discount?: number;
      }
    ) => {
      set((state) => {
        const updatedBills = state.bills.map((bill) => {
          if (bill.id === billId) {
            const productIndex = bill.purchased.findIndex(
              (p) => p.id === productId
            );
            if (productIndex !== -1) {
              const currentProduct = { ...bill.purchased[productIndex] };

              const fields = Object.keys(quantities) as Array<
                keyof typeof quantities
              >;
              fields.forEach((field) => {
                if (
                  field === "piece" ||
                  field === "packet" ||
                  field === "box" ||
                  field === "discount"
                ) {
                  currentProduct[field] = quantities[field] || 0;
                }
                if (field === "box") {
                  currentProduct.packet = 0;
                  currentProduct.piece = 0;
                }
                if (field === "packet") {
                  currentProduct.piece = 0;
                }
              });

              // Calculate total pieces including box and packet quantities
              const totalPieces =
                currentProduct.piece +
                currentProduct.box * currentProduct.boxQuantity +
                currentProduct.packet * currentProduct.packetQuantity;

              // Get price tag based on total pieces
              const priceTag = calculatePriceTag(
                currentProduct,
                totalPieces,
                "retail"
              );

              console.log(priceTag, "Price tag from heaven");

              // Update product type and price
              currentProduct.type = priceTag.type;
              currentProduct.price = priceTag.price;

              // Calculate total price including discount
              currentProduct.total =
                totalPieces * currentProduct.price -
                (currentProduct.discount || 0);

              // Update the product in the purchased array
              bill.purchased[productIndex] = currentProduct;

              // Update bill total
              bill.total = bill.purchased.reduce(
                (sum, product) => sum + product.total,
                0
              );
            }
          }
          return bill;
        });
        return { bills: updatedBills };
      });
    },
  };
});

export default useCurrentBillStore;
