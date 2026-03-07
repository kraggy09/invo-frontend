import { Typography } from "antd";
import { useEffect } from "react";
import { calculateDate, calculateTime } from "../utils/bill.util";
import { formatIndianNumber } from "../utils";

const { Title } = Typography;

interface TransactionPrintProps {
    onClose: () => void;
    contentRef: React.RefObject<HTMLDivElement | null>;
    handlePrint: () => void;
    transactionData: any;
    isPaymentIn?: boolean;
}

const TransactionPrint = ({
    onClose,
    contentRef,
    handlePrint,
    transactionData,
    isPaymentIn,
}: TransactionPrintProps) => {
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

    if (!transactionData) return null;

    const amount =
        transactionData.amount || transactionData.payment || transactionData.total || 0;

    // Try to use the transaction.taken field if available, otherwise use isPaymentIn
    const isDebit = transactionData.taken !== undefined ? transactionData.taken : !isPaymentIn;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-[400px]">
                <div className="flex justify-between items-center mb-4">
                    <Title level={4}>Print Receipt</Title>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
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
                        <div className="font-bold mt-3">
                            ------------------------------------------
                        </div>
                        <div className="text-xs justify-between font-semibold flex w-full">
                            <span id="left">
                                <p>
                                    Receipt No.:{" "}
                                    {transactionData.id ? `T-${transactionData.id}` : transactionData._id?.slice(-8).toUpperCase()}
                                </p>
                                <p>
                                    Date:{" "}
                                    {transactionData.createdAt
                                        ? calculateDate(new Date(transactionData.createdAt))
                                        : calculateDate(new Date())}
                                </p>
                            </span>
                            <span id="right" className="text-right">
                                <p>
                                    Type: {isDebit ? "Cash Out" : "Payment In"}
                                </p>
                                <p>
                                    Time:{" "}
                                    {transactionData.createdAt
                                        ? calculateTime(new Date(transactionData.createdAt))
                                        : calculateTime(new Date())}
                                </p>
                            </span>
                        </div>
                    </header>

                    <div className="font-bold my-2">
                        ------------------------------------------
                    </div>

                    <main className="text-xs font-semibold">
                        <div className="flex justify-between mb-2 mt-2">
                            <span>Party Info:</span>
                            <span className="capitalize">{transactionData.name || "N/A"}</span>
                        </div>

                        {transactionData.purpose && (
                            <div className="flex justify-between mb-2">
                                <span>Purpose:</span>
                                <span className="capitalize">{transactionData.purpose}</span>
                            </div>
                        )}

                        {(transactionData.previousOutstanding !== undefined) && (
                            <div className="flex justify-between mb-2">
                                <span>Previous Balance:</span>
                                <span>{formatIndianNumber(transactionData.previousOutstanding)}₹</span>
                            </div>
                        )}

                        <div className="flex justify-between mb-2 text-base font-bold mt-4">
                            <span>Amount {isDebit ? "Paid" : "Received"}:</span>
                            <span>{formatIndianNumber(amount)}₹</span>
                        </div>

                        {(transactionData.newOutstanding !== undefined) && (
                            <div className="flex justify-between mb-2 border-t border-dashed border-gray-400 pt-2 border-b pb-2">
                                <span>New Balance:</span>
                                <span>{formatIndianNumber(transactionData.newOutstanding)}₹</span>
                            </div>
                        )}

                        <div className="mt-6 text-center text-xs italic opacity-70">
                            Thank you for your business!
                        </div>
                    </main>
                </div>

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

export default TransactionPrint;
