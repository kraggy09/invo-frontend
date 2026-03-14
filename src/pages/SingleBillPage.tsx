import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Table, Spin, Button } from "antd";
import { message } from "../utils/antdStatic";
import { PrinterOutlined, ArrowLeftOutlined, DollarOutlined, FileTextOutlined, ReloadOutlined } from "@ant-design/icons";
import BillPrint from "../billing/BillPrint";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import apiCaller from "../utils/apiCaller";
import dayjs from "dayjs";
import ReturnProductModal from "../components/ReturnProductModal";

const SingleBillPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;
  const [loading, setLoading] = useState(false);
  const [bill, setBill] = useState<any>(null);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

  const billProductTotal = useMemo(() => {
    return bill?.productsTotal ?? bill?.items?.reduce((sum: number, item: any) => sum + (item.total || 0), 0) ?? 0;
  }, [bill])

  useEffect(() => {
    // Always fetch from API — the store holds lightweight bill objects whose
    // items.product field is an unpopulated ObjectId string. BillPrint needs the
    // fully-populated item with productSnapshot (price, mrp, piece, packet…).
    // Only the API's getBillDetails provides this via .populate('items.product').
    const fetchBill = async () => {
      setLoading(true);
      try {
        const res = await apiCaller.get(`/bills/${id}`);
        console.log(res);

        setBill(res.data?.data?.bill);
      } catch (error: any) {
        message.error(error?.response?.data?.message || error?.response?.data?.msg || "Failed to fetch bill details");
      } finally {
        setLoading(false);
      }
    };
    fetchBill();
  }, [id]);

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
            Unit Price: ₹{record.quantity ? (record.total / record.quantity).toFixed(2) : "-"}
          </span>
        </div>
      ),
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center block">Quantity</span>,
      dataIndex: "quantity",
      key: "quantity",
      align: "center" as const,
      render: (q: number) => <span className="font-black text-gray-700">{q}</span>,
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center block">Sub-Total</span>,
      dataIndex: "total",
      key: "total",
      align: "center" as const,
      render: (t: number, record: any) => (
        record.discount > 0 ? (
          <div className="flex flex-col items-center leading-tight">
            <span className="text-[10px] font-bold text-gray-400 line-through mb-0.5">₹{(t + record.discount).toLocaleString()}</span>
            <span className="font-black text-indigo-600">₹{t.toLocaleString()}</span>
          </div>
        ) : (
          <span className="font-black text-indigo-600">₹{t.toLocaleString()}</span>
        )
      ),
    },
    {
      title: <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest text-center block">Markdown</span>,
      dataIndex: "discount",
      key: "discount",
      align: "center" as const,
      render: (d: number) => <span className="font-black text-orange-600">₹{d.toLocaleString()}</span>,
    },
  ];

  // Prepare BillPrint data
  const printContentRef = useRef<HTMLDivElement | null>(null);

  const handlePrint = useReactToPrint({
    contentRef: printContentRef as React.RefObject<HTMLDivElement>,
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
      <div className="w-full max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <Button
            type="text"
            icon={<ArrowLeftOutlined className="text-[10px]" />}
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 font-black text-gray-400 hover:text-indigo-600 transition-all p-0 h-auto uppercase tracking-widest text-[10px]"
          >
            Terminal Root / Previous
          </Button>
          <div className="text-right hidden sm:block">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] block">Invoice Record</span>
            <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest text-right">
              ID: {bill?.id ? `B-${bill.id}` : bill?._id?.slice(-8).toUpperCase()}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="py-40 text-center"><Spin size="large" /></div>
        ) : bill ? (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Card */}
            <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden group">
              <div className="bg-indigo-600 p-8 sm:p-12 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative overflow-hidden">
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500 rounded-full mb-4 border border-indigo-400/30">
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <span className="text-[8px] font-black uppercase tracking-widest">Authorized Transaction</span>
                  </div>
                  <h1 className="text-3xl font-black tracking-tighter leading-tight mb-2">Invoice Details</h1>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[10px] font-black text-indigo-100/70 border border-indigo-100/20 px-3 py-1 rounded-xl bg-white/5 backdrop-blur-sm">
                      {dayjs(bill.createdAt).format("DD MMM YYYY · hh:mm A")}
                    </span>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-xl border flex items-center gap-2 ${billProductTotal > bill?.payment ? "bg-green-500/20 border-green-500/30 text-green-100" : "bg-orange-500/20 border-orange-500/30 text-orange-100"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${billProductTotal > bill?.payment ? "bg-orange-300" : billProductTotal === bill?.payment ? "bg-yellow-300" : "bg-green-300"}`} />
                      {billProductTotal > bill?.payment ? "Less Paid" : billProductTotal === bill?.payment ? "Exact Paid" : "More Paid"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 relative z-10 w-full md:w-auto mt-4 md:mt-0">
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={() => setIsReturnModalOpen(true)}
                    className="h-14 px-8 bg-orange-500 hover:bg-orange-400 border-none text-white font-black rounded-2xl transition-all flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase shadow-lg shadow-orange-500/20"
                  >
                    RETURN ITEMS
                  </Button>
                  <Button
                    icon={<PrinterOutlined />}
                    onClick={() => handlePrint()}
                    className="h-14 px-10 bg-white/10 hover:bg-white/20 border-white/20 text-white font-black rounded-2xl backdrop-blur-md transition-all flex items-center gap-2 text-[10px] tracking-widest uppercase"
                  >
                    PRINT TRANSACTION
                  </Button>
                </div>

                <div className="absolute top-0 right-0 p-20 opacity-5 group-hover:scale-110 transition-transform duration-1000 rotate-12">
                  <PrinterOutlined style={{ fontSize: 280 }} />
                </div>
              </div>

              <div className="p-8 sm:p-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                <div>
                  <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest block mb-2">Client Identification</span>
                  <p className="text-base font-black text-gray-800 tracking-tight capitalize">{bill?.customer?.name}</p>
                </div>
                <div>
                  <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest block mb-1.5">Direct Communication</span>
                  <p className="text-base font-bold text-gray-600">{bill?.customer?.phone}</p>
                </div>
                <div>
                  <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest block mb-1.5">Current Liability</span>
                  <p className="text-base font-black text-red-500 tracking-tight">₹{Number(bill?.customer?.outstanding || 0).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest block mb-1.5">System Operator</span>
                  <p className="text-base font-black text-indigo-600 tracking-tight">{bill?.createdBy?.name ?? "Terminal Admin"}</p>
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm text-center group hover:border-gray-200 transition-all flex flex-col justify-center">
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest block mb-1">Sub-Total</span>
                <div className="flex items-baseline justify-center gap-1.5">
                  <span className="text-2xl font-black text-gray-800 tracking-tighter">₹{Number(billProductTotal).toLocaleString()}</span>
                  <span className="text-sm font-black text-orange-400" title="Previous Outstanding / Adjustments">
                    {bill?.total - billProductTotal >= 0 ? "+" : ""}
                    {Number(bill?.total - billProductTotal).toLocaleString()}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-center gap-1.5 border-t border-gray-50 pt-1">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Overall Total:</span>
                  <span className="text-xs font-black text-indigo-600">₹{Number(bill?.total).toLocaleString()}</span>
                </div>
              </div>
              <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm text-center group hover:border-orange-100 transition-all">
                <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest block mb-1">Rebate</span>
                <span className="text-2xl font-black text-orange-600 tracking-tighter">₹{Number(bill?.discount).toLocaleString()}</span>
              </div>
              <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm text-center group hover:border-green-100 transition-all">
                <span className="text-[10px] font-black text-green-400 uppercase tracking-widest block mb-1">Payment</span>
                <span className="text-2xl font-black text-green-600 tracking-tighter">₹{Number(bill?.payment).toLocaleString()}</span>
              </div>
              <div className="bg-indigo-600 rounded-[32px] p-6 shadow-xl shadow-indigo-100 text-center relative overflow-hidden group">
                <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest block mb-1 relative z-10">Net Balance</span>
                <span className="text-2xl font-black text-white tracking-tighter relative z-10">
                  ₹{Number(bill.total - bill.payment - bill.discount).toLocaleString()}
                </span>
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-700">
                  <DollarOutlined style={{ fontSize: 40 }} />
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Inventory Manifest</h3>
                <span className="px-4 py-1.5 bg-gray-50 rounded-xl text-[10px] font-black text-gray-400 border border-gray-100 uppercase tracking-widest">{bill?.items?.length} Validated Entries</span>
              </div>
              <Table
                dataSource={bill?.items || []}
                columns={columns}
                rowKey="_id"
                pagination={false}
                scroll={{ x: 800 }}
                className="modern-table no-border-table"
                summary={(pageData: readonly any[]) => {
                  const total = pageData.reduce((sum: number, item: any) => sum + (item.total || 0), 0);
                  return (
                    <Table.Summary.Row className="bg-gray-50/50">
                      <Table.Summary.Cell index={0} colSpan={2} className="py-8">
                        <div className="text-right pr-6 text-[10px] font-black text-gray-300 uppercase tracking-widest">Statement Total Identification</div>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} colSpan={2} className="py-8">
                        <div className="text-3xl font-black text-indigo-600 tracking-tighter">₹{total.toLocaleString()}</div>
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
            <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Transaction Registry Not Found</p>
          </div>
        )}

        {/* Hidden BillPrint for printing only */}
        {bill && (
          <div style={{ display: "none" }}>
            <BillPrint
              onClose={() => { }}
              contentRef={printContentRef}
              handlePrint={() => { }}
              payment={bill?.payment?.toString() || "0"}
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

export default SingleBillPage;
