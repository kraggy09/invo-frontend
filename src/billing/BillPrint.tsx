import { Typography, Divider } from "antd";

import useCurrentBillStore from "../store/currentBill.store";
import { formatIndianNumber } from "../utils";
import { useEffect } from "react";

const { Text, Title } = Typography;

interface BillPrintProps {
  onClose: () => void;
  contentRef: React.RefObject<HTMLDivElement | null>;
  handlePrint: () => void;
}

const BillPrint = ({ onClose, contentRef, handlePrint }: BillPrintProps) => {
  const { bills, currentBillingId } = useCurrentBillStore();

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

        <div ref={contentRef} className="p-4 bg-white">
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
        </div>

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
