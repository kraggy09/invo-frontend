import { useState, useEffect } from "react";
import {
  Tabs,
  Card,
  DatePicker,
  Input,
  Button,
  Table,
  Spin,
  Statistic,
  message,
  Select,
  InputNumber,
  Tag,
  Tooltip,
} from "antd";
import {
  LockOutlined,
  EyeInvisibleOutlined,
  DollarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  PercentageOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CloseOutlined,
  StockOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  UndoOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
dayjs.extend(isBetween);
import useBillStore, { BillCustomer, BillCreatedBy, Bill } from "../store/bill.store";
import useTransactionStore from "../store/transaction.store";
import useReturnBillStore from "../store/returnBill.store";
import { useNavigate } from "react-router-dom";
import { useInventoryRequestStore } from "../store/requests.store";
import apiCaller from "../utils/apiCaller";

const { RangePicker } = DatePicker;

const mockReportData = {
  bills: [],
  transactions: [],
};

const DailyReportPage = () => {
  const [activeTab, setActiveTab] = useState("bills");
  const [dateRange, setDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null]
  >([dayjs(), dayjs()]);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<{ bills: any[]; transactions: any[]; returnBills?: any[] } | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [pin, setPin] = useState("");
  const [summary, setSummary] = useState({
    profit: 0,
    totalPaymentIn: 0,
    totalPaymentOut: 0,
    totalBillAmount: 0,
    marginPercent: 0,
    peakHour: "N/A",
  });
  const [billSearch, setBillSearch] = useState("");
  const [transactionSearch, setTransactionSearch] = useState("");
  const [requestSearch, setRequestSearch] = useState("");
  const [transactionFilterType, setTransactionFilterType] = useState("all");
  const [requestFilterType, setRequestFilterType] = useState("all");
  const [billAmountRange, setBillAmountRange] = useState<[number, number]>([
    0,
    Infinity,
  ]);
  const [transactionAmountRange, setTransactionAmountRange] = useState<
    [number, number]
  >([0, Infinity]);

  // Zustand stores
  const billsFromStore = useBillStore((state) => state.bills);
  const transactionsFromStore = useTransactionStore(
    (state) => state.transactions
  );
  const { requests: inventoryRequests } = useInventoryRequestStore();
  const returnBillsFromStore = useReturnBillStore((state) => state.returnBills);

  // Use fetched report data if in historical mode, otherwise use live store
  const bills = reportData ? reportData.bills : billsFromStore;
  const transactions = reportData ? reportData.transactions : transactionsFromStore;
  const returnBills = reportData ? reportData.returnBills || [] : returnBillsFromStore;

  const getOutstanding = (b: any) => b.total - (b.payment || 0);

  const getStatus = (b: any): string => {
    const outstanding = getOutstanding(b);
    if (outstanding <= 0) return "Paid";
    if (b.payment > 0) return "Partial";
    return "Pending";
  };

  const pureMappedBills = bills
    .map((bill: any) => {
      const dateVal = bill.createdAt || bill.date;
      return {
        key: bill._id || bill.id,
        date: dateVal ? dayjs(dateVal).format("DD/MM/YYYY") : "",
        time: dateVal ? dayjs(dateVal).format("hh:mm A") : "",
        billId: bill.id || bill._id,
        billTotal: bill.productsTotal ?? bill.items?.reduce((sum: number, item: any) => sum + (item.total || 0), 0) ?? 0,
        outstanding: getOutstanding(bill),
        payment: bill.payment || 0,
        total: bill.total,
        customer: bill.customer, // keep the full object
        createdBy: bill.createdBy, // keep the full object
        status: bill.status || getStatus(bill),
        rawData: bill,
      };
    });

  const mappedReturnBills = returnBills.map((rb: any) => {
    const dateVal = rb.createdAt || rb.date;
    return {
      key: `return_${rb.id || rb._id}`,
      date: dateVal ? dayjs(dateVal).format("DD/MM/YYYY") : "",
      time: dateVal ? dayjs(dateVal).format("hh:mm A") : "",
      billId: `R-${rb.id || rb._id}`, // Distinct prefix
      billTotal: -rb.productsTotal, // Negative to stand out
      outstanding: rb.previousOutstanding - rb.productsTotal,
      payment: rb.paymentMode === "CASH" ? -rb.totalAmount : 0,
      total: rb.previousOutstanding - rb.productsTotal,
      customer: rb.customer,
      createdBy: rb.createdBy,
      status: "Returned",
      rawData: rb,
      isReturn: true
    };
  });

  const mappedBills = [...pureMappedBills, ...mappedReturnBills].sort((a, b) => {
    const timeA = new Date(a.rawData.createdAt || a.rawData.date).getTime();
    const timeB = new Date(b.rawData.createdAt || b.rawData.date).getTime();
    return timeB - timeA;
  });

  const mappedTransactions = transactions
    .map((t: any) => ({
      key: t._id, // Always use _id for the row key / navigation
      date: t.createdAt ? dayjs(t.createdAt).format("DD/MM/YYYY") : "",
      time: t.createdAt ? dayjs(t.createdAt).format("hh:mm:ss A") : "",
      transId: t.id || t._id, // Display the numeric ID
      purpose: t.purpose || "",
      name: t.name || "",
      previousOutstanding: t.previousOutstanding || 0,
      payment: t.amount || t.payment || 0,
      newOutstanding: t.newOutstanding || 0,
      paymentIn: !t.taken || t.paymentIn,
      approved: t.approved,
      approvedAt: t.approvedAt,
      rejectedAt: t.rejectedAt,
    }))
    .reverse();

  // Map inventory requests to table format with streamlined data
  const mappedRequests = inventoryRequests
    .map((request: any) => ({
      key: request._id,
      date: dayjs(request.date).format("DD/MM"),
      dateTime: dayjs(request.date).format("DD/MM/YYYY HH:mm"),
      productName: request.product.name,
      createdBy: request.createdBy.name,
      stockChange: `${!request.approved ? request.oldStock : request.stockAtUpdate
        } → ${request.newStock}`,
      quantity:
        request.quantity > 0 ? `+${request.quantity}` : request.quantity,
      status: request.approved
        ? "Approved"
        : request.rejected
          ? "Rejected"
          : "Pending",
      approved: request.approved,
      rejected: request.rejected,
      rawData: request, // Keep full data for tooltip/modal if needed
      purpose: request.purpose,
    }))
    .reverse();

  // Filtered data
  const filteredBills = mappedBills.filter((bill: any) => {

    if (
      billSearch &&
      !(
        (bill.customer?.name &&
          bill.customer.name.toLowerCase().includes(billSearch.toLowerCase())) ||
        (bill.billId && bill.billId.toString().includes(billSearch)) ||
        (bill.customer?.phone && bill.customer.phone.toString().includes(billSearch))
      )
    )
      return false;

    if (billAmountRange[0] > 0 && bill.billAmount < billAmountRange[0])
      return false;
    if (billAmountRange[1] < Infinity && bill.billAmount > billAmountRange[1])
      return false;
    return true;
  });

  const filteredTransactions = mappedTransactions.filter((t: any) => {
    if (transactionFilterType !== "all" && t.purpose !== transactionFilterType)
      return false;
    if (
      transactionSearch &&
      !(
        (t.name &&
          t.name.toLowerCase().includes(transactionSearch.toLowerCase())) ||
        (t.transId && t.transId.toString().includes(transactionSearch))
      )
    )
      return false;

    if (transactionAmountRange[0] > 0 && t.payment < transactionAmountRange[0])
      return false;
    if (
      transactionAmountRange[1] < Infinity &&
      t.payment > transactionAmountRange[1]
    )
      return false;
    return true;
  });

  const filteredRequests = mappedRequests.filter((request: any) => {
    if (requestFilterType !== "all" && request.status !== requestFilterType)
      return false;
    if (
      requestSearch &&
      !(
        (request.productName &&
          request.productName
            .toLowerCase()
            .includes(requestSearch.toLowerCase())) ||
        (request.createdBy &&
          request.createdBy.toLowerCase().includes(requestSearch.toLowerCase()))
      )
    )
      return false;

    return true;
  });

  const navigate = useNavigate();

  useEffect(() => {
    // Calculate summary stats here from reportData
    if (!bills && !transactions) return;
    let totalBillAmount = 0;
    let totalInvestment = 0;
    let totalPaymentIn = 0;
    let totalPaymentOut = 0;

    if (bills) {
      for (const bill of bills) {
        if (bill.items) {
          for (const item of bill.items) {
            totalBillAmount += item.total ?? 0;
            // Prefer item level cost price which is persisted
            totalInvestment +=
              (item.quantity ?? 0) * (item.costPrice ?? item.product?.costPrice ?? 0);
          }
        }
      }
    }
    if (transactions) {
      for (const t of transactions) {
        if (t.paymentIn === false) {
          totalPaymentOut += t.amount ?? t.payment ?? 0;
        } else {
          totalPaymentIn += t.amount ?? t.payment ?? 0;
        }
      }
    }
    const profit = totalBillAmount - totalInvestment;
    const marginPercent =
      totalBillAmount > 0 ? (profit / totalBillAmount) * 100 : 0;

    // Calculate Peak Hour
    let peakHour = "N/A";
    if (bills && bills.length > 0) {
      const hourCounts: { [key: number]: number } = {};
      bills.forEach((bill: any) => {
        if (bill.createdAt) {
          const hour = dayjs(bill.createdAt).hour();
          hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        }
      });

      let maxHour = -1;
      let maxCount = 0;
      for (const hour in hourCounts) {
        if (hourCounts[hour] > maxCount) {
          maxCount = hourCounts[hour];
          maxHour = parseInt(hour);
        }
      }

      if (maxHour !== -1) {
        const start = dayjs().hour(maxHour).minute(0).format("hh A");
        const end = dayjs()
          .hour(maxHour + 1)
          .minute(0)
          .format("hh A");
        peakHour = `${start} - ${end}`;
      }
    }

    setSummary({
      profit: Number(profit.toFixed(1)),
      totalPaymentIn: Number(totalPaymentIn.toFixed(1)),
      totalPaymentOut: Number(totalPaymentOut.toFixed(1)),
      totalBillAmount: Number(totalBillAmount.toFixed(1)),
      marginPercent: Number(marginPercent.toFixed(1)),
      peakHour,
    });
  }, [bills, transactions]);

  // Fetch on date range change
  useEffect(() => {
    const isToday =
      dateRange[0]?.isSame(dayjs(), "day") &&
      dateRange[1]?.isSame(dayjs(), "day");

    if (!isToday) {
      fetchReport();
    } else {
      setReportData(null); // Clear report data to fallback to live store for Today
    }
  }, [dateRange]);

  // Real fetch from API
  const fetchReport = async () => {
    if (!dateRange[0] || !dateRange[1]) return;

    setLoading(true);
    try {
      const [billsRes, transactionsRes, returnBillsRes] = await Promise.all([
        apiCaller.get("/bills", {
          params: {
            startDate: dateRange[0].startOf("day").toISOString(),
            endDate: dateRange[1].endOf("day").toISOString(),
          },
        }),
        apiCaller.get("/transactions", {
          params: {
            startDate: dateRange[0].startOf("day").toISOString(),
            endDate: dateRange[1].endOf("day").toISOString(),
          },
        }),
        apiCaller.get("/return-bills", {
          params: {
            startDate: dateRange[0].startOf("day").toISOString(),
            endDate: dateRange[1].endOf("day").toISOString(),
          },
        })
      ]);

      setReportData({
        bills: billsRes.data.data?.bills ?? billsRes.data.bills ?? [],
        transactions:
          transactionsRes.data.data?.transactions ??
          transactionsRes.data.transactions ??
          [],
        returnBills: returnBillsRes.data.data?.returnBills ?? returnBillsRes.data.returnBills ?? [],
      });
      message.success("Report data loaded successfully");
    } catch (error) {
      console.error("Fetch report error:", error);
      message.error("Failed to load historical report");
    } finally {
      setLoading(false);
    }
  };

  // PIN logic
  const handlePinSubmit = () => {
    if (pin === "1234") {
      // Replace with real admin PIN check
      setShowAdmin(true);
      setPin("");
    } else {
      message.error("Incorrect PIN");
    }
  };

  const billColumns = [
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Date</span>,
      dataIndex: "date",
      key: "date",
      render: (text: string, record: any) => (
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
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</span>,
      dataIndex: "customer",
      key: "customer",
      render: (c: BillCustomer) => (
        <div className="flex flex-col cursor-pointer group/customer" onClick={() => c?._id && navigate(`/customers/${c._id}`)}>
          <span className="font-black text-gray-700 capitalize group-hover/customer:text-indigo-600 transition-colors">{c?.name || "—"}</span>
          {c?.phone && <span className="text-[10px] font-bold text-gray-400 group-hover/customer:text-indigo-400 transition-colors">{c.phone}</span>}
        </div>
      ),
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
        <span className={`font-black ${o > 0 ? "text-orange-500" : "text-gray-300"}`}>
          ₹{o.toLocaleString()}
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
      render: (_: any, record: any) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => {
            if (record.isReturn) {
              navigate(`/return-bills/${record.rawData._id}`, { state: { from: "daily-report" } });
            } else {
              navigate(`/bills/${record.key}`, { state: { from: "daily-report" } });
            }
          }}
          className="text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
        />
      ),
    },
  ];

  const transactionColumns = [
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Timestamp</span>,
      dataIndex: "date",
      key: "date",
      render: (text: string, record: any) => (
        <div className="flex flex-col">
          <span className="font-bold text-gray-800">{text}</span>
          <span className="text-[10px] font-bold text-gray-400">{record.time}</span>
        </div>
      ),
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ID</span>,
      dataIndex: "transId",
      key: "transId",
      render: (id: string) => <span className="font-mono font-black text-indigo-500 text-xs text-center">#{id}</span>,
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Intent</span>,
      dataIndex: "purpose",
      key: "purpose",
      render: (text: string) => <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-gray-50 rounded-lg text-gray-500 border border-gray-100">{text}</span>,
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Party</span>,
      dataIndex: "name",
      key: "name",
      render: (name: string) => <span className="font-black text-gray-700 capitalize">{name}</span>,
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Amount</span>,
      dataIndex: "payment",
      key: "payment",
      align: "right" as const,
      render: (val: number, record: any) => (
        <span className={`font-black ${record.paymentIn === false ? "text-red-500" : "text-green-600"}`}>
          {record.paymentIn === false ? "-" : "+"} ₹{val.toLocaleString()}
        </span>
      ),
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</span>,
      key: "status",
      align: "center" as const,
      render: (_: any, record: any) => {
        let status = "Pending";
        let color = "warning";
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
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center block">Inspect</span>,
      key: "view",
      align: "center" as const,
      render: (_: any, record: any) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/transactions/${record.key}`, { state: { from: "daily-report" } })}
          className="text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
        />
      ),
    },
  ];

  const paymentColumns = [
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Date</span>,
      dataIndex: "date",
      key: "date",
      render: (text: string, record: any) => (
        <div className="flex flex-col">
          <span className="font-bold text-gray-800">{text}</span>
          <span className="text-[10px] font-bold text-gray-400">{record.time}</span>
        </div>
      ),
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ID</span>,
      dataIndex: "transId",
      key: "transId",
      render: (id: string) => <span className="font-mono font-black text-indigo-500 text-xs text-center">#{id}</span>,
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Party Name</span>,
      dataIndex: "name",
      key: "name",
      render: (name: string) => <span className="font-black text-gray-700 capitalize">{name}</span>,
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Payment</span>,
      dataIndex: "payment",
      key: "payment",
      align: "right" as const,
      render: (val: number, record: any) => (
        <span className={`font-black ${record.paymentIn === false ? "text-red-500" : "text-green-600"}`}>
          {record.paymentIn === false ? "-" : "+"} ₹{val.toLocaleString()}
        </span>
      ),
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center block">Inspect</span>,
      key: "view",
      align: "center" as const,
      render: (_: any, record: any) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/transactions/${record.key}`, { state: { from: "daily-report" } })}
          className="text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
        />
      ),
    },
  ];

  // Streamlined request columns - only essential data
  const requestColumns = [
    {
      title: "Date ",
      dataIndex: "date",
      key: "date",
      width: 80,
      render: (text: string, record: any) => (
        <Tooltip title={record.dateTime}>
          <span
            style={{
              textDecoration: record.rejected ? "line-through" : "none",
              color: record.rejected ? "#999" : "inherit",
              fontSize: "12px",
            }}
          >
            {text}
          </span>
        </Tooltip>
      ),
    },
    {
      title: "Product",
      dataIndex: "productName",
      key: "productName",
      width: 120,
      render: (text: string, record: any) => (
        <span
          style={{
            textDecoration: record.rejected ? "line-through" : "none",
            color: record.rejected ? "#999" : "inherit",
            fontWeight: 500,
          }}
        >
          {text}
        </span>
      ),
    },
    {
      title: "User",
      dataIndex: "createdBy",
      key: "createdBy",
      width: 100,
      render: (text: string, record: any) => (
        <span
          style={{
            textDecoration: record.rejected ? "line-through" : "none",
            color: record.rejected ? "#999" : "#666",
            fontSize: "12px",
          }}
        >
          {text}
        </span>
      ),
    },
    {
      title: "Stock Change",
      dataIndex: "stockChange",
      key: "stockChange",
      width: 120,
      render: (text: string, record: any) => (
        <Tooltip title={`Quantity: ${record.quantity}`}>
          <span
            style={{
              textDecoration: record.rejected ? "line-through" : "none",
              color: record.rejected ? "#999" : "#1890ff",
              fontWeight: 500,
              fontSize: "12px",
            }}
          >
            {text}
          </span>
        </Tooltip>
      ),
    },
    {
      title: "Purpose",
      dataIndex: "purpose",
      key: "purpose",
      width: 120,
      render: (_: any, record: any) => {
        const isRejected = record.rejected;
        let purposeText = record.purpose;
        let color = "default"; // Fallback color
        let icon = null;

        // Transform text and set colors/icons based on purpose
        if (record.purpose === "STOCK_UPDATE") {
          purposeText = "Stock Update";
          color = isRejected ? "default" : "blue"; // Soft blue for update
          icon = <StockOutlined style={{ marginRight: 4 }} />; // Assuming StockOutlined icon from Ant Design
        } else if (record.purpose === "PRODUCT_RETURN") {
          purposeText = "Product Return";
          color = isRejected ? "default" : "green"; // Green for return (positive action)
          icon = <UndoOutlined style={{ marginRight: 4 }} />; // Return/undo icon
        }

        return (
          <Tag
            color={color}
            icon={icon}
            style={{
              borderRadius: "16px", // Rounded for fancy look
              padding: "2px 8px",
              fontSize: "12px",
              fontWeight: 500,
              textDecoration: isRejected ? "line-through" : "none",
              color: isRejected ? "#999" : undefined, // Gray out if rejected
              border: isRejected ? "1px dashed #d9d9d9" : undefined, // Dashed border for rejected
            }}
          >
            {isRejected && (
              <CloseOutlined style={{ marginRight: 4, fontSize: "10px" }} />
            )}{" "}
            {/* Rejected icon */}
            {purposeText}
          </Tag>
        );
      },
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      width: 80,
      render: (text: string, record: any) => (
        <span
          style={{
            textDecoration: record.rejected ? "line-through" : "none",
            color: record.rejected ? "#999" : "#fa8c16",
            fontWeight: 500,
            fontSize: "12px",
          }}
        >
          {text}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status: string, record: any) => {
        let color = "default";
        let icon = <ClockCircleOutlined />;

        if (status === "Approved") {
          color = "success";
          icon = <CheckCircleOutlined />;
        } else if (status === "Rejected") {
          color = "error";
          icon = <CloseCircleOutlined />;
        } else {
          color = "warning";
          icon = <ClockCircleOutlined />;
        }

        return (
          <Tag color={color} icon={icon} style={{ fontSize: "11px" }}>
            {status}
          </Tag>
        );
      },
    },
    {
      title: "Details",
      key: "details",
      width: 80,
      render: (_: any, record: any) => (
        <Tooltip
          title={
            <div>
              <div>
                <strong>Request ID:</strong> {record.key.slice(-8)}
              </div>
              <div>
                <strong>Purpose:</strong> {record.rawData.purpose}
              </div>
              <div>
                <strong>Old Stock:</strong> {record.rawData.oldStock}
              </div>
              <div></div>
              <div>
                <strong>New Stock:</strong> {record.rawData.newStock}
              </div>
              {record.rawData.approvedAt && (
                <div>
                  <strong>Approved:</strong>{" "}
                  {dayjs(record.rawData.approvedAt).format("DD/MM/YY hh:mm A")}
                </div>
              )}
              {record.rawData.stockAtUpdate !== undefined && (
                <div>
                  <strong>Stock at Update:</strong>{" "}
                  {record.rawData.stockAtUpdate}
                </div>
              )}
            </div>
          }
        >
          <Button
            type="text"
            icon={<InfoCircleOutlined />}
            size="small"
            style={{ color: "#666" }}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-gray-800 tracking-tighter leading-tight">Operation Audits</h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Cross-Terminal Analytical Intelligence</p>
        </div>

        {/* Admin PIN */}
        {!showAdmin ? (
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex items-center gap-3 mb-10 max-w-md mx-auto">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
              <LockOutlined className="text-indigo-600 text-sm" />
            </div>
            <Input.Password
              prefix={<LockOutlined className="text-gray-300 mr-1" />}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter PIN"
              className="h-10 rounded-xl border-gray-100 bg-gray-50/50 font-bold text-xs flex-1"
              onPressEnter={handlePinSubmit}
              size="small"
            />
            <Button
              type="primary"
              onClick={handlePinSubmit}
              className="h-10 px-5 bg-indigo-600 hover:bg-indigo-700 border-none rounded-xl text-[9px] font-black tracking-widest shadow-md shadow-indigo-100 uppercase shrink-0"
            >
              Unlock
            </Button>
          </div>
        ) : (
          <div className="space-y-10 animate-in fade-in duration-700">
            <div className="flex justify-center">
              <Button
                type="text"
                icon={<EyeInvisibleOutlined className="text-xs" />}
                onClick={() => setShowAdmin(false)}
                className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] hover:text-red-500 transition-all flex items-center gap-2"
              >
                DECRYPT FINANCIALS / LOCK LAYER
              </Button>
            </div>

            {/* Performance Summary Matrix */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {[
                {
                  label: "Net Margin",
                  val: `₹${summary.profit.toLocaleString()}`,
                  icon: <DollarOutlined />,
                  sub: `${summary.marginPercent}% yield`,
                  color: "bg-green-600 shadow-green-100",
                  bg: "bg-green-50/30"
                },
                {
                  label: "Settlements",
                  val: `₹${summary.totalPaymentIn.toLocaleString()}`,
                  icon: <ArrowDownOutlined />,
                  sub: "Inward Liquidity",
                  color: "bg-indigo-600 shadow-indigo-100",
                  bg: "bg-indigo-50/30"
                },
                {
                  label: "Disbursements",
                  val: `₹${summary.totalPaymentOut.toLocaleString()}`,
                  icon: <ArrowUpOutlined />,
                  sub: "Outward Flow",
                  color: "bg-orange-600 shadow-orange-100",
                  bg: "bg-orange-50/30"
                },
                {
                  label: "Gross Billed",
                  val: `₹${summary.totalBillAmount.toLocaleString()}`,
                  icon: <FileTextOutlined />,
                  sub: "Ledger Volume",
                  color: "bg-blue-600 shadow-blue-100",
                  bg: "bg-blue-50/30"
                },
                {
                  label: "Peak Load",
                  val: summary.peakHour,
                  icon: <ClockCircleOutlined />,
                  sub: "High Traffic Node",
                  color: "bg-violet-600 shadow-violet-100",
                  bg: "bg-violet-50/30"
                }
              ].map((m, i) => (
                <div key={i} className={`p-8 rounded-[32px] shadow-sm border border-gray-100/50 relative overflow-hidden group hover:border-gray-200 hover:shadow-md transition-all duration-500 ${m.bg}`}>
                  <div className={`w-12 h-12 rounded-2xl ${m.color.split(' ')[0]} text-white flex items-center justify-center mb-6 shadow-xl ${m.color.split(' ')[1]} group-hover:scale-110 transition-transform duration-500`}>
                    {m.icon}
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">{m.label}</p>
                  <p className="text-2xl font-black text-gray-800 tracking-tighter mb-2">
                    {m.val === "N/A" ? <span className="text-gray-300">N/A</span> : m.val}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-gray-300" />
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{m.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters for Bills */}
        {activeTab === "bills" && (
          <div className="bg-white rounded-[32px] shadow-sm p-6 sm:p-8 mb-8 flex flex-col lg:flex-row gap-6 lg:items-end border border-gray-100 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex flex-col flex-1 min-w-0">
              <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2 ml-1">Registry Search</label>
              <Input.Search
                placeholder="Find customer or bill ID"
                value={billSearch}
                onChange={(e) => setBillSearch(e.target.value)}
                className="h-12 rounded-xl"
                allowClear
              />
            </div>

            <div className="flex flex-col flex-1 min-w-0">
              <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2 ml-1">Value Range (₹)</label>
              <div className="flex gap-2">
                <InputNumber
                  min={0}
                  value={billAmountRange[0] === 0 ? undefined : billAmountRange[0]}
                  onChange={(v) => setBillAmountRange([v || 0, billAmountRange[1]])}
                  placeholder="Min"
                  className="h-12 rounded-xl flex-1"
                />
                <InputNumber
                  min={0}
                  value={billAmountRange[1] === Infinity ? undefined : billAmountRange[1]}
                  onChange={(v) => setBillAmountRange([billAmountRange[0], v || Infinity])}
                  placeholder="Max"
                  className="h-12 rounded-xl flex-1"
                />
              </div>
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2 ml-1">Report Span</label>
              <div className="flex gap-2">
                <RangePicker
                  className="h-12 flex-1 rounded-xl border-gray-100"
                  value={dateRange}
                  onChange={(range) => setDateRange(range as [dayjs.Dayjs | null, dayjs.Dayjs | null])}
                  allowClear={false}
                />
                <Button
                  type="primary"
                  onClick={fetchReport}
                  loading={loading}
                  className="h-12 px-5 bg-indigo-600 hover:bg-indigo-700 border-none rounded-xl text-[9px] font-black tracking-widest shadow-md shadow-indigo-100 uppercase shrink-0"
                >
                  Fetch
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Filters for Transactions */}
        {activeTab === "transactions" && (
          <div className="bg-white rounded-[32px] shadow-sm p-6 sm:p-8 mb-8 flex flex-col lg:flex-row gap-6 lg:items-end border border-gray-100 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex flex-col flex-1 min-w-0">
              <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2 ml-1">Ledger Search</label>
              <Input.Search
                placeholder="Find name or transaction id"
                value={transactionSearch}
                onChange={(e) => setTransactionSearch(e.target.value)}
                className="h-12 rounded-xl"
                allowClear
              />
            </div>
            {/* <div className="flex flex-col flex-1 min-w-0">
              <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2 ml-1">Registry Intent</label>
              <Select
                value={transactionFilterType}
                onChange={setTransactionFilterType}
                className="h-12 w-full premium-select"
                options={[
                  { value: "all", label: "All Logic Intents" },
                  { value: "Payment", label: "Payment" },
                  { value: "Refund", label: "Refund" },
                  { value: "Purchase", label: "Purchase" },
                ]}
              />
            </div> */}
            <div className="flex flex-col flex-1 min-w-0">
              <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2 ml-1">Capital Bounds (₹)</label>
              <div className="flex gap-2">
                <InputNumber
                  min={0}
                  value={transactionAmountRange[0] === 0 ? undefined : transactionAmountRange[0]}
                  onChange={(v) => setTransactionAmountRange([v || 0, transactionAmountRange[1]])}
                  placeholder="Min"
                  className="h-12 rounded-xl flex-1"
                />
                <InputNumber
                  min={0}
                  value={transactionAmountRange[1] === Infinity ? undefined : transactionAmountRange[1]}
                  onChange={(v) => setTransactionAmountRange([transactionAmountRange[0], v || Infinity])}
                  placeholder="Max"
                  className="h-12 rounded-xl flex-1"
                />
              </div>
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2 ml-1">Report Span</label>
              <div className="flex gap-2">
                <RangePicker
                  className="h-12 flex-1 rounded-xl border-gray-100"
                  value={dateRange}
                  onChange={(range) => setDateRange(range as [dayjs.Dayjs | null, dayjs.Dayjs | null])}
                  allowClear={false}
                />
                <Button
                  type="primary"
                  onClick={fetchReport}
                  loading={loading}
                  className="h-12 px-5 bg-indigo-600 hover:bg-indigo-700 border-none rounded-xl text-[9px] font-black tracking-widest shadow-md shadow-indigo-100 uppercase shrink-0"
                >
                  Fetch
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Filters for Requests */}
        {activeTab === "requests" && (
          <div className="bg-white rounded-[32px] shadow-sm p-6 sm:p-8 mb-8 flex flex-col lg:flex-row gap-6 lg:items-end border border-gray-100 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex flex-col flex-1 min-w-0">
              <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2 ml-1">Asset Logic Search</label>
              <Input.Search
                placeholder="Product or operator name"
                value={requestSearch}
                onChange={(e) => setRequestSearch(e.target.value)}
                className="h-12 rounded-xl"
                allowClear
              />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2 ml-1">Validation State</label>
              <Select
                value={requestFilterType}
                onChange={setRequestFilterType}
                className="h-12 w-full premium-select"
                options={[
                  { value: "all", label: "All Validation States" },
                  { value: "Approved", label: "Approved" },
                  { value: "Rejected", label: "Rejected" },
                  { value: "Pending", label: "Pending" },
                ]}
              />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2 ml-1">Report Span</label>
              <div className="flex gap-2">
                <RangePicker
                  className="h-12 flex-1 rounded-xl border-gray-100"
                  value={dateRange}
                  onChange={(range) => setDateRange(range as [dayjs.Dayjs | null, dayjs.Dayjs | null])}
                  allowClear={false}
                />
                <Button
                  type="primary"
                  onClick={fetchReport}
                  loading={loading}
                  className="h-12 px-5 bg-indigo-600 hover:bg-indigo-700 border-none rounded-xl text-[9px] font-black tracking-widest shadow-md shadow-indigo-100 uppercase shrink-0"
                >
                  Fetch
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden mb-12">
          <div className="p-4 sm:p-6 bg-gray-50/30 border-b border-gray-50">
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              className="premium-tabs"
              items={[
                { key: "bills", label: "Bills" },
                { key: "transactions", label: "Transaction " },
                { key: "payment", label: "Payments" },
                { key: "requests", label: "Inventory History" }
              ]}
            />
          </div>

          <div className="p-0 sm:p-4">
            {activeTab === "bills" && (
              <Table
                columns={billColumns}
                dataSource={filteredBills || []}
                loading={loading}
                rowKey="billId"
                scroll={{ x: 1000 }}
                className="modern-table no-border-table"
                pagination={{ pageSize: 12, showSizeChanger: false }}
              />
            )}
            {activeTab === "transactions" && (
              <Table
                columns={transactionColumns}
                dataSource={filteredTransactions.filter((trans: any) => trans.paymentIn === true) || []}
                loading={loading}
                rowKey="transId"
                scroll={{ x: 1000 }}
                className="modern-table no-border-table"
                pagination={{ pageSize: 12, showSizeChanger: false }}
              />
            )}
            {activeTab === "payment" && (
              <Table
                columns={paymentColumns}
                dataSource={filteredTransactions?.filter((t: any) => t.paymentIn === false) || []}
                loading={loading}
                rowKey="transId"
                scroll={{ x: 1000 }}
                className="modern-table no-border-table"
                pagination={{ pageSize: 12, showSizeChanger: false }}
              />
            )}
            {activeTab === "requests" && (
              <Table
                columns={requestColumns}
                dataSource={filteredRequests || []}
                loading={loading}
                rowKey="key"
                scroll={{ x: 1000 }}
                className="modern-table no-border-table"
                rowClassName={(record) => (record.rejected ? "opacity-60 grayscale" : "")}
                pagination={{ pageSize: 15 }}
              />
            )}
          </div>
        </div>

      </div>
      <style>{`
        .premium-tabs .ant-tabs-nav { margin: 0 !important; }
        .premium-tabs .ant-tabs-nav::before { display: none !important; }
        .premium-tabs .ant-tabs-tab { 
          padding: 1.25rem 2rem !important; 
          border-radius: 20px !important;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
          margin: 0 4px !important;
        }
        .premium-tabs .ant-tabs-tab-active { background: #fff !important; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.05) !important; }
        .premium-tabs .ant-tabs-tab-btn { font-weight: 900 !important; text-transform: uppercase !important; letter-spacing: 0.1em !important; font-size: 10px !important; color: #94a3b8 !important; }
        .premium-tabs .ant-tabs-tab-active .ant-tabs-tab-btn { color: #4f46e5 !important; }
        .premium-tabs .ant-tabs-ink-bar { display: none !important; }

        .premium-select .ant-select-selector {
          height: 48px !important;
          border-radius: 12px !important;
          border-color: #f1f5f9 !important;
          display: flex !important;
          align-items: center !important;
          font-weight: 900 !important;
          font-size: 10px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
        }

        .no-border-table .ant-table { background: transparent !important; }
        .no-border-table .ant-table-thead > tr > th { 
          background: transparent !important; 
          border-bottom: 2px solid #f8fafc !important;
          padding: 1.5rem 1rem !important;
        }
        .no-border-table .ant-table-tbody > tr > td { 
          border-bottom: 1px solid #f8fafc !important;
          padding: 1.25rem 1rem !important;
        }
        .no-border-table .ant-table-row:hover > td { background: #fdfdfd !important; }
      `}</style>
    </main>
  );
};

export default DailyReportPage;
