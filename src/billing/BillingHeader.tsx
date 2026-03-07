import { Card, Tag } from "antd";
import {
  ShoppingCartOutlined,
  UserOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import SearchWithSuggestions from "../components/SearchWithSuggestions";
import SelectWithSuggestions from "../components/SelectWithSuggestions";

// Zustand selectors
import useProductStore, { IProduct } from "../store/product.store";
import useCustomerStore, { ICustomer } from "../store/customer.store";
import useCurrentBillStore from "../store/currentBill.store";
import useBillStore from "../store/bill.store";
import useTransactionStore from "../store/transaction.store";

const BillingHeader = () => {
  // ✅ Selectively get only needed state from all stores
  const products = useProductStore((state) => state.products);
  const customers = useCustomerStore((state) => state.customers);

  const currentBillingId = useCurrentBillStore(
    (state) => state.currentBillingId
  );
  const setCustomerForBill = useCurrentBillStore(
    (state) => state.setCustomerForBill
  );
  const addProduct = useCurrentBillStore((state) => state.addProduct);

  const bills = useCurrentBillStore((state) => state.bills); // better to colocate current billing data
  const billingId = useBillStore((state) => state.billingId);
  const transactionId = useTransactionStore((state) => state.transactionId);

  // ✅ UseMemo or simple memoization where needed
  const currentBill = bills.find(
    (bill) => bill.id === currentBillingId.toString()
  );
  const currentCustomer = currentBill?.customer;
  const customerName = currentCustomer?.name || "";

  // ✅ Handlers
  const handleProductSelect = (product: IProduct) => {
    addProduct(product, currentBillingId.toString());
  };

  const handleCustomerSelect = (customer: ICustomer) => {
    setCustomerForBill(customer, currentBillingId.toString());
  };

  const handleCustomerClear = () => {
    setCustomerForBill(null, currentBillingId.toString());
  };

  return (
    <div className="w-full mb-6 bg-white rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-100">
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-6">
        {/* Terminals & ID Info */}
        <div className="flex flex-row xl:flex-col gap-4 xl:gap-2 shrink-0 border-b xl:border-b-0 xl:border-r border-gray-100 pb-4 xl:pb-0 xl:pr-6">
          <div className="flex-1 xl:flex-none">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Bill ID</span>
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-lg text-indigo-700 font-black text-sm border border-indigo-100">
              <FileTextOutlined className="text-[10px]" /> B-{billingId + 1}
            </span>
          </div>
          <div className="flex-1 xl:flex-none">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Transaction ID</span>
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-lg text-gray-600 font-bold text-sm border border-gray-100">
              T-{transactionId + 1}
            </span>
          </div>
        </div>

        {/* Search Matrix */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="group">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1 flex items-center gap-2">
              <UserOutlined className="text-indigo-400" /> Customer
            </label>
            <SelectWithSuggestions<ICustomer>
              data={customers}
              onSelect={handleCustomerSelect}
              onClear={handleCustomerClear}
              placeholder="Search by Name or Phone..."
              searchKeys={["name", "phone"]}
              displayKeys={["name", "outstanding"]}
              primaryKey="name"
              value={customerName}
              className="pos-search-input"
            />
          </div>
          <div className="group">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1 flex items-center gap-2">
              <ShoppingCartOutlined className="text-green-400" /> Inventory Catalog
            </label>
            <SearchWithSuggestions
              data={products}
              onSelect={handleProductSelect}
              placeholder="Search by Product or Barcode..."
              searchKeys={["name", "barcode"]}
              autoSelect={true}
              displayKeys={["name"]}
              primaryKey="name"
              className="pos-search-input"
            />
          </div>
        </div>

        {/* Quick Summary */}
        <div className="flex xl:flex-col sm:flex-row items-center xl:items-end justify-between xl:justify-center gap-4 border-t xl:border-t-0 xl:border-l border-gray-100 pt-4 xl:pt-0 xl:pl-6 shrink-0">
          <div className="text-right">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Cart Items</span>
            <span className="text-xl font-black text-indigo-600">{currentBill?.purchased?.length || 0}</span>
          </div>
          <Tag color="indigo" className="rounded-full px-4 border-0 font-black text-[10px] uppercase m-0 py-1">
            Retail Standard
          </Tag>
        </div>
      </div>
    </div>
  );
};

export default BillingHeader;
