import { Card, Tag } from "antd";
import {
  ShoppingCartOutlined,
  UserOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import SearchWithSuggestions from "../components/SearchWithSuggestions";
import SelectWithSuggestions from "../components/SelectWithSuggestions";
import data from "../constant";
import useProductStore, { IProduct } from "../store/product.store";
import { useEffect } from "react";
import useCustomerStore, { Customer } from "../store/customer.store";
import useCurrentBillStore from "../store/currentBill.store";
import useCategoriesStore, { Category } from "../store/categories.store";

const { productData, customerData, categoriesData } = data;

const BillingHeader = () => {
  const { setProducts, products } = useProductStore();
  const { setCustomers, customers } = useCustomerStore();
  const { currentBillingId, billingId, setCustomerForBill, bills, addProduct } =
    useCurrentBillStore();
  const { setCategories, categories } = useCategoriesStore();
  const currentBill = bills.find(
    (bill) => bill.id === currentBillingId.toString()
  );

  const handleProductSelect = (product: IProduct) => {
    addProduct(product, currentBillingId.toString());
  };

  useEffect(() => {
    setProducts(productData as IProduct[]);
    setCustomers(customerData as Customer[]);
    setCategories(categoriesData as Category[]);
  }, []);

  const handleCustomerSelect = (customer: Customer) => {
    setCustomerForBill(customer, currentBillingId.toString());
  };

  const handleCustomerClear = () => {
    setCustomerForBill(null, currentBillingId.toString());
  };

  const currentCustomer = bills.filter(
    (bill) => bill.id === currentBillingId.toString()
  )[0]?.customer;
  const customerName = currentCustomer?.name || null;

  return (
    <Card
      className="w-full mb-4 shadow-sm hover:shadow-md transition-shadow duration-200"
      // bodyStyle={{ padding: "16px 24px" }}
    >
      <div className="grid grid-cols-4 gap-6 items-center">
        {/* Bill Information */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileTextOutlined className="text-blue-500" />
            <span className="text-gray-500">Bill ID:</span>
            <span className="font-semibold text-blue-600">B-{billingId}</span>
          </div>
          <div className="flex items-center gap-2">
            <FileTextOutlined className="text-blue-500" />
            <span className="text-gray-500">Trans ID:</span>
            <span className="font-semibold text-blue-600">T-999</span>
          </div>
        </div>

        {/* Customer Search */}
        <div className="space-y-1.5">
          <SelectWithSuggestions<Customer>
            data={customers}
            onSelect={handleCustomerSelect}
            onClear={handleCustomerClear}
            label="Customer"
            icon={<UserOutlined className="text-gray-400" />}
            placeholder="Search customer..."
            searchKeys={["name", "phone"]}
            displayKeys={["name", "outstanding"]}
            primaryKey="name"
            value={customerName}
          />
        </div>

        {/* Product Search */}
        <div className="space-y-1.5">
          <SearchWithSuggestions
            data={products}
            onSelect={handleProductSelect}
            label="Product"
            icon={<ShoppingCartOutlined className="text-gray-400" />}
            placeholder="Search product..."
            searchKeys={["name", "barcode"]}
            autoSelect={true}
            displayKeys={["name"]}
            primaryKey="name"
          />
        </div>

        {/* Summary Information */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ShoppingCartOutlined className="text-green-500" />
            <span className="text-gray-500">Total Products:</span>
            <span className="font-semibold text-green-600">
              {(currentBill && currentBill?.purchased?.length) || 0}
            </span>
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
