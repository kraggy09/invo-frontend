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
  formatNum,
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
            className={`text-sm text-black ${
              isA4 ? "p-6 bg-white w-full" : "w-[300px] max-w-[300px] mx-auto p-1 font-thermal-a"
            }`}
            style={{
              fontFamily: isA4
                ? "'Inter', sans-serif"
                : '"FontA", "FontA11", "FontA12", "Font A", "JetBrains Mono", "Roboto Mono", "Courier New", Courier, monospace',
            }}
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
                              {formatNum(price)}
                            </td>
                            <td className="p-2 border-r border-gray-200 text-center font-bold">
                              {product.measuring === "kg"
                                ? calculateMeasuring(total)
                                : total % 1 !== 0
                                ? total.toFixed(3)
                                : total}
                            </td>
                            <td className="p-2 border-r border-gray-200 text-center text-gray-500">
                              {formatNum(product.discount || 0)}
                            </td>
                            <td className="p-2 text-right font-bold">
                              {Math.ceil(rowTotal || 0)}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>

                {/* A4 Summary Block */}
                <div className="flex justify-end">
                  <div className="w-72 space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-gray-200">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-bold">₹{formatNum(billTotal)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between py-1 border-b border-gray-200 text-green-600 font-semibold">
                        <span>Discount:</span>
                        <span>-₹{formatNum(discount)}</span>
                      </div>
                    )}
                    {customerOutstanding !== 0 && (
                      <div className="flex justify-between py-1 border-b border-gray-200 text-amber-800">
                        <span>
                          {customerOutstanding >= 0 ? "Previous Balance:" : "Previous Credit:"}
                        </span>
                        <span className="font-bold">
                          {customerOutstanding >= 0 ? "+" : "-"}₹{formatNum(Math.abs(customerOutstanding))}
                        </span>
                      </div>
                    )}
                    {paymentValue > 0 ? (
                      <>
                        <div className="flex justify-between py-1 text-sm font-black border-b-2 border-gray-800">
                          <span>Total Balance Due:</span>
                          <span>₹{formatNum(totalBeforePayment)}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-gray-200 text-blue-700 font-semibold">
                          <span>Payment Received:</span>
                          <span>-₹{formatNum(paymentValue)}</span>
                        </div>
                        <div className="flex justify-between py-1.5 text-sm font-black bg-gray-100 px-2 rounded">
                          <span>
                            {finalOutstanding > 0
                              ? "Final Outstanding:"
                              : finalOutstanding < 0
                              ? "Final Advance Credit:"
                              : "Final Balance:"}
                          </span>
                          <span className={finalOutstanding > 0 ? "text-red-600" : "text-green-600"}>
                            ₹{formatNum(Math.abs(finalOutstanding))}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between py-1.5 text-sm font-black bg-gray-100 px-2 rounded border border-gray-800">
                        <span>
                          {totalBeforePayment > 0
                            ? "Total Outstanding Due:"
                            : totalBeforePayment < 0
                            ? "Total Advance Credit:"
                            : "Total Amount:"}
                        </span>
                        <span className={totalBeforePayment > 0 ? "text-red-600" : "text-gray-900"}>
                          ₹{formatNum(Math.abs(totalBeforePayment))}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {calculateSave(currentBill.purchased) > 0 && (
                  <div className="mt-4 p-2 bg-green-50 border border-green-200 rounded text-center text-green-700 font-bold text-xs">
                    🎉 Total Savings on this Invoice: ₹
                    {formatNum(calculateSave(currentBill.purchased))}
                  </div>
                )}

                <footer className="mt-8 pt-4 border-t border-gray-300 text-center text-[10px] text-gray-400">
                  Thank you for your business! | Powered by InvoSync
                </footer>
              </div>
            ) : (
              /* ================== THERMAL 80MM RECEIPT LAYOUT ================== */
              <div className="thermal-receipt font-thermal-a text-black leading-tight select-none">
                <style>{`
                  @page {
                    size: 80mm auto;
                    margin: 2mm 3mm 4mm 3mm;
                  }
                  @media print {
                    html, body {
                      width: 80mm !important;
                      margin: 0 !important;
                      padding: 0 !important;
                      background: #fff !important;
                      color: #000 !important;
                      -webkit-print-color-adjust: exact !important;
                      print-color-adjust: exact !important;
                    }
                    .thermal-receipt {
                      width: 100% !important;
                      max-width: 76mm !important;
                      margin: 0 auto !important;
                      padding: 1mm 0 !important;
                      color: #000 !important;
                    }
                  }
                `}</style>

                {/* Shop Header */}
                <header className="flex flex-col items-center justify-center text-center">
                  <h1 className="text-lg font-black tracking-wide uppercase font-thermal-a">
                    {shopName}
                  </h1>
                  {shopAddress && (
                    <p className="text-xs font-bold leading-tight font-thermal-b mt-0.5 max-w-[280px]">
                      {shopAddress}
                    </p>
                  )}
                  {shopPhone && (
                    <p className="text-xs font-bold font-thermal-b mt-0.5">
                      Mob: {shopPhone}
                    </p>
                  )}
                  <div className="mt-1 px-3 py-0.5 border-2 border-black text-[11px] font-black uppercase tracking-widest inline-block">
                    Retail Invoice
                  </div>
                </header>

                <div className="border-b-2 border-dashed border-black my-2 w-full" />

                {/* Metadata Grid */}
                <div className="text-xs font-thermal-b space-y-0.5 font-bold">
                  <div className="flex justify-between">
                    <span>
                      <span className="font-black">Inv: </span>
                      {currentBill.id ? `B-${currentBill.id}` : "N/A"}
                    </span>
                    <span>
                      <span className="font-black">Date: </span>
                      {currentBill.createdAt
                        ? calculateDate(new Date(currentBill.createdAt))
                        : calculateDate(new Date())}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="truncate max-w-[160px]">
                      <span className="font-black">Cust: </span>
                      <span className="capitalize font-bold">
                        {currentBill?.customer?.name || "Walk-in"}
                      </span>
                    </span>
                    <span>
                      <span className="font-black">Time: </span>
                      {currentBill.createdAt
                        ? calculateTime(new Date(currentBill.createdAt))
                        : calculateTime(new Date())}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>
                      <span className="font-black">Mob: </span>
                      {currentBill?.customer?.phone || "N/A"}
                    </span>
                    <span>
                      <span className="font-black">Items: </span>
                      {currentBill?.purchased?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>
                      <span className="font-black">Mode: </span>
                      {paymentValue > 0
                        ? paymentValue >= totalBeforePayment
                          ? "PAID"
                          : "PARTIAL"
                        : "CREDIT"}
                    </span>
                  </div>
                </div>

                <div className="border-b-2 border-dashed border-black my-2 w-full" />

                {/* 4-Column Items Table */}
                <main className="w-full">
                  <table className="w-full text-xs font-thermal-a border-collapse">
                    <thead>
                      <tr className="border-b-2 border-dashed border-black text-xs font-black">
                        <th className="text-left pb-1 font-black w-[42%]">ITEM</th>
                        <th className="text-center pb-1 font-black w-[18%]">QTY</th>
                        <th className="text-right pb-1 font-black w-[18%]">RATE</th>
                        <th className="text-right pb-1 font-black w-[22%]">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentBill?.purchased &&
                        [...currentBill.purchased].reverse().map((product: any, idx: number) => {
                          const totalQty =
                            product.piece +
                            product.box * product.boxQuantity +
                            product.packet * product.packetQuantity;
                          const price = product.price;
                          const rowTotal = price * totalQty - (product.discount || 0);

                          return (
                            <tr
                              key={product.id || idx}
                              className="border-b border-dashed border-black"
                            >
                              <td className="py-1 pr-1 align-top text-left">
                                <div className="leading-tight capitalize font-bold break-words">
                                  {product.name}
                                </div>
                                {product.discount > 0 && (
                                  <div className="text-[11px] font-bold text-black font-thermal-b">
                                    (Disc: -₹{formatNum(product.discount)})
                                  </div>
                                )}
                              </td>
                              <td className="py-1 text-center align-top whitespace-nowrap font-thermal-b font-bold">
                                {product.measuring === "kg"
                                  ? calculateMeasuring(totalQty)
                                  : totalQty % 1 !== 0
                                  ? totalQty.toFixed(3)
                                  : totalQty}
                              </td>
                              <td className="py-1 text-right align-top whitespace-nowrap font-thermal-b font-bold">
                                {formatNum(price)}
                              </td>
                              <td className="py-1 text-right align-top font-black whitespace-nowrap">
                                {Math.ceil(rowTotal || 0)}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>

                  <div className="border-b-2 border-dashed border-black mt-2 mb-1.5 w-full" />

                  {/* Summary Block */}
                  <div className="w-full text-xs font-thermal-a space-y-1 font-bold">

                    <div className="flex justify-between font-bold">
                      <span>Subtotal:</span>
                      <span>₹{formatNum(billTotal)}</span>
                    </div>

                    {discount > 0 && (
                      <div className="flex justify-between font-thermal-b font-bold">
                        <span>Discount:</span>
                        <span>-₹{formatNum(discount)}</span>
                      </div>
                    )}

                    {customerOutstanding !== 0 && (
                      <div className="flex justify-between font-thermal-b font-bold">
                        <span>
                          {customerOutstanding >= 0 ? "Prev Balance:" : "Prev Credit:"}
                        </span>
                        <span className="font-black">
                          {customerOutstanding >= 0 ? "+" : "-"}₹{formatNum(Math.abs(customerOutstanding))}
                        </span>
                      </div>
                    )}

                    <div className="border-b-2 border-dashed border-black my-1 w-full" />

                    {paymentValue > 0 ? (
                      <>
                        <div className="flex justify-between text-sm font-black py-0.5">
                          <span>TOTAL BALANCE:</span>
                          <span>₹{formatNum(totalBeforePayment)}</span>
                        </div>

                        <div className="border-b border-dashed border-black my-1 w-full" />

                        <div className="flex justify-between font-thermal-b font-bold">
                          <span>Payment Received:</span>
                          <span>-₹{formatNum(paymentValue)}</span>
                        </div>

                        <div className="flex justify-between font-black text-sm pt-0.5">
                          <span>
                            {finalOutstanding > 0
                              ? "Final Outstanding:"
                              : finalOutstanding < 0
                              ? "Final Credit:"
                              : "Final Balance:"}
                          </span>
                          <span>₹{formatNum(Math.abs(finalOutstanding))}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between text-base font-black py-0.5">
                        <span>
                          {totalBeforePayment > 0
                            ? "TOTAL OUTSTANDING:"
                            : totalBeforePayment < 0
                            ? "TOTAL CREDIT:"
                            : "TOTAL AMOUNT:"}
                        </span>
                        <span>₹{formatNum(Math.abs(totalBeforePayment))}</span>
                      </div>
                    )}
                  </div>

                  {/* You Saved Banner */}
                  {calculateSave(currentBill.purchased) > 0 && (
                    <div className="mt-3 border-2 border-dashed border-black py-1 px-2 text-center text-xs font-black font-thermal-a">
                      *** YOU SAVED: ₹{formatNum(calculateSave(currentBill.purchased))} ***
                    </div>
                  )}

                  {/* Receipt Footer */}
                  <div className="border-b border-dashed border-black mt-3 mb-2 w-full" />
                  <footer className="text-center text-[11px] font-thermal-b space-y-0.5 pb-1 font-bold">
                    <p className="font-black">Thank you for your visit!</p>
                    <p>Powered by InvoSync</p>
                  </footer>
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
