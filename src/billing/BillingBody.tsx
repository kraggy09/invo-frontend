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
      const response = await apiCaller.post("/bills/create-bill", {
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
      title: "Action",
      key: "action",
      align: "center",
      render: (_: unknown, record: PurchasedProduct) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemove(record.id)}
          tabIndex={-1}
        />
      ),
    },
    {
      title: "Stock",
      dataIndex: "stock",
      key: "stock",
      align: "center",
      render: (_: unknown, record: PurchasedProduct) => (
        <span className="text-gray-600 text-xs">
          {record.stock % 1 === 0
            ? record.stock
            : record.stock.toFixed(2) + " kg"}
        </span>
      ),
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      width: 200,
      align: "left",
      render: (name: string, record: PurchasedProduct) => (
        <div className="flex items-center gap-2">
          <p className="capitalize text-start">{name}</p>
          {record.measuring === "kg" && (
            <CalculatorOutlined
              className="text-blue-500 cursor-pointer hover:text-blue-600"
              onClick={() => handleCalculatorClick(record)}
            />
          )}
        </div>
      ),
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      align: "center",
    },
    {
      title: "Price Type",
      key: "priceType",
      align: "center",
      width: 150,
      render: (_: unknown, record: PurchasedProduct) => (
        <div tabIndex={-1}>
          <Radio.Group
            size="small"
            value={record.type}
            onChange={(e) => handlePriceChange(record, e.target.value)}
            buttonStyle="outline"
          >
            <Radio.Button value="RETAIL">RP</Radio.Button>
            <Radio.Button value="WHOLESALE">WP</Radio.Button>
            <Radio.Button value="SUPERWHOLESALE">SWP</Radio.Button>
          </Radio.Group>
        </div>
      ),
    },
    {
      title: "Piece",
      dataIndex: "piece",
      key: "piece",
      align: "center",
      render: (_: unknown, record: PurchasedProduct) => (
        <Input
          size="small"
          className="w-16 text-right"
          placeholder="0"
          style={{ paddingRight: "2px" }}
          value={record.piece}
          onChange={(e) =>
            handleQuantityChange(record.id, "piece", e.target.value)
          }
        />
      ),
    },
    {
      title: "Packet",
      dataIndex: "packet",
      key: "packet",
      align: "center",
      render: (_: unknown, record: PurchasedProduct) => (
        <Input
          size="small"
          className="w-16 text-right"
          placeholder="0"
          style={{ paddingRight: "2px" }}
          value={record.packet}
          onChange={(e) =>
            handleQuantityChange(record.id, "packet", e.target.value)
          }
        />
      ),
    },
    {
      title: "Box",
      dataIndex: "box",
      key: "box",
      align: "center",
      render: (_: unknown, record: PurchasedProduct) => (
        <Input
          size="small"
          className="w-16 text-right"
          placeholder="0"
          style={{ paddingRight: "2px" }}
          value={record.box}
          onChange={(e) =>
            handleQuantityChange(record.id, "box", e.target.value)
          }
        />
      ),
    },
    {
      title: "Discount",
      dataIndex: "discount",
      key: "discount",
      align: "center",
      render: (_: unknown, record: PurchasedProduct) => (
        <Input
          size="small"
          className="w-16 text-right"
          placeholder="0"
          prefix="₹"
          style={{ paddingRight: "2px" }}
          value={record.discount}
          onChange={(e) =>
            handleQuantityChange(record.id, "discount", e.target.value)
          }
        />
      ),
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      align: "center",
      render: (_: unknown, record: PurchasedProduct) => (
        <span className="font-semibold">
          {formatIndianNumber(record.total)}₹
        </span>
      ),
    },
  ];

  return (
    <div
      className="w-[98%] h-full mb-4 shadow-sm hover:shadow-md transition-shadow duration-200"
      // bodyStyle={{ padding: "16px 24px" }}
    >
      <div className="flex flex-col flex-1 h-full">
        <div className="h-[70%] flex  overflow-auto">
          <Table
            className="h-full"
            bordered
            pagination={false}
            dataSource={dataSource}
            columns={columns}
            rowKey="id"
            size="small"
            scroll={{ y: "calc(100vh - 450px)" }}
            tableLayout="fixed"
          />
        </div>

        <div className="h-[30%] mr-12 bg-white p-2">
          <div className="h-full flex flex-col justify-end">
            <div className="space-y-1 text-right max-w-[250px] ml-auto">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-xs">Total Bill</span>
                <span className="font-semibold text-gray-800 text-sm">
                  {formatIndianNumber(currentBill?.total || 0)}₹
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-xs">Outstanding</span>
                <span className="font-semibold text-gray-800 text-sm">
                  {formatIndianNumber(currentBill?.customer?.outstanding || 0)}₹
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-xs">Discount</span>
                <span className="font-semibold text-gray-800 text-sm">
                  {formatIndianNumber(currentBill?.discount || 0)}₹
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-gray-200 pt-1">
                <span className="text-gray-600 text-xs font-medium">Total</span>
                <span className="font-bold text-sm text-gray-900">
                  {currentBill &&
                    formatIndianNumber(
                      currentBill?.total +
                        (currentBill?.customer?.outstanding || 0) -
                        currentBill?.discount
                    )}
                  ₹
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <span className="text-gray-600 text-xs">Payment</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-gray-600 font-medium">
                    F9
                  </span>
                </div>
                <Input
                  ref={paymentInputRef}
                  size="small"
                  className="w-6 text-right h-6"
                  placeholder="0"
                  prefix="₹"
                  style={{
                    paddingRight: "2px",
                    textAlign: "right",
                    width: "90px",
                  }}
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-xs ">Payment Mode</span>
                <Select
                  size="small"
                  value={paymentMode}
                  className=" h-6"
                  options={[
                    { value: "CASH", label: "Cash" },
                    { value: "ONLINE", label: "Online" },
                  ]}
                  style={{ width: "100px" }}
                  onChange={setPaymentMode}
                />
              </div>
              <div className="flex justify-end mt-2 gap-2">
                <Select
                  size="small"
                  value={delayMs}
                  style={{ width: 80 }}
                  onChange={setDelayMs}
                  options={[
                    { value: 2000, label: "2 sec" },
                    { value: 3000, label: "3 sec" },
                    { value: 5000, label: "5 sec" },
                    { value: 10000, label: "10 sec" },
                  ]}
                />
                <Button
                  type="default"
                  icon={<SoundOutlined />}
                  className="bg-gray-100 hover:bg-gray-200"
                  disabled={!currentBill || !currentBill.purchased.length}
                  onClick={async () => {
                    if (!currentBill || !currentBill.purchased.length) return;
                    const synth = window.speechSynthesis;
                    synth.cancel(); // Cancel any ongoing speech
                    const voices = synth.getVoices();
                    const indianVoice =
                      voices.find(
                        (v) =>
                          v.lang === "en-IN" ||
                          v.name.toLowerCase().includes("india")
                      ) || voices.find((v) => v.lang.startsWith("en"));
                    const products = currentBill.purchased;
                    let idx = 0;
                    function speakNext() {
                      if (idx >= products.length) return;
                      const product = products[idx];
                      const text = `${product.name}, quantity: ${
                        product.piece +
                        product.packet * product.packetQuantity +
                        product.box * product.boxQuantity
                      }`;
                      const utter = new window.SpeechSynthesisUtterance(text);
                      if (indianVoice) utter.voice = indianVoice;
                      utter.rate = 0.8;
                      utter.pitch = 1;
                      utter.onend = () => {
                        setTimeout(() => {
                          idx++;
                          speakNext();
                        }, delayMs); // Use selected delay
                      };
                      synth.speak(utter);
                    }
                    speakNext();
                  }}
                />
                <Button
                  type="primary"
                  size="middle"
                  icon={<PlusOutlined />}
                  className="bg-blue-500 hover:bg-blue-600"
                  onClick={handleCreateBill}
                  loading={isCreating}
                >
                  Create Bill
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

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
