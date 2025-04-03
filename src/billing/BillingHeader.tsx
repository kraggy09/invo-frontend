import { Card, Tag, Input } from "antd";
import {
  ShoppingCartOutlined,
  UserOutlined,
  FileTextOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useState, useRef, useEffect } from "react";

const dummyProducts = [
  { value: "1", label: "Laptop Pro X", price: "$999.99" },
  { value: "2", label: "Wireless Mouse", price: "$29.99" },
  { value: "3", label: "4K Monitor", price: "$499.99" },
  { value: "4", label: "Mechanical Keyboard", price: "$89.99" },
  { value: "5", label: "USB-C Hub", price: "$49.99" },
];

const BillingHeader = () => {
  const [productSearch, setProductSearch] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const productInputRef = useRef<HTMLDivElement>(null);

  const filteredProducts = dummyProducts.filter((product) =>
    product.label.toLowerCase().includes(productSearch.toLowerCase())
  );

  const handleProductSelect = (product: (typeof dummyProducts)[0]) => {
    // Here you would typically add the product to the bill
    console.log("Selected product:", product);

    // Clear the input and focus back
    setProductSearch("");
    setShowProductDropdown(false);
    productInputRef.current?.querySelector("input")?.focus();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        productInputRef.current &&
        !productInputRef.current.contains(event.target as Node)
      ) {
        setShowProductDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const productDropdownContent = (
    <div className="bg-white rounded-lg shadow-lg border border-gray-100 max-h-60 overflow-y-auto">
      {filteredProducts.length > 0 ? (
        filteredProducts.map((product) => (
          <div
            key={product.value}
            className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
            onClick={() => handleProductSelect(product)}
          >
            <span className="text-gray-700">{product.label}</span>
            <span className="text-gray-500">{product.price}</span>
          </div>
        ))
      ) : (
        <div className="px-4 py-2 text-gray-500">No products found</div>
      )}
    </div>
  );

  return (
    <Card
      className="w-full mb-4 shadow-sm hover:shadow-md transition-shadow duration-200"
      bodyStyle={{ padding: "16px 24px" }}
    >
      <div className="grid grid-cols-4 gap-6 items-center">
        {/* Bill Information */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileTextOutlined className="text-blue-500" />
            <span className="text-gray-500">Bill ID:</span>
            <span className="font-semibold text-blue-600">B-001</span>
          </div>
          <div className="flex items-center gap-2">
            <FileTextOutlined className="text-blue-500" />
            <span className="text-gray-500">Trans ID:</span>
            <span className="font-semibold text-blue-600">T-999</span>
          </div>
        </div>

        {/* Customer Search */}
        <div className="space-y-1.5">
          <label className="text-gray-500 text-sm font-medium flex items-center gap-1">
            <UserOutlined className="text-gray-400" />
            Customer
          </label>
          <Input
            prefix={<SearchOutlined className="text-gray-400" />}
            placeholder="Search customer..."
            className="w-full"
          />
        </div>

        {/* Product Search */}
        <div className="space-y-1.5 relative" ref={productInputRef}>
          <label className="text-gray-500 text-sm font-medium flex items-center gap-1">
            <ShoppingCartOutlined className="text-gray-400" />
            Product
          </label>
          <Input
            prefix={<SearchOutlined className="text-gray-400" />}
            placeholder="Search product..."
            className="w-full"
            value={productSearch}
            onChange={(e) => {
              setProductSearch(e.target.value);
              setShowProductDropdown(true);
            }}
            onFocus={() => setShowProductDropdown(true)}
          />
          {showProductDropdown && productSearch && (
            <div className="absolute z-10 w-full mt-1">
              {productDropdownContent}
            </div>
          )}
        </div>

        {/* Summary Information */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ShoppingCartOutlined className="text-green-500" />
            <span className="text-gray-500">Total Products:</span>
            <span className="font-semibold text-green-600">33</span>
          </div>
          <div className="flex items-center gap-2">
            <Tag color="blue" className="px-2 py-0.5 rounded-full">
              Retail
            </Tag>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default BillingHeader;
