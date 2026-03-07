import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Table, Spin, Button, message } from "antd";
import { ArrowLeftOutlined, DollarOutlined, FileTextOutlined, PrinterOutlined } from "@ant-design/icons";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import ReturnBillPrint from "../billing/ReturnBillPrint";
import apiCaller from "../utils/apiCaller";
import dayjs from "dayjs";

const SingleReturnBillPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from;
    const [loading, setLoading] = useState(false);
    const [returnBill, setReturnBill] = useState<any>(null);

    useEffect(() => {
        const fetchReturnBill = async () => {
            setLoading(true);
            try {
                const res = await apiCaller.get(`/return-bills/${id}`);
                setReturnBill(res.data?.data?.returnBill);
            } catch (error) {
                message.error("Failed to fetch return bill details");
            } finally {
                setLoading(false);
            }
        };
        fetchReturnBill();
    }, [id]);

    const printContentRef = useRef<HTMLDivElement | null>(null);
    const handlePrint = useReactToPrint({
        contentRef: printContentRef as React.RefObject<HTMLDivElement>,
    });

    const columns = [
        {
            title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Item Details</span>,
            dataIndex: ["product", "name"],
            key: "name",
            render: (_: any, record: any) => (
                <div className="flex flex-col">
                    <span className="font-black text-gray-800 capitalize leading-tight">
                        {record.product ? record.product.name : "Deleted Product"}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                        Return Price: ₹{(record.returnPrice || 0).toFixed(2)}
                    </span>
                </div>
            ),
        },
        {
            title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center block">Qty Returned</span>,
            dataIndex: "quantityReturned",
            key: "quantityReturned",
            align: "center" as const,
            render: (q: number) => <span className="font-black text-orange-500">{q}</span>,
        },
        {
            title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-right block">Refund Total</span>,
            dataIndex: "returnTotal",
            key: "returnTotal",
            align: "right" as const,
            render: (t: number) => <span className="font-black text-indigo-600">₹{t.toLocaleString()}</span>,
        },
    ];

    return (
        <main className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-50/50 flex flex-col items-center">
            <div className="w-full max-w-4xl">
                <div className="flex items-center justify-between mb-8">
                    <Button
                        type="text"
                        icon={<ArrowLeftOutlined className="text-[10px]" />}
                        onClick={() => {
                            if (from === "daily-report") navigate("/daily-report");
                            else if (from === "customer") navigate(-1);
                            else navigate(-1);
                        }}
                        className="flex items-center gap-2 font-black text-gray-400 hover:text-indigo-600 transition-all p-0 h-auto uppercase tracking-widest text-[10px]"
                    >
                        {from === "daily-report" ? "Terminal Root / Report" : from === "customer" ? "Terminal Root / CRM" : "Terminal Root / Archives"}
                    </Button>
                    <div className="text-right hidden sm:block">
                        <span className="text-[10px] font-black text-orange-400 uppercase tracking-[0.2em] block">Return Record</span>
                        <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest text-right">
                            ID: {returnBill?.id ? `R-${returnBill.id}` : returnBill?._id?.slice(-8).toUpperCase()}
                        </span>
                    </div>
                </div>

                {loading ? (
                    <div className="py-40 text-center"><Spin size="large" /></div>
                ) : returnBill ? (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        {/* Header Card */}
                        <div className="bg-white rounded-[40px] shadow-sm border border-orange-100 overflow-hidden group">
                            <div className="bg-orange-500 p-8 sm:p-12 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative overflow-hidden">
                                <div className="relative z-10">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-400 rounded-full mb-4 border border-orange-300/30">
                                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                        <span className="text-[8px] font-black uppercase tracking-widest">Return Processed</span>
                                    </div>
                                    <h1 className="text-3xl font-black tracking-tighter leading-tight mb-2">Return Invoice</h1>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className="text-[10px] font-black text-orange-100/70 border border-orange-100/20 px-3 py-1 rounded-xl bg-white/5 backdrop-blur-sm">
                                            {dayjs(returnBill.createdAt).format("DD MMM YYYY · hh:mm A")}
                                        </span>
                                        <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-xl border flex items-center gap-2 bg-white/20 border-white/30 text-white">
                                            Orig. Invoice: B-{returnBill?.originalBill?.id || "N/A"}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3 relative z-10 w-full md:w-auto mt-4 md:mt-0">
                                    <Button
                                        icon={<PrinterOutlined />}
                                        onClick={() => handlePrint()}
                                        className="h-14 px-10 bg-white/20 hover:bg-white/30 border-white/30 text-white font-black rounded-2xl backdrop-blur-md transition-all flex items-center gap-2 text-[10px] tracking-widest uppercase shadow-lg shadow-orange-900/10"
                                    >
                                        PRINT REFUND RECORD
                                    </Button>
                                </div>

                                <div className="absolute top-0 right-0 p-20 opacity-10 group-hover:scale-110 transition-transform duration-1000 rotate-12">
                                    <DollarOutlined style={{ fontSize: 280 }} />
                                </div>
                            </div>

                            <div className="p-8 sm:p-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                <div>
                                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest block mb-2">Client Identification</span>
                                    <p className="text-base font-black text-gray-800 tracking-tight capitalize">{returnBill?.customer?.name}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest block mb-1.5">Direct Communication</span>
                                    <p className="text-base font-bold text-gray-600">{returnBill?.customer?.phone}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest block mb-1.5">Refund Method</span>
                                    <p className="text-base font-black text-indigo-600 tracking-tight">{returnBill?.paymentMode}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest block mb-1.5">System Operator</span>
                                    <p className="text-base font-black text-orange-600 tracking-tight">{returnBill?.createdBy?.name ?? "Terminal Admin"}</p>
                                </div>
                            </div>
                        </div>

                        {/* Financial Summary */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center group hover:border-gray-200 transition-all">
                                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest block mb-1">Refund Value</span>
                                <span className="text-3xl font-black text-gray-800 tracking-tighter">₹{Number(returnBill.totalAmount).toLocaleString()}</span>
                            </div>
                            <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center group hover:border-orange-100 transition-all">
                                <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest block mb-1">Previous Outstanding</span>
                                <span className="text-2xl font-black text-orange-600 tracking-tighter">
                                    {(returnBill.previousOutstanding || 0) < 0 ? "-" : ""}₹{Math.abs(Number(returnBill.previousOutstanding || 0)).toLocaleString()}
                                </span>
                            </div>
                            <div className={`rounded-[32px] p-6 shadow-sm flex flex-col items-center justify-center text-center group transition-all ${returnBill.paymentMode === "CASH" ? "bg-white border border-gray-100" : "bg-green-50 border border-green-100 hover:border-green-200"}`}>
                                <span className={`text-[10px] font-black uppercase tracking-widest block mb-1 ${returnBill.paymentMode === "CASH" ? "text-gray-400" : "text-green-500"}`}>Mode</span>
                                <span className={`text-xl font-black tracking-tighter ${returnBill.paymentMode === "CASH" ? "text-gray-600" : "text-green-600"}`}>{returnBill.paymentMode}</span>
                            </div>
                            <div className="bg-indigo-600 rounded-[32px] p-6 shadow-xl shadow-indigo-100 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                                <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest block mb-1 relative z-10">New Net Balance</span>
                                <span className="text-3xl font-black text-white tracking-tighter relative z-10">
                                    {(returnBill.newOutstanding || 0) < 0 ? "-" : ""}₹{Math.abs(Number(returnBill.newOutstanding || 0)).toLocaleString()}
                                </span>
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-700">
                                    <DollarOutlined style={{ fontSize: 60 }} />
                                </div>
                            </div>
                        </div>

                        {/* Line Items Table */}
                        <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Returned Inventory</h3>
                            </div>
                            <Table
                                dataSource={returnBill?.items || []}
                                columns={columns}
                                rowKey={(record: any) => record?._id || Math.random().toString()}
                                pagination={false}
                                scroll={{ x: 600 }}
                                className="modern-table no-border-table"
                                summary={(pageData: readonly any[]) => {
                                    const total = pageData.reduce((sum: number, item: any) => sum + (item.returnTotal || 0), 0);
                                    return (
                                        <Table.Summary.Row className="bg-gray-50/50">
                                            <Table.Summary.Cell index={0} colSpan={2} className="py-8">
                                                <div className="text-right pr-6 text-[10px] font-black text-gray-300 uppercase tracking-widest">Aggregate Refund Total</div>
                                            </Table.Summary.Cell>
                                            <Table.Summary.Cell index={1} colSpan={1} className="py-8">
                                                <div className="text-2xl font-black text-indigo-600 tracking-tighter text-right">₹{total.toLocaleString()}</div>
                                            </Table.Summary.Cell>
                                        </Table.Summary.Row>
                                    );
                                }}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="py-40 text-center flex flex-col items-center">
                        <div className="w-20 h-20 rounded-[32px] bg-red-50 text-red-500 flex items-center justify-center mb-6">
                            <FileTextOutlined style={{ fontSize: 32 }} />
                        </div>
                        <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Return Record Not Found</p>
                    </div>
                )}

                {/* Hidden ReturnBillPrint for printing only */}
                {returnBill && (
                    <div style={{ display: "none" }}>
                        <ReturnBillPrint
                            onClose={() => { }}
                            contentRef={printContentRef}
                            handlePrint={() => { }}
                            returnBill={returnBill}
                        />
                    </div>
                )}
            </div>

            <style>{`
                .no-border-table .ant-table { background: transparent !important; }
                .no-border-table .ant-table-thead > tr > th { 
                    background: transparent !important; 
                    border-bottom: 1px solid #f8fafc !important;
                    padding: 1.5rem 1rem !important;
                }
                .no-border-table .ant-table-tbody > tr > td { 
                    border-bottom: 1px solid #f8fafc !important;
                    padding: 1.25rem 1rem !important;
                }
            `}</style>
        </main>
    );
};

export default SingleReturnBillPage;
