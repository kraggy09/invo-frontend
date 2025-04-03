import BillingHeader from "./BillingHeader";
import BillingTabs from "./BillingTabs";

const BillingPage = () => {
  return (
    <div className="w-full py-3 h-screen flex">
      <div className="flex-shrink-0 h-full max-h-[90vh] overflow-hidden">
        <BillingTabs />
      </div>
      <div className="flex-1 h-full max-w-[1320px] mx-auto flex items-start justify-start px-4 ">
        <BillingHeader />
      </div>
    </div>
  );
};

export default BillingPage;
