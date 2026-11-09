import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Table, Spin, Button, Tag, Modal, Input, Popconfirm } from "antd";
import { message } from "../utils/antdStatic";
import {
    ArrowLeftOutlined,
    DollarOutlined,
    FileTextOutlined,
    PrinterOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
} from "@ant-design/icons";
import { useReactToPrint } from "react-to-print";
import ReturnBillPrint from "../billing/ReturnBillPrint";
import apiCaller from "../utils/apiCaller";
import dayjs from "dayjs";
import useUserStore from "../store/user.store";
import useReturnBillStore from "../store/returnBill.store";

const SingleReturnBillPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [returnBill, setReturnBill] = useState<any>(null);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");

    const updateReturnBill = useReturnBillStore((state) => state.updateReturnBill);
    const user = useUserStore((state) => state.user);
    const hasAdminAccess = user && user.roles?.some((role) =>
        ["SUPER_ADMIN", "ADMIN", "CREATOR"].includes(role)
    );

    const fetchReturnBill = async () => {
        setLoading(true);
        try {
            const res = await apiCaller.get(`/return-bills/${id}`);
            setReturnBill(res.data?.data?.returnBill);
        } catch (error: any) {
            message.error(error?.response?.data?.message || error?.response?.data?.msg || "Failed to fetch return bill details");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchReturnBill();
    }, [id]);

    const printContentRef = useRef<HTMLDivElement | null>(null);
    const printType = user?.shopSettings?.printType || "THERMAL";
    const pageStyle =
        printType === "A4"
            ? "@page { size: A4 portrait; margin: 10mm; } @media print { body { -webkit-print-color-adjust: exact; } }"
            : "@page { size: 80mm auto; margin: 0; } @media print { body { -webkit-print-color-adjust: exact; } thead { display: table-row-group !important; } tfoot { display: table-row-group !important; } }";

    const handlePrint = useReactToPrint({
        contentRef: printContentRef as React.RefObject<HTMLDivElement>,
        pageStyle,
    });

    // Handle Admin Approve
    const handleApprove = async () => {
        if (!id) return;
        setActionLoading(true);
        try {
            const res = await apiCaller.post(`/return-bills/${id}/approve`);
            message.success(res.data?.msg || res.data?.message || "Return bill approved successfully");
            if (res.data?.data?.returnBill) {
                setReturnBill(res.data.data.returnBill);
                updateReturnBill(res.data.data.returnBill);
            }
            fetchReturnBill();
        } catch (error: any) {
            console.error(error);
            if (error.response?.data?.data?.customer?.outstanding !== undefined) {
                const { customer, returnBill: errRb } = error.response.data.data;
                const expected = errRb?.previousOutstanding ?? returnBill?.previousOutstanding;
                message.error({
                    content: (
                        <div className="flex flex-col gap-1.5 py-1">
                            <div className="font-black text-red-600 text-sm tracking-tight leading-tight mb-1">
                                {error.response.data.msg || "Outstanding mismatch detected"}
                            </div>
                            <div className="flex justify-between items-center bg-gray-50 rounded-lg p-2 border border-gray-100">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Expected</span>
                                <span className="font-mono font-black text-gray-500 line-through">₹{expected}</span>
                            </div>
                            <div className="flex justify-between items-center bg-red-50 rounded-lg p-2 border border-red-100">
                                <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Actual (Now)</span>
                                <span className="font-mono font-black text-red-600">₹{customer.outstanding}</span>
                            </div>
                            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center mt-2.5">
                                Reject this return bill and create a new return request
                            </div>
                        </div>
                    ),
                    duration: 8,
                    className: "custom-error-message",
                });
                fetchReturnBill();
            } else {
                message.error(error?.response?.data?.message || error?.response?.data?.msg || "Failed to approve return bill");
            }
        } finally {
            setActionLoading(false);
        }
    };

    // Handle Admin Reject
    const handleReject = async () => {
        if (!id) return;
        setActionLoading(true);
        try {
            const res = await apiCaller.post(`/return-bills/${id}/reject`, {
                reason: rejectionReason || "Rejected by admin",
            });
            message.success(res.data?.msg || res.data?.message || "Return bill rejected successfully");
            setIsRejectModalOpen(false);
            if (res.data?.data?.returnBill) {
                setReturnBill(res.data.data.returnBill);
                updateReturnBill(res.data.data.returnBill);
            }
            fetchReturnBill();
        } catch (error: any) {
            console.error(error);
            message.error(error?.response?.data?.message || "Failed to reject return bill");
        } finally {
            setActionLoading(false);
        }
    };

    const status = returnBill?.status || "APPROVED"; // Default legacy to APPROVED

    const customerCurrentOutstanding = returnBill?.customer?.outstanding;
    const expectedOutstanding = returnBill?.previousOutstanding;
    const hasMismatch =
        status === "PENDING" &&
        customerCurrentOutstanding !== undefined &&
        expectedOutstanding !== undefined &&
        Math.abs(Number(customerCurrentOutstanding) - Number(expectedOutstanding)) > 0.01;

    const columns = [
        {
            title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Item Details</span>,
            dataIndex: ["product", "name"],
            key: "name",
            render: (_: any, record: any) => (
                <div className="flex flex-col">
                    <span className={`font-black capitalize leading-tight ${status === "REJECTED" ? "line-through text-gray-400" : "text-gray-800"}`}>
                        {record.product ? record.product.name : "Deleted Product"}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${status === "REJECTED" ? "line-through text-gray-300" : "text-gray-400"}`}>
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
            render: (q: number) => <span className={`font-black ${status === "REJECTED" ? "line-through text-gray-400" : "text-orange-500"}`}>{q}</span>,
        },
        {
            title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-right block">Refund Total</span>,
            dataIndex: "returnTotal",
            key: "returnTotal",
            align: "right" as const,
            render: (t: number) => <span className={`font-black ${status === "REJECTED" ? "line-through text-gray-400" : "text-indigo-600"}`}>₹{t.toLocaleString()}</span>,
        },
    ];

    return (
        <main className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-50/50 flex flex-col items-center">
            <div className="w-full max-w-4xl">
                {/* Back button and ID */}
                <div className="flex items-center justify-between mb-8">
                    <Button
                        type="text"
                        icon={<ArrowLeftOutlined className="text-[10px]" />}
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 font-black text-gray-400 hover:text-indigo-600 transition-all p-0 h-auto uppercase tracking-widest text-[10px]"
                    >
                        Back
                    </Button>
                    <div className="text-right hidden sm:block">
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] block ${status === "REJECTED" ? "text-red-500" : "text-orange-400"}`}>
                            {status === "REJECTED" ? "Return Bill (Rejected)" : "Return Bill"}
                        </span>
                        <span className={`text-[8px] font-black uppercase tracking-widest text-right ${status === "REJECTED" ? "text-red-400 line-through" : "text-gray-300"}`}>
                            ID: {returnBill?.id ? `R-${returnBill.id}` : returnBill?._id?.slice(-8).toUpperCase()}
                        </span>
                    </div>
                </div>

                {loading ? (
                    <div className="py-40 text-center"><Spin size="large" /></div>
                ) : returnBill ? (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        {/* Status Alert Banner */}
                        {status === "PENDING" && (
                            hasMismatch ? (
                                <div className="bg-red-50 border border-red-200 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
                                    <div className="flex items-center gap-3">
                                        <CloseCircleOutlined className="text-2xl text-red-500 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-black text-red-900 text-sm m-0">Customer Outstanding Mismatch Detected</h4>
                                            <p className="text-xs text-red-700 m-0 mt-0.5">
                                                Customer balance is currently <span className="font-black text-red-800 font-mono">₹{Number(customerCurrentOutstanding).toLocaleString()}</span>, but the return bill expected <span className="font-bold line-through font-mono">₹{Number(expectedOutstanding).toLocaleString()}</span>. This return bill cannot be approved. Please reject it and create a new return request.
                                            </p>
                                        </div>
                                    </div>
                                    {hasAdminAccess && (
                                        <div className="flex items-center gap-2 w-full sm:w-auto">
                                            <Button
                                                danger
                                                type="primary"
                                                onClick={() => {
                                                    setRejectionReason(`Customer outstanding mismatch (Expected: ₹${expectedOutstanding}, Actual: ₹${customerCurrentOutstanding})`);
                                                    setIsRejectModalOpen(true);
                                                }}
                                                loading={actionLoading}
                                                className="font-black text-xs rounded-xl h-10 px-5 bg-red-600 hover:bg-red-700 shadow-md shadow-red-200 uppercase"
                                            >
                                                REJECT RETURN BILL
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <ClockCircleOutlined className="text-2xl text-amber-500" />
                                        <div>
                                            <h4 className="font-black text-amber-900 text-sm m-0">Awaiting Admin Approval</h4>
                                            <p className="text-xs text-amber-700 m-0 mt-0.5">
                                                This return bill is pending. Product stocks and customer balance will update once approved.
                                            </p>
                                        </div>
                                    </div>
                                    {hasAdminAccess && (
                                        <div className="flex items-center gap-2 w-full sm:w-auto">
                                            <Button
                                                danger
                                                onClick={() => setIsRejectModalOpen(true)}
                                                loading={actionLoading}
                                                className="font-black text-xs rounded-xl h-10 px-5"
                                            >
                                                REJECT
                                            </Button>
                                            <Popconfirm
                                                title="Approve Return Bill"
                                                description="This will restore product stock and update customer ledger balance."
                                                onConfirm={handleApprove}
                                                okButtonProps={{ className: "bg-orange-500 rounded-lg font-black" }}
                                                cancelButtonProps={{ className: "rounded-lg font-black" }}
                                            >
                                                <Button
                                                    type="primary"
                                                    loading={actionLoading}
                                                    className="bg-orange-500 hover:bg-orange-600 border-none font-black text-xs rounded-xl h-10 px-6 shadow-md shadow-orange-200"
                                                >
                                                    APPROVE
                                                </Button>
                                            </Popconfirm>
                                        </div>
                                    )}
                                </div>
                            )
                        )}

                        {status === "APPROVED" && (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-4 px-6 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <CheckCircleOutlined className="text-xl text-emerald-600" />
                                    <span className="text-xs font-black text-emerald-800">
                                        Approved {returnBill.approvedBy?.name ? `by ${returnBill.approvedBy.name}` : ""} {returnBill.approvedAt ? `on ${dayjs(returnBill.approvedAt).format("DD MMM YYYY, h:mm A")}` : ""}
                                    </span>
                                </div>
                                <Tag color="green" className="font-black uppercase tracking-widest text-[9px] rounded-full border-0 px-3">
                                    Approved
                                </Tag>
                            </div>
                        )}

                        {status === "REJECTED" && (
                            <div className="bg-red-50 border border-red-200 rounded-3xl p-5 flex flex-col gap-1">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-red-600 font-black text-sm">
                                        <CloseCircleOutlined />
                                        <span>Return Bill Rejected</span>
                                    </div>
                                    <Tag color="red" className="font-black uppercase tracking-widest text-[9px] rounded-full border-0 px-3">
                                        Rejected
                                    </Tag>
                                </div>
                                <p className="text-xs text-red-700 m-0 mt-1">
                                    {returnBill.rejectedBy?.name ? `Rejected by ${returnBill.rejectedBy.name}. ` : ""}
                                    Reason: <span className="font-bold">{returnBill.rejectionReason || "None provided"}</span>
                                </p>
                            </div>
                        )}

                        {/* Header Card */}
                        <div className="bg-white rounded-[40px] shadow-sm border border-orange-100 overflow-hidden group">
                            <div className={`${status === "REJECTED" ? "bg-red-600" : "bg-orange-500"} p-8 sm:p-12 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative overflow-hidden transition-colors duration-500`}>
                                <div className="relative z-10">
                                    <div className={`inline-flex items-center gap-2 px-3 py-1 ${status === "REJECTED" ? "bg-red-700" : "bg-orange-400"} rounded-full mb-4 border border-white/20`}>
                                        {status !== "REJECTED" && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                                        <span className="text-[8px] font-black uppercase tracking-widest">
                                            {status === "REJECTED" ? "Rejected (Void)" : status === "APPROVED" ? "Approved Return" : "Pending Approval"}
                                        </span>
                                    </div>
                                    <h1 className={`text-3xl font-black tracking-tighter leading-tight mb-2 ${status === "REJECTED" ? "line-through opacity-85" : ""}`}>
                                        Return Bill #{returnBill?.id ? `R-${returnBill.id}` : returnBill?._id?.slice(-6)}
                                    </h1>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className="text-[10px] font-black text-orange-100/70 border border-orange-100/20 px-3 py-1 rounded-xl bg-white/5 backdrop-blur-sm">
                                            {dayjs(returnBill.createdAt).format("DD MMM YYYY · hh:mm A")}
                                        </span>
                                        <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-xl border flex items-center gap-2 bg-white/20 border-white/30 text-white">
                                            Original Bill: B-{returnBill?.originalBill?.id || "N/A"}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3 relative z-10 w-full md:w-auto mt-4 md:mt-0">
                                    <Button
                                        icon={<PrinterOutlined />}
                                        onClick={() => handlePrint()}
                                        className="h-14 px-10 bg-white/20 hover:bg-white/30 border-white/30 text-white font-black rounded-2xl backdrop-blur-md transition-all flex items-center gap-2 text-[10px] tracking-widest uppercase shadow-lg shadow-orange-900/10"
                                    >
                                        PRINT RETURN BILL
                                    </Button>
                                </div>

                                <div className="absolute top-0 right-0 p-20 opacity-10 group-hover:scale-110 transition-transform duration-1000 rotate-12">
                                    <DollarOutlined style={{ fontSize: 280 }} />
                                </div>
                            </div>

                            <div className="p-8 sm:p-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                <div>
                                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest block mb-2">Customer Name</span>
                                    <p className="text-base font-black text-gray-800 tracking-tight capitalize">{returnBill?.customer?.name}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest block mb-1.5">Phone Number</span>
                                    <p className="text-base font-bold text-gray-600">{returnBill?.customer?.phone || "N/A"}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest block mb-1.5">Refund Type</span>
                                    <p className="text-base font-black text-indigo-600 tracking-tight">{returnBill?.paymentMode}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest block mb-1.5">Billed By</span>
                                    <p className="text-base font-black text-orange-600 tracking-tight">{returnBill?.createdBy?.name ?? "Staff"}</p>
                                </div>
                            </div>
                        </div>

                        {/* Financial Summary */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center group hover:border-gray-200 transition-all">
                                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest block mb-1">Return Total</span>
                                <span className={`text-3xl font-black tracking-tighter ${status === "REJECTED" ? "line-through text-gray-400" : "text-gray-800"}`}>
                                    ₹{Number(returnBill.totalAmount).toLocaleString()}
                                </span>
                            </div>
                            <div className={`rounded-[32px] p-6 border shadow-sm flex flex-col items-center justify-center text-center group transition-all ${hasMismatch ? "bg-red-50/50 border-red-200" : "bg-white border-gray-100 hover:border-orange-100"}`}>
                                <span className={`text-[10px] font-black uppercase tracking-widest block mb-1 ${hasMismatch ? "text-red-500" : "text-orange-400"}`}>
                                    {hasMismatch ? "Expected Balance" : "Previous Balance"}
                                </span>
                                <span className={`text-2xl font-black tracking-tighter ${hasMismatch ? "text-red-600 line-through" : "text-orange-600"}`}>
                                    {(returnBill.previousOutstanding || 0) < 0 ? "-" : ""}₹{Math.abs(Number(returnBill.previousOutstanding || 0)).toLocaleString()}
                                </span>
                                {hasMismatch && (
                                    <span className="text-[9px] font-black text-red-500 uppercase mt-1">
                                        Current: ₹{Number(customerCurrentOutstanding || 0).toLocaleString()}
                                    </span>
                                )}
                            </div>
                            <div className={`rounded-[32px] p-6 shadow-sm flex flex-col items-center justify-center text-center group transition-all ${returnBill.paymentMode === "CASH" ? "bg-white border border-gray-100" : "bg-green-50 border border-green-100 hover:border-green-200"}`}>
                                <span className={`text-[10px] font-black uppercase tracking-widest block mb-1 ${returnBill.paymentMode === "CASH" ? "text-gray-400" : "text-green-500"}`}>Mode</span>
                                <span className={`text-xl font-black tracking-tighter ${returnBill.paymentMode === "CASH" ? "text-gray-600" : "text-green-600"}`}>{returnBill.paymentMode}</span>
                            </div>
                            <div className="bg-indigo-600 rounded-[32px] p-6 shadow-xl shadow-indigo-100 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                                <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest block mb-1 relative z-10">
                                    {status === "PENDING" ? "Projected Balance" : status === "REJECTED" ? "Ledger Balance (No Change)" : "New Balance"}
                                </span>
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
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Returned Items</h3>
                            </div>
                            <Table
                                dataSource={returnBill?.items || []}
                                columns={columns}
                                rowKey={(record: any) => record?._id || Math.random().toString()}
                                pagination={false}
                                scroll={{ x: 600 }}
                                className="modern-table no-border-table"
                                rowClassName={() => status === "REJECTED" ? "rejected-return-row line-through text-gray-400 bg-red-50/20 opacity-60" : ""}
                                summary={(pageData: readonly any[]) => {
                                    const total = pageData.reduce((sum: number, item: any) => sum + (item.returnTotal || 0), 0);
                                    return (
                                        <Table.Summary.Row className="bg-gray-50/50">
                                            <Table.Summary.Cell index={0} colSpan={2} className="py-8">
                                                <div className="text-right pr-6 text-[10px] font-black text-gray-300 uppercase tracking-widest">
                                                    Total Return Amount {status === "REJECTED" && "(VOID - REJECTED)"}
                                                </div>
                                            </Table.Summary.Cell>
                                            <Table.Summary.Cell index={1} colSpan={1} className="py-8">
                                                <div className={`text-2xl font-black tracking-tighter text-right ${status === "REJECTED" ? "line-through text-gray-400" : "text-indigo-600"}`}>
                                                    ₹{total.toLocaleString()}
                                                </div>
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
                        <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Return Bill Not Found</p>
                    </div>
                )}

                {/* Reject Reason Modal */}
                <Modal
                    title={<span className="font-black">Reject Return Bill</span>}
                    open={isRejectModalOpen}
                    onOk={handleReject}
                    onCancel={() => setIsRejectModalOpen(false)}
                    confirmLoading={actionLoading}
                    okText="Confirm Reject"
                    okButtonProps={{ danger: true, className: "font-black rounded-lg" }}
                    cancelButtonProps={{ className: "font-black rounded-lg" }}
                >
                    <p className="text-xs text-gray-500 mb-3">
                        Please enter an optional reason for rejecting this return request:
                    </p>
                    <Input.TextArea
                        rows={3}
                        placeholder="e.g. Products were not returned or wrong items selected"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="rounded-xl font-medium"
                    />
                </Modal>

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
                .rejected-return-row td {
                    text-decoration: line-through !important;
                    color: #9ca3af !important;
                }
                .rejected-return-row td span:not(.ant-tag) {
                    text-decoration: line-through !important;
                }
                .rejected-return-row td .ant-tag {
                    text-decoration: none !important;
                }
            `}</style>
        </main>
    );
};

export default SingleReturnBillPage;
