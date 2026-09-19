import { Typography } from "antd";

import useCurrentBillStore, {
  PurchasedProduct,
} from "../store/currentBill.store";
import useUserStore from "../store/user.store";
import { useEffect, useState } from "react";
import {
  calculateDate,
  calculateMeasuring,
  calculateTime,
} from "../utils/bill.util";

const { Title } = Typography;

interface BillPrintProps {
  onClose: () => void;
  contentRef: React.RefObject<HTMLDivElement | null>;
  handlePrint: () => void;
  printBillData?: any;
  isDirectPrint?: boolean;
}

const BillPrint = ({
  onClose,
  contentRef,
  handlePrint,
  printBillData,
  isDirectPrint = false,
}: BillPrintProps) => {
  const shopName = useUserStore((state) => state.user?.shopName) || "InvoSync Shop";
  const shopAddress = useUserStore((state) => state.user?.shopAddress) || "";
  const shopPhone = useUserStore((state) => state.user?.shopPhone) || "";

  const calculateSave = (product: PurchasedProduct[]) => {
    let saved = 0;
    for (let i = 0; i < product.length; i++) {
      const quantity =
        product[i].piece +
        product[i].box * product[i].boxQuantity +
        product[i].packet * product[i].packetQuantity;
      let temp = product[i].mrp * quantity;
      saved += temp - product[i].price * quantity;
    }
    return saved;
  };
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        handlePrint();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  // Use printBillData if provided, otherwise fallback to currentBill from store
  let currentBill: any = null;
  if (
    printBillData &&
    printBillData.bill &&
    Array.isArray(printBillData.bill.items)
  ) {
    console.log(printBillData, "print bill data");

    // If backend response structure is printBillData.bill
    currentBill = printBillData.bill;
    // Map items to purchased for compatibility
    if (currentBill.items && !currentBill.purchased) {
      currentBill.purchased = currentBill.items.map((item: any) => {
        const snap = item.productSnapshot || {};
        const prod =
          typeof item.product === "object" && item.product !== null
            ? item.product
            : {};
        const totalQty = item.quantity ?? 0;
        const derivedPrice =
          snap.price != null
            ? snap.price
            : totalQty > 0
              ? (item.total ?? 0) / totalQty
              : 0;
        return {
          ...snap,
          ...item,
          name: snap.name ?? prod.name ?? "Deleted Product",
          mrp: snap.mrp ?? prod.mrp ?? 0,
          measuring: snap.measuring ?? prod.measuring ?? "piece",
          price: derivedPrice,
          piece: snap.piece ?? totalQty,
          packet: snap.packet ?? 0,
          box: snap.box ?? 0,
          boxQuantity: snap.boxQuantity ?? prod.box ?? 1,
          packetQuantity: snap.packetQuantity ?? prod.packet ?? 1,
          discount: snap.discount ?? item.discount ?? 0,
          total: item.total ?? snap.total ?? 0,
        };
      });
    }
  }
  // Attach customer info if available (always do this if present)
  if (printBillData && printBillData.updatedCustomer && currentBill) {
    currentBill.customer = printBillData.updatedCustomer;
  }

  console.log(currentBill, "current bill");
  // Calculate Bill Total from purchased
  const billTotal = Math.ceil(currentBill?.purchased
    ? currentBill.purchased.reduce(
      (sum: number, p: any) => sum + (p.total || 0),
      0
    )
    : currentBill?.total || 0);
  // Discount
  const discount = Math.ceil(currentBill?.discount || 0);
  // Outstanding from customer
  const customerOutstanding = Math.ceil(currentBill.total - billTotal + discount);
  // Payment
  const paymentValue = Math.ceil(currentBill.payment || 0);
  // Total before payment (rounded)
  const totalBeforePayment = Math.ceil(billTotal + customerOutstanding - discount);
  // Final Outstanding after payment
  const finalOutstanding = Math.ceil(totalBeforePayment - paymentValue);
  const printType =
    useUserStore((state) => state.user?.shopSettings?.printType) || "THERMAL";
  const isA4 = printType === "A4";

  return (
    <div
      className={`fixed inset-0 bg-black flex items-center justify-center z-50 ${
        isDirectPrint ? "opacity-0 pointer-events-none" : "bg-opacity-50"
      }`}
    >
      <div
        className={`bg-white p-6 rounded-lg shadow-lg ${
          isA4 ? "w-[800px] max-h-[90vh] overflow-y-auto" : "w-[450px]"
        }`}
      >
        <div className="flex justify-between items-center mb-4">
          <Title level={4}>
            {isA4 ? "Print A4 Tax Invoice" : "Print Thermal Receipt"}
          </Title>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {currentBill && (
          <div
            ref={contentRef}
            className={`text-sm ${
              isA4 ? "p-6 bg-white w-full" : "w-[330px] mx-auto"
            }`}
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {isA4 ? (
              /* ================== A4 INVOICE LAYOUT ================== */
              <div className="text-gray-800 text-xs">
                <header className="border-b-2 border-gray-800 pb-4 mb-4 flex justify-between items-start">
                  <div>
                    <h1 className="text-2xl font-black tracking-tight text-gray-900">
                      {shopName}
                    </h1>
                    {shopAddress && (
                      <p className="text-xs text-gray-600 max-w-sm mt-1">
                        {shopAddress}
                      </p>
                    )}
                    {shopPhone && (
                      <p className="text-xs text-gray-600 font-semibold mt-0.5">
                        Phone: {shopPhone}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black uppercase tracking-widest bg-gray-900 text-white px-3 py-1 rounded">
                      TAX INVOICE
                    </span>
                    <p className="font-bold mt-2">
                      Invoice No:{" "}
                      <span className="font-black font-mono">
                        {currentBill.id ? `INV-${currentBill.id}` : "N/A"}
                      </span>
                    </p>
                    <p className="text-gray-600">
                      Date:{" "}
                      {currentBill.createdAt
                        ? calculateDate(new Date(currentBill.createdAt))
                        : calculateDate(new Date())}{" "}
                      |{" "}
                      {currentBill.createdAt
                        ? calculateTime(new Date(currentBill.createdAt))
                        : calculateTime(new Date())}
                    </p>
                  </div>
                </header>

                {/* Customer Details Box */}
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">
                      Billed To
                    </span>
                    <p className="font-bold text-sm text-gray-900 capitalize">
                      {currentBill?.customer?.name || "Walk-in Customer"}
                    </p>
                    <p className="text-xs text-gray-600">
                      Contact: {currentBill?.customer?.phone || "N/A"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">
                      Payment Mode
                    </span>
                    <p className="font-bold text-gray-900">
                      {paymentValue > 0 ? "PAID (Part/Full)" : "PENDING / CREDIT"}
                    </p>
                    <p className="text-xs text-gray-600">
                      Total Items: {currentBill?.purchased?.length || 0}
                    </p>
                  </div>
                </div>

                {/* A4 Items Table */}
                <table className="w-full border-collapse border border-gray-300 mb-4">
                  <thead>
                    <tr className="bg-gray-100 text-gray-700 font-bold border-b border-gray-300 text-left">
                      <th className="p-2 border-r border-gray-300 w-10 text-center">
                        #
                      </th>
                      <th className="p-2 border-r border-gray-300">
                        Item Description
                      </th>
                      <th className="p-2 border-r border-gray-300 text-center w-24">
                        Rate (₹)
                      </th>
                      <th className="p-2 border-r border-gray-300 text-center w-24">
                        Quantity
                      </th>
                      <th className="p-2 border-r border-gray-300 text-center w-20">
                        Disc (₹)
                      </th>
                      <th className="p-2 text-right w-24">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentBill?.purchased &&
                      [...currentBill.purchased].reverse().map((product, idx) => {
                        const total =
                          product.piece +
                          product.box * product.boxQuantity +
                          product.packet * product.packetQuantity;
                        const price = product.price;
                        const rowTotal = price * total - (product.discount || 0);

                        return (
                          <tr
                            key={product.id || idx}
                            className="border-b border-gray-200"
                          >
                            <td className="p-2 border-r border-gray-200 text-center text-gray-500">
                              {idx + 1}
                            </td>
                            <td className="p-2 border-r border-gray-200 font-semibold capitalize">
                              {product.name}
                            </td>
                            <td className="p-2 border-r border-gray-200 text-center">
                              {price.toFixed(2)}
                            </td>
                            <td className="p-2 border-r border-gray-200 text-center font-bold">
                              {product.measuring === "kg"
                                ? calculateMeasuring(total)
                                : total % 1 !== 0
                                ? total.toFixed(3)
                                : total}
                            </td>
                            <td className="p-2 border-r border-gray-200 text-center text-gray-500">
                              {(product.discount || 0).toFixed(2)}
                            </td>
                            <td className="p-2 text-right font-bold">
                              {rowTotal.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>

                {/* A4 Summary Block */}
                <div className="flex justify-end">
                  <div className="w-64 space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-gray-200">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-bold">₹{billTotal.toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between py-1 border-b border-gray-200 text-green-600 font-semibold">
                        <span>Discount:</span>
                        <span>-₹{discount.toFixed(2)}</span>
                      </div>
                    )}
                    {customerOutstanding !== 0 && (
                      <div className="flex justify-between py-1 border-b border-gray-200 text-amber-700">
                        <span>
                          {customerOutstanding > 0 ? "Prev. Balance:" : "Credit Balance:"}
                        </span>
                        <span>₹{customerOutstanding.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-1 text-sm font-black border-b-2 border-gray-800">
                      <span>Grand Total:</span>
                      <span>₹{totalBeforePayment.toFixed(2)}</span>
                    </div>
                    {paymentValue > 0 && (
                      <div className="flex justify-between py-1 border-b border-gray-200 text-blue-700 font-semibold">
                        <span>Amount Paid:</span>
                        <span>₹{paymentValue.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-1.5 text-sm font-black bg-gray-100 px-2 rounded">
                      <span>{finalOutstanding > 0 ? "Balance Due:" : "Balance Credit:"}</span>
                      <span className={finalOutstanding > 0 ? "text-red-600" : "text-green-600"}>
                        ₹{Math.abs(finalOutstanding).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {calculateSave(currentBill.purchased) > 0 && (
                  <div className="mt-4 p-2 bg-green-50 border border-green-200 rounded text-center text-green-700 font-bold text-xs">
                    🎉 Total Savings on this Invoice: ₹
                    {calculateSave(currentBill.purchased).toFixed(2)}
                  </div>
                )}

                <footer className="mt-8 pt-4 border-t border-gray-300 text-center text-[10px] text-gray-400">
                  Thank you for your business! | Powered by InvoSync
                </footer>
              </div>
            ) : (
              /* ================== THERMAL 80MM RECEIPT LAYOUT ================== */
              <div style={{ fontWeight: 700 }}>
                <header className="flex items-center flex-col justify-center">
                  <h1 className="ml-1 font-bold text-center">{shopName}</h1>
                  {shopAddress && (
                    <p className="text-xs font-semibold text-center">
                      {shopAddress}
                    </p>
                  )}
                  {shopPhone && (
                    <p className="text-xs font-semibold">Mob: {shopPhone}</p>
                  )}
                  <div className="font-bold mt-2">
                    -----------------------------------------
                  </div>
                  <div className="text-xs justify-between font-semibold flex w-full">
                    <span id="left">
                      <p>
                        Invoice:{" "}
                        {currentBill.id ? `B-${currentBill.id}` : "Old Bill"}
                      </p>
                      <p>
                        Date:{" "}
                        {currentBill.createdAt
                          ? calculateDate(new Date(currentBill.createdAt))
                          : calculateDate(new Date())}
                      </p>
                    </span>
                    <span id="right" className="text-right">
                      <p>Payment: {paymentValue}</p>
                      <p>
                        Time:{" "}
                        {currentBill.createdAt
                          ? calculateTime(new Date(currentBill.createdAt))
                          : calculateTime(new Date())}
                      </p>
                    </span>
                  </div>
                </header>

                <div className="flex text-xs justify-between font-semibold mt-1">
                  <span>
                    Cust:{" "}
                    <span className="capitalize italic">
                      {currentBill?.customer?.name || "Walk-in"}
                    </span>
                  </span>
                  <span>
                    Mob: {currentBill?.customer?.phone || "N/A"}
                  </span>
                </div>
                <p className="font-semibold text-xs mt-1">
                  Total Items: {currentBill?.purchased?.length || 0}
                </p>

                <div className="font-bold my-1">
                  -----------------------------------------
                </div>
                <main className="flex text-xs items-center font-semibold justify-center flex-col">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="border border-black p-1 text-left">Item</th>
                        <th className="border border-black p-1 text-center">Qty</th>
                        <th className="border border-black p-1 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentBill?.purchased &&
                        [...currentBill.purchased].reverse().map((product) => {
                          const total =
                            product.piece +
                            product.box * product.boxQuantity +
                            product.packet * product.packetQuantity;
                          const price = product.price;

                          return (
                            <tr key={product.id} className="border border-black">
                              <td className="p-1 capitalize">
                                {product.name}
                              </td>
                              <td className="p-1 text-center">
                                {product.measuring === "kg"
                                  ? calculateMeasuring(total)
                                  : total % 1 !== 0
                                  ? total.toFixed(3)
                                  : total}
                              </td>
                              <td className="p-1 text-right">
                                {(price * total - product.discount) % 1 !== 0
                                  ? (price * total - product.discount).toFixed(2)
                                  : price * total - product.discount}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>

                  <div className="w-full mt-2 flex flex-col pr-1 justify-end items-end space-y-0.5">
                    <div>Bill Total: ₹{billTotal}</div>
                    {discount > 0 && <div>Discount: -₹{discount}</div>}
                    {customerOutstanding !== 0 && (
                      <div>
                        {customerOutstanding > 0 ? "Outstanding: " : "Balance: "}
                        ₹{customerOutstanding}
                      </div>
                    )}
                    <div className="font-bold">Total: ₹{totalBeforePayment}</div>
                    {paymentValue > 0 && <div>Payment: -₹{paymentValue}</div>}
                    <div className="font-bold">
                      {finalOutstanding > 0
                        ? `Outstanding: ₹${finalOutstanding}`
                        : `Balance: ₹${finalOutstanding}`}
                    </div>
                    {calculateSave(currentBill.purchased) > 0 && (
                      <>
                        <div className="w-full text-center">
                          -----------------------------------------
                        </div>
                        <div className="font-bold text-center w-full text-sm">
                          You Saved: ₹
                          {calculateSave(currentBill.purchased).toFixed(2)}
                        </div>
                        <div className="w-full text-center">
                          -----------------------------------------
                        </div>
                      </>
                    )}
                  </div>
                </main>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end mt-4">
          <button
            onClick={handlePrint}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Print
          </button>
        </div>
      </div>
    </div>
  );
};

export default BillPrint;
