import { Table, Button, Radio, Select, Input, InputRef } from "antd";
import {
  DeleteOutlined,
  PlusOutlined,
  CalculatorOutlined,
  SoundOutlined,
} from "@ant-design/icons";
import useCurrentBillStore, {
  PurchasedProduct,
} from "../store/currentBill.store";
import { ColumnType } from "antd/es/table";
import { useEffect, useRef, useMemo, useState } from "react";
import { formatIndianNumber } from "../utils/index";
import WeightCalculatorModal from "./WeightCalculatorModal";
import BillPrint from "./BillPrint";
import { useReactToPrint } from "react-to-print";
import toast from "react-hot-toast";
import apiCaller from "../utils/apiCaller";
import useUserStore from "../store/user.store";
import useBillStore from "../store/bill.store";
import useTransactionStore from "../store/transaction.store";
import useTabsStore from "../store/tabs.store";

const BillingBody = () => {
  const {
    bills,
    currentBillingId,
    removeProductFromBill,
    updateProductPrice,
    updateProductQuantities,
    removeBill,
    setCurrentBillingId,
  } = useCurrentBillStore();
  const { removeTabAndBill } = useTabsStore();
  const { billingId } = useBillStore();
  const { transactionId } = useTransactionStore();

  const paymentInputRef = useRef<InputRef>(null);
  const [selectedProduct, setSelectedProduct] =
    useState<PurchasedProduct | null>(null);
  const [showPrint, setShowPrint] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [tableHeight, setTableHeight] = useState(400);
  const [delayMs, setDelayMs] = useState(2000); // Default 2 seconds
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [printBillData, setPrintBillData] = useState(null);

  const handlePrint = useReactToPrint({
    contentRef: contentRef as React.RefObject<HTMLDivElement>,
    // onAfterPrint: () => {
    //   setShowPrint(false);
    //   removeTabAndBill(
    //     currentBillingId.toString(),
    //     bills,
    //     removeBill,
    //     setCurrentBillingId
    //   );
    // },
  });

  const handlePrintClick = () => {
    setShowPrint(true);
    setTimeout(() => {
      handlePrint();
    }, 100);
  };

  const handleClosePrint = () => {
    setShowPrint(false);
    setPrintBillData(null); // <-- clear after printing
  };

  const currentBill = useMemo(() => {
    return bills.find((bill) => bill.id === currentBillingId.toString());
  }, [bills, currentBillingId]);

  const dataSource = [...(currentBill?.purchased || [])].reverse();

  useEffect(() => {
    if (!tableContainerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Ant Design small table header is approx 40px
        setTableHeight(entry.contentRect.height - 42);
      }
    });

    resizeObserver.observe(tableContainerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "F9") {
        e.preventDefault();
        paymentInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  const handleRemove = (productId: string) => {
    removeProductFromBill(productId, currentBillingId);
  };

  const handlePriceChange = (
    record: PurchasedProduct,
    priceType: "RETAIL" | "WHOLESALE" | "SUPERWHOLESALE"
  ) => {
    updateProductPrice(record.id, currentBillingId, priceType);
  };

  const handleQuantityChange = (
    productId: string,
    field: "piece" | "packet" | "box" | "discount",
    value: string
  ) => {
    const numericValue = value === "" ? 0 : parseInt(value, 10);
    if (!isNaN(numericValue)) {
      updateProductQuantities(productId, currentBillingId.toString(), {
        [field]: numericValue,
      });
    }
  };

  const handleCalculatorClick = (record: PurchasedProduct) => {
    setSelectedProduct(record);
  };

  const handleCloseCalculator = () => {
    setSelectedProduct(null);
  };

  const { user } = useUserStore((state) => state);

  const handleCreateBill = async () => {
    try {
      setIsCreating(true);
      if (!currentBill) {
        toast.error("No current bill found.");
        return;
      }
      if (!currentBill.customer) {
        toast.error("Please select the customer.");
        return;
      }
      for (const product of currentBill.purchased) {
        if (product.piece === 0 && product.packet === 0 && product.box === 0) {
          toast.error(
            `Please enter a quantity for the product ${product.name}`
          );
          throw new Error("Quantity cannot be zero.");
        }
        if (product.discount < 0) {
          toast.error("Discount cannot be negative.");
          throw new Error("Discount cannot be negative.");
        }
        if (product.total < 0) {
          toast.error("Total cannot be negative.");
          throw new Error("Total cannot be negative.");
        }
      }
      // API call
      let paymentValue = paymentInputRef.current?.input?.value;
      if (paymentValue === "" || paymentValue === undefined) paymentValue = "0";
      paymentValue = String(paymentValue);
      const response = await apiCaller.post("/bills", {
        customerId: currentBill.customer._id,
        billId: billingId,
        transactionId: transactionId,
        payment: paymentValue,
        paymentMode: paymentMode, // <-- use state here
        discount: currentBill.discount,
        createdBy: user?._id,
        products: currentBill.purchased,
      });
      if (response.data && response.data.success) {
        const billData = response.data.data.bill;
        console.log(billData, "this is the bill data");
        setPrintBillData(billData); // <-- store for printing
        toast.success("Bill created successfully!");
        setShowPrint(true); // Open print modal only after success
        // setTimeout(() => {
        //   handlePrint();
        // }, 100);
        setTimeout(() => {
          // setShowPrint(false);
        }, 2000);
      } else {
        toast.error(response.data?.message || "Failed to create bill.");
      }
    } catch (e: any) {
      if (e.response && e.response.data && e.response.data.message) {
        toast.error(e.response.data.message);
      } else if (e.message) {
        toast.error(e.message);
      } else {
        toast.error("Failed to create bill. Please try again.");
      }
      console.log(e, "this is the error");
    } finally {
      setIsCreating(false);
    }
  };

  const columns: ColumnType<PurchasedProduct>[] = [
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Item</span>,
      dataIndex: "name",
      key: "name",
      width: 180,
      render: (name: string, record: PurchasedProduct) => (
        <div className="flex items-center gap-2 group">
          <div className="flex flex-col">
            <span className="font-black text-gray-800 capitalize leading-tight">{name}</span>
            <span className="text-[10px] font-bold text-gray-400">Stock: {record.stock} {record.measuring}</span>
          </div>
          {record.measuring === "kg" && (
            <Button
              type="text"
              size="small"
              icon={<CalculatorOutlined />}
              onClick={() => handleCalculatorClick(record)}
              className="text-indigo-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-all"
            />
          )}
        </div>
      ),
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center block">Price (₹)</span>,
      dataIndex: "price",
      key: "price",
      width: 80,
      align: "center",
      render: (price: number) => <span className="font-black text-gray-700">{price}</span>,
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center block">Type</span>,
      key: "priceType",
      align: "center",
      width: 140,
      render: (_: unknown, record: PurchasedProduct) => (
        <Radio.Group
          size="small"
          value={record.type}
          onChange={(e) => handlePriceChange(record, e.target.value)}
          className="pos-type-selector"
        >
          <Radio.Button value="RETAIL">RT</Radio.Button>
          <Radio.Button value="WHOLESALE">WS</Radio.Button>
          <Radio.Button value="SUPERWHOLESALE">SW</Radio.Button>
        </Radio.Group>
      ),
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center block">PCS</span>,
      dataIndex: "piece",
      key: "piece",
      align: "center",
      width: 70,
      render: (_: unknown, record: PurchasedProduct) => (
        <Input
          size="small"
          className="text-center font-black h-8 rounded-lg border-gray-100 bg-gray-50/50"
          value={record.piece}
          onChange={(e) => handleQuantityChange(record.id, "piece", e.target.value)}
        />
      ),
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center block">PKT</span>,
      dataIndex: "packet",
      key: "packet",
      align: "center",
      width: 70,
      render: (_: unknown, record: PurchasedProduct) => (
        <Input
          size="small"
          className="text-center font-black h-8 rounded-lg border-gray-100 bg-gray-50/50"
          value={record.packet}
          onChange={(e) => handleQuantityChange(record.id, "packet", e.target.value)}
        />
      ),
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center block">BOX</span>,
      dataIndex: "box",
      key: "box",
      align: "center",
      width: 70,
      render: (_: unknown, record: PurchasedProduct) => (
        <Input
          size="small"
          className="text-center font-black h-8 rounded-lg border-gray-100 bg-gray-50/50"
          value={record.box}
          onChange={(e) => handleQuantityChange(record.id, "box", e.target.value)}
        />
      ),
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center block">Disc.</span>,
      dataIndex: "discount",
      key: "discount",
      align: "center",
      width: 80,
      render: (_: unknown, record: PurchasedProduct) => (
        <Input
          size="small"
          className="text-center font-black h-8 rounded-lg border-red-50 text-red-600 bg-red-50/20"
          value={record.discount}
          onChange={(e) => handleQuantityChange(record.id, "discount", e.target.value)}
        />
      ),
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-right block pr-4">Total</span>,
      dataIndex: "total",
      key: "total",
      align: "right",
      width: 100,
      render: (_: unknown, record: PurchasedProduct) => (
        <span className="font-black text-indigo-600 pr-4">
          ₹{formatIndianNumber(record.total)}
        </span>
      ),
    },
    {
      title: "",
      key: "action",
      width: 50,
      align: "center",
      render: (_: unknown, record: PurchasedProduct) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined className="text-xs" />}
          onClick={() => handleRemove(record.id)}
          className="hover:bg-red-50 flex items-center justify-center mx-auto"
        />
      ),
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
      {/* Table Section - High Density Scroll */}
      <div ref={tableContainerRef} className="flex-1 overflow-hidden flex flex-col">
        <Table
          bordered
          pagination={false}
          dataSource={dataSource}
          columns={columns}
          rowKey="id"
          size="small"
          scroll={{ x: "max-content", y: tableHeight }}
          className="pos-table no-border-table flex-1"
        />
      </div>

      {/* Optimized Summary Footer - Compressed for Efficiency */}
      <div className="bg-gray-50/50 p-4 sm:px-8 sm:py-6 border-t border-gray-100">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-center">
          {/* Quick Controls - 3 Cols */}
          <div className="xl:col-span-3 flex items-center gap-4">
            <div className="flex-1 min-w-[100px]">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1 block">Vocal Latency</label>
              <Select
                size="middle"
                value={delayMs}
                className="w-full rounded-xl h-10"
                onChange={setDelayMs}
                options={[
                  { value: 2000, label: "2.0s" },
                  { value: 3000, label: "3.0s" },
                  { value: 5000, label: "5.0s" }
                ]}
              />
            </div>
            <Button
              type="default"
              size="middle"
              icon={<SoundOutlined className="text-xs" />}
              disabled={!currentBill || !currentBill.purchased.length}
              onClick={async () => {
                if (!currentBill || !currentBill.purchased.length) return;
                const synth = window.speechSynthesis;
                synth.cancel();
                const voices = synth.getVoices();
                const indianVoice = voices.find(v => v.lang === "en-IN" || v.name.toLowerCase().includes("india")) || voices.find(v => v.lang.startsWith("en"));
                const products = currentBill.purchased;
                let idx = 0;
                function speakNext() {
                  if (idx >= products.length) return;
                  const product = products[idx];
                  const text = `${product.name}, quantity: ${product.piece + product.packet * product.packetQuantity + product.box * product.boxQuantity}`;
                  const utter = new window.SpeechSynthesisUtterance(text);
                  if (indianVoice) utter.voice = indianVoice;
                  utter.rate = 0.8;
                  utter.onend = () => setTimeout(() => { idx++; speakNext(); }, delayMs);
                  synth.speak(utter);
                }
                speakNext();
              }}
              className="h-10 px-4 rounded-xl bg-white border-gray-200 flex items-center justify-center font-black text-[9px] uppercase tracking-widest hover:border-indigo-400 hover:text-indigo-600 transition-all flex-none"
            >
              Vocal
            </Button>
          </div>

          {/* Pricing Grid - 6 Cols */}
          <div className="xl:col-span-6 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="border-r border-gray-50 pr-2">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Base</span>
                <span className="text-sm font-black text-gray-800">₹{formatIndianNumber(currentBill?.total || 0)}</span>
              </div>
              <div className="border-r border-gray-50 pr-2">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Arrears</span>
                <span className="text-sm font-black text-red-500">₹{formatIndianNumber(currentBill?.customer?.outstanding || 0)}</span>
              </div>
              <div className="border-r border-gray-50 pr-2">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Disc.</span>
                <span className="text-sm font-black text-green-500">-₹{formatIndianNumber(currentBill?.discount || 0)}</span>
              </div>
              <div className="pl-2">
                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block mb-1">Grand Total</span>
                <span className="text-xl font-black text-indigo-600 tracking-tighter">
                  ₹{currentBill && formatIndianNumber(currentBill.total + (currentBill?.customer?.outstanding || 0) - currentBill.discount)}
                </span>
              </div>
            </div>
          </div>

          {/* Checkout Logic - 3 Cols */}
          <div className="xl:col-span-3 flex flex-row items-end gap-3">
            <div className="flex-1 group">
              <div className="relative">
                <Input
                  ref={paymentInputRef}
                  size="large"
                  placeholder="Payment"
                  prefix={<span className="text-indigo-400 font-black mr-1">₹</span>}
                  className="h-12 rounded-xl text-lg font-black border-2 border-transparent bg-white shadow-sm transition-all group-hover:border-indigo-100 focus:border-indigo-600 pr-10"
                />
                <div className="absolute right-0 top-0 bottom-0 flex items-center">
                  <Select
                    value={paymentMode}
                    className="h-full w-20 custom-compact-select"
                    bordered={false}
                    options={[
                      { value: "CASH", label: <span className="text-[8px] font-black uppercase">Cash</span> },
                      { value: "ONLINE", label: <span className="text-[8px] font-black uppercase">Digi</span> },
                    ]}
                    onChange={setPaymentMode}
                  />
                </div>
              </div>
            </div>
            <Button
              type="primary"
              onClick={handleCreateBill}
              loading={isCreating}
              className="h-12 px-6 bg-indigo-600 border-none text-[10px] font-black rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 uppercase tracking-widest flex-none"
            >
              Finish
            </Button>
          </div>
        </div>
      </div>

      <style>{`
        .pos-table .ant-table-body {
          scrollbar-width: thin;
          scrollbar-color: #e2e8f0 transparent;
        }
        .pos-table .ant-table-body::-webkit-scrollbar {
          width: 4px;
        }
        .pos-table .ant-table-body::-webkit-scrollbar-thumb {
          background-color: #e2e8f0;
          border-radius: 10px;
        }
        .custom-compact-select .ant-select-selector {
          padding: 0 8px !important;
          background: transparent !important;
        }
        .pos-table .ant-table-cell {
          padding: 8px 12px !important;
        }
        .custom-radio-group .ant-radio-button-wrapper {
          border-radius: 6px !important;
          margin: 0 1px !important;
          border: 1px solid #f1f5f9 !important;
          height: 24px !important;
          line-height: 22px !important;
          padding: 0 8px !important;
        }
      `}</style>

      {selectedProduct && (
        <WeightCalculatorModal
          isOpen={!!selectedProduct}
          onClose={handleCloseCalculator}
          product={selectedProduct}
          billId={currentBillingId.toString()}
        />
      )}

      {showPrint && (
        <BillPrint
          onClose={handleClosePrint}
          handlePrint={handlePrintClick}
          contentRef={contentRef}
          payment={paymentInputRef.current?.input?.value || "0"}
          printBillData={printBillData}
        />
      )}
    </div>
  );
};

export default BillingBody;
