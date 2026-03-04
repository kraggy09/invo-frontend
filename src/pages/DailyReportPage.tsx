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
import useBillStore from "../store/bill.store";
import useTransactionStore from "../store/transaction.store";
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
  const [reportData, setReportData] = useState<{ bills: any[]; transactions: any[] } | null>(null);
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
  const [billFilterType, setBillFilterType] = useState("all");
  const [transactionFilterType, setTransactionFilterType] = useState("all");
  const [requestFilterType, setRequestFilterType] = useState("all");
  const [billAmountRange, setBillAmountRange] = useState<[number, number]>([
    0,
    Infinity,
  ]);
  const [billDateRange, setBillDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null]
  >([null, null]);
  const [transactionAmountRange, setTransactionAmountRange] = useState<
    [number, number]
  >([0, Infinity]);
  const [transactionDateRange, setTransactionDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null]
  >([null, null]);
  const [requestDateRange, setRequestDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null]
  >([null, null]);

  // Zustand stores
  const billsFromStore = useBillStore((state) => state.bills);
  const transactionsFromStore = useTransactionStore(
    (state) => state.transactions
  );
  const { requests: inventoryRequests } = useInventoryRequestStore();

  // Use fetched report data if in historical mode, otherwise use live store
  const bills = reportData ? reportData.bills : billsFromStore;
  const transactions = reportData ? reportData.transactions : transactionsFromStore;

  // Map bills and transactions to correct table shape
  const mappedBills = bills
    .map((bill: any) => ({
      key: bill._id || bill.id,
      date: bill.createdAt ? dayjs(bill.createdAt).format("DD/MM/YYYY") : "",
      time: bill.createdAt ? dayjs(bill.createdAt).format("hh:mm:ss A") : "",
      billId: bill.id || bill._id,
      billAmount: bill.total,
      outstanding: bill.outstanding || 0,
      payment: bill.payment || 0,
      total: bill.total,
      customerName: bill.customer?.name || bill.customer || "",
      createdByName: bill.createdBy?.name || "System",
      status: bill.status || (bill.outstanding > 0 ? "Pending" : "Paid"),
    }))
    .reverse();

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
      taken: t.taken,
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
    if (billFilterType !== "all" && bill.status !== billFilterType)
      return false;
    if (
      billSearch &&
      !(
        (bill.customerName &&
          bill.customerName.toLowerCase().includes(billSearch.toLowerCase())) ||
        (bill.billId && bill.billId.toString().includes(billSearch))
      )
    )
      return false;
    if (billDateRange[0] && billDateRange[1]) {
      const billDate = dayjs(bill.date, "DD/MM/YYYY");
      if (!billDate.isBetween(billDateRange[0], billDateRange[1], null, "[]"))
        return false;
    }
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
    if (transactionDateRange[0] && transactionDateRange[1]) {
      const tDate = dayjs(t.date, "DD/MM/YYYY");
      if (
        !tDate.isBetween(
          transactionDateRange[0],
          transactionDateRange[1],
          null,
          "[]"
        )
      )
        return false;
    }
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
    if (requestDateRange[0] && requestDateRange[1]) {
      const requestDate = dayjs(request.dateTime, "DD/MM/YYYY HH:mm");
      if (
        !requestDate.isBetween(
          requestDateRange[0],
          requestDateRange[1],
          null,
          "[]"
        )
      )
        return false;
    }
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
        if (t.taken) {
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
      const [billsRes, transactionsRes] = await Promise.all([
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
      ]);

      setReportData({
        bills: billsRes.data.data?.bills ?? billsRes.data.bills ?? [],
        transactions:
          transactionsRes.data.data?.transactions ??
          transactionsRes.data.transactions ??
          [],
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

  // Table columns for each tab
  const billColumns = [
    { title: "Date", dataIndex: "date", key: "date" },
    { title: "Time", dataIndex: "time", key: "time" },
    { title: "Bill Id", dataIndex: "billId", key: "billId" },
    { title: "Customer", dataIndex: "customerName", key: "customerName" },
    {
      title: "Created By",
      dataIndex: "createdBy",
      key: "createdBy",
      render: (_: any, record: any) => record.createdByName || "N/A",
    },
    { title: "Bill Amount", dataIndex: "billAmount", key: "billAmount" },
    { title: "Outstanding", dataIndex: "outstanding", key: "outstanding" },
    { title: "Payment", dataIndex: "payment", key: "payment" },
    { title: "Total", dataIndex: "total", key: "total" },
    {
      title: "View",
      dataIndex: "view",
      key: "view",
      render: (_: any, record: any) => (
        <Button
          icon={<EyeOutlined />}
          onClick={() => {
            console.log(record, "record");
            navigate(`/bills/${record.key}`, {
              state: { from: "daily-report" },
            });
          }}
        />
      ),
    },
  ];

  const transactionColumns = [
    { title: "Date", dataIndex: "date", key: "date" },
    { title: "Time", dataIndex: "time", key: "time" },
    { title: "Trans. Id", dataIndex: "transId", key: "transId" },
    { title: "Purpose", dataIndex: "purpose", key: "purpose" },
    { title: "Name", dataIndex: "name", key: "name" },
    {
      title: "Previous Outstanding",
      dataIndex: "previousOutstanding",
      key: "previousOutstanding",
    },
    { title: "Payment", dataIndex: "payment", key: "payment" },
    {
      title: "New Outstanding",
      dataIndex: "newOutstanding",
      key: "newOutstanding",
    },
    {
      title: "View",
      dataIndex: "view",
      key: "view",
      render: (_: any, record: any) => (
        <Button
          icon={<EyeOutlined />}
          onClick={() =>
            navigate(`/transactions/${record.key}`, {
              state: { from: "daily-report" },
            })
          }
        />
      ),
    },
  ];

  const paymentColumns = [
    { title: "Date", dataIndex: "date", key: "date" },
    { title: "Time", dataIndex: "time", key: "time" },
    { title: "Trans. Id", dataIndex: "transId", key: "transId" },
    { title: "Party Name", dataIndex: "partyName", key: "partyName" },
    { title: "Payment ₹", dataIndex: "payment", key: "payment" },
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
                  {dayjs(record.rawData.approvedAt).format("DD/MM HH:mm")}
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
    <div className="p-4 min-h-screen bg-gray-50">
      <h1 className="text-center font-bold mb-4 text-2xl">
        Get the complete details here
      </h1>

      {/* Admin PIN */}
      {!showAdmin ? (
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mb-6">
          <Input.Password
            prefix={<LockOutlined className="text-gray-400" />}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter admin PIN"
            className="w-full sm:w-64 max-w-xs"
            onPressEnter={handlePinSubmit}
          />
          <Button type="primary" onClick={handlePinSubmit} className="w-full sm:w-auto">
            Authorize View
          </Button>
        </div>
      ) : (
        <div className="flex justify-center mb-6">
          <Button
            type="primary"
            danger
            ghost
            icon={<EyeInvisibleOutlined />}
            onClick={() => setShowAdmin(false)}
          >
            Hide Admin Summary
          </Button>
        </div>
      )}

      {/* Date Range Picker and Fetch */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mb-8">
        <RangePicker
          className="w-full sm:w-80"
          value={dateRange}
          onChange={(range) =>
            setDateRange(range as [dayjs.Dayjs | null, dayjs.Dayjs | null])
          }
          allowClear={false}
        />
        <Button
          type="primary"
          onClick={fetchReport}
          loading={loading}
          className="w-full sm:w-auto min-w-[120px]"
        >
          {loading ? "Fetching..." : "Fetch Reports"}
        </Button>
      </div>

      {/* Summary Cards */}
      {showAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card
            className="rounded-xl overflow-hidden shadow-sm border-0"
            style={{ background: "linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)" }}
            bodyStyle={{ padding: "16px 20px" }}
          >
            <Statistic
              title={<span className="text-gray-600 font-medium">Profit</span>}
              value={summary.profit}
              prefix={<DollarOutlined className="text-green-600" />}
              valueStyle={{ color: "#389e0d", fontWeight: 800, fontSize: "24px" }}
            />
          </Card>
          <Card
            className="rounded-xl overflow-hidden shadow-sm border-0"
            style={{ background: "linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)" }}
            bodyStyle={{ padding: "16px 20px" }}
          >
            <Statistic
              title={<span className="text-gray-600 font-medium">Payment In</span>}
              value={summary.totalPaymentIn}
              prefix={<ArrowDownOutlined className="text-blue-600" />}
              valueStyle={{ color: "#1890ff", fontWeight: 800, fontSize: "24px" }}
            />
          </Card>
          <Card
            className="rounded-xl overflow-hidden shadow-sm border-0"
            style={{ background: "linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%)" }}
            bodyStyle={{ padding: "16px 20px" }}
          >
            <Statistic
              title={<span className="text-gray-600 font-medium">Payment Out</span>}
              value={summary.totalPaymentOut}
              prefix={<ArrowUpOutlined className="text-orange-600" />}
              valueStyle={{ color: "#fa8c16", fontWeight: 800, fontSize: "24px" }}
            />
          </Card>
          <Card
            className="rounded-xl overflow-hidden shadow-sm border-0"
            style={{ background: "linear-gradient(135deg, #f0f5ff 0%, #d6e4ff 100%)" }}
            bodyStyle={{ padding: "16px 20px" }}
          >
            <Statistic
              title={<span className="text-gray-600 font-medium">Total Billed</span>}
              value={summary.totalBillAmount}
              prefix={<FileTextOutlined className="text-indigo-600" />}
              valueStyle={{ color: "#2f54eb", fontWeight: 800, fontSize: "24px" }}
            />
          </Card>
          <Card
            className="rounded-xl overflow-hidden shadow-sm border-0"
            style={{ background: "linear-gradient(135deg, #fff2f0 0%, #ffccc7 100%)" }}
            bodyStyle={{ padding: "16px 20px" }}
          >
            <div className="flex flex-col">
              <span className="text-gray-500 font-medium text-xs uppercase tracking-wider mb-1">Peak Business Hour</span>
              <div className="flex items-center gap-2">
                <ClockCircleOutlined className="text-red-500 text-xl" />
                <span className="text-red-700 font-black text-lg">{summary.peakHour}</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters for Bills */}
      {activeTab === "bills" && (
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6 flex flex-wrap gap-4 items-end border border-gray-100">
          <div className="flex flex-col w-full sm:w-auto min-w-[200px]">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-tighter mb-1.5 ml-1">Search Records</label>
            <Input.Search
              placeholder="Customer or Bill ID"
              value={billSearch}
              onChange={(e) => setBillSearch(e.target.value)}
              className="w-full"
              allowClear
            />
          </div>
          <div className="flex flex-col w-full sm:w-auto min-w-[120px]">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-tighter mb-1.5 ml-1">Status Filter</label>
            <Select
              className="w-full"
              value={billFilterType}
              onChange={setBillFilterType}
              options={[
                { value: "all", label: "All Status" },
                { value: "Paid", label: "Paid" },
                { value: "Pending", label: "Pending" },
                { value: "Partial", label: "Partial" },
              ]}
            />
          </div>
          <div className="flex flex-col w-full sm:w-auto min-w-[220px]">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-tighter mb-1.5 ml-1">Report Date Range</label>
            <RangePicker
              className="w-full"
              value={billDateRange}
              onChange={(range) =>
                setBillDateRange(
                  range as [dayjs.Dayjs | null, dayjs.Dayjs | null]
                )
              }
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">Amount</label>
            <div className="flex gap-2">
              <InputNumber
                min={0}
                value={
                  billAmountRange[0] === 0 ? undefined : billAmountRange[0]
                }
                onChange={(v) =>
                  setBillAmountRange([v || 0, billAmountRange[1]])
                }
                placeholder="Min"
                style={{ width: 80 }}
              />
              <InputNumber
                min={0}
                value={
                  billAmountRange[1] === Infinity
                    ? undefined
                    : billAmountRange[1]
                }
                onChange={(v) =>
                  setBillAmountRange([billAmountRange[0], v || Infinity])
                }
                placeholder="Max"
                style={{ width: 80 }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Filters for Transactions */}
      {activeTab === "transactions" && (
        <div className="bg-white rounded-lg shadow-sm p-4 mb-2 flex flex-wrap gap-4 items-end border border-gray-200">
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">Search</label>
            <Input.Search
              placeholder="Name or transaction id"
              value={transactionSearch}
              onChange={(e) => setTransactionSearch(e.target.value)}
              style={{ width: 200 }}
              allowClear
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">Purpose</label>
            <Select
              value={transactionFilterType}
              onChange={setTransactionFilterType}
              style={{ width: 140 }}
              options={[
                { value: "all", label: "All Purposes" },
                { value: "Payment", label: "Payment" },
                { value: "Refund", label: "Refund" },
                { value: "Purchase", label: "Purchase" },
              ]}
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">Date Range</label>
            <RangePicker
              value={transactionDateRange}
              onChange={(range) =>
                setTransactionDateRange(
                  range as [dayjs.Dayjs | null, dayjs.Dayjs | null]
                )
              }
              style={{ width: 220 }}
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">Amount</label>
            <div className="flex gap-2">
              <InputNumber
                min={0}
                value={
                  transactionAmountRange[0] === 0
                    ? undefined
                    : transactionAmountRange[0]
                }
                onChange={(v) =>
                  setTransactionAmountRange([v || 0, transactionAmountRange[1]])
                }
                placeholder="Min"
                style={{ width: 80 }}
              />
              <InputNumber
                min={0}
                value={
                  transactionAmountRange[1] === Infinity
                    ? undefined
                    : transactionAmountRange[1]
                }
                onChange={(v) =>
                  setTransactionAmountRange([
                    transactionAmountRange[0],
                    v || Infinity,
                  ])
                }
                placeholder="Max"
                style={{ width: 80 }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Filters for Requests */}
      {activeTab === "requests" && (
        <div className="bg-white rounded-lg shadow-sm p-4 mb-2 flex flex-wrap gap-4 items-end border border-gray-200">
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">Search</label>
            <Input.Search
              placeholder="Product or user name"
              value={requestSearch}
              onChange={(e) => setRequestSearch(e.target.value)}
              style={{ width: 200 }}
              allowClear
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">Status</label>
            <Select
              value={requestFilterType}
              onChange={setRequestFilterType}
              style={{ width: 120 }}
              options={[
                { value: "all", label: "All Status" },
                { value: "Approved", label: "Approved" },
                { value: "Rejected", label: "Rejected" },
                { value: "Pending", label: "Pending" },
              ]}
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">Date Range</label>
            <RangePicker
              value={requestDateRange}
              onChange={(range) =>
                setRequestDateRange(
                  range as [dayjs.Dayjs | null, dayjs.Dayjs | null]
                )
              }
              style={{ width: 220 }}
            />
          </div>
        </div>
      )}

      {/* Tabs for Bills, Transactions, Payments, Stock Updates */}
      <Tabs activeKey={activeTab} onChange={setActiveTab} className="mb-4">
        <Tabs.TabPane tab="Bills" key="bills">
          <Table
            columns={billColumns}
            dataSource={filteredBills || []}
            loading={loading}
            rowKey="billId"
            scroll={{ x: "max-content" }}
          />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Transactions" key="transactions">
          <Table
            columns={transactionColumns}
            dataSource={filteredTransactions || []}
            loading={loading}
            rowKey="transId"
            scroll={{ x: "max-content" }}
          />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Payment" key="payment">
          <Table
            columns={paymentColumns}
            dataSource={transactions?.filter((t: any) => t.taken) || []}
            loading={loading}
            rowKey="transId"
            scroll={{ x: "max-content" }}
          />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Inventory Requests" key="requests">
          <Table
            columns={requestColumns}
            dataSource={filteredRequests || []}
            loading={loading}
            rowKey="key"
            scroll={{ x: "max-content" }}
            rowClassName={(record) => (record.rejected ? "opacity-60" : "")}
            size="small"
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} requests`,
            }}
          />
        </Tabs.TabPane>
      </Tabs>
      {loading && <Spin className="block mx-auto" />}
    </div>
  );
};

export default DailyReportPage;
