import { message } from "../utils/antdStatic";
import { useEffect, useMemo, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Table, Spin, Button, Tooltip, Modal, Input, Tag } from "antd";
import type { InputRef } from "antd";
import toast from "react-hot-toast";
import {
  PrinterOutlined,
  ArrowLeftOutlined,
  DollarOutlined,
  FileTextOutlined,
  ReloadOutlined,
  EditOutlined,
  CalendarOutlined,
  LockOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import BillPrint from "../billing/BillPrint";
import { useReactToPrint } from "react-to-print";
import apiCaller from "../utils/apiCaller";
import dayjs from "dayjs";
import ReturnProductModal from "../components/ReturnProductModal";
import AlterBillModal from "../components/AlterBillModal";
import useUserStore from "../store/user.store";
import { useSocket } from "../contexts/SocketContext";
import { SocketEvents } from "../types/socket";

const SingleBillPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;
  const [loading, setLoading] = useState(false);
  const [bill, setBill] = useState<any>(null);
  const [existingReturns, setExistingReturns] = useState<any[]>([]);
  const { socket, isConnected } = useSocket();
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isAlterModalOpen, setIsAlterModalOpen] = useState(false);
  const [alterEligibility, setAlterEligibility] = useState<{
    canAlter: boolean;
    reason?: string;
    basePreviousOutstanding?: number;
  } | null>(null);

  // Profit Lock & Verification State
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pin, setPin] = useState("");
  const pinInputRef = useRef<InputRef>(null);

  // Automatically focus on the PIN textbox when the dialog opens
  useEffect(() => {
    if (isPinModalOpen) {
      const timer = setTimeout(() => {
        pinInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isPinModalOpen]);

  const user = useUserStore((state) => state.user);
  const isAdmin = user?.roles?.some((role) =>
    ["ADMIN", "SUPER_ADMIN", "CREATOR"].includes(role),
  );

  const billProductTotal = useMemo(() => {
    return (
      bill?.productsTotal ??
      bill?.items?.reduce(
        (sum: number, item: any) => sum + (item.total || 0),
        0,
      ) ??
      0
    );
  }, [bill]);

  // Compute Bill Profit, Cost, and Margin
  const profitMetrics = useMemo(() => {
    if (!bill || !bill.items) {
      return { totalCost: 0, profit: 0, marginPercent: 0, netRevenue: 0 };
    }

    let totalCost = 0;
    for (const item of bill.items) {
      const qty = Number(item.quantity) || 0;
      const unitCost = Number(
        item.costPrice ??
          item.productSnapshot?.costPrice ??
          item.product?.costPrice ??
          0,
      );
      totalCost += qty * unitCost;
    }

    const productTotal =
      bill.productsTotal ??
      bill.items.reduce(
        (sum: number, item: any) => sum + (Number(item.total) || 0),
        0,
      );

    const billDiscount = Number(bill.discount) || 0;
    const netRevenue = productTotal - billDiscount;
    const profit = netRevenue - totalCost;
    const marginPercent = netRevenue > 0 ? (profit / netRevenue) * 100 : 0;

    return {
      totalCost,
      profit,
      marginPercent,
      netRevenue,
    };
  }, [bill]);

  const handlePinSubmit = () => {
    if (!isAdmin) {
      toast.error("Admin access only");
      return;
    }
    if (user?.pin && pin === user.pin) {
      setIsUnlocked(true);
      setIsPinModalOpen(false);
      setPin("");
      toast.success("Profit unlocked");
    } else if (!user?.pin) {
      toast.error("No PIN set for your account");
    } else {
      toast.error("Wrong PIN");
    }
  };

  const fetchBill = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await apiCaller.get(`/bills/${id}`);
      const fetchedBill = res.data?.data?.bill;
      setBill(fetchedBill);
      setExistingReturns(res.data?.data?.existingReturns || []);

      if (isAdmin && fetchedBill?._id) {
        try {
          const eligRes = await apiCaller.get(
            `/bills/${fetchedBill._id}/alter-eligibility`,
          );
          setAlterEligibility(eligRes.data?.data);
        } catch (e) {
          console.error("Failed to check alter eligibility:", e);
        }
      }
    } catch (error: any) {
      console.error("Fetch bill error:", error);
      message.error(
        error?.response?.data?.message ||
          error?.response?.data?.msg ||
          "Failed to fetch bill details",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchBill();
    }
  }, [id, isAdmin]);

  useEffect(() => {
    if (!socket || !isConnected) return;
    const handleReturnEvent = () => {
      fetchBill();
    };
    socket.on(SocketEvents.BILL.RETURN_CREATED, handleReturnEvent);
    socket.on(SocketEvents.BILL.RETURN_APPROVED, handleReturnEvent);
    socket.on(SocketEvents.BILL.RETURN_REJECTED, handleReturnEvent);

    return () => {
      socket.off(SocketEvents.BILL.RETURN_CREATED, handleReturnEvent);
      socket.off(SocketEvents.BILL.RETURN_APPROVED, handleReturnEvent);
      socket.off(SocketEvents.BILL.RETURN_REJECTED, handleReturnEvent);
    };
  }, [socket, isConnected, id]);

  const columns = [
    {
      title: (
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
          Item Details
        </span>
      ),
      dataIndex: ["product", "name"],
      key: "name",
      render: (_: any, record: any) => {
        const unitCost = Number(
          record.costPrice ??
            record.productSnapshot?.costPrice ??
            record.product?.costPrice ??
            0,
        );
        const itemProfit =
          (record.total || 0) - unitCost * (record.quantity || 0);

        return (
          <div className="flex flex-col">
            <span className="font-black text-gray-800 capitalize leading-tight">
              {record.product ? record.product.name : "Deleted Product"}
            </span>
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Unit Price: ₹
                {record.quantity
                  ? (record.total / record.quantity).toFixed(2)
                  : "-"}
              </span>
              {isUnlocked && (
                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                  Cost: ₹{unitCost.toFixed(2)} · Profit: ₹
                  {itemProfit.toFixed(2)}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: (
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center block">
          Quantity
        </span>
      ),
      dataIndex: "quantity",
      key: "quantity",
      align: "center" as const,
      render: (q: number) => (
        <span className="font-black text-gray-700">{q}</span>
      ),
    },
    {
      title: (
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center block">
          Sub-Total
        </span>
      ),
      dataIndex: "total",
      key: "total",
      align: "center" as const,
      render: (t: number, record: any) =>
        record.discount > 0 ? (
          <div className="flex flex-col items-center leading-tight">
            <span className="text-[10px] font-bold text-gray-400 line-through mb-0.5">
              ₹{(t + record.discount).toLocaleString()}
            </span>
            <span className="font-black text-indigo-600">
              ₹
              {t % 1 === 0 ? t.toLocaleString() : t.toFixed(2).toLocaleString()}
            </span>
          </div>
        ) : (
          <span className="font-black text-indigo-600">
            ₹{t % 1 === 0 ? t.toLocaleString() : t.toFixed(2).toLocaleString()}
          </span>
        ),
    },
    {
      title: (
        <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest text-center block">
          Discount
        </span>
      ),
      dataIndex: "discount",
      key: "discount",
      align: "center" as const,
      render: (d: number) => (
        <span className="font-black text-orange-600">
          ₹{d.toLocaleString()}
        </span>
      ),
    },
  ];

  // Prepare BillPrint data
  const printContentRef = useRef<HTMLDivElement | null>(null);
  const printType =
    useUserStore((state) => state.user?.shopSettings?.printType) || "THERMAL";
  const pageStyle =
    printType === "A4"
      ? "@page { size: A4 portrait; margin: 10mm; } @media print { body { -webkit-print-color-adjust: exact; } }"
      : "@page { size: 80mm auto; margin: 0; } @media print { body { -webkit-print-color-adjust: exact; } thead { display: table-row-group !important; } tfoot { display: table-row-group !important; } }";

  const handlePrint = useReactToPrint({
    contentRef: printContentRef as React.RefObject<HTMLDivElement>,
    pageStyle,
  });

  // Map API bill data to BillPrint expected structure.
  // BillPrint expects each item: name, mrp, measuring, price, piece, packet,
  // box, boxQuantity, packetQuantity, discount, total.
  //
  // New bills: item.productSnapshot has all of the above (captured at billing time).
  // Old bills: productSnapshot is absent — fall back to the populated product doc
  //   for name/mrp/measuring, and derive price from item.total / item.quantity.
  const printBillData = bill
    ? {
        bill: {
          ...bill,
          purchased: bill.items
            ? bill.items.map((item: any) => {
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
                  // Spread snapshot first (new bills) then item-level overrides
                  ...snap,
                  ...item,
                  // Ensure every field BillPrint reads always has a safe value
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
              })
            : [],
        },
        updatedCustomer: bill.customer,
      }
    : undefined;

  return (
    <main className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-50/50 flex flex-col items-center">
      <div className="w-full max-w-5xl">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-gray-100 text-gray-600 hover:text-indigo-600 font-bold text-xs uppercase tracking-wider transition-all shadow-sm border border-gray-200/70 cursor-pointer"
          >
            <ArrowLeftOutlined className="text-xs" />
            <span>Back to Bills</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest hidden sm:inline">
              Bill No
            </span>
            <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 font-black text-xs rounded-xl tracking-wide">
              {bill?.id ? `B-${bill.id}` : bill?._id?.slice(-8).toUpperCase()}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="py-40 text-center">
            <Spin size="large" />
          </div>
        ) : bill ? (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
            {/* Header Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Gradient Hero Banner */}
              <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 p-6 sm:p-8 lg:p-10 text-white relative overflow-hidden">
                {/* Decorative background watermark */}
                <div className="absolute -top-12 -right-12 pointer-events-none select-none opacity-5 text-white">
                  <PrinterOutlined style={{ fontSize: 260 }} />
                </div>

                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                  {/* Left Side: Title & Status Badges */}
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/15">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-indigo-100">
                        Bill Details
                      </span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white m-0">
                      Bill Details
                    </h1>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-xs font-semibold text-indigo-100/90 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/15 inline-flex items-center gap-1.5">
                        <CalendarOutlined className="text-[11px]" />
                        {dayjs(bill.createdAt).format("DD MMM YYYY · hh:mm A")}
                      </span>

                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl border inline-flex items-center gap-1.5 ${
                          billProductTotal > bill?.payment
                            ? "bg-amber-500/20 border-amber-400/30 text-amber-200"
                            : billProductTotal === bill?.payment
                              ? "bg-emerald-500/20 border-emerald-400/30 text-emerald-200"
                              : "bg-blue-500/20 border-blue-400/30 text-blue-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            billProductTotal > bill?.payment
                              ? "bg-amber-400"
                              : billProductTotal === bill?.payment
                                ? "bg-emerald-400"
                                : "bg-blue-400"
                          }`}
                        />
                        {billProductTotal > bill?.payment
                          ? "Less Paid"
                          : billProductTotal === bill?.payment
                            ? "Exact Paid"
                            : "More Paid"}
                      </span>

                      {bill.alteredAt && (
                        <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl border bg-amber-400/25 border-amber-300/40 text-amber-100 inline-flex items-center gap-1.5 shadow-sm">
                          <EditOutlined className="text-[11px]" />
                          Altered (
                          {dayjs(bill.alteredAt).format("DD MMM · hh:mm A")})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Side: Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full lg:w-auto mt-2 lg:mt-0">
                    {isAdmin &&
                      (alterEligibility?.canAlter ? (
                        <button
                          type="button"
                          onClick={() => setIsAlterModalOpen(true)}
                          className="h-11 px-5 sm:px-6 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/25 transition-all inline-flex items-center gap-2 border-none cursor-pointer"
                        >
                          <EditOutlined className="text-sm" />
                          <span>ALTER BILL</span>
                        </button>
                      ) : (
                        <Tooltip
                          title={
                            alterEligibility?.reason ||
                            "Checking alter eligibility..."
                          }
                        >
                          <button
                            type="button"
                            disabled
                            className="h-11 px-5 sm:px-6 bg-white/10 border border-white/10 text-white/40 font-black text-xs uppercase tracking-wider rounded-xl inline-flex items-center gap-2 cursor-not-allowed opacity-75"
                          >
                            <EditOutlined className="text-sm" />
                            <span>ALTER BILL</span>
                          </button>
                        </Tooltip>
                      ))}

                    <button
                      type="button"
                      onClick={() => setIsReturnModalOpen(true)}
                      className="h-11 px-5 sm:px-6 bg-white/15 hover:bg-white/25 active:bg-white/20 border border-white/20 text-white font-black text-xs uppercase tracking-wider rounded-xl backdrop-blur-md transition-all inline-flex items-center gap-2 cursor-pointer shadow-sm"
                    >
                      <ReloadOutlined className="text-sm" />
                      <span>RETURN ITEMS</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePrint()}
                      className="h-11 px-5 sm:px-6 bg-white hover:bg-gray-50 active:bg-gray-100 text-indigo-700 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-black/10 transition-all inline-flex items-center gap-2 border-none cursor-pointer"
                    >
                      <PrinterOutlined className="text-sm" />
                      <span>PRINT BILL</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Client Information Grid */}
              <div className="p-6 sm:p-8 bg-white grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 flex flex-col justify-between">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                    Customer Name
                  </span>
                  <p className="text-base font-black text-gray-800 tracking-tight capitalize truncate m-0">
                    {bill?.customer?.name || "Cash Customer"}
                  </p>
                </div>

                <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 flex flex-col justify-between">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                    Phone Number
                  </span>
                  <p className="text-base font-bold text-gray-700 m-0">
                    {bill?.customer?.phone || "No Phone Number"}
                  </p>
                </div>

                <div className="bg-rose-50/60 p-4 rounded-2xl border border-rose-100/70 flex flex-col justify-between">
                  <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest block mb-1">
                    Customer Balance
                  </span>
                  <p className="text-base font-black text-rose-600 tracking-tight m-0">
                    ₹{Number(bill?.customer?.outstanding || 0).toLocaleString()}
                  </p>
                </div>

                <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100/70 flex flex-col justify-between">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-1">
                    Billed By
                  </span>
                  <p className="text-base font-black text-indigo-700 tracking-tight truncate m-0">
                    {bill?.createdBy?.name ?? "Admin"}
                  </p>
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm text-center group hover:border-gray-200 transition-all flex flex-col justify-center">
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest block mb-1">
                  Items Total
                </span>
                <div className="flex items-baseline justify-center gap-1.5">
                  <span className="text-2xl font-black text-gray-800 tracking-tighter">
                    ₹{Math.ceil(billProductTotal).toLocaleString()}
                  </span>
                  <span
                    className="text-sm font-black text-orange-400"
                    title="Previous Outstanding / Adjustments"
                  >
                    {Math.ceil(bill?.total - billProductTotal) >= 0 ? "+" : ""}
                    {Math.floor(
                      bill?.total - billProductTotal,
                    ).toLocaleString()}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-center gap-1.5 border-t border-gray-50 pt-1">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                    Bill Total:
                  </span>
                  <span className="text-xs font-black text-indigo-600">
                    ₹{Number(bill?.total).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm text-center group hover:border-orange-100 transition-all">
                <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest block mb-1">
                  Discount
                </span>
                <span className="text-2xl font-black text-orange-600 tracking-tighter">
                  ₹{Number(bill?.discount).toLocaleString()}
                </span>
              </div>
              <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm text-center group hover:border-green-100 transition-all">
                <span className="text-[10px] font-black text-green-400 uppercase tracking-widest block mb-1">
                  Paid Amount
                </span>
                <span className="text-2xl font-black text-green-600 tracking-tighter">
                  ₹{Number(bill?.payment).toLocaleString()}
                </span>
              </div>

              {/* Profit Metric (Locked / Unlocked) */}
              {!isUnlocked ? (
                <div
                  onClick={() => {
                    if (!isAdmin) {
                      toast.error("Admin access only");
                      return;
                    }
                    setIsPinModalOpen(true);
                  }}
                  className="bg-white rounded-[32px] p-6 border border-emerald-100/80 shadow-sm text-center group hover:border-emerald-300 transition-all flex flex-col justify-center items-center col-span-2 sm:col-span-1 cursor-pointer relative overflow-hidden"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block">
                      Profit
                    </span>
                    <LockOutlined className="text-emerald-500 text-[10px]" />
                  </div>
                  <div className="flex flex-col items-center justify-center my-0.5">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm mb-1 group-hover:scale-110 transition-transform">
                      <LockOutlined className="text-base" />
                    </div>
                    <span className="text-sm font-black text-gray-300 tracking-[0.25em]">
                      ••••••
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-center border-t border-gray-50 pt-1 w-full">
                    <span className="text-[9px] font-black text-emerald-600 group-hover:text-emerald-700 uppercase tracking-widest">
                      Click to unlock
                    </span>
                  </div>
                </div>
              ) : (
                <div
                  className={`rounded-[32px] p-6 shadow-sm text-center relative overflow-hidden group transition-all flex flex-col justify-between col-span-2 sm:col-span-1 border ${
                    profitMetrics.profit >= 0
                      ? "bg-emerald-50/60 border-emerald-200/70 hover:border-emerald-300"
                      : "bg-rose-50/60 border-rose-200/70 hover:border-rose-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest block ${
                        profitMetrics.profit >= 0
                          ? "text-emerald-700"
                          : "text-rose-700"
                      }`}
                    >
                      Profit
                    </span>
                    <Tooltip title="Lock">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsUnlocked(false);
                          toast.success("Profit locked");
                        }}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors border-none cursor-pointer ${
                          profitMetrics.profit >= 0
                            ? "bg-emerald-100/80 hover:bg-emerald-200 text-emerald-700"
                            : "bg-rose-100/80 hover:bg-rose-200 text-rose-700"
                        }`}
                      >
                        <LockOutlined className="text-xs" />
                      </button>
                    </Tooltip>
                  </div>
                  <div className="my-1">
                    <div
                      className={`text-2xl font-black tracking-tighter ${
                        profitMetrics.profit >= 0
                          ? "text-emerald-600"
                          : "text-rose-600"
                      }`}
                    >
                      ₹{Math.round(profitMetrics.profit).toLocaleString()}
                    </div>
                    <div
                      className={`text-[10px] font-black tracking-tight ${
                        profitMetrics.profit >= 0
                          ? "text-emerald-600"
                          : "text-rose-600"
                      }`}
                    >
                      {profitMetrics.profit >= 0 ? "+" : ""}
                      {profitMetrics.marginPercent.toFixed(1)}% margin
                    </div>
                  </div>
                  <div
                    className={`mt-1 flex items-center justify-center gap-1.5 border-t pt-1 ${
                      profitMetrics.profit >= 0
                        ? "border-emerald-100/80 text-emerald-600"
                        : "border-rose-100/80 text-rose-600"
                    }`}
                  >
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-80">
                      Cost:
                    </span>
                    <span className="text-xs font-black">
                      ₹{Math.round(profitMetrics.totalCost).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Line Items Table */}
            <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                  Items in Bill
                </h3>
                <span className="px-4 py-1.5 bg-gray-50 rounded-xl text-[10px] font-black text-gray-400 border border-gray-100 uppercase tracking-widest">
                  {bill?.items?.length} Items
                </span>
              </div>
              <Table
                dataSource={bill?.items || []}
                columns={columns}
                rowKey="_id"
                pagination={false}
                scroll={{ x: 800 }}
                className="modern-table no-border-table"
                summary={(pageData: readonly any[]) => {
                  const total = pageData.reduce(
                    (sum: number, item: any) => sum + (item.total || 0),
                    0,
                  );
                  return (
                    <Table.Summary.Row className="bg-gray-50/50">
                      <Table.Summary.Cell
                        index={0}
                        colSpan={2}
                        className="py-8"
                      >
                        <div className="text-right pr-6 text-[10px] font-black text-gray-300 uppercase tracking-widest">
                          Items Total
                        </div>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell
                        index={1}
                        colSpan={2}
                        className="py-8"
                      >
                        <div className="flex flex-wrap items-baseline gap-4">
                          <div className="text-3xl font-black text-indigo-600 tracking-tighter">
                            ₹{Math.ceil(total).toLocaleString()}
                          </div>
                          {isUnlocked && (
                            <span
                              className={`text-xs font-black px-3 py-1 rounded-xl border ${
                                profitMetrics.profit >= 0
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-rose-50 text-rose-700 border-rose-200"
                              }`}
                            >
                              Profit: ₹
                              {Math.round(
                                profitMetrics.profit,
                              ).toLocaleString()}{" "}
                              ({profitMetrics.profit >= 0 ? "+" : ""}
                              {profitMetrics.marginPercent.toFixed(1)}%)
                            </span>
                          )}
                        </div>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  );
                }}
              />
            </div>

            {/* Associated Return Bills Section */}
            {existingReturns && existingReturns.length > 0 && (
              <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                  <div>
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] m-0">
                      Associated Return Bills / Credit Notes
                    </h3>
                    <p className="text-[10px] font-bold text-gray-400 m-0 mt-0.5">
                      Returns created against this invoice
                    </p>
                  </div>
                  <span className="px-4 py-1.5 bg-gray-50 rounded-xl text-[10px] font-black text-gray-400 border border-gray-100 uppercase tracking-widest">
                    {existingReturns.length} Return
                    {existingReturns.length > 1 ? "s" : ""}
                  </span>
                </div>
                <Table
                  dataSource={existingReturns}
                  rowKey="_id"
                  pagination={false}
                  scroll={{ x: 800 }}
                  className="modern-table no-border-table"
                  rowClassName={(record: any) => {
                    const isRejected = record.status === "REJECTED" || record.rawData?.status === "REJECTED";
                    return `group cursor-pointer hover:bg-indigo-50/30 transition-all duration-300 ${
                      isRejected
                        ? "rejected-return-row line-through text-gray-400 bg-red-50/20 hover:bg-red-50/40 opacity-60"
                        : ""
                    }`;
                  }}
                  columns={[
                    {
                      title: (
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                          Date
                        </span>
                      ),
                      dataIndex: "createdAt",
                      key: "date",
                      render: (d: string, record: any) => {
                        const isRejected = record.status === "REJECTED" || record.rawData?.status === "REJECTED";
                        return (
                          <div className="flex flex-col">
                            <span
                              className={`font-bold ${isRejected ? "text-gray-400 line-through" : "text-gray-800"}`}
                            >
                              {dayjs(d).format("DD/MM/YYYY")}
                            </span>
                            <span
                              className={`text-[10px] font-bold ${isRejected ? "text-gray-300 line-through" : "text-gray-400"}`}
                            >
                              {dayjs(d).format("hh:mm A")}
                            </span>
                          </div>
                        );
                      },
                    },
                    {
                      title: (
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          Return ID
                        </span>
                      ),
                      dataIndex: "id",
                      key: "id",
                      render: (retId: number, record: any) => {
                        const isRejected = record.status === "REJECTED" || record.rawData?.status === "REJECTED";
                        const isPending = !isRejected && (record.status === "PENDING" || record.rawData?.status === "PENDING");
                        return (
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`font-mono font-black text-xs ${isRejected ? "text-gray-400 line-through" : "text-indigo-500"}`}
                            >
                              #R-{retId || record._id?.slice(-6).toUpperCase()}
                            </span>
                            {isPending && (
                              <Tag
                                color="orange"
                                className="text-[8px] font-black uppercase tracking-widest rounded-full border-0 m-0 px-1.5 py-0"
                              >
                                Pending
                              </Tag>
                            )}
                            {isRejected && (
                              <Tooltip
                                title={
                                  record.rejectionReason || record.rawData?.rejectionReason
                                    ? `Reason: ${record.rejectionReason || record.rawData?.rejectionReason}`
                                    : "Rejected by admin"
                                }
                              >
                                <Tag
                                  color="red"
                                  className="text-[8px] font-black uppercase tracking-widest rounded-full border-0 m-0 px-1.5 py-0 cursor-help"
                                >
                                  Rejected
                                </Tag>
                              </Tooltip>
                            )}
                            {record.status === "APPROVED" && (
                              <Tag
                                color="green"
                                className="text-[8px] font-black uppercase tracking-widest rounded-full border-0 m-0 px-1.5 py-0"
                              >
                                Approved
                              </Tag>
                            )}
                          </div>
                        );
                      },
                    },
                    {
                      title: (
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center block">
                          Items Returned
                        </span>
                      ),
                      dataIndex: "items",
                      key: "itemsCount",
                      align: "center" as const,
                      render: (items: any[], record: any) => {
                        const isRejected = record.status === "REJECTED" || record.rawData?.status === "REJECTED";
                        const totalQty = (items || []).reduce(
                          (acc: number, it: any) =>
                            acc + (it.quantityReturned || 0),
                          0,
                        );
                        return (
                          <span
                            className={`font-black ${isRejected ? "text-gray-400 line-through" : "text-gray-700"}`}
                          >
                            {totalQty} Units ({items?.length || 0} items)
                          </span>
                        );
                      },
                    },
                    {
                      title: (
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">
                          Refund Amount
                        </span>
                      ),
                      dataIndex: "totalAmount",
                      key: "totalAmount",
                      align: "right" as const,
                      render: (amt: number, record: any) => {
                        const isRejected = record.status === "REJECTED" || record.rawData?.status === "REJECTED";
                        return (
                          <span
                            className={`font-black ${isRejected ? "text-gray-400 line-through" : "text-red-500"}`}
                          >
                            -₹{Number(amt || 0).toLocaleString()}
                          </span>
                        );
                      },
                    },
                    {
                      title: (
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center block">
                          Mode
                        </span>
                      ),
                      dataIndex: "paymentMode",
                      key: "paymentMode",
                      align: "center" as const,
                      render: (mode: string, record: any) => {
                        const isRejected = record.status === "REJECTED" || record.rawData?.status === "REJECTED";
                        return (
                          <span
                            className={`text-[10px] font-black uppercase tracking-wider ${isRejected ? "text-gray-400 line-through" : "text-gray-600"}`}
                          >
                            {mode}
                          </span>
                        );
                      },
                    },
                    {
                      title: (
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center block">
                          Action
                        </span>
                      ),
                      key: "action",
                      align: "center" as const,
                      render: (_: any, record: any) => (
                        <Button
                          type="text"
                          icon={<EyeOutlined />}
                          onClick={() =>
                            navigate(`/return-bills/${record._id}`, {
                              state: { from: "bill" },
                            })
                          }
                          className="text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                        />
                      ),
                    },
                  ]}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="py-40 text-center flex flex-col items-center">
            <div className="w-20 h-20 rounded-[32px] bg-red-50 text-red-500 flex items-center justify-center mb-6">
              <FileTextOutlined style={{ fontSize: 32 }} />
            </div>
            <p className="text-sm font-black text-gray-400 uppercase tracking-widest">
              Bill Not Found
            </p>
          </div>
        )}

        {/* Hidden BillPrint for printing only */}
        {bill && (
          <div style={{ display: "none" }}>
            <BillPrint
              onClose={() => {}}
              contentRef={printContentRef}
              handlePrint={() => {}}
              printBillData={printBillData}
            />
          </div>
        )}

        <ReturnProductModal
          isOpen={isReturnModalOpen}
          onClose={() => setIsReturnModalOpen(false)}
          bill={bill}
          onSuccess={() => {
            navigate("/daily-report");
          }}
        />

        <AlterBillModal
          isOpen={isAlterModalOpen}
          onClose={() => setIsAlterModalOpen(false)}
          bill={bill}
          basePreviousOutstanding={alterEligibility?.basePreviousOutstanding}
          onSuccess={() => {
            fetchBill();
          }}
        />

        {/* Admin Profit PIN Verification Modal */}
        <Modal
          open={isPinModalOpen}
          afterOpenChange={(open) => {
            if (open) {
              setTimeout(() => {
                pinInputRef.current?.focus();
              }, 50);
            }
          }}
          onCancel={() => {
            setIsPinModalOpen(false);
            setPin("");
          }}
          footer={null}
          centered
          width={380}
          destroyOnClose
        >
          <div className="p-4 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 shadow-sm border border-emerald-100">
              <LockOutlined style={{ fontSize: 24 }} />
            </div>

            <h3 className="text-lg font-black text-gray-800 m-0 tracking-tight">
              Enter Admin PIN
            </h3>
            <p className="text-xs font-bold text-gray-400 mt-1 mb-6">
              Enter your PIN to see the profit for this bill.
            </p>

            {!user?.pin ? (
              <div className="w-full bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
                <p className="text-xs font-black text-red-600 uppercase tracking-widest m-0">
                  No PIN Set
                </p>
                <p className="text-[11px] font-bold text-red-400 m-0 mt-1">
                  Please set a PIN on your account first.
                </p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handlePinSubmit();
                }}
                className="w-full space-y-4"
              >
                <Input.Password
                  ref={pinInputRef}
                  autoFocus
                  prefix={<LockOutlined className="text-gray-300 mr-2" />}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  onPressEnter={handlePinSubmit}
                  placeholder="Enter PIN"
                  className="h-12 rounded-2xl border-gray-200 bg-gray-50/50 font-black tracking-widest text-sm text-center"
                  maxLength={10}
                />
                <div className="flex gap-2 w-full pt-2">
                  <Button
                    type="default"
                    onClick={() => {
                      setIsPinModalOpen(false);
                      setPin("");
                    }}
                    className="flex-1 h-11 rounded-xl text-xs font-black uppercase tracking-wider"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    onClick={handlePinSubmit}
                    className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 border-none rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-emerald-100 text-white"
                  >
                    Unlock
                  </Button>
                </div>
              </form>
            )}
          </div>
        </Modal>
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
        .no-border-table .ant-table-row:hover > td { background: #fdfdfd !important; }
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
        .rejected-return-row td button {
          text-decoration: none !important;
        }
      `}</style>
    </main>
  );
};

export default SingleBillPage;
