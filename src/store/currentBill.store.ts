import { create } from "zustand";
import { ICustomer as Customer } from "./customer.store";
import { IProduct } from "./product.store";
import { calculatePriceTag, PriceType } from "../utils/priceUtils";
import { BillItem } from "./bill.store";

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
  type: "SUPERWHOLESALE" | "WHOLESALE" | "RETAIL";
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
  type: "SUPERWHOLESALE" | "WHOLESALE" | "RETAIL";
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
    type: "SUPERWHOLESALE" | "WHOLESALE" | "RETAIL",
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

export type Bill = {
  id: string;
  idx: number;
  total: number;
  purchased: PurchasedProduct[];
  customer: Customer | null;
  discount: number;
  createdAt: string;
  lastActivityAt: string;
  billType: PriceType;
};

type BillingStore = {
  bills: Bill[];
  addBill: (bill: Bill) => void;
  removeBill: (id: string) => void;
  currentBillingId: number;
  setCurrentBillingId: (id: number) => void;
  initialBills: (bills: Bill[]) => void;
  setCustomerForBill: (customer: Customer | null, id: string) => void;
  addProduct: (product: IProduct, id: string) => void;
  removeProductFromBill: (productId: string, billId: number) => void;
  updateProductPrice: (
    productId: string,
    billId: number,
    priceType: "SUPERWHOLESALE" | "WHOLESALE" | "RETAIL"
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
  updateProductQuantityForMeasuring: (
    productId: string,
    billId: string,
    price: number,
    priceType: "SUPERWHOLESALE" | "WHOLESALE" | "RETAIL"
  ) => void;
  afterBillCreated: (
    customer: Customer,
    purchasedMap?: Map<string, BillItem>
  ) => void;
  afterStockUpdated: (
    updatedProducts: {
      newStock: number;
      previousStock: number;
      productId: string;
    }[]
  ) => void;
  afterProductUpdated: (product: IProduct) => void;
  afterProductDeleted: (productId: string) => void;
};

const useCurrentBillStore = create<BillingStore>((set, get) => {
  // Get categories from the categories store

  return {
    bills: [],
    addBill: (bill) => set((state) => ({ bills: [...state.bills, bill] })),
    initialBills: (bills: Bill[]) => set(() => ({ bills: bills })),
    removeBill: (id) =>
      set((state) => {
        const idx = state.bills.findIndex((bill) => bill.id === id);
        if (idx === -1) return state;

        const filteredBills = state.bills.filter((bill) => bill.id !== id);
        let removedId = Number(id);

        const updatedBills = filteredBills.map((bill, i) => {
          if (i >= idx) {
            const newId = removedId + "";
            removedId++;
            return { ...bill, id: newId };
          }
          return bill;
        });

        return { bills: updatedBills };
      }),
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
      set((state) => {
        // Find the bill index
        const billIndex = Number(id) - 1;
        if (billIndex < 0 || billIndex >= state.bills.length) return state;

        // Copy the bill and its purchased array
        const bill = state.bills[billIndex];
        const purchased = [...bill.purchased];
        const existingProductIndex = purchased.findIndex(
          (p) => p.id === product._id
        );

        if (existingProductIndex !== -1) {
          // Copy the product and update
          const currentProduct = { ...purchased[existingProductIndex] };
          currentProduct.piece += 1;

          // Calculate total pieces
          const totalPieces =
            currentProduct.piece +
            currentProduct.box * currentProduct.boxQuantity +
            currentProduct.packet * currentProduct.packetQuantity;

          // Calculate price tag based on total pieces
          const priceTag = calculatePriceTag(
            currentProduct,
            totalPieces,
            bill.billType || "RETAIL"
          );

          // Update product details
          currentProduct.type = priceTag.type;
          currentProduct.price = priceTag.price;
          currentProduct.total = totalPieces * priceTag.price;

          // Replace the updated product in the purchased copy
          purchased[existingProductIndex] = currentProduct;
        } else {
          // Create a new Product instance (immutable)
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
            "RETAIL",
            1,
            0,
            0,
            0,
            0,
            product.category,
            product.hi,
            product.stock
          );

          // Calculate price tag for the new product
          const priceTag = calculatePriceTag(newProduct, 1, bill.billType || "RETAIL");
          newProduct.type = priceTag.type;
          newProduct.price = priceTag.price;
          newProduct.total = newProduct.price;

          // Add new product to purchased copy
          purchased.push(newProduct);
        }

        // Create a new bill object with updated purchased products and recalc total
        const updatedBill = {
          ...bill,
          purchased,
          total: purchased.reduce((sum, p) => sum + p.total, 0),
          lastActivityAt: new Date().toISOString(),
        };

        // Create a new bills array with the updated bill
        const bills = [...state.bills];
        bills[billIndex] = updatedBill;

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
        const updatedBill = {
          ...state.bills[idx],
          total: state.bills[idx].purchased.reduce(
            (sum, product) => sum + product.total,
            0
          ),
          lastActivityAt: new Date().toISOString(),
        };
        const newBills = [...state.bills];
        newBills[idx] = updatedBill;
        return { bills: newBills };
      });
    },
    updateProductPrice: (
      productId: string,
      billId: number,
      priceType: "SUPERWHOLESALE" | "WHOLESALE" | "RETAIL"
    ) => {
      set((state) => {
        const idx = state.bills.findIndex(
          (bill) => bill.id === billId.toString()
        );
        const productIdx = state.bills[idx].purchased.findIndex(
          (product) => product.id === productId
        );
        if (productIdx !== -1) {
          const bill = state.bills[idx];
          const currentProduct = { ...bill.purchased[productIdx] };
          currentProduct.type = priceType;
          currentProduct.price =
            priceType === "SUPERWHOLESALE"
              ? currentProduct.superWholesalePrice
              : priceType === "WHOLESALE"
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

          const updatedPurchased = [...bill.purchased];
          updatedPurchased[productIdx] = currentProduct;

          const updatedBill = {
            ...bill,
            purchased: updatedPurchased,
            total: updatedPurchased.reduce(
              (sum, product) => sum + product.total,
              0
            ),
            lastActivityAt: new Date().toISOString(),
          };

          const newBills = [...state.bills];
          newBills[idx] = updatedBill;
          return { bills: newBills };
        }
        return state;
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
                bill.billType || "RETAIL"
              );

              // Update product type and price
              currentProduct.type = priceTag.type;
              currentProduct.price = priceTag.price;

              // Calculate total price including discount
              currentProduct.total =
                totalPieces * currentProduct.price -
                (currentProduct.discount || 0);

              const updatedPurchased = [...bill.purchased];
              updatedPurchased[productIndex] = currentProduct;

              return {
                ...bill,
                purchased: updatedPurchased,
                total: updatedPurchased.reduce(
                  (sum, product) => sum + product.total,
                  0
                ),
                lastActivityAt: new Date().toISOString(),
              };
            }
          }
          return bill;
        });
        return { bills: updatedBills };
      });
    },
    updateProductQuantityForMeasuring: (
      productId: string,
      billId: string,
      price: number,
      priceType: "SUPERWHOLESALE" | "WHOLESALE" | "RETAIL"
    ) => {
      set((state) => {
        const billIdx = state.bills.findIndex((bill) => bill.id === billId);
        if (billIdx === -1) return state;
        const productIdx = state.bills[billIdx].purchased.findIndex(
          (product) => product.id === productId
        );
        if (productIdx === -1) return state;

        const bill = state.bills[billIdx];
        const currentProduct = { ...bill.purchased[productIdx] };
        if (currentProduct.measuring !== "kg") {
          return state;
        }
        let sellingPrice = 0;
        if (priceType === "SUPERWHOLESALE") {
          sellingPrice = currentProduct.superWholesalePrice;
        } else if (priceType === "WHOLESALE") {
          sellingPrice = currentProduct.wholesalePrice;
        } else {
          sellingPrice = currentProduct.retailPrice;
        }

        const pieces = price / sellingPrice;
        currentProduct.piece = pieces;
        currentProduct.total =
          pieces * sellingPrice - (currentProduct.discount || 0);
        currentProduct.price = sellingPrice;
        currentProduct.type = priceType;
        currentProduct.box = 0;
        currentProduct.packet = 0;

        const updatedPurchased = [...bill.purchased];
        updatedPurchased[productIdx] = currentProduct;

        const updatedBill = {
          ...bill,
          purchased: updatedPurchased,
          total: updatedPurchased.reduce((sum, p) => sum + p.total, 0),
          lastActivityAt: new Date().toISOString(),
        };

        const newBills = [...state.bills];
        newBills[billIdx] = updatedBill;

        return { bills: newBills };
      });
    },
    afterBillCreated: (customer, purchasedMap) => {
      const { bills } = get();
      console.log(customer, purchasedMap, "After bill created");

      const newBills = bills.map((bill) => {
        const isSameCustomer = bill.customer?._id === customer._id;

        // Track if something actually changed
        let updated = false;

        // Update customer if matched
        const updatedCustomer = isSameCustomer ? customer : bill.customer;

        const updatedPurchased = purchasedMap ? bill.purchased.map((product) => {
          const updatedItem = purchasedMap.get(product.id);
          if (updatedItem) {
            updated = true;
            return {
              ...product,
              stock: updatedItem.newQuantity,
            };
          }
          return product;
        }) : bill.purchased;

        // Only return a new object if something changed
        if (isSameCustomer || updated) {
          return {
            ...bill,
            customer: updatedCustomer,
            purchased: updatedPurchased,
            total: updatedPurchased.reduce((sum, item) => sum + item.total, 0),
          };
        }

        // No changes needed, return existing bill
        return bill;
      });

      // Finally, update the state only if needed
      set({ bills: newBills });
    },
    afterProductUpdated: (updatedProduct: IProduct) => {
      set((state) => {
        const newBills = state.bills.map((bill) => {
          let billUpdated = false;
          const newPurchased = bill.purchased.map((item) => {
            if (item.id === updatedProduct._id) {
              billUpdated = true;
              const newItem = { ...item };
              newItem.name = updatedProduct.name;
              newItem.mrp = updatedProduct.mrp;
              newItem.category = updatedProduct.category;
              newItem.measuring = updatedProduct.measuring;
              newItem.barcode = updatedProduct.barcode;

              newItem.retailPrice = updatedProduct.retailPrice;
              newItem.wholesalePrice = updatedProduct.wholesalePrice;
              newItem.superWholesalePrice = updatedProduct.superWholesalePrice;

              if (newItem.type === "SUPERWHOLESALE") {
                newItem.price = updatedProduct.superWholesalePrice;
              } else if (newItem.type === "WHOLESALE") {
                newItem.price = updatedProduct.wholesalePrice;
              } else {
                newItem.price = updatedProduct.retailPrice;
              }

              const totalPieces =
                newItem.piece +
                newItem.box * newItem.boxQuantity +
                newItem.packet * newItem.packetQuantity;

              newItem.total = totalPieces * newItem.price - (newItem.discount || 0);
              return newItem;
            }
            return item;
          });

          if (billUpdated) {
            return {
              ...bill,
              purchased: newPurchased,
              total: newPurchased.reduce((sum, item) => sum + item.total, 0),
            };
          }
          return bill;
        });

        return { bills: newBills };
      });
    },
    afterProductDeleted: (productId: string) => {
      set((state) => {
        const newBills = state.bills.map((bill) => {
          // Check if product is in this bill
          const hasProduct = bill.purchased.some((item) => item.id === productId);

          if (hasProduct) {
            const newPurchased = bill.purchased.filter((item) => item.id !== productId);
            return {
              ...bill,
              purchased: newPurchased,
              total: newPurchased.reduce((sum, item) => sum + item.total, 0),
            };
          }
          return bill;
        });

        return { bills: newBills };
      });
    },
    afterStockUpdated: (updatedProduct) => {
      const updatedProductMap = new Map(
        updatedProduct.map((prod) => [prod.productId, prod])
      );
      const { bills } = get();
      const newBills = bills.map((bill) => {
        const updatedPurchsed = bill.purchased.map((product) => {
          if (updatedProductMap.has(product.id)) {
            const updatedProd = updatedProductMap.get(product.id);
            if (updatedProd) {
              return {
                ...product,
                stock: updatedProd.newStock,
              };
            }
          }
          return product;
        });
        return {
          ...bill,
          purchased: updatedPurchsed,
        };
      });
      set({ bills: newBills });
    },
    addCreatedAt: (billId: string, createdAt: string, customer: Customer) => {
      set((state) => {
        const bills = [...state.bills];
        const billIndex = bills.findIndex((bill) => bill.id === billId);

        if (billIndex === -1) return state;

        bills[billIndex].createdAt = createdAt;
        bills[billIndex].customer = customer;
        return { bills };
      });
    },
  };
});

export default useCurrentBillStore;
