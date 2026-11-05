import React, { useEffect, useState } from "react";
import { Modal, Spin, Table, Tag, Typography, Pagination } from "antd";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import dayjs from "dayjs";
import apiCaller from "../utils/apiCaller";
import { RiseOutlined, FallOutlined, HistoryOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface IPriceHistoryItem {
  _id: string;
  product: string;
  changedAt: string;
  changedBy: {
    _id: string;
    name: string;
    username: string;
  };
  source: "MANUAL_EDIT" | "SUPPLIER_PURCHASE";
  supplier?: {
    _id: string;
    name: string;
  };
  previousCostPrice: number;
  newCostPrice: number;
  previousRetailPrice: number;
  newRetailPrice: number;
  previousWholesalePrice: number;
  newWholesalePrice: number;
  previousSuperWholesalePrice: number;
  newSuperWholesalePrice: number;
}

interface PriceHistoryModalProps {
  productId: string | null;
  productName?: string;
  open: boolean;
  onClose: () => void;
}

const PriceHistoryModal: React.FC<PriceHistoryModalProps> = ({
  productId,
  productName,
  open,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<IPriceHistoryItem[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [total, setTotal] = useState(0);

  // Reset to page 1 when modal is opened or product changes
  useEffect(() => {
    if (open) {
      setPage(1);
    }
  }, [open, productId]);

  useEffect(() => {
    if (!open || !productId) {
      setHistory([]);
      setTotal(0);
      return;
    }

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await apiCaller.get(`/products/${productId}/price-history`, {
          params: { page, limit: pageSize },
        });
        if (res.data?.success && res.data?.data?.priceHistories) {
          setHistory(res.data.data.priceHistories);
          setTotal(res.data.data.total || 0);
        }
      } catch (err) {
        console.error("Error fetching price history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [open, productId, page, pageSize]);

  // Prepare chart data (reverse chronological to chronological for chart left-to-right)
  const chartData = [...history].reverse().map((h) => ({
    date: dayjs(h.changedAt).format("DD MMM, HH:mm"),
    costPrice: h.newCostPrice,
    retailPrice: h.newRetailPrice,
    wholesalePrice: h.newWholesalePrice,
    superWholesalePrice: h.newSuperWholesalePrice,
    source: h.source,
    supplier: h.supplier?.name || "Manual Update",
  }));

  const renderPriceChange = (oldVal: number, newVal: number) => {
    if (oldVal === newVal) {
      return <span className="font-mono text-gray-700">₹{newVal}</span>;
    }
    const isUp = newVal > oldVal;
    return (
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-gray-400 line-through text-xs">
          ₹{oldVal}
        </span>
        <span className="text-gray-300 font-mono">→</span>
        <span
          className={`font-mono font-black ${isUp ? "text-emerald-600" : "text-rose-600"}`}
        >
          ₹{newVal}
        </span>
        {isUp ? (
          <RiseOutlined className="text-emerald-500 text-xs" />
        ) : (
          <FallOutlined className="text-rose-500 text-xs" />
        )}
      </div>
    );
  };

  const columns = [
    {
      title: "Date & Time",
      dataIndex: "changedAt",
      key: "changedAt",
      render: (val: string) => (
        <div>
          <div className="font-bold text-gray-800 text-xs">
            {dayjs(val).format("DD MMM YYYY")}
          </div>
          <div className="text-[10px] text-gray-400 font-mono">
            {dayjs(val).format("hh:mm A")}
          </div>
        </div>
      ),
    },
    {
      title: "Source",
      key: "source",
      render: (_: any, record: IPriceHistoryItem) => (
        <div>
          <Tag
            color={record.source === "SUPPLIER_PURCHASE" ? "blue" : "purple"}
            className="text-[10px] font-black uppercase rounded-lg border-0 m-0"
          >
            {record.source === "SUPPLIER_PURCHASE"
              ? "Supplier Entry"
              : "Manual Edit"}
          </Tag>
          {record.supplier && (
            <div className="text-[10px] font-bold text-gray-600 mt-1 truncate max-w-[120px]">
              {record.supplier.name}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Cost Price (CP)",
      key: "costPrice",
      render: (_: any, record: IPriceHistoryItem) =>
        renderPriceChange(record.previousCostPrice, record.newCostPrice),
    },
    {
      title: "Retail Price",
      key: "retailPrice",
      render: (_: any, record: IPriceHistoryItem) =>
        renderPriceChange(record.previousRetailPrice, record.newRetailPrice),
    },
    {
      title: "Wholesale",
      key: "wholesalePrice",
      render: (_: any, record: IPriceHistoryItem) =>
        renderPriceChange(
          record.previousWholesalePrice,
          record.newWholesalePrice,
        ),
    },
    {
      title: "Super Wholesale",
      key: "superWholesalePrice",
      render: (_: any, record: IPriceHistoryItem) =>
        renderPriceChange(
          record.previousSuperWholesalePrice,
          record.newSuperWholesalePrice,
        ),
    },
    {
      title: "Updated By",
      key: "changedBy",
      render: (_: any, record: IPriceHistoryItem) => (
        <span className="text-xs font-medium text-gray-600">
          {record.changedBy?.name || "System"}
        </span>
      ),
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={1000}
      centered
      title={
        <div className="flex items-center gap-3 py-2 border-b border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <HistoryOutlined className="text-lg" />
          </div>
          <div>
            <h2 className="text-lg font-black text-gray-800 tracking-tight m-0">
              Price Fluctuation History
            </h2>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider m-0">
              {productName || "Product Price History"}
            </p>
          </div>
        </div>
      }
    >
      <Spin spinning={loading}>
        <div className="py-4">
          {chartData.length > 0 ? (
            <>
              {/* Chart section */}
              <div className="bg-gray-50/70 p-5 rounded-3xl border border-gray-100 mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 m-0">
                      Price Trend Timeline
                    </h3>
                    <span className="text-[10px] font-bold text-gray-400">
                      Showing {history.length} of {total} records (Page {page} of {Math.ceil(total / pageSize) || 1})
                    </span>
                  </div>
                  {total > pageSize && (
                    <Pagination
                      size="small"
                      current={page}
                      pageSize={pageSize}
                      total={total}
                      showSizeChanger={false}
                      onChange={(p) => setPage(p)}
                    />
                  )}
                </div>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#e2e8f0"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                        tickFormatter={(v) => `₹${v.toFixed(2)}`}
                        domain={([dataMin, dataMax]: [number, number]) => {
                          const range = dataMax - dataMin;
                          const padding = Math.max(
                            range * 0.2,
                            dataMax * 0.005,
                          );

                          return [
                            Math.max(0, dataMin - padding),
                            dataMax + padding,
                          ];
                        }}
                        allowDataOverflow={false}
                      />{" "}
                      <ChartTooltip
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          borderRadius: "16px",
                          border: "1px solid #e2e8f0",
                          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                      <Legend
                        verticalAlign="top"
                        height={36}
                        formatter={(val) => (
                          <span className="text-xs font-bold text-gray-700">
                            {val}
                          </span>
                        )}
                      />
                      <Line
                        type="monotone"
                        dataKey="costPrice"
                        name="Cost Price (CP)"
                        stroke="#6366f1"
                        strokeWidth={2.5}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="retailPrice"
                        name="Retail Price"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        dot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="wholesalePrice"
                        name="Wholesale Price"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="superWholesalePrice"
                        name="Super Wholesale"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Table section */}
              <div className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <Table
                  columns={columns}
                  dataSource={history}
                  rowKey="_id"
                  loading={loading}
                  pagination={{
                    current: page,
                    pageSize,
                    total,
                    showSizeChanger: true,
                    pageSizeOptions: ["10", "15", "25", "50"],
                    onChange: (p, ps) => {
                      setPage(p);
                      if (ps !== pageSize) setPageSize(ps);
                    },
                    size: "small",
                  }}
                  size="middle"
                />
              </div>
            </>
          ) : (
            <div className="py-20 text-center flex flex-col items-center justify-center grayscale opacity-60">
              <HistoryOutlined className="text-4xl text-gray-300 mb-3" />
              <p className="font-bold text-gray-500 m-0">
                No price fluctuation recorded yet
              </p>
              <Text type="secondary" className="text-xs">
                Price changes from supplier purchases and manual edits will
                appear here.
              </Text>
            </div>
          )}
        </div>
      </Spin>
    </Modal>
  );
};

export default PriceHistoryModal;
