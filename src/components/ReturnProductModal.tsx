import React, { useState, useMemo, useEffect } from "react";
import { Modal, Table, InputNumber, Select, Button, Tag } from "antd";
import { message } from "../utils/antdStatic";
import { DollarOutlined, InfoCircleOutlined, ReloadOutlined } from "@ant-design/icons";
import apiCaller from "../utils/apiCaller";

interface ReturnProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    bill: any;
    onSuccess: () => void;
}

const ReturnProductModal: React.FC<ReturnProductModalProps> = ({
    isOpen,
    onClose,
    bill,
    onSuccess,
}) => {
    const [returnItems, setReturnItems] = useState<{ [key: string]: number }>({});
    const [paymentMode, setPaymentMode] = useState<"ADJUSTMENT" | "CASH">("ADJUSTMENT");
    const [loading, setLoading] = useState(false);

    // Reset state when opened with a new bill
    useEffect(() => {
        if (isOpen) {
            setReturnItems({});
            setPaymentMode("ADJUSTMENT");
        }
    }, [isOpen, bill]);

    // Handle quantity change
    const handleQuantityChange = (productId: string, value: number | null) => {
        setReturnItems((prev) => ({
            ...prev,
            [productId]: value || 0,
        }));
    };

    // Calculate total return amount
    const { totalReturnAmount, itemsToReturn } = useMemo(() => {
        let total = 0;
        const items: any[] = [];

        if (!bill?.items) return { totalReturnAmount: 0, itemsToReturn: [] };

        bill.items.forEach((item: any) => {
            const pIdStr = item.product?._id || item.product;
            const returningQty = returnItems[pIdStr] || 0;

            if (returningQty > 0) {
                // Calculate unit price based on original bill
                const unitPrice = item.quantity > 0 ? item.total / item.quantity : 0;
                const returnTotal = unitPrice * returningQty;
                total += returnTotal;

                items.push({
                    product: pIdStr,
                    quantityReturned: returningQty,
                    returnPrice: unitPrice,
                    returnTotal: returnTotal,
                    originalType: item.type || "RETAIL"
                });
            }
        });

        return { totalReturnAmount: total, itemsToReturn: items };
    }, [bill, returnItems]);

    const handleSubmit = async () => {
        if (itemsToReturn.length === 0) {
            message.error("Please select at least one item to return.");
            return;
        }

        setLoading(true);
        try {
            await apiCaller.post("/return-bills", {
                originalBillId: bill._id || bill.id,
                customerId: bill.customer?._id || bill.customer,
                paymentMode,
                items: itemsToReturn,
                totalAmount: totalReturnAmount
            });
            message.success("Return processed successfully");
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error(error);
            message.error(error.response?.data?.message || "Failed to process return");
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Product</span>,
            dataIndex: ["product", "name"],
            key: "name",
            render: (_: any, record: any) => (
                <span className="font-bold text-gray-800 capitalize">
                    {record.product ? record.product.name : "Unknown"}
                </span>
            ),
        },
        {
            title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center block">Purchased Qty</span>,
            dataIndex: "quantity",
            key: "quantity",
            align: "center" as const,
            render: (q: number) => <span className="font-bold text-gray-600">{q}</span>,
        },
        {
            title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center block">Return Qty</span>,
            key: "returnQty",
            align: "center" as const,
            render: (_: any, record: any) => {
                const pIdStr = record.product?._id || record.product;
                return (
                    <InputNumber
                        min={0}
                        max={record.quantity}
                        value={returnItems[pIdStr] || 0}
                        onChange={(val) => handleQuantityChange(pIdStr, val)}
                        className="w-24 text-center font-bold"
                    />
                );
            },
        },
        {
            title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-right block">Refund Value</span>,
            key: "refundValue",
            align: "right" as const,
            render: (_: any, record: any) => {
                const pIdStr = record.product?._id || record.product;
                const returningQty = returnItems[pIdStr] || 0;
                const unitPrice = record.quantity > 0 ? record.total / record.quantity : 0;
                return (
                    <span className="font-black text-indigo-600">
                        ₹{(unitPrice * returningQty).toLocaleString()}
                    </span>
                );
            },
        },
    ];

    return (
        <Modal
            title={
                <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                        <ReloadOutlined className="text-xl" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-800 m-0 leading-tight">Return Products</h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest m-0">
                            Invoice #{bill?.id ? bill.id : bill?._id?.slice(-8).toUpperCase()}
                        </p>
                    </div>
                </div>
            }
            open={isOpen}
            onCancel={onClose}
            footer={null}
            width={700}
            centered
            className="modern-modal"
            closeIcon={<span className="text-gray-400 hover:text-gray-800 transition-colors">✕</span>}
        >
            <div className="py-6 flex flex-col gap-6">

                {/* Customer Info */}
                <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100 flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Returning For</span>
                        <span className="font-black text-gray-700 capitalize text-base">{bill?.customer?.name}</span>
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Current Outstanding</span>
                        <span className="font-black text-red-500 text-base">₹{Number(bill?.customer?.outstanding || 0).toLocaleString()}</span>
                    </div>
                </div>

                {/* Item Selection Table */}
                <div className="border border-gray-100 rounded-2xl overflow-hidden">
                    <Table
                        dataSource={bill?.items || []}
                        columns={columns}
                        rowKey={(rec: any) => rec.product?._id || rec.product || Math.random().toString()}
                        pagination={false}
                        size="small"
                        scroll={{ y: 240 }}
                        className="no-border-table"
                    />
                </div>

                {/* Payment & Summary */}
                <div className="bg-indigo-50/30 border border-indigo-100/50 p-5 rounded-2xl flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center">

                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                            <DollarOutlined /> Refund Method
                        </span>
                        <Select
                            value={paymentMode}
                            onChange={setPaymentMode}
                            className="w-full sm:w-48 font-bold"
                            options={[
                                { value: "ADJUSTMENT", label: "Reduce Outstanding" },
                                { value: "CASH", label: "Cash Refund" },
                            ]}
                        />
                        {paymentMode === "CASH" && (
                            <span className="text-[9px] font-bold text-orange-400 flex items-center gap-1 mt-1">
                                <InfoCircleOutlined /> Does not lower outstanding
                            </span>
                        )}
                    </div>

                    <div className="text-right w-full sm:w-auto">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Total Refund Value</span>
                        <span className="text-3xl font-black text-indigo-600 tracking-tighter block leading-none">
                            ₹{totalReturnAmount.toLocaleString()}
                        </span>
                        {paymentMode === "ADJUSTMENT" && totalReturnAmount > 0 && (
                            <span className="text-[10px] border border-green-200 bg-green-50 text-green-600 font-bold px-2 py-0.5 rounded-md mt-2 inline-block">
                                New Outstanding: {(Number(bill?.customer?.outstanding || 0) - totalReturnAmount) < 0 ? "-" : ""}₹{Math.abs(Number(bill?.customer?.outstanding || 0) - totalReturnAmount).toLocaleString()}
                            </span>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 mt-2">
                    <Button onClick={onClose} className="font-bold border-gray-200 text-gray-500 rounded-xl px-6 h-11">
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        onClick={handleSubmit}
                        loading={loading}
                        disabled={itemsToReturn.length === 0}
                        className="bg-indigo-600 hover:bg-indigo-700 font-black tracking-widest uppercase text-[10px] rounded-xl px-8 h-11 shadow-md shadow-indigo-200"
                    >
                        Process Return
                    </Button>
                </div>

            </div>

            <style>{`
        .modern-modal .ant-modal-content {
          border-radius: 32px;
          padding: 32px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
        .modern-modal .ant-modal-close {
          top: 32px;
          right: 32px;
        }
        .no-border-table .ant-table { background: transparent !important; }
        .no-border-table .ant-table-thead > tr > th { 
          background: #f8fafc !important; 
          border-bottom: 1px solid #f1f5f9 !important;
        }
        .no-border-table .ant-table-tbody > tr > td { 
          border-bottom: 1px solid #f8fafc !important;
        }
      `}</style>
        </Modal>
    );
};

export default ReturnProductModal;
