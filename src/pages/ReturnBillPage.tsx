import React, { useState } from "react";
import { Input, Button, Spin, message, Card } from "antd";
import { SearchOutlined, CheckCircleOutlined, ReloadOutlined } from "@ant-design/icons";
import apiCaller from "../utils/apiCaller";
import ReturnProductModal from "../components/ReturnProductModal";
import dayjs from "dayjs";

const ReturnBillPage = () => {
    const [searchId, setSearchId] = useState("");
    const [loading, setLoading] = useState(false);
    const [bill, setBill] = useState<any>(null);
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

    const handleSearch = async () => {
        if (!searchId.trim()) {
            message.warning("Please enter a valid Invoice ID");
            return;
        }

        setLoading(true);
        setBill(null);
        try {
            const res = await apiCaller.get(`/bills/${searchId.trim()}`);
            if (res.data?.success && res.data?.data?.bill) {
                setBill(res.data.data.bill);
            } else {
                message.warning("Invoice not found.");
            }
        } catch (error: any) {
            if (error.response?.status === 404) {
                message.warning("Invoice not found.");
            } else {
                message.error("Failed to fetch bill details.");
            }
        } finally {
            setLoading(false);
        }
    };

    const billProductTotal = bill?.productsTotal ?? bill?.items?.reduce((sum: number, item: any) => sum + (item.total || 0), 0) ?? 0;

    return (
        <main className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-50/50 flex flex-col items-center">
            <div className="w-full max-w-4xl">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter leading-tight text-gray-800">Return Center</h1>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Process Client Refunds & Adjustments</span>
                    </div>
                </div>

                {/* Search Card */}
                <div className="bg-white rounded-[32px] shadow-sm p-6 sm:p-8 mb-8 border border-gray-100 flex flex-col sm:flex-row gap-4 items-center">
                    <Input
                        prefix={<SearchOutlined className="text-gray-400 mr-2" />}
                        placeholder="Enter Invoice ID (e.g. 1042)"
                        value={searchId}
                        onChange={(e) => setSearchId(e.target.value)}
                        onPressEnter={handleSearch}
                        className="h-14 rounded-2xl border-gray-200 bg-gray-50/50 text-base font-bold flex-1 focus:bg-white transition-all shadow-inner"
                    />
                    <Button
                        type="primary"
                        onClick={handleSearch}
                        loading={loading}
                        className="h-14 px-8 bg-indigo-600 hover:bg-indigo-700 border-none rounded-2xl text-[10px] font-black tracking-widest shadow-md shadow-indigo-100 uppercase sm:w-auto w-full"
                    >
                        Find Invoice
                    </Button>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="py-20 text-center flex flex-col items-center">
                        <Spin size="large" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-4">Searching Archives...</span>
                    </div>
                )}

                {/* Result Card */}
                {bill && !loading && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden relative group">
                            <div className="bg-emerald-600 p-8 sm:p-10 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative overflow-hidden">
                                <div className="relative z-10 flex items-center gap-5">
                                    <div className="w-16 h-16 rounded-[24px] bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner border border-white/20">
                                        <CheckCircleOutlined />
                                    </div>
                                    <div>
                                        <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-emerald-500/50 rounded-full mb-1 border border-emerald-400/30 backdrop-blur-sm">
                                            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                            <span className="text-[8px] font-black uppercase tracking-widest">Invoice Verified</span>
                                        </div>
                                        <h2 className="text-2xl font-black tracking-tighter m-0">Invoice #{bill?.id ? bill.id : bill?._id?.slice(-8).toUpperCase()}</h2>
                                        <span className="text-[10px] font-bold text-emerald-100/70 block mt-1">
                                            {dayjs(bill.createdAt || bill.date).format("DD MMM YYYY · hh:mm A")}
                                        </span>
                                    </div>
                                </div>

                                <div className="relative z-10 w-full sm:w-auto mt-4 sm:mt-0">
                                    <Button
                                        icon={<ReloadOutlined />}
                                        onClick={() => setIsReturnModalOpen(true)}
                                        className="h-14 w-full sm:w-auto px-8 bg-orange-500 hover:bg-orange-400 border-none text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2 text-[10px] tracking-[0.2em] uppercase shadow-xl shadow-orange-500/30 group-hover:scale-105"
                                    >
                                        INITIATE RETURN
                                    </Button>
                                </div>

                                <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-1000 rotate-12">
                                    <CheckCircleOutlined style={{ fontSize: 240 }} />
                                </div>
                            </div>

                            <div className="p-8 sm:p-10 grid grid-cols-1 sm:grid-cols-3 gap-8">
                                <div>
                                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest block mb-2">Billed To</span>
                                    <p className="text-base font-black text-gray-800 tracking-tight capitalize">{bill?.customer?.name || "Walk-in Customer"}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest block mb-1.5">Original Total</span>
                                    <p className="text-base font-black text-indigo-600 tracking-tight">₹{Number(billProductTotal).toLocaleString()}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest block mb-1.5">Items</span>
                                    <p className="text-base font-bold text-gray-600">{bill?.items?.length || 0} Listed Items</p>
                                </div>
                            </div>
                        </div>

                        <ReturnProductModal
                            isOpen={isReturnModalOpen}
                            onClose={() => setIsReturnModalOpen(false)}
                            bill={bill}
                            onSuccess={() => {
                                setBill(null);
                                setSearchId("");
                            }}
                        />
                    </div>
                )}
            </div>
        </main>
    );
};

export default ReturnBillPage;
