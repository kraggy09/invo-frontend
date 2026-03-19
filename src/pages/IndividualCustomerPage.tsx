import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSocket } from "../contexts/SocketContext";
import { SocketEvents } from "../types/socket";
import {
  Card,
  Tabs,
  Table,
  Statistic,
  Input,
  Button,
  Spin,
  Tooltip,
  Select,
  Tag,
  Modal,
  DatePicker,
  Empty,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { message } from "../utils/antdStatic";
import {
  ArrowLeftOutlined,
  EyeOutlined,
  LockOutlined,
  BarChartOutlined,
  LineChartOutlined,
  HistoryOutlined,
  CloudDownloadOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import apiCaller from "../utils/apiCaller";
import { formatIndianNumber } from "../utils";
import dayjs from "dayjs";
import { BillCreatedBy, BillCustomer } from "../store/bill.store";
import useUserStore from "../store/user.store";

interface BillLike {
  _id: string;
  id?: string | number;
  key: string | number;
  date: string;
  time: string;
  billId: string | number;
  billTotal: number;
  outstanding: number;
  total: number;
  payment: number;
  productsTotal?: number;
  discount?: number;
  isReturn: boolean;
  paymentMode?: string;
  items?: any[];
  customer?: BillCustomer;
  createdAt: string;
  createdBy?: BillCreatedBy;
  rawData: any;
}

interface TransactionLike {
  _id: string;
  id: string | number;
  createdAt: string;
  purpose: string;
  amount: number;
  newOutstanding: number;
  paymentIn: boolean;
  approved?: boolean;
  approvedAt?: string;
  rejectedAt?: string;
}

interface JourneyLike {
  _id: string;
  createdAt: string;
  action: string;
  description: string;
  amount: number;
  previousOutstanding: number;
  newOutstanding: number;
  user?: { name: string };
  entityId?: string;
}


const ACCENT = "#2563eb";

const IndividualCustomerPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(true);
  const [pin, setPin] = useState("");
  const [tab, setTab] = useState("bills");
  const [analyticsDays, setAnalyticsDays] = useState(7);
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [analyticsSummary, setAnalyticsSummary] = useState({ totalSales: 0, totalProfit: 0, totalPayments: 0 });
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination states
  const [pagination, setPagination] = useState({
    bills: { current: 1, total: 0, pageSize: 15 },
    transactions: { current: 1, total: 0, pageSize: 15 },
    returns: { current: 1, total: 0, pageSize: 15 },
    journeys: { current: 1, total: 0, pageSize: 15 },
  });

  const [paginatedData, setPaginatedData] = useState<{
    bills: any[];
    transactions: any[];
    returns: any[];
    journeys: any[];
  }>({
    bills: [],
    transactions: [],
    returns: [],
    journeys: [],
  });

  const [tabLoading, setTabLoading] = useState(false);

  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [historyRange, setHistoryRange] = useState<any>([dayjs().subtract(1, 'month'), dayjs()]);
  const [historyData, setHistoryData] = useState<any>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const user = useUserStore((state) => state.user)

  const hasAdminAccess = user?.roles?.some((role) =>
    ["ADMIN", "SUPER_ADMIN", "CREATOR"].includes(role)
  );

  const fetchHistory = useCallback(async () => {
    if (!hasAdminAccess) {
      message.info("You are not authorised to see the history");
      return;
    }
    if (!id || !historyRange) return;
    setHistoryLoading(true);
    try {
      const res = await apiCaller.get(`/customers/${id}/history`, {
        params: {
          startDate: historyRange[0].toISOString(),
          endDate: historyRange[1].toISOString()
        }
      });
      if (res.data.success) {
        setHistoryData(res.data.data);
      }
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Failed to fetch history");
    } finally {
      setHistoryLoading(false);
    }
  }, [id, historyRange, hasAdminAccess]);

  const fetchPaginatedBills = useCallback(async (page: number) => {
    if (!id) return;
    if (page === 1) {
      setPagination(prev => ({ ...prev, bills: { ...prev.bills, current: 1 } }));
      return;
    }
    setTabLoading(true);
    try {
      const res = await apiCaller.get(`/customers/${id}/bills`, { params: { page, limit: 15 } });
      if (res.data.success) {
        setPaginatedData(prev => ({ ...prev, bills: res.data.data.bills }));
        setPagination(prev => ({ ...prev, bills: { ...prev.bills, current: page, total: res.data.data.pagination.total } }));
      }
    } catch (err) {
      message.error("Failed to fetch more bills");
    } finally {
      setTabLoading(false);
    }
  }, [id]);

  const fetchPaginatedTransactions = useCallback(async (page: number) => {
    if (!id) return;
    if (page === 1) {
      setPagination(prev => ({ ...prev, transactions: { ...prev.transactions, current: 1 } }));
      return;
    }
    setTabLoading(true);
    try {
      const res = await apiCaller.get(`/customers/${id}/transactions`, { params: { page, limit: 15 } });
      if (res.data.success) {
        setPaginatedData(prev => ({ ...prev, transactions: res.data.data.transactions }));
        setPagination(prev => ({ ...prev, transactions: { ...prev.transactions, current: page, total: res.data.data.pagination.total } }));
      }
    } catch (err) {
      message.error("Failed to fetch more transactions");
    } finally {
      setTabLoading(false);
    }
  }, [id]);

  const fetchPaginatedReturns = useCallback(async (page: number) => {
    if (!id) return;
    if (page === 1) {
      setPagination(prev => ({ ...prev, returns: { ...prev.returns, current: 1 } }));
      return;
    }
    setTabLoading(true);
    try {
      const res = await apiCaller.get(`/customers/${id}/returns`, { params: { page, limit: 15 } });
      if (res.data.success) {
        setPaginatedData(prev => ({ ...prev, returns: res.data.data.returnBills }));
        setPagination(prev => ({ ...prev, returns: { ...prev.returns, current: page, total: res.data.data.pagination.total } }));
      }
    } catch (err) {
      message.error("Failed to fetch more returns");
    } finally {
      setTabLoading(false);
    }
  }, [id]);

  const fetchPaginatedJourneys = useCallback(async (page: number) => {
    if (!id) return;
    if (page === 1) {
      setPagination(prev => ({ ...prev, journeys: { ...prev.journeys, current: 1 } }));
      return;
    }
    setTabLoading(true);
    try {
      const res = await apiCaller.get(`/customers/${id}/journeys`, { params: { page, limit: 15 } });
      if (res.data.success) {
        setPaginatedData(prev => ({ ...prev, journeys: res.data.data.journeys }));
        setPagination(prev => ({ ...prev, journeys: { ...prev.journeys, current: page, total: res.data.data.pagination.total } }));
      }
    } catch (err) {
      message.error("Failed to fetch more journey logs");
    } finally {
      setTabLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (customer) {
      setPagination(prev => ({
        ...prev,
        bills: { ...prev.bills, total: customer.totalBills || 0 },
        transactions: { ...prev.transactions, total: customer.totalTransactions || 0 },
        returns: { ...prev.returns, total: customer.totalReturnBills || 0 },
        journeys: { ...prev.journeys, total: customer.totalJourneys || 0 }
      }));
    }
  }, [customer]);

  useEffect(() => {
    if (historyModalVisible) {
      fetchHistory();
    }
  }, [historyModalVisible, fetchHistory]);

  const billHistoryData = useMemo(() => {
    if (!customer) return [];
    const isPage1 = pagination.bills.current === 1;
    const sourceBills = isPage1 ? (customer.bills || []) : paginatedData.bills;
    return sourceBills.map((bill: any) => {
      const dateVal = bill.createdAt || bill.date;
      return {
        ...bill,
        key: bill._id || bill.id,
        date: dateVal ? dayjs(dateVal).format("DD/MM/YYYY") : "",
        time: dateVal ? dayjs(dateVal).format("hh:mm A") : "",
        billId: bill.id || bill._id,
        billTotal: bill.productsTotal ?? bill.items?.reduce((sum: number, item: any) => sum + (item.total || 0), 0) ?? 0,
        outstanding: (bill.total || 0) - (bill.payment || 0),
        payment: bill.payment || 0,
        total: bill.total,
        isReturn: false,
        rawData: bill,
      };
    });
  }, [customer, pagination.bills.current, paginatedData.bills]);

  const returnHistoryData = useMemo(() => {
    if (!customer) return [];
    const isPage1 = pagination.returns.current === 1;
    const sourceReturns = isPage1 ? (customer.returnBills || []) : paginatedData.returns;

    return sourceReturns.map((rb: any) => {
      const dateVal = rb.createdAt || rb.date;
      return {
        ...rb,
        key: rb._id || rb.id,
        date: dateVal ? dayjs(dateVal).format("DD/MM/YYYY") : "",
        time: dateVal ? dayjs(dateVal).format("hh:mm A") : "",
        billId: `R-${rb.id || rb._id?.slice(-6).toUpperCase()}`,
        billTotal: -(rb.productsTotal || rb.totalAmount || 0),
        outstanding: (rb.previousOutstanding || 0) - (rb.productsTotal || rb.totalAmount || 0),
        payment: rb.paymentMode === "CASH" ? -(rb.totalAmount || 0) : 0,
        total: (rb.previousOutstanding || 0) - (rb.productsTotal || rb.totalAmount || 0),
        isReturn: true,
        rawData: rb,
      };
    });
  }, [customer, pagination.returns.current, paginatedData.returns]);

  const transactionsData = useMemo(() => {
    if (!customer) return [];
    const isPage1 = pagination.transactions.current === 1;
    return isPage1 ? (customer.transactions || []) : paginatedData.transactions;
  }, [customer, pagination.transactions.current, paginatedData.transactions]);

  const journeysData = useMemo(() => {
    if (!customer) return [];
    const isPage1 = pagination.journeys.current === 1;
    return isPage1 ? (customer.journeys || []) : paginatedData.journeys;
  }, [customer, pagination.journeys.current, paginatedData.journeys]);

  const shareStatement = () => {
    if (!historyData || !historyRange) return;
    const start = historyRange[0].format("DD/MM/YY");
    const end = historyRange[1].format("DD/MM/YY");

    let text = `*Account Statement*\n`;
    text += `*Customer:* ${customer?.name}\n`;
    text += `*Period:* ${start} - ${end}\n\n`;
    text += `*Opening Bal:* ₹${formatIndianNumber(historyData.openingBalance)}\n`;
    text += `*Closing Bal:* ₹${formatIndianNumber(historyData.closingBalance)}\n`;
    text += `*Net Change:* ₹${formatIndianNumber(Math.abs(historyData.closingBalance - historyData.openingBalance))} (${(historyData.closingBalance - historyData.openingBalance) >= 0 ? "Debit" : "Credit"})\n\n`;

    text += `--- *Recent Ledger* ---\n`;
    historyData.history.slice(-10).forEach((h: any) => {
      const date = dayjs(h.date).format("DD/MM");
      const dr = h.type === 'BILL' ? h.total : (h.type === 'TRANSACTION' && !h.paymentIn ? h.amount : 0);
      const cr = h.type === 'BILL' ? h.payment : (h.paymentIn ? h.amount : (h.type === 'RETURN' && h.paymentMode === 'ADJUSTMENT' ? h.totalAmount : 0));

      text += `${date} | ${h.description}\n`;
      if (dr > 0) text += `DR: +₹${formatIndianNumber(dr)}\n`;
      if (cr > 0) text += `CR: -₹${formatIndianNumber(cr)}\n`;
      text += `Bal: ₹${formatIndianNumber(h.newBalance)}\n\n`;
    });

    text += `Generated via InvoSync`;

    const whatsappUrl = `https://wa.me/${customer?.phone}?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  const fetchCustomer = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const res = await apiCaller.get(`/customers/${id}`);
      setCustomer(res.data.data.customer);
      console.log(res.data.data.customer, "This is the customer data");
    } catch (err: any) {
      if (showLoading) setError(err?.response?.data?.message || err?.response?.data?.msg || "Failed to fetch customer details");
      else console.error("Failed to refetch customer details socket:", err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchCustomer();
  }, [id, fetchCustomer]);

  useEffect(() => {
    if (!socket || !isConnected || !id) return;

    const handleCustomerUpdateEvent = (data: any) => {
      let eventCustomerId = null;

      // Determine the customer ID from different socket event payloads
      if (data?.updatedCustomer?._id) {
        eventCustomerId = data.updatedCustomer._id;
      } else if (data?.customer?._id) {
        eventCustomerId = data.customer._id;
      } else if (data?.bill?.customer) {
        eventCustomerId = typeof data.bill.customer === "string" ? data.bill.customer : data.bill.customer._id;
      } else if (data?.returnBill?.customer) {
        eventCustomerId = typeof data.returnBill.customer === "string" ? data.returnBill.customer : data.returnBill.customer._id;
      } else if (data?.transaction?.customer) {
        eventCustomerId = typeof data.transaction.customer === "string" ? data.transaction.customer : data.transaction.customer._id;
      }

      if (eventCustomerId === id) {
        console.log("Refetching customer data due to socket event...");
        fetchCustomer(false); // Refetch without loading spinner
      }
    };

    socket.on(SocketEvents.BILL.CREATED, handleCustomerUpdateEvent);
    socket.on(SocketEvents.BILL.UPDATED, handleCustomerUpdateEvent);
    socket.on(SocketEvents.BILL.RETURN_CREATED, handleCustomerUpdateEvent);
    socket.on(SocketEvents.TRANSACTION.CREATED, handleCustomerUpdateEvent);
    socket.on(SocketEvents.TRANSACTION.UPDATED, handleCustomerUpdateEvent);
    socket.on(SocketEvents.CUSTOMER.UPDATED, handleCustomerUpdateEvent);

    return () => {
      socket.off(SocketEvents.BILL.CREATED, handleCustomerUpdateEvent);
      socket.off(SocketEvents.BILL.UPDATED, handleCustomerUpdateEvent);
      socket.off(SocketEvents.BILL.RETURN_CREATED, handleCustomerUpdateEvent);
      socket.off(SocketEvents.TRANSACTION.CREATED, handleCustomerUpdateEvent);
      socket.off(SocketEvents.TRANSACTION.UPDATED, handleCustomerUpdateEvent);
      socket.off(SocketEvents.CUSTOMER.UPDATED, handleCustomerUpdateEvent);
    };
  }, [socket, isConnected, id, fetchCustomer]);

  useEffect(() => {
    async function fetchAnalytics() {
      if (!id || locked || tab !== "analytics") return;
      setAnalyticsLoading(true);
      try {
        const res = await apiCaller.get(`/customers/${id}/analytics?days=${analyticsDays}`);
        if (res.data.success) {
          setAnalyticsData(res.data.data.chartData);
          setAnalyticsSummary(res.data.data.summary);
        }
      } catch (err: any) {
        message.error(err?.response?.data?.message || err?.response?.data?.msg || "Failed to fetch customer analytics");
      } finally {
        setAnalyticsLoading(false);
      }
    }
    fetchAnalytics();
  }, [id, locked, tab, analyticsDays]);


  const billColumns: ColumnsType<BillLike> = [
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Date</span>,
      dataIndex: "date",
      key: "date",
      render: (text: string, record: BillLike) => (
        <div className="flex flex-col">
          <span className="font-bold text-gray-800">{text}</span>
          <span className="text-[10px] font-bold text-gray-400">{record.time}</span>
        </div>
      ),
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ID</span>,
      dataIndex: "billId",
      key: "billId",
      render: (id: string) => <span className="font-mono font-black text-indigo-500 text-xs">#{id}</span>,
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Products Total</span>,
      dataIndex: "billTotal",
      key: "billTotal",
      align: "right" as const,
      render: (t: number) => <span className="font-black text-gray-800">₹{t?.toLocaleString()}</span>,
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Total</span>,
      dataIndex: "total",
      key: "total",
      align: "right" as const,
      render: (t: number) => <span className="font-black text-gray-800">₹{t.toLocaleString()}</span>,
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Payment</span>,
      dataIndex: "payment",
      key: "payment",
      align: "right" as const,
      render: (p: number) => <span className="font-black text-green-600">₹{p.toLocaleString()}</span>,
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Outstanding</span>,
      dataIndex: "outstanding",
      key: "outstanding",
      align: "right" as const,
      render: (o: number) => (
        <span className={`font-black ${o > 0 ? "text-orange-500" : o < 0 ? "text-green-500" : "text-gray-300"}`}>
          {o < 0 ? "-" : ""}₹{Math.abs(o).toLocaleString()}
        </span>
      ),
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Created By</span>,
      dataIndex: "createdBy",
      key: "createdBy",
      render: (u: BillCreatedBy) => (
        <span className="text-xs font-bold text-gray-500 capitalize">{u?.name || "System"}</span>
      ),
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center block">View</span>,
      key: "view",
      align: "center" as const,
      render: (_: any, record: BillLike) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => {
            if (record.isReturn) {
              navigate(`/return-bills/${record.rawData._id}`, { state: { from: "customer" } });
            } else {
              navigate(`/bills/${record.rawData._id || record.key}`, { state: { from: "customer" } });
            }
          }}
          className="text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
        />
      ),
    },
  ];

  const transactionColumns: ColumnsType<TransactionLike> = [
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Timestamp</span>,
      dataIndex: "createdAt",
      key: "date",
      render: (d: string) => (
        <div className="flex flex-col">
          <span className="font-bold text-gray-800">{dayjs(d).format("DD/MM/YYYY")}</span>
          <span className="text-[10px] font-bold text-gray-400">{dayjs(d).format("hh:mm:ss A")}</span>
        </div>
      ),
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ID</span>,
      dataIndex: "id",
      key: "id",
      render: (id: string) => <span className="font-mono font-black text-indigo-500 text-xs">#{id}</span>,
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Intent</span>,
      dataIndex: "purpose",
      key: "purpose",
      render: (v: string) => (
        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
          {v || "Standard Payment"}
        </span>
      ),
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Amount</span>,
      dataIndex: "amount",
      key: "amount",
      align: "right" as const,
      render: (val: number, record: TransactionLike) => (
        <span className={`font-black ${record.paymentIn === false ? "text-red-500" : "text-green-600"}`}>
          {record.paymentIn === false ? "-" : "+"} ₹{val.toLocaleString()}
        </span>
      ),
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</span>,
      key: "status",
      align: "center" as const,
      render: (_: any, record: TransactionLike) => {
        let status = "Pending";
        let color: "warning" | "success" | "error" = "warning";
        let icon = <ClockCircleOutlined />;
        let time = "";

        if (record.approved) {
          status = "Approved";
          color = "success";
          icon = <CheckCircleOutlined />;
          if (record.approvedAt) time = dayjs(record.approvedAt).format("DD/MM/YY hh:mm A");
        } else if (record.rejectedAt) {
          status = "Rejected";
          color = "error";
          icon = <CloseCircleOutlined />;
          time = dayjs(record.rejectedAt).format("DD/MM/YY hh:mm A");
        }

        return (
          <div className="flex flex-col items-center">
            <Tag color={color} icon={icon} className="m-0 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border-0">
              {status}
            </Tag>
            {time && <span className="text-[9px] font-bold text-gray-400 mt-1">{time}</span>}
          </div>
        );
      }
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Balance</span>,
      dataIndex: "newOutstanding",
      key: "newOutstanding",
      align: "center" as const,
      render: (v: number) => (
        <span className="font-black text-gray-800 tracking-tighter text-xs">₹{v.toLocaleString()}</span>
      ),
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center block">Inspect</span>,
      key: "view",
      align: "center" as const,
      render: (_: any, record: TransactionLike) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/transactions/${record._id}`)}
          className="text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
        />
      ),
    },
  ];

  const journeyColumns: ColumnsType<JourneyLike> = [
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Timestamp</span>,
      dataIndex: "createdAt",
      key: "date",
      render: (d: string) => (
        <div className="flex flex-col">
          <span className="font-bold text-gray-800">{dayjs(d).format("DD MMM, YYYY")}</span>
          <span className="text-[10px] font-bold text-gray-400">{dayjs(d).format("hh:mm A")}</span>
        </div>
      ),
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Action</span>,
      dataIndex: "action",
      key: "action",
      render: (action: string) => {
        let color = "blue";
        if (action.includes("CREATE")) color = "green";
        if (action.includes("RETURN") || action.includes("REJECT")) color = "red";
        if (action.includes("APPROVE")) color = "purple";
        return (
          <Tag color={color} className="font-black text-[10px] uppercase tracking-wider rounded-lg border-0 py-1 px-2 m-0 bg-opacity-10 backdrop-blur-sm shadow-sm ring-1 ring-inset inline-block">
            {action.replace("_", " ")}
          </Tag>
        );
      },
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</span>,
      dataIndex: "description",
      key: "description",
      render: (desc: string) => <span className="text-xs font-bold text-gray-600">{desc}</span>,
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-right block pr-4">Amount</span>,
      dataIndex: "amount",
      key: "amount",
      render: (v: number) => (
        <div className="text-right pr-4">
          <span className={`font-black tracking-tighter text-sm ${v > 0 ? "text-indigo-600" : "text-gray-400"}`}>
            {v ? `₹${formatIndianNumber(v)}` : "-"}
          </span>
        </div>
      ),
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-right block pr-4">Prev. Bal.</span>,
      dataIndex: "previousOutstanding",
      key: "previousOutstanding",
      render: (v: number) => (
        <div className="text-right pr-4">
          <span className="font-black text-gray-400 tracking-tighter text-xs">
            {typeof v === 'number' ? `₹${formatIndianNumber(v)}` : "-"}
          </span>
        </div>
      ),
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pr-4">New Bal.</span>,
      dataIndex: "newOutstanding",
      key: "newOutstanding",
      render: (v: number) => (
        <div className="text-right pr-4">
          <span className="font-black text-gray-800 tracking-tighter text-sm">
            {typeof v === 'number' ? `₹${formatIndianNumber(v)}` : "-"}
          </span>
        </div>
      ),
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">By</span>,
      key: "user",
      render: (_: any, record: JourneyLike) => (
        <span className="text-xs font-bold text-gray-500 capitalize">{record?.user?.name || "System"}</span>
      ),
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center block">Inspect</span>,
      key: "view",
      align: "center" as const,
      render: (_: unknown, record: JourneyLike) => {
        if (!record.entityId) return <span className="text-gray-300">-</span>;

        return (
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => {
                const action = record.action || "";
                if (action.includes("RETURN")) {
                  navigate(`/return-bills/${record.entityId}`, { state: { from: "customer" } });
                } else if (action.includes("BILL_CREATED") || action.includes("BILL_UPDATED")) {
                  navigate(`/bills/${record.entityId}`, { state: { from: "customer" } });
                } else if (action.includes("TRANSACTION") || action.includes("PAYMENT")) {
                  navigate(`/transactions/${record.entityId}`, { state: { from: "customer" } });
                }
              }}
              className="text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            />
          </Tooltip>
        );
      },
    },
  ];

  const handlePinSubmit = () => {
    if (pin === "1234") {
      setLocked(false);
      setPin("");
    } else {
      message.error("Incorrect PIN");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-red-500">
        <p>{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-50/50 flex flex-col items-center">
      <div className="w-full max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <Button
            type="text"
            icon={<ArrowLeftOutlined className="text-[10px]" />}
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 font-black text-gray-400 hover:text-indigo-600 transition-all p-0 h-auto uppercase tracking-widest text-[10px]"
          >
            Terminal Root / CRM
          </Button>
          <div className="text-right hidden sm:block">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] block">Registry Sync 2.0</span>
            <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest text-right">Authorized Account Terminal</span>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden mb-8 group">
          <div className="bg-indigo-600 p-8 sm:p-12 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative overflow-hidden">
            <div className="relative z-10 flex items-center gap-6">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[32px] bg-white/10 backdrop-blur-md flex items-center justify-center text-3xl font-black border border-white/20 shadow-xl group-hover:scale-110 transition-transform duration-500">
                {customer?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-indigo-500/50 rounded-full mb-2 border border-indigo-400/30 backdrop-blur-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span className="text-[8px] font-black uppercase tracking-widest">Active Registry</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tighter leading-tight capitalize">{customer?.name}</h1>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs font-bold text-indigo-100/70 bg-white/5 border border-white/10 px-3 py-1 rounded-xl focus:outline-none">
                    {customer?.phone}
                  </span>
                  <span className="text-[10px] font-black text-indigo-100/40 uppercase tracking-widest">ID: {customer?._id?.slice(-6).toUpperCase()}</span>
                </div>
              </div>
            </div>
            <div className="relative z-10 bg-white/10 backdrop-blur-xl rounded-[32px] p-6 sm:p-8 border border-white/20 min-w-[220px] shadow-2xl">
              <span className="text-[10px] font-black text-indigo-100 uppercase tracking-widest block mb-1">Financial Exposure</span>
              <div className="text-4xl font-black tracking-tighter leading-none">
                <span className="text-indigo-200 text-lg mr-1 tracking-normal">₹</span>
                {Number(customer?.outstanding || 0).toLocaleString()}
              </div>
              <p className="text-[8px] font-black text-indigo-200/50 uppercase tracking-widest mt-2">{customer?.outstanding > 0 ? "Outstanding Amount" : "Settled"}</p>
              {hasAdminAccess && <Button
                icon={<HistoryOutlined />}
                onClick={() => {
                  if (!hasAdminAccess) {
                    message.info("You are not authorised to see the history");
                    return;
                  }
                  setHistoryModalVisible(true)
                }}
                className="mt-6 w-full h-12 bg-white/10 hover:bg-white/20 border-white/20 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl backdrop-blur-md transition-all border"
              >
                Account History
              </Button>}
            </div>

            <div className="absolute top-0 right-0 p-20 opacity-5 group-hover:scale-110 transition-transform duration-1000 rotate-12">
              <BarChartOutlined style={{ fontSize: 300 }} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden mb-12">
          <Tabs
            activeKey={tab}
            onChange={setTab}
            className="customer-tabs"
            items={[
              {
                key: "bills",
                label: <span className="px-6 py-4 font-black uppercase text-[10px] tracking-widest">Bills</span>,
                children: (
                  <div className="p-2 sm:p-8">
                    <Table
                      columns={billColumns}
                      dataSource={billHistoryData}
                      rowKey="_id"
                      loading={tabLoading}
                      pagination={{
                        current: pagination.bills.current,
                        pageSize: pagination.bills.pageSize,
                        total: pagination.bills.total,
                        onChange: (page) => fetchPaginatedBills(page),
                        showSizeChanger: false,
                        className: "px-6 py-4"
                      }}
                      scroll={{ x: 800 }}
                      className="modern-table"
                      rowClassName="group cursor-pointer hover:bg-indigo-50/30 transition-all duration-300"
                    />
                  </div>
                ),
              },
              {
                key: "returns",
                label: <span className="px-6 py-4 font-black uppercase text-[10px] tracking-widest">Returns</span>,
                children: (
                  <div className="p-2 sm:p-8">
                    <Table
                      columns={billColumns} // Reuse bill columns, they fit returns too
                      dataSource={returnHistoryData}
                      rowKey="_id"
                      loading={tabLoading}
                      pagination={{
                        current: pagination.returns.current,
                        pageSize: pagination.returns.pageSize,
                        total: pagination.returns.total,
                        onChange: (page) => fetchPaginatedReturns(page),
                        showSizeChanger: false,
                        className: "px-6 py-4"
                      }}
                      scroll={{ x: 800 }}
                      className="modern-table"
                      rowClassName="group cursor-pointer hover:bg-indigo-50/30 transition-all duration-300"
                    />
                  </div>
                ),
              },
              {
                key: "transactions",
                label: <span className="px-6 py-4 font-black uppercase text-[10px] tracking-widest">Ledger</span>,
                children: (
                  <div className="p-2 sm:p-8">
                    <Table
                      columns={transactionColumns}
                      dataSource={transactionsData}
                      rowKey="_id"
                      loading={tabLoading}
                      pagination={{
                        current: pagination.transactions.current,
                        pageSize: pagination.transactions.pageSize,
                        total: pagination.transactions.total,
                        onChange: (page) => fetchPaginatedTransactions(page),
                        showSizeChanger: false,
                        className: "px-6 py-4"
                      }}
                      scroll={{ x: 800 }}
                      className="modern-table"
                      rowClassName="group cursor-pointer hover:bg-indigo-50/30 transition-all duration-300"
                    />
                  </div>
                ),
              },
              ...(hasAdminAccess ? [{
                key: "journeys",
                label: <span className="px-6 py-4 font-black uppercase text-[10px] tracking-widest">Journey</span>,
                children: (
                  <div className="p-2 sm:p-8">
                    <Table
                      columns={journeyColumns}
                      dataSource={journeysData}
                      rowKey="_id"
                      loading={tabLoading}
                      pagination={{
                        current: pagination.journeys.current,
                        pageSize: pagination.journeys.pageSize,
                        total: pagination.journeys.total,
                        onChange: (page) => fetchPaginatedJourneys(page),
                        showSizeChanger: false,
                        className: "px-6 py-4"
                      }}
                      scroll={{ x: 800 }}
                      className="modern-table"
                      rowClassName="group cursor-pointer hover:bg-indigo-50/30 transition-all duration-300"
                    />
                  </div>
                ),
              }] : []),
              ...(hasAdminAccess ? [{
                key: "analytics",
                label: <span className="px-6 py-4 font-black uppercase text-[10px] tracking-widest">Insight Matrix</span>,
                children: (
                  <div className="p-4 sm:p-12">
                    {locked ? (
                      <div className="py-20 text-center max-w-sm mx-auto">
                        <div className="w-20 h-20 rounded-[32px] bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-8 shadow-inner border border-indigo-100">
                          <LockOutlined style={{ fontSize: 28 }} />
                        </div>
                        <h2 className="text-2xl font-black text-gray-800 mb-2 tracking-tight">Security Protocol</h2>
                        <p className="text-gray-400 text-xs font-bold mb-10 px-4">Authorized Admin Credentials Required to view comprehensive financial flow analytics.</p>
                        <Input.Password
                          value={pin}
                          onChange={(e) => setPin(e.target.value)}
                          placeholder="••••"
                          className="h-16 rounded-[24px] text-center text-3xl font-black mb-6 border-2 border-gray-50 bg-gray-50/30 focus:bg-white transition-all shadow-inner"
                          onPressEnter={handlePinSubmit}
                          maxLength={4}
                        />
                        <Button
                          type="primary"
                          onClick={handlePinSubmit}
                          className="w-full h-14 bg-indigo-600 border-none font-black text-[10px] tracking-widest rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 uppercase"
                        >
                          Verify & Decode Insights
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                          <div>
                            <h3 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-3">
                              <LineChartOutlined className="text-indigo-600" /> Revenue Flow
                            </h3>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-0.5">Time-Series Engagement Analytics</p>
                          </div>
                          <Select
                            value={analyticsDays}
                            onChange={(val: number) => setAnalyticsDays(val)}
                            className="w-full sm:w-48 h-12 rounded-2xl font-black"
                            options={[
                              { value: 7, label: "Last 7 Business Days" },
                              { value: 15, label: "Last 15 Cycles" },
                              { value: 30, label: "Last 30 Cycles" },
                              { value: 90, label: "Quarterly Analysis" }
                            ]}
                          />
                        </div>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          <div className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm transition-all hover:shadow-xl hover:shadow-blue-50/50 group">
                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-1">Gross Yield</span>
                            <div className="text-3xl font-black text-gray-800 tracking-tighter group-hover:text-blue-600 transition-colors">₹{Number(analyticsSummary.totalSales).toLocaleString()}</div>
                          </div>
                          <div className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm transition-all hover:shadow-xl hover:shadow-emerald-50/50 group">
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block mb-1">Net Margin</span>
                            <div className="text-3xl font-black text-gray-800 tracking-tighter group-hover:text-emerald-600 transition-colors">₹{Number(analyticsSummary.totalProfit).toLocaleString()}</div>
                          </div>
                          <div className="bg-indigo-600 border border-indigo-500 rounded-[32px] p-8 shadow-xl shadow-indigo-100 lg:col-span-1 sm:col-span-2 group">
                            <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest block mb-1">Total Liquidity</span>
                            <div className="text-3xl font-black text-white tracking-tighter">₹{Number(analyticsSummary.totalPayments).toLocaleString()}</div>
                          </div>
                        </div>

                        {/* Multi-Area Graph */}
                        <div className="bg-gray-50/50 rounded-[40px] p-6 sm:p-10 border border-gray-100">
                          <div style={{ width: '100%', height: 400 }}>
                            {analyticsLoading ? (
                              <div className="w-full h-full flex justify-center items-center"><Spin size="large" /></div>
                            ) : analyticsData.length === 0 ? (
                              <div className="w-full h-full flex flex-col justify-center items-center text-gray-400">
                                <BarChartOutlined style={{ fontSize: 40 }} className="mb-4 opacity-20" />
                                <p className="font-black text-[10px] uppercase tracking-[0.2em]">Insufficient Data Points</p>
                              </div>
                            ) : (
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={analyticsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                  <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                  <XAxis
                                    dataKey="date"
                                    tickFormatter={(dateStr) => dayjs(dateStr).format('D MMM')}
                                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 900 }}
                                    axisLine={false}
                                    tickLine={false}
                                    dy={15}
                                  />
                                  <YAxis
                                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 900 }}
                                    tickFormatter={(val) => `₹${val}`}
                                    axisLine={false}
                                    tickLine={false}
                                  />
                                  <ChartTooltip
                                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', padding: '20px' }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}
                                    labelStyle={{ marginBottom: '12px', fontWeight: 900, fontSize: '14px', color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}
                                  />
                                  <Legend verticalAlign="top" align="right" height={50} iconType="circle" wrapperStyle={{ fontWeight: 900, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                                  <Area type="monotone" name="Registry Sales" dataKey="sales" stroke="#6366f1" strokeWidth={5} fillOpacity={1} fill="url(#colorSales)" />
                                  <Area type="monotone" name="Net Profit" dataKey="profit" stroke="#10b981" strokeWidth={5} fillOpacity={1} fill="url(#colorProfit)" />
                                </AreaChart>
                              </ResponsiveContainer>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ),
              }] : [])
            ]}
          />
        </div>
      </div>

      <Modal
        title={null}
        open={historyModalVisible}
        onCancel={() => setHistoryModalVisible(false)}
        footer={null}
        width={900}
        className="history-modal"
        centered
      >
        <div className="p-2 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8 mt-2">
            <div>
              <h2 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-3">
                <HistoryOutlined className="text-indigo-600" /> Account History
              </h2>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-0.5">Comprehensive Ledger Statement</p>
            </div>
            <DatePicker.RangePicker
              value={historyRange}
              onChange={(val) => setHistoryRange(val)}
              className="h-12 rounded-2xl font-black border-gray-100 shadow-sm"
              allowClear={false}
            />
          </div>

          {historyLoading ? (
            <div className="py-20 flex justify-center"><Spin size="large" /></div>
          ) : historyData ? (
            <div className="space-y-6">
              {/* Balances Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Opening</span>
                  <div className="text-lg font-black text-gray-800">₹{formatIndianNumber(historyData.openingBalance)}</div>
                </div>
                <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
                  <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest block mb-1">Closing</span>
                  <div className="text-lg font-black text-indigo-600">₹{formatIndianNumber(historyData.closingBalance)}</div>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Period Net</span>
                  <div className={`text-lg font-black ${(historyData.closingBalance - historyData.openingBalance) >= 0 ? "text-orange-500" : "text-green-600"}`}>
                    ₹{formatIndianNumber(Math.abs(historyData.closingBalance - historyData.openingBalance))}
                    <span className="text-[10px] ml-1">{(historyData.closingBalance - historyData.openingBalance) >= 0 ? "Dr" : "Cr"}</span>
                  </div>
                </div>
              </div>

              {/* Ledger Table */}
              <div className="border border-gray-50 rounded-[32px] overflow-hidden bg-white shadow-sm">
                <Table
                  dataSource={historyData.history}
                  pagination={false}
                  scroll={{ y: 400 }}
                  rowKey="id"
                  className="modern-table"
                  columns={[
                    {
                      title: 'DATE & TIME',
                      dataIndex: 'date',
                      width: 150,
                      render: (d) => (
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-gray-800">{dayjs(d).format("DD MMM, YYYY")}</span>
                          <span className="text-[9px] font-black text-gray-400 uppercase">{dayjs(d).format("hh:mm A")}</span>
                        </div>
                      )
                    },
                    {
                      title: 'DESCRIPTION',
                      dataIndex: 'description',
                      render: (desc, record: any) => (
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-gray-700">{desc}</span>
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">REF: #{record.refId}</span>
                        </div>
                      )
                    },
                    {
                      title: 'DEBIT (+)',
                      align: 'right',
                      render: (_, record: any) => {
                        let debit = 0;
                        if (record.type === 'BILL') debit = record.total;
                        if (record.type === 'TRANSACTION' && !record.paymentIn) debit = record.amount;

                        return debit > 0 ? (
                          <span className="text-xs font-black text-orange-500">₹{formatIndianNumber(debit)}</span>
                        ) : <span className="text-gray-200">-</span>;
                      }
                    },
                    {
                      title: 'CREDIT (-)',
                      align: 'right',
                      render: (_, record: any) => {
                        let credit = 0;
                        if (record.type === 'BILL') credit = record.payment;
                        if (record.type === 'TRANSACTION' && record.paymentIn) credit = record.amount;
                        if (record.type === 'RETURN' && record.paymentMode === 'ADJUSTMENT') credit = record.totalAmount;

                        return credit > 0 ? (
                          <span className="text-xs font-black text-green-600">₹{formatIndianNumber(credit)}</span>
                        ) : <span className="text-gray-200">-</span>;
                      }
                    },
                    {
                      title: 'BALANCE',
                      dataIndex: 'newBalance',
                      align: 'right',
                      render: (b) => (
                        <span className="text-xs font-black text-gray-800 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                          ₹{formatIndianNumber(b)}
                        </span>
                      )
                    }
                  ]}
                />
              </div>
              <div className="flex justify-end pt-4">
                <Button
                  type="primary"
                  icon={<CloudDownloadOutlined />}
                  onClick={shareStatement}
                  className="h-12 bg-indigo-600 border-none font-black text-[10px] tracking-widest rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 uppercase px-8"
                >
                  Share on WhatsApp
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-20"><Empty description="No history available for this range" /></div>
          )}
        </div>
      </Modal>

      <style>{`
        .history-modal .ant-modal-content {
          border-radius: 40px;
          padding: 0;
          overflow: hidden;
        }
        .customer-tabs .ant-tabs-nav {
          margin-bottom: 0 !important;
          border-bottom: 1px solid #f1f5f9;
          padding: 0 2rem;
        }
        .customer-tabs .ant-tabs-tab {
          margin: 0 !important;
          padding: 1.5rem 1.5rem !important;
          transition: all 0.3s ease !important;
        }
        .customer-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
          color: #4f46e5 !important;
        }
        .customer-tabs .ant-tabs-ink-bar {
          height: 4px !important;
          background: #4f46e5 !important;
          border-radius: 4px 4px 0 0;
        }
        .modern-table .ant-table {
          background: transparent !important;
        }
        .modern-table .ant-table-thead > tr > th {
          background: transparent !important;
          border-bottom: 1px solid #f8fafc !important;
          padding: 1.5rem 1rem !important;
        }
        .modern-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f8fafc !important;
          padding: 1.25rem 1rem !important;
        }
      `}</style>
    </main >
  );
};

export default IndividualCustomerPage;
