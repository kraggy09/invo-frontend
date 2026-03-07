import { Typography } from "antd";
import { useEffect } from "react";
import { formatIndianNumber } from "../utils";
import dayjs from "dayjs";

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

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-[500px]">
                <div className="flex justify-between items-center mb-4">
                    <Title level={4}>Print Return Bill</Title>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 font-bold"
                    >
                        ✕
                    </button>
                </div>

                <div ref={contentRef} className="text-sm">
                    <header className="flex items-center flex-col justify-center">
                        <h1 className="ml-1 font-bold">
                            Sultan Communication & General Stroes
                        </h1>
                        <p className="text-xs font-semibold">Behind Green Land Hotel</p>
                        <p className="text-xs font-semibold">Mob:9370564909/9145506000</p>
                        <p className="text-sm font-black mt-1 uppercase tracking-widest border border-black px-4 py-0.5 rounded-md">Return Receipt</p>
                        <div className="font-bold mt-3 w-full text-center">
                            ------------------------------------------------
                        </div>
                        <div className="text-xs justify-between font-semibold flex w-full px-4 mt-2">
                            <span id="left" className="mr-10 text-left">
                                <p>
                                    Return ID: {returnBill.id ? `R-${returnBill.id}` : returnBill._id?.slice(-8).toUpperCase()}
                                </p>
                                <p>
                                    Ref Bill: {returnBill?.originalBill?.id ? `B-${returnBill.originalBill.id}` : returnBill?.originalBill?._id?.slice(-8).toUpperCase() || "N/A"}
                                </p>
                                <p>
                                    Date: {dayjs(returnBill.createdAt).format("DD/MM/YYYY")}
                                </p>
                            </span>
                            <span id="right" className="text-right">
                                <p>Mode: {paymentMode}</p>
                                <p>
                                    Time: {dayjs(returnBill.createdAt).format("hh:mm A")}
                                </p>
                            </span>
                        </div>
                    </header>

                    <div className="flex text-xs justify-around font-semibold mt-4">
                        <span className="flex font-semibold gap-1">
                            Customer:
                            <p className="capitalize italic">
                                {returnBill?.customer?.name || "Walk-in Customer"}
                            </p>
                        </span>
                        <span className="flex font-semibold gap-1">
                            Mobile:
                            <p className="capitalize italic">
                                {returnBill?.customer?.phone || "N/A"}
                            </p>
                        </span>
                    </div>

                    <p className="font-semibold text-xs ml-6 mt-2">
                        Items Returned: {returnBill?.items?.length || 0}
                    </p>

                    <div className="font-bold my-3 w-full text-center">
                        ------------------------------------------------
                    </div>
                    <main className="flex text-xs items-center font-semibold justify-center flex-col">
                        <table className="min-w-full mx-6 mb-4">
                            <tbody>
                                <tr>
                                    <th className="border border-black pb-1">Name</th>
                                    <th className="border border-black pb-1">Ret. Qty</th>
                                    <th className="border border-black pb-1">Unit Price</th>
                                    <th className="border border-black pb-1">Refund</th>
                                </tr>
                                {returnBill?.items?.map((item: any, index: number) => {
                                    return (
                                        <tr key={item._id || index} className="border border-black">
                                            <td>
                                                <p className="text-center capitalize py-1 px-2">
                                                    {item.product?.name || "Unknown Product"}
                                                </p>
                                            </td>
                                            <td>
                                                <p className="text-center py-1">
                                                    {item.quantityReturned}
                                                </p>
                                            </td>
                                            <td>
                                                <p className="text-center py-1">
                                                    {item.returnPrice % 1 !== 0 ? item.returnPrice.toFixed(2) : item.returnPrice}
                                                </p>
                                            </td>
                                            <td>
                                                <p className="text-center py-1">
                                                    {item.returnTotal % 1 !== 0 ? item.returnTotal.toFixed(2) : item.returnTotal}
                                                </p>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        <div className="min-w-full flex flex-col pr-2 justify-end items-end gap-1 text-sm font-bold">
                            <div className="flex gap-4 pb-1 border-b border-gray-300 w-48 justify-between">
                                <span>Ref Total:</span>
                                <span>{formatIndianNumber(productsTotal)}₹</span>
                            </div>

                            {discount > 0 && (
                                <div className="flex gap-4 w-48 text-orange-600 justify-between">
                                    <span>Revert Discount:</span>
                                    <span>-{formatIndianNumber(discount)}₹</span>
                                </div>
                            )}

                            <div className="flex gap-4 w-48 text-indigo-600 justify-between">
                                <span>Total Refund:</span>
                                <span>{formatIndianNumber(returnBill.totalAmount)}₹</span>
                            </div>

                            {previousOutstanding !== undefined && newOutstanding !== undefined && paymentMode === "ADJUSTMENT" && (
                                <>
                                    <div className="flex gap-4 mt-2 w-48 text-xs text-gray-500 justify-between">
                                        <span>Prev Balance:</span>
                                        <span>{previousOutstanding < 0 ? "-" : ""}{formatIndianNumber(Math.abs(previousOutstanding))}₹</span>
                                    </div>
                                    <div className="flex gap-4 w-48 justify-between">
                                        <span>New Balance:</span>
                                        <span>{newOutstanding < 0 ? "-" : ""}{formatIndianNumber(Math.abs(newOutstanding))}₹</span>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="font-bold my-4 w-full text-center">
                            ------------------------------------------------
                        </div>
                        <div className="text-xs font-bold text-center italic">
                            Returns subject to store policy.
                        </div>
                    </main>
                </div>

                <div className="flex justify-end mt-6">
                    <button
                        onClick={handlePrint}
                        className="bg-indigo-600 text-white font-black uppercase text-xs tracking-widest px-6 py-2.5 rounded-lg hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all"
                    >
                        Print Receipt
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReturnBillPrint;
