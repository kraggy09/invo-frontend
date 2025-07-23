import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Table, Spin, Button, message } from "antd";
import { PrinterOutlined } from "@ant-design/icons";
import BillPrint from "../billing/BillPrint";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import apiCaller from "../utils/apiCaller";
import dayjs from "dayjs";

const SingleBillPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;
  const [loading, setLoading] = useState(false);
  const [bill, setBill] = useState<any>(null);

  useEffect(() => {
    const fetchBill = async () => {
      setLoading(true);
      try {
        const res = await apiCaller.get(`/bills/single-bill/${id}`);
        setBill(res.data?.data?.bill);
      } catch (error) {
        message.error("Failed to fetch bill details");
      } finally {
        setLoading(false);
      }
    };
    fetchBill();
  }, [id]);

  const columns = [
    {
      title: "Product Name",
      dataIndex: ["product", "name"],
      key: "name",
      render: (_: any, record: any) =>
        record.product ? record.product.name : "Deleted Product",
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      align: "center" as const,
    },
    {
      title: "Price",
      key: "price",
      align: "center" as const,
      render: (_: any, record: any) =>
        record.quantity ? (record.total / record.quantity).toFixed(2) : "-",
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      align: "center" as const,
    },
    {
      title: "Discount",
      dataIndex: "discount",
      key: "discount",
      align: "center" as const,
    },
  ];

  // Prepare BillPrint data
  const printContentRef = useRef<HTMLDivElement | null>(null);

  const handlePrint = useReactToPrint({
    contentRef: printContentRef as React.RefObject<HTMLDivElement>,
  });

  // Map API bill data to BillPrint expected structure
  const printBillData = bill
    ? {
        bill: {
          ...bill,
          purchased: bill.items
            ? bill.items.map((item: any) => ({
                ...(item.productSnapshot || {}),
                ...(item.product || {}),
                ...item,
              }))
            : [],
        },
        updatedCustomer: bill.customer,
      }
    : undefined;

  return (
    <div className="p-6 min-h-screen bg-white">
      {/* Back Button */}
      <button
        onClick={() => {
          if (from === "daily-report") navigate("/daily-report");
          else if (from === "bill") navigate("/bills");
          else navigate("/bills");
        }}
        className="mb-6 flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors text-sm font-medium focus:outline-none"
        style={{
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
        }}
      >
        <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
          <path
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12.5 16L7.5 10L12.5 4"
          />
        </svg>
        {from === "daily-report" ? "Back to Daily Report" : "Back to Bills"}
      </button>
      {loading ? (
        <Spin size="large" className="block mx-auto mt-32" />
      ) : bill ? (
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Bill Details
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-gray-500 text-sm">
                <span>
                  Bill ID:{" "}
                  <b className="text-gray-800">
                    {bill?.id ? `B-${bill.id}` : "Old Bill"}
                  </b>
                </span>
                <span className="hidden sm:inline">·</span>
                <span>
                  {bill?.createdAt
                    ? dayjs(bill.createdAt).format("DD/MM/YYYY hh:mm A")
                    : "-"}
                </span>
                <span className="hidden sm:inline">·</span>
                <span
                  className={
                    bill?.status === "Paid" ||
                    bill?.total - bill?.payment - bill?.discount <= 0
                      ? "text-green-600 font-semibold"
                      : "text-yellow-600 font-semibold"
                  }
                >
                  {bill?.status ||
                    (bill?.total - bill?.payment - bill?.discount > 0
                      ? "Pending"
                      : "Paid")}
                </span>
              </div>
            </div>
            <Button
              icon={<PrinterOutlined />}
              onClick={() => handlePrint()}
              type="default"
              size="middle"
              className="font-medium border-gray-300"
              style={{
                borderRadius: 8,
                boxShadow: "none",
                background: "#fafbfc",
              }}
            >
              Print
            </Button>
          </div>

          {/* Customer & Bill Info */}
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-8">
              <div>
                <div className="text-xs text-gray-500 mb-1 font-medium">
                  Customer Name
                </div>
                <div className="text-base text-gray-900 font-semibold">
                  {bill?.customer?.name}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1 font-medium">
                  Mobile
                </div>
                <div className="text-base text-gray-900">
                  {bill?.customer?.phone}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1 font-medium">
                  Current Outstanding
                </div>
                <div className="text-base text-red-600 font-bold">
                  ₹{bill?.customer?.outstanding}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1 font-medium">
                  Created By
                </div>
                <div className="text-base text-gray-900">{bill?.createdBy}</div>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col items-center">
              <div className="text-xs text-gray-500 mb-1">Total</div>
              <div className="text-lg font-bold text-green-700">
                ₹{bill?.total}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col items-center">
              <div className="text-xs text-gray-500 mb-1">Discount</div>
              <div className="text-lg font-bold text-yellow-600">
                ₹{bill?.discount}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col items-center">
              <div className="text-xs text-gray-500 mb-1">Payment</div>
              <div className="text-lg font-bold text-blue-700">
                ₹{bill?.payment}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col items-center">
              <div className="text-xs text-gray-500 mb-1">Remaining</div>
              <div className="text-lg font-bold text-red-600">
                ₹{bill ? bill.total - bill.payment - bill.discount : 0}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-gray-50 rounded-xl border border-gray-100 p-0 overflow-hidden">
            <Table
              dataSource={bill?.items || []}
              columns={columns}
              rowKey={(item: any, idx?: number) =>
                item && item._id
                  ? item._id
                  : typeof idx === "number"
                  ? idx
                  : `row-${Math.random()}`
              }
              pagination={false}
              bordered={false}
              size="middle"
              summary={(pageData: readonly any[]) => {
                const total = pageData.reduce(
                  (sum: number, item: any) => sum + (item.total || 0),
                  0
                );
                return (
                  <Table.Summary.Row style={{ background: "#f5f7fa" }}>
                    <Table.Summary.Cell index={0} colSpan={3} align="right">
                      <b>Total</b>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1}>
                      <b>₹{total}</b>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} />
                  </Table.Summary.Row>
                );
              }}
              style={{ borderRadius: 12, overflow: "hidden" }}
              rowClassName={() => "hover:bg-gray-100 transition-all"}
              components={{
                header: {
                  cell: (props: any) => (
                    <th
                      {...props}
                      style={{
                        ...props.style,
                        background: "#f5f7fa",
                        fontWeight: 600,
                        fontSize: 15,
                        color: "#22223b",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    />
                  ),
                },
              }}
            />
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-400 mt-32 text-base">
          No bill found.
        </div>
      )}
      {/* Hidden BillPrint for printing only */}
      {bill && (
        <div style={{ display: "none" }}>
          <BillPrint
            onClose={() => {}}
            contentRef={printContentRef}
            handlePrint={() => {}}
            payment={bill?.payment?.toString() || "0"}
            printBillData={printBillData}
          />
        </div>
      )}
    </div>
  );
};

export default SingleBillPage;
