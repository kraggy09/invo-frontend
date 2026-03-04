import { Tabs } from "antd";
import { useEffect } from "react";
import "./billingTabs.css";
import useCurrentBillStore from "../store/currentBill.store";
import useTabsStore from "../store/tabs.store";

const BillingTabs = () => {
  const { bills, initialBills, addBill, setCurrentBillingId, removeBill } =
    useCurrentBillStore();
  const {
    tabs,
    activeKey,
    setTabs,
    addTab: addTabStore,
    removeTab: removeTabStore,
    setActiveKey,
    updateFiveMinutesStatus,
    removeTabAndBill,
  } = useTabsStore();

  useEffect(() => {
    const newKey = bills.length + 1;
    const newBill = {
      id: `${newKey}`,
      amount: 0,
      purchased: [],
      customer: null,
      discount: 0,
      total: 0,
      idx: 0,
      createdAt: new Date().toISOString(),
    };
    initialBills([newBill]);
    setTabs([
      {
        key: `${newKey}`,
        label: `${newKey}`,
        fiveMinutes: false,
        createdAt: new Date().toLocaleString(),
      },
    ]);
    setActiveKey(`${newKey}`);
    setCurrentBillingId(newKey);
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const inter = setInterval(() => {
      updateFiveMinutesStatus(bills);
    }, 45000);

    return () => clearInterval(inter);
  }, [bills, updateFiveMinutesStatus]);

  const addTab = () => {
    const newBillingId = bills.length + 1;
    const newKey = `${newBillingId}`;
    addTabStore({
      key: newKey,
      label: `${newKey}`,
      fiveMinutes: false,
      createdAt: new Date().toLocaleString(),
    });
    setActiveKey(newKey);
    const newBill = {
      id: `${newKey}`,
      amount: 0,
      purchased: [],
      customer: null,
      discount: 0,
      total: 0,
      idx: bills.length,
      createdAt: new Date().toISOString(),
    };
    addBill(newBill);
    setCurrentBillingId(newBillingId);
  };

  const removeTab = (targetKey: string) => {
    removeTabAndBill(targetKey, bills, removeBill, setCurrentBillingId);
  };

  const removeBillFn = (targetKey: string) => {
    const idx = bills.findIndex((bill) => bill.id === targetKey);
    removeBill(bills[idx].id);
  };
  return (
    <div className="h-full max-h-[90vh] flex flex-col overflow-hidden">
      <Tabs
        type="editable-card"
        activeKey={activeKey}
        onChange={(key) => {
          setActiveKey(key);
          setCurrentBillingId(Number(key));
        }}
        onEdit={(targetKey, action) =>
          action === "add" ? addTab() : removeTab(targetKey as string)
        }
        tabPosition="left"
        className="h-full custom-billing-tabs"
      >
        {tabs.map((tab) => (
          <Tabs.TabPane
            key={tab.key}
            closable
            tab={
              <div
                className={`custom-tab ${tab.fiveMinutes ? "five-minutes-tab" : ""
                  }`}
              >
                {tab.label}
              </div>
            }
          />
        ))}
      </Tabs>
    </div>
  );
};

export default BillingTabs;
