import { Typography } from "antd";

import useCurrentBillStore, {
  PurchasedProduct,
} from "../store/currentBill.store";
import { useEffect, useState } from "react";
import {
  calculateDate,
  calculateMeasuring,
  calculateTime,
} from "../utils/bill.util";
import { formatIndianNumber } from "../utils";

const { Title } = Typography;

interface BillPrintProps {
  onClose: () => void;
  contentRef: React.RefObject<HTMLDivElement | null>;
  handlePrint: () => void;
  payment: string;
  printBillData?: any;
  isDirectPrint?: boolean;
}

const BillPrint = ({
  onClose,
  contentRef,
  handlePrint,
  payment,
  printBillData,
  isDirectPrint = false,
}: BillPrintProps) => {

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
  const billTotal = currentBill?.purchased
    ? currentBill.purchased.reduce(
      (sum: number, p: any) => sum + (p.total || 0),
      0
    )
    : currentBill?.total || 0;
  // Discount
  const discount = currentBill?.discount || 0;
  // Outstanding from customer
  const customerOutstanding = currentBill.total - billTotal + discount;
  // Payment
  const paymentValue = Number(payment) || 0;
  // Total before payment (rounded)
  const totalBeforePayment = Math.ceil(billTotal + customerOutstanding - discount);
  // Final Outstanding after payment
  const finalOutstanding = totalBeforePayment - paymentValue;
  return (
    <div className={`fixed inset-0 bg-black flex items-center justify-center z-50 ${isDirectPrint ? 'opacity-0 pointer-events-none' : 'bg-opacity-50'}`}>
      <div className="bg-white p-6 rounded-lg shadow-lg w-[500px]">
        <div className="flex justify-between items-center mb-4">
          <Title level={4}>Print Bill</Title>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {currentBill && (
          <div ref={contentRef} className="text-sm ">
            <header className="flex items-center flex-col justify-center">
              <h1 className="ml-1 font-bold">
                Sultan Communication & General Stroes
              </h1>
              <p className="text-xs font-semibold">Behind Green Land Hotel</p>
              <p className="text-xs font-semibold">Mob:9370564909/9145506000</p>
              <div className="font-bold mt-3">
                -----------------------------------------
              </div>
              <div className="text-xs justify-between font-semibold  flex ">
                <span id="left" className="mr-10">
                  <p>
                    Invoice No.:{" "}
                    {currentBill.id ? `B-${currentBill.id}` : "Old Bill"}
                  </p>
                  <p>
                    Date:
                    {currentBill.createdAt
                      ? calculateDate(new Date(currentBill.createdAt))
                      : calculateDate(new Date())}
                  </p>
                </span>
                <span id="right">
                  <p>Payment: {payment}</p>
                  <p>
                    Time :{" "}
                    {currentBill.createdAt
                      ? calculateTime(new Date(currentBill.createdAt))
                      : calculateTime(new Date())}
                  </p>
                </span>
              </div>
            </header>

            <div className="flex text-xs justify-around font-semibold">
              <span className="flex font-semibold">
                Customer:
                <p className="capitalize italic">
                  {currentBill?.customer?.name || "Walk-in Customer"}
                </p>
              </span>
              <span className="flex font-semibold">
                Mobile:
                <p className="capitalize italic">
                  {currentBill?.customer?.phone || "N/A"}
                </p>
              </span>
            </div>
            <p className="font-semibold text-xs ml-6">
              Total Items:{currentBill?.purchased.length}
            </p>

            <div className="font-bold mb-3">
              -----------------------------------------
            </div>
            <main className="flex text-xs items-center font-semibold justify-center flex-col">
              <table className="min-w-full mx-6">
                <tbody>
                  <tr>
                    <th className="border border-black">Name</th>
                    <th className="border border-black">Quantity</th>
                    <th className="border border-black">Total</th>
                  </tr>
                  {currentBill?.purchased &&
                    [...currentBill?.purchased].reverse().map((product) => {
                      // console.log(product, "current product");
                      const total =
                        product.piece +
                        product.box * product.boxQuantity +
                        product.packet * product.packetQuantity;
                      const price = product.price;

                      return (
                        <tr key={product.id} className="border border-black">
                          <td>
                            <p className="text-center capitalize">
                              {product.name}
                            </p>
                          </td>

                          <td>
                            <p className="text-center">
                              {" "}
                              {product.measuring === "kg"
                                ? calculateMeasuring(total)
                                : total % 1 != 0
                                  ? total.toFixed(3)
                                  : total}
                            </p>
                          </td>

                          <td>
                            <p className="text-center">
                              {(price * total - product.discount) % 1 != 0
                                ? (price * total - product.discount).toFixed(2)
                                : price * total - product.discount}
                            </p>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
              <div className="min-w-full mt-2 flex flex-col pr-2 justify-end items-end">
                <div className="">
                  Bill Total:
                  {formatIndianNumber(billTotal)}₹
                </div>
                {discount > 0 && (
                  <div>Discount:-{formatIndianNumber(discount)}</div>
                )}
                {customerOutstanding !== 0 && (
                  <div>
                    {customerOutstanding > 0 ? "Outstanding:" : "Balance:"}
                    {formatIndianNumber(customerOutstanding)}₹
                  </div>
                )}
                <div className="">
                  Total:
                  {formatIndianNumber(totalBeforePayment)}
                </div>
                {paymentValue > 0 && (
                  <div className="">
                    Payment:{payment === "" ? 0 : "-" + payment}
                  </div>
                )}
                <div className="">
                  {finalOutstanding > 0 ? (
                    <span>
                      Outstanding:
                      {formatIndianNumber(finalOutstanding)}
                    </span>
                  ) : (
                    <span>
                      Balance:
                      {formatIndianNumber(finalOutstanding)}
                    </span>
                  )}
                </div>
                {calculateSave(currentBill.purchased) > 0 && (
                  <>
                    <div>-----------------------------------------</div>
                    <div className="mt-2 font-bold flex min-w-full items-center justify-center text-2xl">
                      You Saved:
                      {calculateSave(currentBill.purchased).toFixed(3)}
                    </div>
                    <div>-----------------------------------------</div>
                  </>
                )}
              </div>
            </main>
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
