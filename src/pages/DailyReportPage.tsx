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
  Space,
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
  ClockCircleOutlined,
  InfoCircleOutlined,
  UndoOutlined,
  CloseOutlined,
  StockOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
dayjs.extend(isBetween);
import useBillStore from "../store/bill.store";
import useTransactionStore from "../store/transaction.store";
import { useNavigate } from "react-router-dom";
import { useInventoryRequestStore } from "../store/requests.store";

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
  const [reportData, setReportData] = useState<any>(mockReportData);
  const [showAdmin, setShowAdmin] = useState(false);
  const [pin, setPin] = useState("");
  const [summary, setSummary] = useState({
    profit: 0,
    totalPaymentIn: 0,
    totalPaymentOut: 0,
    totalBillAmount: 0,
    marginPercent: 0,
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

  // Simulate fetch
  const fetchReport = async () => {
    setLoading(true);
    setTimeout(() => {
      setReportData(mockReportData); // Replace with API call
      setLoading(false);
      message.success("Fetched daily report!");
    }, 1000);
  };

  // Use zustand store data until API data is loaded
  const bills =
    reportData !== mockReportData && reportData.bills.length > 0
      ? reportData.bills
      : billsFromStore;
  const transactions =
    reportData !== mockReportData && reportData.transactions.length > 0
      ? reportData.transactions
      : transactionsFromStore;

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
      status: bill.status || (bill.outstanding > 0 ? "Pending" : "Paid"),
    }))
    .reverse();

  const mappedTransactions = transactions
    .map((t: any) => ({
      key: t._id || t.id,
      date: t.createdAt ? dayjs(t.createdAt).format("DD/MM/YYYY") : "",
      time: t.createdAt ? dayjs(t.createdAt).format("hh:mm:ss A") : "",
      transId: t.id || t._id,
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
      stockChange: `${
        !request.approved ? request.oldStock : request.stockAtUpdate
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
            totalInvestment +=
              (item.quantity ?? 0) * (item.product?.costPrice ?? 0);
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
    setSummary({
      profit: Number(profit.toFixed(1)),
      totalPaymentIn: Number(totalPaymentIn.toFixed(1)),
      totalPaymentOut: Number(totalPaymentOut.toFixed(1)),
      totalBillAmount: Number(totalBillAmount.toFixed(1)),
      marginPercent: Number(marginPercent.toFixed(1)),
    });
  }, [bills, transactions]);

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
        <div className="flex justify-center items-center mb-4">
          <Input.Password
            prefix={<LockOutlined />}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter admin PIN"
            style={{ width: 200, marginRight: 8 }}
            onPressEnter={handlePinSubmit}
          />
          <Button type="primary" onClick={handlePinSubmit}>
            Check
          </Button>
        </div>
      ) : (
        <Button
          icon={<EyeInvisibleOutlined />}
          onClick={() => setShowAdmin(false)}
        />
      )}

      {/* Date Range Picker and Fetch */}
      <div className="flex justify-center gap-4 mb-4">
        <RangePicker
          value={dateRange}
          onChange={(range) =>
            setDateRange(range as [dayjs.Dayjs | null, dayjs.Dayjs | null])
          }
          allowClear={false}
        />
        <Button type="primary" onClick={fetchReport}>
          Get the bills
        </Button>
      </div>

      {/* Summary Cards */}
      {showAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-4">
          <Card
            style={{
              background: "#f6ffed",
              border: "1px solid #b7eb8f",
              boxShadow: "0 2px 8px rgba(34,197,94,0.06)",
            }}
          >
            <Statistic
              title="Profit"
              value={summary.profit}
              prefix={<DollarOutlined style={{ color: "#389e0d" }} />}
              valueStyle={{ color: "#389e0d", fontWeight: 700 }}
            />
          </Card>
          <Card
            style={{
              background: "#e6f7ff",
              border: "1px solid #91d5ff",
              boxShadow: "0 2px 8px rgba(24,144,255,0.06)",
            }}
          >
            <Statistic
              title="Total Payment In"
              value={summary.totalPaymentIn}
              prefix={<ArrowDownOutlined style={{ color: "#1890ff" }} />}
              valueStyle={{ color: "#1890ff", fontWeight: 700 }}
            />
          </Card>
          <Card
            style={{
              background: "#fff7e6",
              border: "1px solid #ffd591",
              boxShadow: "0 2px 8px rgba(255,140,0,0.06)",
            }}
          >
            <Statistic
              title="Total Payment Out"
              value={summary.totalPaymentOut}
              prefix={<ArrowUpOutlined style={{ color: "#fa8c16" }} />}
              valueStyle={{ color: "#fa8c16", fontWeight: 700 }}
            />
          </Card>
          <Card
            style={{
              background: "#f0f5ff",
              border: "1px solid #adc6ff",
              boxShadow: "0 2px 8px rgba(47,84,235,0.06)",
            }}
          >
            <Statistic
              title="Total Bill"
              value={summary.totalBillAmount}
              prefix={<ArrowUpOutlined style={{ color: "#2f54eb" }} />}
              valueStyle={{ color: "#2f54eb", fontWeight: 700 }}
            />
          </Card>
          <Card
            style={{
              background: "#fffbe6",
              border: "1px solid #ffe58f",
              boxShadow: "0 2px 8px rgba(250,219,20,0.06)",
            }}
          >
            <Statistic
              title="Margin %"
              value={summary.marginPercent}
              prefix={<PercentageOutlined style={{ color: "#faad14" }} />}
              valueStyle={{ color: "#faad14", fontWeight: 700 }}
            />
          </Card>
        </div>
      )}

      {/* Filters for Bills */}
      {activeTab === "bills" && (
        <div className="bg-white rounded-lg shadow-sm p-4 mb-2 flex flex-wrap gap-4 items-end border border-gray-200">
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">Search</label>
            <Input.Search
              placeholder="Customer name or bill id"
              value={billSearch}
              onChange={(e) => setBillSearch(e.target.value)}
              style={{ width: 200 }}
              allowClear
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">Status</label>
            <Select
              value={billFilterType}
              onChange={setBillFilterType}
              style={{ width: 120 }}
              options={[
                { value: "all", label: "All Status" },
                { value: "Paid", label: "Paid" },
                { value: "Pending", label: "Pending" },
                { value: "Partial", label: "Partial" },
              ]}
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">Date Range</label>
            <RangePicker
              value={billDateRange}
              onChange={(range) =>
                setBillDateRange(
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
