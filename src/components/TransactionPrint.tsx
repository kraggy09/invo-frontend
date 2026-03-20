import { Typography } from "antd";
import { useEffect } from "react";
import { calculateDate, calculateTime } from "../utils/bill.util";
import { formatIndianNumber } from "../utils";
import useUserStore from "../store/user.store";

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
    const { user } = useUserStore();

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
    const creatorName = transactionData?.approvedBy?.name || user?.username || "System";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-[500px]">
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
                            -----------------------------------------
                        </div>
                        <div className="text-xs justify-between font-semibold flex px-6 w-full">
                            <span id="left" className="mr-10">
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
                            <span id="right">
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

                    <div className="flex text-xs justify-around font-semibold mt-2">
                        <span className="flex font-semibold">
                            Party Info:
                            <p className="capitalize italic ml-1">
                                {transactionData.name || "N/A"}
                            </p>
                        </span>
                        <span className="flex font-semibold">
                            Creator:
                            <p className="capitalize italic ml-1">
                                {creatorName}
                            </p>
                        </span>
                    </div>

                    <div className="font-bold my-3 text-center">
                        -----------------------------------------
                    </div>

                    <main className="text-xs font-semibold flex items-center justify-center flex-col">
                        <div className="min-w-full mt-2 flex flex-col px-8 justify-end items-end gap-1">
                            {transactionData.purpose && (
                                <div>
                                    Purpose: <span className="capitalize">{transactionData.purpose}</span>
                                </div>
                            )}

                            {(transactionData.previousOutstanding !== undefined) && (
                                <div>
                                    Previous Balance: {formatIndianNumber(transactionData.previousOutstanding)}₹
                                </div>
                            )}

                            <div className="text-base font-bold mt-2">
                                Amount {isDebit ? "Paid" : "Received"}: {formatIndianNumber(amount)}₹
                            </div>

                            {(transactionData.newOutstanding !== undefined) && (
                                <div className="mt-2 text-sm border-t border-dashed border-gray-400 pt-2 w-full text-right">
                                    New Balance: {formatIndianNumber(transactionData.newOutstanding)}₹
                                </div>
                            )}
                        </div>

                        <div className="mt-8 text-center text-xs italic opacity-70 w-full mb-1">
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
