import React, { useState, useMemo, useEffect } from "react";
import {
  Modal,
  Table,
  InputNumber,
  Select,
  Button,
  Tag,
  Alert,
  Popconfirm,
  Tooltip,
} from "antd";
import { message } from "../utils/antdStatic";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  DollarOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import apiCaller from "../utils/apiCaller";
import useProductStore, { IProduct } from "../store/product.store";
import useCategoriesStore from "../store/categories.store";
import { calculatePriceTag, PriceType } from "../utils/priceUtils";
import SearchWithSuggestions from "./SearchWithSuggestions";

interface AlterBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: any;
  basePreviousOutstanding?: number;
  onSuccess: () => void;
}

interface EditableBillItem {
  id: string; // product id
  name: string;
  category?: string;
  measuring?: "kg" | "pieces";
  price: number;
  mrp: number;
  type: PriceType;
  piece: number;
  packet: number;
  box: number;
  packetQuantity: number;
  boxQuantity: number;
  discount: number;
  total: number;
  retailPrice: number;
  wholesalePrice: number;
  superWholesalePrice: number;
  stock?: number;
  hasCustomType?: boolean;
  hasCustomPrice?: boolean;
}

const AlterBillModal: React.FC<AlterBillModalProps> = ({
  isOpen,
  onClose,
  bill,
  basePreviousOutstanding: propBasePreviousOutstanding,
  onSuccess,
}) => {
  const products = useProductStore((state) => state.products);
  const categories = useCategoriesStore((state) => state.categories);
  const setCategories = useCategoriesStore((state) => state.setCategories);

  const [items, setItems] = useState<EditableBillItem[]>([]);
  const [billDiscount, setBillDiscount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const billType: PriceType = (bill?.billType || bill?.type || "RETAIL") as PriceType;

  // Ensure categories are loaded for priceUtils calculation
  useEffect(() => {
    if (isOpen && (!categories || categories.length === 0)) {
      apiCaller
        .get("/categories")
        .then((res) => {
          const fetched =
            res.data?.data?.categories || res.data?.categories || [];
          if (Array.isArray(fetched) && fetched.length > 0) {
            setCategories(fetched);
          }
        })
        .catch((err) => {
          console.error("Failed to load categories in AlterBillModal", err);
        });
    }
  }, [isOpen, categories, setCategories]);

  // Initialize items from current bill
  useEffect(() => {
    if (isOpen && bill) {
      setBillDiscount(bill.discount || 0);

      const initialItems: EditableBillItem[] = (bill.items || []).map(
        (item: any) => {
          const snap = item.productSnapshot || {};
          const prod =
            typeof item.product === "object" && item.product !== null
              ? item.product
              : {};
          const pid = snap.id || prod._id || item.product || "";
          const storeProd = products.find((p) => p._id === pid.toString());

          const piece = snap.piece ?? item.quantity ?? 1;
          const packet = snap.packet ?? 0;
          const box = snap.box ?? 0;
          const packetQuantity =
            snap.packetQuantity ?? prod.packet ?? storeProd?.packet ?? 1;
          const boxQuantity =
            snap.boxQuantity ?? prod.box ?? storeProd?.box ?? 1;

          const totalUnits =
            piece + packet * packetQuantity + box * boxQuantity;

          const derivedPrice =
            snap.price != null
              ? snap.price
              : totalUnits > 0
                ? (item.total ?? 0) / totalUnits
                : 0;

          const retailPrice =
            prod.retailPrice ??
            snap.retailPrice ??
            storeProd?.retailPrice ??
            derivedPrice;
          const wholesalePrice =
            prod.wholesalePrice ??
            snap.wholesalePrice ??
            storeProd?.wholesalePrice ??
            retailPrice;
          const superWholesalePrice =
            prod.superWholesalePrice ??
            snap.superWholesalePrice ??
            storeProd?.superWholesalePrice ??
            retailPrice;
          const category =
            snap.category || prod.category || storeProd?.category;

          const itemType = (item.type || snap.type || "RETAIL") as PriceType;

          // Check what priceUtils would calculate for this item
          const autoTag = calculatePriceTag(
            {
              retailPrice,
              wholesalePrice,
              superWholesalePrice,
              category,
              piece: totalUnits,
            },
            totalUnits,
            billType,
          );

          const hasCustomType =
            snap.hasCustomType !== undefined
              ? !!snap.hasCustomType
              : itemType !== autoTag.type;

          const expectedPrice = hasCustomType
            ? itemType === "SUPERWHOLESALE"
              ? superWholesalePrice
              : itemType === "WHOLESALE"
                ? wholesalePrice
                : retailPrice
            : autoTag.price;

          const hasCustomPrice =
            snap.hasCustomPrice !== undefined
              ? !!snap.hasCustomPrice
              : Math.abs(derivedPrice - expectedPrice) > 0.01;

          return {
            id: pid.toString(),
            name: snap.name || prod.name || storeProd?.name || "Product",
            category,
            measuring: snap.measuring || prod.measuring || storeProd?.measuring || "pieces",
            price: derivedPrice,
            mrp: snap.mrp ?? prod.mrp ?? storeProd?.mrp ?? derivedPrice,
            type: itemType,
            piece,
            packet,
            box,
            packetQuantity,
            boxQuantity,
            discount: item.discount ?? snap.discount ?? 0,
            total: item.total ?? snap.total ?? 0,
            retailPrice,
            wholesalePrice,
            superWholesalePrice,
            stock: prod.stock ?? storeProd?.stock,
            hasCustomType,
            hasCustomPrice,
          };
        },
      );

      setItems(initialItems);
    }
  }, [isOpen, bill, products]);

  // Handle adding product from search
  const handleAddProduct = (selectedProd: IProduct) => {
    const existingIndex = items.findIndex((i) => i.id === selectedProd._id);
    if (existingIndex > -1) {
      // Increment quantity of existing item
      const updated = [...items];
      const existing = { ...updated[existingIndex] };
      const newPiece = existing.piece + 1;
      existing.piece = newPiece;

      const totalUnits =
        newPiece +
        existing.packet * existing.packetQuantity +
        existing.box * existing.boxQuantity;

      // Automatically recalculate price tag using priceUtils if not manually overridden
      if (!existing.hasCustomType && !existing.hasCustomPrice) {
        const priceTag = calculatePriceTag(existing, totalUnits, billType);
        existing.type = priceTag.type;
        existing.price = priceTag.price;
      } else if (existing.hasCustomType && !existing.hasCustomPrice) {
        existing.price =
          existing.type === "SUPERWHOLESALE"
            ? existing.superWholesalePrice || existing.retailPrice
            : existing.type === "WHOLESALE"
              ? existing.wholesalePrice || existing.retailPrice
              : existing.retailPrice;
      }

      const subtotal = Math.max(
        0,
        totalUnits * existing.price - existing.discount,
      );

      existing.total = subtotal;
      updated[existingIndex] = existing;
      setItems(updated);
      message.info(`Incremented quantity for ${selectedProd.name}`);
      return;
    }

    const defaultRetail = selectedProd.retailPrice || selectedProd.mrp || 0;
    const defaultWholesale = selectedProd.wholesalePrice || defaultRetail;
    const defaultSuperWholesale = selectedProd.superWholesalePrice || defaultRetail;

    // Calculate initial price tag via priceUtils
    const priceTag = calculatePriceTag(
      {
        retailPrice: defaultRetail,
        wholesalePrice: defaultWholesale,
        superWholesalePrice: defaultSuperWholesale,
        category: selectedProd.category,
        piece: 1,
      },
      1,
      billType,
    );

    const newItem: EditableBillItem = {
      id: selectedProd._id,
      name: selectedProd.name,
      category: selectedProd.category,
      measuring: selectedProd.measuring,
      price: priceTag.price,
      mrp: selectedProd.mrp || defaultRetail,
      type: priceTag.type,
      piece: 1,
      packet: 0,
      box: 0,
      packetQuantity: selectedProd.packet || 1,
      boxQuantity: selectedProd.box || 1,
      discount: 0,
      total: priceTag.price,
      retailPrice: defaultRetail,
      wholesalePrice: defaultWholesale,
      superWholesalePrice: defaultSuperWholesale,
      stock: selectedProd.stock,
      hasCustomType: false,
      hasCustomPrice: false,
    };

    setItems((prev) => [newItem, ...prev]);
    message.success(`Added ${selectedProd.name} to bill`);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (
    index: number,
    updates: Partial<EditableBillItem>,
  ) => {
    setItems((prev) => {
      const updated = [...prev];
      const current = { ...updated[index], ...updates };

      // Manual type change overrides auto type
      if (updates.type !== undefined) {
        current.hasCustomType = true;
        current.hasCustomPrice = false;
        if (updates.type === "RETAIL") {
          current.price = current.retailPrice;
        } else if (updates.type === "WHOLESALE") {
          current.price = current.wholesalePrice || current.retailPrice;
        } else if (updates.type === "SUPERWHOLESALE") {
          current.price = current.superWholesalePrice || current.retailPrice;
        }
      }

      // Manual price change overrides auto price
      if (updates.price !== undefined) {
        current.hasCustomPrice = true;
      }

      // Calculate total units
      const totalUnits =
        (current.piece || 0) +
        (current.packet || 0) * (current.packetQuantity || 1) +
        (current.box || 0) * (current.boxQuantity || 1);

      const quantityChanged =
        updates.piece !== undefined ||
        updates.packet !== undefined ||
        updates.box !== undefined;

      // Recalculate using priceUtils if quantity changed and pricing is not manually locked
      if (quantityChanged && !current.hasCustomType && !current.hasCustomPrice) {
        const priceTag = calculatePriceTag(current, totalUnits, billType);
        current.type = priceTag.type;
        current.price = priceTag.price;
      }

      current.total = Math.max(
        0,
        totalUnits * (current.price || 0) - (current.discount || 0),
      );
      updated[index] = current;
      return updated;
    });
  };

  const handleResetAutoPrice = (index: number) => {
    setItems((prev) => {
      const updated = [...prev];
      const current = { ...updated[index] };
      current.hasCustomType = false;
      current.hasCustomPrice = false;

      const totalUnits =
        (current.piece || 0) +
        (current.packet || 0) * (current.packetQuantity || 1) +
        (current.box || 0) * (current.boxQuantity || 1);

      const priceTag = calculatePriceTag(current, totalUnits, billType);
      current.type = priceTag.type;
      current.price = priceTag.price;
      current.total = Math.max(
        0,
        totalUnits * current.price - (current.discount || 0),
      );

      updated[index] = current;
      return updated;
    });
  };

  // Financial Calculations
  const calculations = useMemo(() => {
    const originalProductsTotal =
      bill?.productsTotal ??
      bill?.items?.reduce((sum: number, it: any) => sum + (it.total || 0), 0) ??
      0;
    const originalBillTotal = bill?.total ?? 0;
    const originalDiscount = bill?.discount ?? 0;
    const checkoutPayment = bill?.payment ?? 0;

    const basePreviousOutstanding =
      propBasePreviousOutstanding ??
      originalBillTotal - originalProductsTotal + originalDiscount;

    const newProductsTotal = items.reduce(
      (sum, it) => sum + (it.total || 0),
      0,
    );
    const newBillTotal = Math.ceil(
      newProductsTotal + basePreviousOutstanding - billDiscount,
    );
    const newCustomerOutstanding = newBillTotal - checkoutPayment;
    const productsDiff = newProductsTotal - originalProductsTotal;
    const outstandingDiff = newBillTotal - originalBillTotal;

    return {
      originalProductsTotal,
      originalBillTotal,
      basePreviousOutstanding,
      checkoutPayment,
      newProductsTotal,
      newBillTotal,
      newCustomerOutstanding,
      productsDiff,
      outstandingDiff,
    };
  }, [bill, items, billDiscount, propBasePreviousOutstanding]);

  const handleSubmit = async () => {
    if (items.length === 0) {
      message.error("The bill must contain at least one item.");
      return;
    }

    setLoading(true);
    try {
      const payloadProducts = items.map((it) => ({
        id: it.id,
        name: it.name,
        piece: it.piece || 0,
        packet: it.packet || 0,
        box: it.box || 0,
        packetQuantity: it.packetQuantity || 1,
        boxQuantity: it.boxQuantity || 1,
        type: it.type || "RETAIL",
        price: it.price || 0,
        discount: it.discount || 0,
        total: it.total || 0,
        category: it.category,
        retailPrice: it.retailPrice,
        wholesalePrice: it.wholesalePrice,
        superWholesalePrice: it.superWholesalePrice,
        mrp: it.mrp,
        hasCustomType: it.hasCustomType,
        hasCustomPrice: it.hasCustomPrice,
      }));

      await apiCaller.put(`/bills/${bill._id || bill.id}/alter`, {
        products: payloadProducts,
        discount: billDiscount,
      });

      message.success("Bill altered successfully!");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      message.error(
        error.response?.data?.message ||
          error.response?.data?.msg ||
          "Failed to alter bill",
      );
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: (
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
          Product
        </span>
      ),
      key: "name",
      render: (_: any, record: EditableBillItem) => (
        <div>
          <div className="font-bold text-gray-800 text-sm leading-snug">
            {record.name}
          </div>
          <div className="text-[10px] text-gray-400 font-semibold mt-0.5">
            MRP: ₹{record.mrp} {record.category ? `· ${record.category}` : ""}
          </div>
        </div>
      ),
    },
    {
      title: (
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center block">
          Pricing Tier
        </span>
      ),
      key: "type",
      width: 140,
      render: (_: any, record: EditableBillItem, index: number) => (
        <div className="flex flex-col gap-1">
          <Select
            size="small"
            value={record.type}
            onChange={(type) => handleUpdateItem(index, { type })}
            className="w-full text-xs font-semibold"
            options={[
              { label: "Retail", value: "RETAIL" },
              { label: "Wholesale", value: "WHOLESALE" },
              { label: "Super WS", value: "SUPERWHOLESALE" },
            ]}
          />
          {(record.hasCustomType || record.hasCustomPrice) && (
            <div className="flex items-center justify-between px-0.5">
              <span className="text-[9px] text-amber-600 font-bold tracking-tight">
                Manual
              </span>
              <button
                type="button"
                onClick={() => handleResetAutoPrice(index)}
                className="text-[9px] text-indigo-600 hover:text-indigo-800 underline font-semibold cursor-pointer"
                title="Reset to category tier pricing"
              >
                Reset Auto
              </button>
            </div>
          )}
        </div>
      ),
    },
    {
      title: (
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center block">
          Unit Rate
        </span>
      ),
      key: "price",
      width: 105,
      align: "center" as const,
      render: (_: any, record: EditableBillItem, index: number) => (
        <InputNumber
          size="small"
          min={0}
          value={record.price}
          onChange={(val) => handleUpdateItem(index, { price: val || 0 })}
          className="w-full text-xs text-center font-bold"
          prefix="₹"
        />
      ),
    },
    {
      title: (
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center block">
          Qty (Pcs/Pkts/Box)
        </span>
      ),
      key: "quantities",
      width: 200,
      align: "center" as const,
      render: (_: any, record: EditableBillItem, index: number) => {
        const totalUnits =
          (record.piece || 0) +
          (record.packet || 0) * (record.packetQuantity || 1) +
          (record.box || 0) * (record.boxQuantity || 1);

        return (
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1">
              <Tooltip title="Pieces">
                <InputNumber
                  size="small"
                  min={0}
                  value={record.piece}
                  onChange={(val) =>
                    handleUpdateItem(index, { piece: val || 0 })
                  }
                  className="w-16 text-center text-xs font-bold"
                  placeholder="Pcs"
                />
              </Tooltip>
              {record.packetQuantity > 1 && (
                <Tooltip title={`Packets (${record.packetQuantity} pcs/pkt)`}>
                  <InputNumber
                    size="small"
                    min={0}
                    value={record.packet}
                    onChange={(val) =>
                      handleUpdateItem(index, { packet: val || 0 })
                    }
                    className="w-14 text-center text-xs text-orange-600"
                    placeholder="Pkt"
                  />
                </Tooltip>
              )}
              {record.boxQuantity > 1 && (
                <Tooltip title={`Boxes (${record.boxQuantity} pcs/box)`}>
                  <InputNumber
                    size="small"
                    min={0}
                    value={record.box}
                    onChange={(val) =>
                      handleUpdateItem(index, { box: val || 0 })
                    }
                    className="w-14 text-center text-xs text-indigo-600"
                    placeholder="Box"
                  />
                </Tooltip>
              )}
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase">
              Total: {totalUnits} units
            </span>
          </div>
        );
      },
    },
    {
      title: (
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center block">
          Discount
        </span>
      ),
      key: "discount",
      width: 90,
      align: "center" as const,
      render: (_: any, record: EditableBillItem, index: number) => (
        <InputNumber
          size="small"
          min={0}
          value={record.discount}
          onChange={(val) => handleUpdateItem(index, { discount: val || 0 })}
          className="w-full text-xs text-center text-orange-600 font-bold"
          prefix="₹"
        />
      ),
    },
    {
      title: (
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center block">
          Total
        </span>
      ),
      key: "total",
      width: 100,
      align: "center" as const,
      render: (_: any, record: EditableBillItem) => (
        <span className="font-black text-indigo-600 text-sm">
          ₹{Math.round(record.total).toLocaleString()}
        </span>
      ),
    },
    {
      title: "",
      key: "action",
      width: 50,
      align: "center" as const,
      render: (_: any, __: any, index: number) => (
        <Popconfirm
          title="Remove this item from the bill?"
          onConfirm={() => handleRemoveItem(index)}
          okText="Remove"
          cancelText="Keep"
          okButtonProps={{ danger: true, size: "small" }}
          cancelButtonProps={{ size: "small" }}
        >
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            size="small"
            className="hover:bg-red-50 rounded-lg"
          />
        </Popconfirm>
      ),
    },
  ];

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={980}
      centered
      destroyOnClose
      className="modern-modal"
      bodyStyle={{ padding: 0, maxHeight: "90vh", overflowY: "auto" }}
    >
      <div className="p-6 sm:p-8 bg-gray-50/50">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-full mb-2 border border-amber-200">
              <EditOutlined className="text-[10px]" />
              <span className="text-[9px] font-black uppercase tracking-widest">
                Edit Bill (Admin)
              </span>
            </div>
            <h2 className="text-2xl font-black text-gray-800 tracking-tight">
              Edit Bill #
              {bill?.id ? `B-${bill.id}` : bill?._id?.slice(-6).toUpperCase()}
            </h2>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 mt-1">
              <span className="capitalize">
                {bill?.customer?.name || "Customer"}
              </span>
              <span>·</span>
              <span>{bill?.customer?.phone || "No phone"}</span>
            </div>
          </div>

          <div className="text-left sm:text-right bg-white px-4 py-2.5 rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
              Original Bill Total
            </span>
            <span className="text-xl font-black text-gray-800">
              ₹{Number(bill?.total || 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Product Search Bar to Add New Items */}
        <div className="mt-6 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
            <PlusOutlined className="text-indigo-500" /> Add Product to Invoice
          </label>
          <SearchWithSuggestions
            data={products}
            onSelect={handleAddProduct}
            placeholder="Search by Product name or Barcode to add item..."
            searchKeys={["name", "barcode"]}
            autoSelect={true}
            primaryKey="name"
            displayKeys={["name", "stock"]}
            stockRequired={false}
            className="w-full"
          />
        </div>

        {/* Line Items Table */}
        <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-50 flex items-center justify-between">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Invoice Items ({items.length})
            </span>
            <span className="text-xs font-black text-indigo-600">
              Products Subtotal: ₹
              {Math.round(calculations.newProductsTotal).toLocaleString()}
            </span>
          </div>
          <Table
            dataSource={items}
            columns={columns}
            rowKey="id"
            pagination={false}
            size="middle"
            scroll={{ x: 700 }}
            locale={{
              emptyText:
                "No products in bill. Use the search bar above to add items.",
            }}
          />
        </div>

        {/* Overall Bill Discount & Financial Breakdown */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Discount & Adjustments */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
              Invoice Adjustments
            </span>

            <div>
              <label className="text-xs font-bold text-gray-600 mb-1.5 block">
                Bill-Level Discount (₹)
              </label>
              <InputNumber
                min={0}
                value={billDiscount}
                onChange={(val) => setBillDiscount(val || 0)}
                className="w-full text-base font-bold text-orange-600"
                placeholder="Discount Amount"
                prefix="₹"
              />
            </div>

            <div className="pt-3 border-t border-gray-50 space-y-2 text-xs">
              <div className="flex justify-between font-semibold text-gray-500">
                <span>Base Customer Balance Prior to Bill:</span>
                <span className="text-gray-700">
                  ₹
                  {Math.round(
                    calculations.basePreviousOutstanding,
                  ).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between font-semibold text-gray-500">
                <span>Payment Paid at Checkout:</span>
                <span className="text-green-600">
                  ₹{Number(calculations.checkoutPayment).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* New Balances Summary Card */}
          <div className="bg-indigo-600 text-white p-6 rounded-3xl shadow-xl shadow-indigo-100 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest block mb-2">
                Financial Reconciliation
              </span>

              <div className="space-y-2 text-xs font-bold text-indigo-100/90 pb-4 border-b border-indigo-400/30">
                <div className="flex justify-between">
                  <span>New Products Total:</span>
                  <span className="text-white font-black">
                    ₹
                    {Math.round(calculations.newProductsTotal).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Net Difference in Bill:</span>
                  <span
                    className={
                      calculations.productsDiff >= 0
                        ? "text-green-300 font-black"
                        : "text-orange-300 font-black"
                    }
                  >
                    {calculations.productsDiff >= 0 ? "+" : ""}₹
                    {Math.round(calculations.productsDiff).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 grid grid-cols-2 gap-4">
              <div>
                <span className="text-[9px] font-black text-indigo-200 uppercase tracking-wider block">
                  New Bill Total
                </span>
                <span className="text-2xl font-black text-white tracking-tight">
                  ₹{Math.round(calculations.newBillTotal).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-black text-indigo-200 uppercase tracking-wider block">
                  New Cust. Balance
                </span>
                <span className="text-2xl font-black text-white tracking-tight">
                  ₹
                  {Math.round(
                    calculations.newCustomerOutstanding,
                  ).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Warning & Submit Actions */}
        <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 px-4 py-2.5 rounded-xl border border-amber-200/60 font-medium">
            <InfoCircleOutlined className="text-amber-600" />
            <span>
              Editing this bill will automatically adjust shop stock and update customer balance.
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 shrink-0">
            <Button
              onClick={onClose}
              disabled={loading}
              className="h-12 px-6 rounded-xl font-bold text-gray-500 hover:text-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={loading}
              icon={<CheckCircleOutlined />}
              className="h-12 px-8 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-indigo-500/20"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AlterBillModal;
