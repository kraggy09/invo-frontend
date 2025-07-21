import { Typography } from "antd";

import useCurrentBillStore, {
  PurchasedProduct,
} from "../store/currentBill.store";
import { useEffect, useState } from "react";
import {
  calculateDate,
  calculateMeasuring,
  calculateTime,
} from "../utils/bill.util";

const { Title } = Typography;

interface BillPrintProps {
  onClose: () => void;
  contentRef: React.RefObject<HTMLDivElement | null>;
  handlePrint: () => void;
  payment: string;
}

const BillPrint = ({
  onClose,
  contentRef,
  handlePrint,
  payment,
}: BillPrintProps) => {
  const { bills, currentBillingId } = useCurrentBillStore();

  const [withMRP, setWithMRP] = useState(false);
  const calculateSave = (product: PurchasedProduct[]) => {
    let saved = 0;
    for (let i = 0; i < product.length; i++) {
      const quantity =
        product[i].piece +
        product[i].box * product[i].boxQuantity +
        product[i].packet * product[i].packetQuantity;
      let temp = product[i].mrp * quantity;
      saved += temp - product[i].price * quantity;
    }
    return saved;
  };
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
      if (e.key === "Enter") {
        handlePrint();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);
  const currentBill = bills.find(
    (bill) => bill.id === currentBillingId.toString()
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[500px]">
        <div className="flex justify-between items-center mb-4">
          <Title level={4}>Print Bill</Title>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {currentBill && (
          <div ref={contentRef} className="text-sm ">
            <header className="flex items-center flex-col justify-center">
              <h1 className="ml-1 font-bold">
                Sultan Communication & General Stroes
              </h1>
              <p className="text-xs font-semibold">Behind Green Land Hotel</p>
              <p className="text-xs font-semibold">Mob:9370564909/9145506000</p>
              <div className="font-bold mt-3">
                ------------------------------------------------
              </div>
              <div className="text-xs justify-between font-semibold  flex ">
                <span id="left" className="mr-10">
                  <p>
                    Invoice No.:{" "}
                    {currentBillingId ? `B-${currentBillingId}` : "Old Bill"}
                  </p>
                  <p>
                    Date:
                    {currentBill.createdAt
                      ? calculateDate(new Date(currentBill.createdAt))
                      : calculateDate(new Date())}
                  </p>
                </span>
                <span id="right">
                  <p>Payment: {payment}</p>
                  <p>
                    Time :{" "}
                    {currentBill.createdAt
                      ? calculateTime(new Date(currentBill.createdAt))
                      : calculateTime(new Date())}
                  </p>
                </span>
              </div>
            </header>

            <div className="flex text-xs justify-around font-semibold">
              <span className="flex font-semibold">
                Customer:
                <p className="capitalize italic">
                  {currentBill?.customer?.name || "Walk-in Customer"}
                </p>
              </span>
              <span className="flex font-semibold">
                Mobile:
                <p className="capitalize italic">
                  {currentBill?.customer?.phone || "N/A"}
                </p>
              </span>
            </div>
            <p className="font-semibold text-xs ml-6">
              Total Items:{currentBill?.purchased.length}
            </p>

            <div className="font-bold mb-3">
              ------------------------------------------------
            </div>
            <main className="flex text-xs items-center font-semibold justify-center flex-col">
              <table className="min-w-full mx-6">
                <tbody>
                  <tr>
                    <th className="border border-black">Name</th>
                    <th className="border border-black">Quantity</th>
                    {withMRP && (
                      <>
                        <th className="border border-black">Price</th>

                        <th className="border border-black">MRP</th>
                      </>
                    )}
                    <th className="border border-black">Total</th>
                  </tr>
                  {currentBill?.purchased &&
                    [...currentBill?.purchased].reverse().map((product) => {
                      // console.log(product, "current product");
                      const total =
                        product.piece +
                        product.box * product.boxQuantity +
                        product.packet * product.packetQuantity;
                      const price = product.price;

                      return (
                        <tr key={product.id} className="border border-black">
                          <td>
                            <p className="text-center capitalize">
                              {product.name}
                            </p>
                          </td>

                          <td>
                            <p className="text-center">
                              {" "}
                              {product.measuring === "kg"
                                ? calculateMeasuring(total)
                                : total % 1 != 0
                                ? total.toFixed(3)
                                : total}
                            </p>
                          </td>

                          {withMRP && (
                            <>
                              <td>
                                <p className="text-center">
                                  {price % 1 != 0 ? price.toFixed(2) : price}
                                </p>
                              </td>
                              <td>
                                <p className="text-center"> {product.mrp}</p>
                              </td>
                            </>
                          )}
                          <td>
                            <p className="text-center">
                              {(price * total - product.discount) % 1 != 0
                                ? (price * total - product.discount).toFixed(2)
                                : price * total - product.discount}
                            </p>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
              <div className="min-w-full mt-2 flex flex-col pr-2 justify-end items-end">
                <div className="">
                  Bill Total:
                  {(currentBill?.total ?? 0) -
                    (currentBill.customer?.outstanding ?? 0) +
                    (currentBill.discount ?? 0)}
                </div>
                {currentBill.customer &&
                currentBill.customer.outstanding > 0 ? (
                  <div>Outstanding:+{currentBill.customer.outstanding}</div>
                ) : (
                  currentBill.customer &&
                  currentBill.customer.outstanding < 0 && (
                    <div>Balance:-{currentBill.customer.outstanding}</div>
                  )
                )}
                {currentBill.discount > 0 && (
                  <div>Discount:-{currentBill.discount}</div>
                )}

                <div className="">Total:{currentBill.total}</div>
                {Number(payment) > 0 && (
                  <div className="">
                    Payment:{payment == null ? 0 : "-" + payment}
                  </div>
                )}
                <div className="">
                  {currentBill.total - Number(payment) > 0 ? (
                    <span>
                      Outstanding:{currentBill.total - Number(payment)}
                    </span>
                  ) : (
                    <span>Balance:{currentBill.total - Number(payment)}</span>
                  )}
                </div>
                {calculateSave(currentBill.purchased) > 0 && (
                  <>
                    <div>------------------------------------------------</div>
                    <div className="mt-2 font-bold flex min-w-full items-center justify-center text-2xl">
                      You Saved:
                      {calculateSave(currentBill.purchased).toFixed(3)}
                    </div>
                    <div>------------------------------------------------</div>
                  </>
                )}
              </div>
            </main>
          </div>
        )}
        {/* <div ref={contentRef} className="p-4 bg-white">
          <div className="text-center mb-4">
            <Title level={3}>INVOICE</Title>
            <Text className="text-gray-600">Bill No: {currentBill?.id}</Text>
          </div>

          <Divider />

          <div className="mb-4">
            <Text strong>Customer:</Text>
            <Text className="block">
              {currentBill?.customer?.name || "Walk-in Customer"}
            </Text>
            {currentBill?.customer?.phone && (
              <Text className="block text-gray-600">
                Phone: {currentBill?.customer?.phone}
              </Text>
            )}
          </div>

          <Divider />

          <div className="mb-4">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Item</th>
                  <th className="text-right py-2">Qty</th>
                  <th className="text-right py-2">Price</th>
                  <th className="text-right py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {currentBill?.purchased.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-2">{item.name}</td>
                    <td className="text-right py-2">
                      {item.piece +
                        item.packet * item.packetQuantity +
                        item.box * item.boxQuantity}
                    </td>
                    <td className="text-right py-2">
                      {formatIndianNumber(item.price)}
                    </td>
                    <td className="text-right py-2">
                      {formatIndianNumber(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Divider />

          <div className="text-right space-y-2">
            <div className="flex justify-between">
              <Text>Subtotal:</Text>
              <Text>{formatIndianNumber(currentBill?.total || 0)}</Text>
            </div>
            {currentBill &&
              currentBill.discount &&
              currentBill.discount > 0 && (
                <div className="flex justify-between">
                  <Text>Discount:</Text>
                  <Text>-{formatIndianNumber(currentBill?.discount || 0)}</Text>
                </div>
              )}
            <div className="flex justify-between font-bold">
              <Text>Total:</Text>
              <Text>
                {formatIndianNumber(
                  (currentBill?.total || 0) - (currentBill?.discount || 0)
                )}
              </Text>
            </div>
          </div>

          <Divider />

          <div className="text-center text-gray-600 text-sm">
            <Text>Thank you for your business!</Text>
          </div>
        </div> */}

        <div className="flex justify-end mt-4">
          <button
            onClick={handlePrint}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Print
          </button>
        </div>
      </div>
    </div>
  );
};

export default BillPrint;
