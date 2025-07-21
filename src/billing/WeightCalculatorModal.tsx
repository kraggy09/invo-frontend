import { Modal, Input, Typography, Space, Button, InputRef } from "antd";
import { useEffect, useRef, useState } from "react";
import useCurrentBillStore from "../store/currentBill.store";
import useCategoriesStore from "../store/categories.store";

const { Text } = Typography;

interface WeightCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    measuring: "kg" | "pieces";
    superWholesalePrice: number;
    wholesalePrice: number;
    retailPrice: number;
    type: "SUPERWHOLESALE" | "WHOLESALE" | "RETAIL";
    category: string;
  };
  billId: string;
}

const WeightCalculatorModal = ({
  isOpen,
  onClose,
  product,
  billId,
}: WeightCalculatorModalProps) => {
  const [amount, setAmount] = useState<string>("");
  const [localProduct, setLocalProduct] = useState(product);
  const { updateProductQuantityForMeasuring } = useCurrentBillStore();
  const { categories } = useCategoriesStore();
  const amountRef = useRef<InputRef>(null);
  useEffect(() => {
    amountRef.current?.focus();
  }, []);
  const handleAmountChange = (value: string) => {
    setAmount(value);
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue)) {
      // Get category info
      const categoryInfo = categories.find(
        (cat) => cat.name === product.category
      );

      // Calculate weight in kg
      const kg = numericValue / getPricePerKg();

      // Determine new price type based on weight and category thresholds
      let newPriceType = product.type;
      if (categoryInfo) {
        if (kg >= categoryInfo.superWholeSale) {
          newPriceType = "SUPERWHOLESALE";
        } else if (kg >= categoryInfo.wholesale) {
          newPriceType = "WHOLESALE";
        } else {
          newPriceType = "RETAIL";
        }
        ``;
      }

      // Update local product state
      setLocalProduct((prev) => ({
        ...prev,
        type: newPriceType,
      }));
    }
  };

  const handleSave = () => {
    const numericValue = parseFloat(amount);
    if (!isNaN(numericValue)) {
      // Update quantity
      updateProductQuantityForMeasuring(
        product.id,
        billId,
        numericValue,
        localProduct.type
      );

      // Close modal
      onClose();
    }
  };

  const getPricePerKg = () => {
    switch (localProduct.type) {
      case "SUPERWHOLESALE":
        return localProduct.superWholesalePrice;
      case "WHOLESALE":
        return localProduct.wholesalePrice;
      default:
        return localProduct.retailPrice;
    }
  };

  const calculateWeight = () => {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) return { kg: 0, grams: 0 };

    const pricePerKg = getPricePerKg();
    const kg = numericAmount / pricePerKg;
    const grams = kg * 1000;

    return {
      kg: kg.toFixed(2),
      grams: grams.toFixed(0),
    };
  };

  const { kg, grams } = calculateWeight();

  return (
    <Modal
      title="Weight Calculator"
      open={isOpen}
      onCancel={onClose}
      footer={null}
      centered
      className="[&_.ant-modal-content]:p-6"
    >
      <Space direction="vertical" size="large" className="w-full">
        <div className="space-y-2">
          <Text className="text-gray-600">Enter Amount (₹)</Text>
          <Input
            size="large"
            ref={amountRef}
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            placeholder="Enter amount"
            prefix="₹"
            className="w-full"
            style={{ textAlign: "right" }}
          />
        </div>

        <div className="space-y-2">
          <Text className="text-gray-600">Calculated Weight</Text>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <Text className="text-gray-500 block text-sm">Kilograms</Text>
              <Text className="text-xl font-semibold">{kg} kg</Text>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <Text className="text-gray-500 block text-sm">Grams</Text>
              <Text className="text-xl font-semibold">{grams} g</Text>
            </div>
          </div>
        </div>

        <div className="p-4 bg-blue-50 rounded-lg">
          <Text className="text-gray-600 block text-sm">Price per kg</Text>
          <Text className="text-xl font-semibold text-blue-600">
            ₹{getPricePerKg()}
          </Text>
        </div>

        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            onClick={handleSave}
            disabled={!amount || isNaN(parseFloat(amount))}
          >
            Save
          </Button>
        </div>
      </Space>
    </Modal>
  );
};

export default WeightCalculatorModal;
