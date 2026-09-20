import { Typography } from "antd";
import { useEffect } from "react";
import { calculateDate, calculateTime, formatNum } from "../utils/bill.util";
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
    const shopAddress = user?.shopAddress || "";
    const shopPhone = user?.shopPhone || "";

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
    const printType = user?.shopSettings?.printType || "THERMAL";
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
                        {isA4
                            ? isDebit
                                ? "Print A4 Cash Out Voucher"
                                : "Print A4 Payment Receipt"
                            : isDebit
                            ? "Print Cash Out Voucher"
                            : "Print Payment Receipt"}
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
                        /* ================== A4 TRANSACTION VOUCHER LAYOUT ================== */
                        <div className="text-gray-800 text-xs">
                            <header className="border-b-2 border-gray-800 pb-4 mb-4 flex justify-between items-start">
                                <div>
                                    <h1 className="text-2xl font-black tracking-tight text-gray-900">
                                        {user?.shopName || "InvoSync Shop"}
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
                                    <span
                                        className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded text-white ${
                                            isDebit ? "bg-red-700" : "bg-green-700"
                                        }`}
                                    >
                                        {isDebit ? "CASH PAYMENT VOUCHER" : "PAYMENT RECEIPT"}
                                    </span>
                                    <p className="font-bold mt-2">
                                        Receipt No:{" "}
                                        <span className="font-black font-mono">
                                            {transactionData.id
                                                ? `REC-${transactionData.id}`
                                                : transactionData._id?.slice(-8).toUpperCase()}
                                        </span>
                                    </p>
                                    <p className="text-gray-600">
                                        Date:{" "}
                                        {transactionData.createdAt
                                            ? calculateDate(new Date(transactionData.createdAt))
                                            : calculateDate(new Date())}{" "}
                                        |{" "}
                                        {transactionData.createdAt
                                            ? calculateTime(new Date(transactionData.createdAt))
                                            : calculateTime(new Date())}
                                    </p>
                                </div>
                            </header>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">
                                        Party Information
                                    </span>
                                    <p className="font-bold text-base text-gray-900 capitalize mt-0.5">
                                        {transactionData.name || "N/A"}
                                    </p>
                                    {transactionData.purpose && (
                                        <p className="text-xs text-gray-600 mt-1">
                                            <span className="font-semibold">Purpose: </span>
                                            <span className="capitalize">{transactionData.purpose}</span>
                                        </p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">
                                        Transaction Type
                                    </span>
                                    <p className="font-bold text-gray-900 mt-0.5">
                                        {isDebit ? "Debit (Cash Out / Paid)" : "Credit (Payment In / Received)"}
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1">
                                        <span className="font-semibold">Processed By: </span>
                                        <span className="capitalize">{creatorName}</span>
                                    </p>
                                    {transactionData.paymentMode && (
                                        <p className="text-xs text-gray-600">
                                            <span className="font-semibold">Payment Mode: </span>
                                            <span className="uppercase">{transactionData.paymentMode}</span>
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Amount Highlight Card */}
                            <div className="bg-gray-100/70 border border-gray-300 rounded-lg p-6 my-6 text-center">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block">
                                    Total Amount {isDebit ? "Paid (Dr)" : "Received (Cr)"}
                                </span>
                                <span className="text-3xl font-black text-gray-900 block mt-1">
                                    ₹{formatNum(amount)}
                                </span>
                            </div>

                            {/* Balance Breakdown Table in Indian Billing Format */}
                            <div className="flex justify-end mb-8">
                                <div className="w-72 space-y-2 text-xs border border-gray-200 rounded-lg p-3 bg-gray-50">
                                    <div className="flex justify-between py-1 border-b border-gray-200 text-gray-600">
                                        <span>
                                            {transactionData.previousOutstanding !== undefined
                                                ? "Previous Balance:"
                                                : "Total Amount:"}
                                        </span>
                                        <span className="font-semibold">
                                            ₹{formatNum(transactionData.previousOutstanding ?? amount)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-gray-200 text-blue-700 font-semibold">
                                        <span>Payment {isDebit ? "Paid:" : "Received:"}</span>
                                        <span>-₹{formatNum(amount)}</span>
                                    </div>
                                    <div className="flex justify-between py-1 text-sm font-bold">
                                        <span>
                                            {transactionData.previousOutstanding !== undefined
                                                ? (transactionData.newOutstanding ?? 0) > 0
                                                    ? "Final Balance Due:"
                                                    : (transactionData.newOutstanding ?? 0) < 0
                                                    ? "Final Advance Credit:"
                                                    : "Final Balance:"
                                                : "Final Amount:"}
                                        </span>
                                        <span
                                            className={
                                                transactionData.previousOutstanding !== undefined &&
                                                (transactionData.newOutstanding ?? 0) > 0
                                                    ? "text-red-600"
                                                    : "text-green-600"
                                            }
                                        >
                                            ₹{formatNum(Math.abs(Number(transactionData.newOutstanding ?? 0)))}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Signature Section */}
                            <div className="grid grid-cols-2 gap-8 pt-12 pb-4">
                                <div className="text-center">
                                    <div className="border-b border-gray-400 w-48 mx-auto" />
                                    <p className="text-xs text-gray-500 mt-1 font-semibold">
                                        Customer / Receiver Signature
                                    </p>
                                </div>
                                <div className="text-center">
                                    <div className="border-b border-gray-400 w-48 mx-auto" />
                                    <p className="text-xs text-gray-500 mt-1 font-semibold">
                                        Authorized Signatory
                                    </p>
                                </div>
                            </div>

                            <footer className="mt-8 pt-4 border-t border-gray-300 text-center text-[10px] text-gray-400">
                                This is a computer generated voucher. | Powered by InvoSync
                            </footer>
                        </div>
                    ) : (
                        /* ================== THERMAL 80MM RECEIPT LAYOUT ================== */
                        <div className="thermal-receipt font-thermal-a text-black leading-tight select-none px-1">
                    <style>{`
                        @page {
                            size: 80mm auto;
                            margin: 2mm 2mm 3mm 2mm;
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
                                max-width: 71mm !important;
                                margin: 0 auto !important;
                                padding: 0 1.5mm !important;
                                color: #000 !important;
                            }
                        }
                    `}</style>

                    {/* Shop Header */}
                    <header className="flex flex-col items-center justify-center text-center">
                        <h1 className="text-lg font-black tracking-wide uppercase font-thermal-a">
                            {user?.shopName || "InvoSync Shop"}
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
                            {isDebit ? "Cash Out Voucher" : "Payment Receipt"}
                        </div>
                    </header>

                    <div className="border-b-2 border-dashed border-black my-2 w-full" />

                    {/* Metadata Grid */}
                    <div className="text-xs font-thermal-b space-y-0.5 font-bold">
                        <div className="flex justify-between">
                            <span>
                                <span className="font-black">Receipt: </span>
                                {transactionData.id
                                    ? `T-${transactionData.id}`
                                    : transactionData._id?.slice(-8).toUpperCase()}
                            </span>
                            <span>
                                <span className="font-black">Date: </span>
                                {transactionData.createdAt
                                    ? calculateDate(new Date(transactionData.createdAt))
                                    : calculateDate(new Date())}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="truncate max-w-[160px]">
                                <span className="font-black">Party: </span>
                                <span className="capitalize font-bold">
                                    {transactionData.name || "N/A"}
                                </span>
                            </span>
                            <span>
                                <span className="font-black">Time: </span>
                                {transactionData.createdAt
                                    ? calculateTime(new Date(transactionData.createdAt))
                                    : calculateTime(new Date())}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>
                                <span className="font-black">Type: </span>
                                {isDebit ? "Cash Out" : "Payment In"}
                            </span>
                            <span className="truncate max-w-[140px]">
                                <span className="font-black">By: </span>
                                <span className="capitalize font-bold">{creatorName}</span>
                            </span>
                        </div>
                    </div>

                    <div className="border-b-2 border-dashed border-black my-2 w-full" />

                    {/* Transaction Details */}
                    <main className="w-full text-xs font-thermal-a space-y-1.5 font-bold">
                        {transactionData.purpose && (
                            <div className="flex justify-between font-thermal-b text-xs font-bold">
                                <span>Purpose:</span>
                                <span className="capitalize font-black">
                                    {transactionData.purpose}
                                </span>
                            </div>
                        )}

                        {transactionData.paymentMode && (
                            <div className="flex justify-between font-thermal-b text-xs font-bold">
                                <span>Payment Mode:</span>
                                <span className="uppercase font-black">
                                    {transactionData.paymentMode}
                                </span>
                            </div>
                        )}

                        {/* Highlighted Amount Box */}
                        <div className="border-2 border-black py-2 px-3 my-2 text-center bg-gray-50">
                            <span className="text-[11px] uppercase font-black tracking-wider block font-thermal-b">
                                Amount {isDebit ? "Paid" : "Received"}
                            </span>
                            <span className="text-xl font-black font-thermal-a block mt-0.5">
                                ₹{formatNum(amount)}
                            </span>
                        </div>

                        {/* Breakdown sequence in Indian format */}
                        <div className="w-full text-xs font-thermal-a space-y-1 pt-1 font-bold">
                            <div className="flex justify-between font-thermal-b text-xs font-bold">
                                <span>
                                    {transactionData.previousOutstanding !== undefined
                                        ? "Previous Balance:"
                                        : "Total Amount:"}
                                </span>
                                <span>₹{formatNum(transactionData.previousOutstanding ?? amount)}</span>
                            </div>
                            <div className="flex justify-between font-thermal-b text-xs font-bold">
                                <span>Payment {isDebit ? "Paid:" : "Received:"}</span>
                                <span>-₹{formatNum(amount)}</span>
                            </div>
                            <div className="border-b-2 border-dashed border-black my-1 w-full" />
                            <div className="flex justify-between font-black text-sm">
                                <span>
                                    {transactionData.previousOutstanding !== undefined
                                        ? (transactionData.newOutstanding ?? 0) > 0
                                            ? "Final Outstanding:"
                                            : (transactionData.newOutstanding ?? 0) < 0
                                            ? "Final Credit:"
                                            : "Final Balance:"
                                        : "Final Balance:"}
                                </span>
                                <span>
                                    ₹{formatNum(Math.abs(Number(transactionData.newOutstanding ?? 0)))}
                                </span>
                            </div>
                        </div>

                        {/* Signature Line & Footer */}
                        <div className="pt-6 pb-1">
                            <div className="border-b-2 border-black w-36 ml-auto" />
                            <p className="text-right text-[11px] font-thermal-b mt-0.5 font-bold">
                                Authorized Signature
                            </p>
                        </div>

                        <div className="border-b border-dashed border-black mt-2 mb-2 w-full" />
                        <footer className="text-center text-[11px] font-thermal-b space-y-0.5 pb-1 font-bold">
                            <p className="font-black">Thank you for your business!</p>
                            <p>Powered by InvoSync</p>
                        </footer>
                    </main>
                </div>
            )}
        </div>

                <div className="flex justify-end mt-4">
                    <button
                        onClick={handlePrint}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        {isA4 ? "Print A4 Voucher" : "Print Receipt"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TransactionPrint;
