import useTabsStore from "../store/tabs.store";
import BillingBody from "./BillingBody";
import BillingHeader from "./BillingHeader";
import BillingTabs from "./BillingTabs";
import { Empty } from "antd";
const BillingPage = () => {
  const { tabs } = useTabsStore();
  return (
    <div className="w-full py-3 h-screen flex ">
      <div className="flex-shrink-0 h-full max-h-[90vh] ">
        <BillingTabs />
      </div>
      <div className="flex-1 h-full max-w-[1320px] mx-auto flex flex-col items-start justify-start px-4 ">
        {tabs.length > 0 ? (
          <>
            <BillingHeader />
            <BillingBody />
          </>
        ) : (
          <div className="flex-1 h-full w-full flex items-center justify-center">
            <Empty description="No bills found" />
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingPage;
