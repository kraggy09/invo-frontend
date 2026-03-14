import { useState, useEffect, useMemo } from "react";
import {
  Table,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Button,
} from "antd";
import { message } from "../utils/antdStatic";
import {
  EyeOutlined,
  DollarOutlined,
  FileTextOutlined,
  ArrowDownOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
dayjs.extend(isBetween);
import apiCaller from "../utils/apiCaller";
import { formatIndianNumber } from "../utils";
import useBillStore, { Bill, BillCustomer, BillCreatedBy } from "../store/bill.store";
import { useNavigate } from "react-router-dom";

const { RangePicker } = DatePicker;

const BillPage = () => {
  const billsFromStore = useBillStore((state) => state.bills);
  const navigate = useNavigate();

  // Local state
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [amountRange, setAmountRange] = useState<[number, number]>([0, Infinity]);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([dayjs(), dayjs()]);
  const [historicalBills, setHistoricalBills] = useState<Bill[] | null>(null);

  // If dateRange is today, use live store; otherwise use fetched data
  const isToday =
    dateRange[0]?.isSame(dayjs(), "day") &&
    dateRange[1]?.isSame(dayjs(), "day");

  const effectiveBills = isToday ? billsFromStore : (historicalBills ?? []);

  // Fetch from API only when date range changes to non-today
  useEffect(() => {
    if (isToday) {
      setHistoricalBills(null);
      return;
    }
    if (!dateRange[0] || !dateRange[1]) return;

    setLoading(true);
    apiCaller
      .get("/bills", {
        params: {
          startDate: dateRange[0].startOf("day").toISOString(),
          endDate: dateRange[1].endOf("day").toISOString(),
        },
      })
      .then((res) => {
        setHistoricalBills(res.data.data?.bills ?? res.data.bills ?? []);
        message.success("Bills loaded for selected range");
      })
      .catch(() => {
        message.error("Failed to fetch bills");
        setHistoricalBills([]);
      })
      .finally(() => setLoading(false));
  }, [dateRange, isToday]);

  const getOutstanding = (b: Bill) => b.total - b.payment;

  const getStatus = (b: Bill): string => {
    const outstanding = getOutstanding(b);
    if (outstanding <= 0) return "Paid";
    if (b.payment > 0) return "Partial";
    return "Pending";
  };

  const filteredBills = useMemo(() => {
    let data = [...effectiveBills];

    if (status !== "all") {
      data = data.filter((b) => getStatus(b) === status);
    }

    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        (b) =>
          b.customer?.name?.toLowerCase().includes(q) ||
          b.id?.toString().includes(search) ||
          b.customer?.phone?.toString().includes(search)
      );
    }

    if (amountRange[0] > 0) data = data.filter((b) => b.total >= amountRange[0]);
    if (amountRange[1] < Infinity) data = data.filter((b) => b.total <= amountRange[1]);

    return data.reverse();
  }, [effectiveBills, status, search, amountRange]);

  // Summary stats
  const summary = useMemo(() => ({
    totalBills: filteredBills.length,
    totalAmount: filteredBills.reduce((s, b) => s + (b.total || 0), 0),
    totalPayment: filteredBills.reduce((s, b) => s + (b.payment || 0), 0),
    outstanding: filteredBills.reduce((s, b) => s + getOutstanding(b), 0),
  }), [filteredBills]);

  // Table columns
  const columns = [
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Date</span>,
      dataIndex: "createdAt",
      key: "date",
      render: (d: string) => (
        <div className="flex flex-col">
          <span className="font-bold text-gray-800">{dayjs(d).format("DD/MM/YYYY")}</span>
          <span className="text-[10px] font-bold text-gray-400">{dayjs(d).format("hh:mm A")}</span>
        </div>
      ),
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ID</span>,
      dataIndex: "id",
      key: "id",
      render: (id: number) => <span className="font-mono font-black text-indigo-500 text-xs">#{id}</span>,
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
      dataIndex: "productsTotal",
      key: "productsTotal",
      align: "right" as const,
      render: (t: number, record: Bill) => {
        const pTotal = t ?? record?.items?.reduce((sum: number, item: any) => sum + (item.total || 0), 0) ?? 0;
        return <span className="font-black text-gray-800">₹{formatIndianNumber(pTotal)}</span>;
      },
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Total</span>,
      dataIndex: "total",
      key: "total",
      align: "right" as const,
      render: (t: number) => <span className="font-black text-gray-800">₹{formatIndianNumber(t)}</span>,
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Payment</span>,
      dataIndex: "payment",
      key: "payment",
      align: "right" as const,
      render: (p: number) => <span className="font-black text-green-600">₹{formatIndianNumber(p)}</span>,
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Outstanding</span>,
      key: "outstanding",
      align: "right" as const,
      render: (_: unknown, record: Bill) => {
        const o = getOutstanding(record);
        return (
          <span className={`font-black ${o > 0 ? "text-orange-500" : "text-gray-300"}`}>
            ₹{formatIndianNumber(o)}
          </span>
        );
      },
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
      render: (_: unknown, record: Bill) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/bills/${record._id}`, { state: { from: "bill" } })}
          className="text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
        />
      ),
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-black text-gray-800 tracking-tighter leading-tight">
            Ledger Archives
          </h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">
            Authorized Revenue Documentation
            {!isToday && historicalBills && (
              <span className="ml-3 bg-orange-50 text-orange-500 px-2 py-0.5 rounded-md text-[8px] tracking-normal">
                HISTORICAL MODE
              </span>
            )}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            {
              label: "Total Registry",
              value: summary.totalBills.toString(),
              icon: <FileTextOutlined />,
              color: "bg-indigo-600 shadow-indigo-100",
              bg: "bg-indigo-50/30",
              accent: "text-indigo-400",
            },
            {
              label: "Gross Invoiced",
              value: `₹${formatIndianNumber(summary.totalAmount)}`,
              icon: <DollarOutlined />,
              color: "bg-emerald-600 shadow-emerald-100",
              bg: "bg-emerald-50/30",
              accent: "text-emerald-400",
            },
            {
              label: "Settled Funds",
              value: `₹${formatIndianNumber(summary.totalPayment)}`,
              icon: <ArrowDownOutlined />,
              color: "bg-blue-600 shadow-blue-100",
              bg: "bg-blue-50/30",
              accent: "text-blue-400",
            },
            {
              label: "Exposure",
              value: `₹${formatIndianNumber(summary.outstanding)}`,
              icon: <WarningOutlined />,
              color: "bg-orange-600 shadow-orange-100",
              bg: "bg-orange-50/30",
              accent: "text-orange-400",
            },
          ].map((card, i) => (
            <div
              key={i}
              className={`p-6 sm:p-8 rounded-[32px] shadow-sm border border-gray-100/50 relative overflow-hidden group hover:border-gray-200 hover:shadow-md transition-all duration-500 ${card.bg}`}
            >
              <div
                className={`w-11 h-11 rounded-2xl ${card.color.split(" ")[0]} text-white flex items-center justify-center mb-5 shadow-xl ${card.color.split(" ")[1]} group-hover:scale-110 transition-transform duration-500`}
              >
                {card.icon}
              </div>
              <p className={`text-[10px] font-black ${card.accent} uppercase tracking-[0.2em] mb-1`}>
                {card.label}
              </p>
              <p className="text-2xl font-black text-gray-800 tracking-tighter leading-none">
                {card.value}
              </p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-[32px] shadow-sm p-6 sm:p-8 mb-8 flex flex-col lg:flex-row gap-6 lg:items-end border border-gray-100">
          <div className="flex flex-col flex-1 min-w-0">
            <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2 ml-1">
              Search
            </label>
            <Input.Search
              placeholder="Customer name, bill ID, phone"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 rounded-xl"
              allowClear
            />
          </div>
          {/* <div className="flex flex-col flex-1 min-w-0">
            <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2 ml-1">
              Status
            </label>
            <Select
              className="h-12 w-full premium-select"
              value={status}
              onChange={setStatus}
              options={[
                { value: "all", label: "All" },
                { value: "Paid", label: "Paid" },
                { value: "Pending", label: "Pending" },
                { value: "Partial", label: "Partial" },
              ]}
            />
          </div> */}
          <div className="flex flex-col flex-1 min-w-0">
            <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2 ml-1">
              Amount Range (₹)
            </label>
            <div className="flex gap-2">
              <InputNumber
                min={0}
                value={amountRange[0] === 0 ? undefined : amountRange[0]}
                onChange={(v) => setAmountRange([v || 0, amountRange[1]])}
                placeholder="Min"
                className="h-12 rounded-xl flex-1"
              />
              <InputNumber
                min={0}
                value={amountRange[1] === Infinity ? undefined : amountRange[1]}
                onChange={(v) => setAmountRange([amountRange[0], v || Infinity])}
                placeholder="Max"
                className="h-12 rounded-xl flex-1"
              />
            </div>
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2 ml-1">
              Report Span
            </label>
            <div className="flex gap-2">
              <RangePicker
                className="h-12 flex-1 rounded-xl border-gray-100"
                value={dateRange}
                onChange={(range) =>
                  setDateRange(
                    (range as [dayjs.Dayjs | null, dayjs.Dayjs | null]) ?? [dayjs(), dayjs()]
                  )
                }
                allowClear={false}
              />
              {!isToday && (
                <Button
                  type="text"
                  onClick={() => setDateRange([dayjs(), dayjs()])}
                  className="h-12 px-4 rounded-xl text-[9px] font-black text-gray-400 hover:text-indigo-600 tracking-widest uppercase shrink-0"
                >
                  Today
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden mb-12">
          <Table
            columns={columns}
            dataSource={filteredBills}
            loading={loading}
            rowKey="_id"
            scroll={{ x: 1000 }}
            className="no-border-table"
            pagination={{
              pageSize: 15,
              showSizeChanger: false,
              className: "px-8 py-6",
              position: ["bottomCenter"],
            }}
          />
        </div>
      </div>

      <style>{`
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

export default BillPage;
