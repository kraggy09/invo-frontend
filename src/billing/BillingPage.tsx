import BillingBody from "./BillingBody";
import BillingHeader from "./BillingHeader";
import BillingTabs from "./BillingTabs";
const BillingPage = () => {
  return (
    <div className="w-full py-3 h-screen flex ">
      <div className="flex-shrink-0 h-full max-h-[90vh] ">
        <BillingTabs />
      </div>
      <div className="flex-1 h-full max-w-[1320px] mx-auto flex flex-col items-start justify-start px-4 ">
        <BillingHeader />
        <BillingBody />
      </div>
    </div>
  );
};

export default BillingPage;
