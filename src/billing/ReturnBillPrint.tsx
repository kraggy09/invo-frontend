import { Typography } from "antd";
import { useEffect } from "react";
import dayjs from "dayjs";
import useUserStore from "../store/user.store";
import { formatNum } from "../utils/bill.util";

const { Title } = Typography;

interface ReturnBillPrintProps {
  onClose: () => void;
  contentRef: React.RefObject<HTMLDivElement | null>;
  handlePrint: () => void;
  returnBill: any;
}

const ReturnBillPrint = ({
  onClose,
  contentRef,
  handlePrint,
  returnBill,
}: ReturnBillPrintProps) => {
  const shopName = useUserStore((state) => state.user?.shopName);
  const shopAddress = useUserStore((state) => state.user?.shopAddress) || "";
  const shopPhone = useUserStore((state) => state.user?.shopPhone) || "";

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
      if (e.key === "Enter") {
        handlePrint();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [onClose, handlePrint]);

  if (!returnBill) return null;

  const discount = returnBill.discount || 0;
  // For older return bills that might not have these fields, we fall back to calculating or omitting
  const productsTotal = returnBill.productsTotal || returnBill.totalAmount;
  const previousOutstanding = returnBill.previousOutstanding;
  const newOutstanding = returnBill.newOutstanding;
  const paymentMode = returnBill.paymentMode;

  const printType =
    useUserStore((state) => state.user?.shopSettings?.printType) || "THERMAL";
  const isA4 = printType === "A4";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className={`bg-white p-6 rounded-lg shadow-lg ${
          isA4 ? "w-[800px] max-h-[90vh] overflow-y-auto" : "w-[450px]"
        }`}
      >
        <div className="flex justify-between items-center mb-4">
          <Title level={4}>
            {isA4 ? "Print A4 Return Bill" : "Print Return Receipt"}
          </Title>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 font-bold"
          >
            ✕
          </button>
        </div>

        <div
          ref={contentRef}
          className={
            isA4
              ? "p-6 bg-white w-full"
              : "thermal-receipt w-[300px] max-w-[300px] mx-auto p-1 font-thermal-a text-black leading-tight select-none"
          }
          style={{
            fontFamily: isA4
              ? "'Inter', sans-serif"
              : '"FontA", "FontA11", "FontA12", "Font A", "JetBrains Mono", "Roboto Mono", "Courier New", Courier, monospace',
          }}
        >
          {isA4 ? (
            /* ================== A4 RETURN BILL LAYOUT ================== */
            <div className="text-gray-800 text-xs">
              <header className="border-b-2 border-gray-800 pb-4 mb-4 flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-gray-900">
                    {shopName || "InvoSync Shop"}
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
                  <span className="text-xs font-black uppercase tracking-widest bg-red-800 text-white px-3 py-1 rounded">
                    CREDIT NOTE / RETURN
                  </span>
                  <p className="font-bold mt-2">
                    Return No:{" "}
                    <span className="font-black font-mono">
                      {returnBill.id
                        ? `RET-${returnBill.id}`
                        : returnBill._id?.slice(-8).toUpperCase()}
                    </span>
                  </p>
                  <p className="text-gray-600">
                    Ref Invoice:{" "}
                    <span className="font-semibold font-mono">
                      {returnBill?.originalBill?.id
                        ? `INV-${returnBill.originalBill.id}`
                        : returnBill?.originalBill?._id?.slice(-8).toUpperCase() || "N/A"}
                    </span>
                  </p>
                  <p className="text-gray-600">
                    Date: {dayjs(returnBill.createdAt).format("DD/MM/YYYY | hh:mm A")}
                  </p>
                </div>
              </header>

              {/* Customer Details Box */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">
                    Customer Details
                  </span>
                  <p className="font-bold text-sm text-gray-900 capitalize">
                    {returnBill?.customer?.name || "Walk-in Customer"}
                  </p>
                  <p className="text-xs text-gray-600">
                    Contact: {returnBill?.customer?.phone || "N/A"}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">
                    Refund Mode
                  </span>
                  <p className="font-bold text-gray-900 uppercase">
                    {paymentMode || "CASH"}
                  </p>
                  <p className="text-xs text-gray-600">
                    Items Returned: {returnBill?.items?.length || 0}
                  </p>
                </div>
              </div>

              {/* A4 Items Table */}
              <table className="w-full border-collapse border border-gray-300 mb-4">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 font-bold border-b border-gray-300 text-left">
                    <th className="p-2 border-r border-gray-300 w-10 text-center">#</th>
                    <th className="p-2 border-r border-gray-300">Returned Item Description</th>
                    <th className="p-2 border-r border-gray-300 text-center w-28">Return Rate (₹)</th>
                    <th className="p-2 border-r border-gray-300 text-center w-28">Qty Returned</th>
                    <th className="p-2 text-right w-28">Refund Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {returnBill?.items?.map((item: any, idx: number) => {
                    return (
                      <tr key={item._id || idx} className="border-b border-gray-200">
                        <td className="p-2 border-r border-gray-200 text-center text-gray-500">
                          {idx + 1}
                        </td>
                        <td className="p-2 border-r border-gray-200 font-semibold capitalize">
                          {item.product?.name || "Unknown Product"}
                        </td>
                        <td className="p-2 border-r border-gray-200 text-center">
                          {formatNum(item.returnPrice || 0)}
                        </td>
                        <td className="p-2 border-r border-gray-200 text-center font-bold">
                          {item.quantityReturned}
                        </td>
                        <td className="p-2 text-right font-bold text-red-600">
                          {Math.ceil(item.returnTotal || 0)}
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
                    <span className="text-gray-600">Return Items Subtotal:</span>
                    <span className="font-bold">₹{formatNum(productsTotal || returnBill.totalAmount)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between py-1 border-b border-gray-200 text-orange-600 font-semibold">
                      <span>Revert Discount:</span>
                      <span>-₹{formatNum(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1 border-b border-gray-200 text-gray-800 font-semibold">
                    <span>Total Return Amount:</span>
                    <span>₹{formatNum(returnBill.totalAmount || 0)}</span>
                  </div>

                  {paymentMode === "ADJUSTMENT" || previousOutstanding !== undefined ? (
                    <>
                      <div className="flex justify-between py-1 border-b border-gray-200 text-amber-800">
                        <span>Previous Balance Due:</span>
                        <span className="font-semibold">
                          {(previousOutstanding || 0) < 0 ? "-" : "+"}₹{formatNum(Math.abs(Number(previousOutstanding || 0)))}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-200 text-green-700 font-semibold">
                        <span>Less Return Credit:</span>
                        <span>-₹{formatNum(returnBill.totalAmount || 0)}</span>
                      </div>
                      <div className="flex justify-between py-1.5 text-sm font-black bg-gray-100 px-2 rounded border border-gray-200">
                        <span>
                          {(newOutstanding ?? ((previousOutstanding || 0) - (returnBill.totalAmount || 0))) > 0
                            ? "Final Outstanding Due:"
                            : (newOutstanding ?? ((previousOutstanding || 0) - (returnBill.totalAmount || 0))) < 0
                            ? "Final Advance Credit:"
                            : "Final Balance:"}
                        </span>
                        <span
                          className={
                            (newOutstanding ?? ((previousOutstanding || 0) - (returnBill.totalAmount || 0))) > 0
                              ? "text-red-600"
                              : "text-green-600"
                          }
                        >
                          ₹{formatNum(Math.abs(Number(newOutstanding ?? ((previousOutstanding || 0) - (returnBill.totalAmount || 0)))))}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between py-1 border-b border-gray-200 text-blue-700 font-semibold">
                        <span>Payment Refunded ({paymentMode}):</span>
                        <span>-₹{formatNum(returnBill.totalAmount || 0)}</span>
                      </div>
                      <div className="flex justify-between py-1.5 text-sm font-black bg-gray-100 px-2 rounded border border-gray-200">
                        <span>Final Amount:</span>
                        <span className="text-gray-900">₹0</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <footer className="mt-8 pt-4 border-t border-gray-300 text-center text-[10px] text-gray-400">
                Returns subject to store policy & terms. | Powered by InvoSync
              </footer>
            </div>
          ) : (
            /* ================== THERMAL 80MM RECEIPT LAYOUT ================== */
            <div>
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
              {shopName || "InvoSync Shop"}
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
              Return Receipt
            </div>
          </header>

          <div className="border-b-2 border-dashed border-black my-2 w-full" />

          {/* Metadata Grid */}
          <div className="text-xs font-thermal-b space-y-0.5 font-bold">
            <div className="flex justify-between">
              <span>
                <span className="font-black">Ret ID: </span>
                {returnBill.id
                  ? `R-${returnBill.id}`
                  : returnBill._id?.slice(-8).toUpperCase()}
              </span>
              <span>
                <span className="font-black">Date: </span>
                {dayjs(returnBill.createdAt).format("DD/MM/YYYY")}
              </span>
            </div>
            <div className="flex justify-between">
              <span>
                <span className="font-black">Ref Inv: </span>
                {returnBill?.originalBill?.id
                  ? `B-${returnBill.originalBill.id}`
                  : returnBill?.originalBill?._id?.slice(-8).toUpperCase() || "N/A"}
              </span>
              <span>
                <span className="font-black">Time: </span>
                {dayjs(returnBill.createdAt).format("hh:mm A")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="truncate max-w-[160px]">
                <span className="font-black">Cust: </span>
                <span className="capitalize font-bold">
                  {returnBill?.customer?.name || "Walk-in Customer"}
                </span>
              </span>
              <span>
                <span className="font-black">Mode: </span>
                {paymentMode || "CASH"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>
                <span className="font-black">Mob: </span>
                {returnBill?.customer?.phone || "N/A"}
              </span>
              <span>
                <span className="font-black">Items: </span>
                {returnBill?.items?.length || 0}
              </span>
            </div>
          </div>

          <div className="border-b-2 border-dashed border-black my-2 w-full" />

          {/* 4-Column Return Items Table */}
          <main className="w-full">
            <table className="w-full text-xs font-thermal-a border-collapse">
              <thead>
                <tr className="border-b-2 border-dashed border-black text-xs font-black">
                  <th className="text-left pb-1 font-black w-[42%]">ITEM</th>
                  <th className="text-center pb-1 font-black w-[18%]">QTY</th>
                  <th className="text-right pb-1 font-black w-[18%]">RATE</th>
                  <th className="text-right pb-1 font-black w-[22%]">REFUND</th>
                </tr>
              </thead>
              <tbody>
                {returnBill?.items?.map((item: any, index: number) => {
                  return (
                    <tr
                      key={item._id || index}
                      className="border-b border-dashed border-black"
                    >
                      <td className="py-1 pr-1 align-top text-left">
                        <div className="leading-tight capitalize font-bold break-words">
                          {item.product?.name || "Unknown Product"}
                        </div>
                      </td>
                      <td className="py-1 text-center align-top whitespace-nowrap font-thermal-b font-bold">
                        {item.quantityReturned}
                      </td>
                      <td className="py-1 text-right align-top whitespace-nowrap font-thermal-b font-bold">
                        {formatNum(item.returnPrice || 0)}
                      </td>
                      <td className="py-1 text-right align-top font-black whitespace-nowrap">
                        {Math.ceil(item.returnTotal || 0)}
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
                  <span>Return Subtotal:</span>
                  <span>₹{formatNum(productsTotal || returnBill.totalAmount)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between font-thermal-b font-bold">
                    <span>Revert Discount:</span>
                    <span>-₹{formatNum(discount)}</span>
                  </div>
                )}

                <div className="flex justify-between font-black">
                  <span>Total Return:</span>
                  <span>₹{formatNum(returnBill.totalAmount || 0)}</span>
                </div>

                {paymentMode === "ADJUSTMENT" || previousOutstanding !== undefined ? (
                  <>
                    <div className="border-b border-dashed border-black my-1 w-full" />
                    <div className="flex justify-between font-thermal-b font-bold text-xs">
                      <span>Previous Due:</span>
                      <span className="font-black">
                        {(previousOutstanding || 0) < 0 ? "-" : "+"}₹{formatNum(Math.abs(Number(previousOutstanding || 0)))}
                      </span>
                    </div>
                    <div className="flex justify-between font-thermal-b font-bold text-xs">
                      <span>Less Return:</span>
                      <span>-₹{formatNum(returnBill.totalAmount || 0)}</span>
                    </div>
                    <div className="border-b-2 border-dashed border-black my-1 w-full" />
                    <div className="flex justify-between font-black text-sm">
                      <span>
                        {(newOutstanding ?? ((previousOutstanding || 0) - (returnBill.totalAmount || 0))) > 0
                          ? "Final Outstanding:"
                          : (newOutstanding ?? ((previousOutstanding || 0) - (returnBill.totalAmount || 0))) < 0
                          ? "Final Credit:"
                          : "Final Balance:"}
                      </span>
                      <span>
                        ₹{formatNum(Math.abs(Number(newOutstanding ?? ((previousOutstanding || 0) - (returnBill.totalAmount || 0)))))}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="border-b border-dashed border-black my-1 w-full" />
                    <div className="flex justify-between font-thermal-b font-bold text-xs">
                      <span>Refund Paid ({paymentMode}):</span>
                      <span>-₹{formatNum(returnBill.totalAmount || 0)}</span>
                    </div>
                    <div className="border-b-2 border-dashed border-black my-1 w-full" />
                    <div className="flex justify-between font-black text-sm">
                      <span>Final Balance:</span>
                      <span>₹0</span>
                    </div>
                  </>
                )}
              </div>

            {/* Receipt Footer */}
            <div className="border-b border-dashed border-black mt-3 mb-2 w-full" />
            <footer className="text-center text-[11px] font-thermal-b space-y-0.5 pb-1 font-bold">
              <p className="font-black italic">Returns subject to store policy.</p>
              <p>Powered by InvoSync</p>
            </footer>
          </main>
        </div>
      )}
    </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={handlePrint}
            className="bg-indigo-600 text-white font-black uppercase text-xs tracking-widest px-6 py-2.5 rounded-lg hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all"
          >
            {isA4 ? "Print A4 Invoice" : "Print Receipt"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReturnBillPrint;
