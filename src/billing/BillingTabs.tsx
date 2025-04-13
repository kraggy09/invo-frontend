import { Tabs } from "antd";
import { useEffect, useState } from "react";
import "./billingTabs.css";
import useCurrentBillStore from "../store/currentBill.store";

const BillingTabs = () => {
  const [activeKey, setActiveKey] = useState("1");
  const { bills, initialBills, addBill, setCurrentBillingId, removeBill } =
    useCurrentBillStore();
  const [tabs, setTabs] = useState<
    {
      key: string;
      label: string;
      fiveMinutes: boolean;
      createdAt: string;
    }[]
  >([]);

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
    };
    initialBills([newBill]);
    setTabs([
      ...tabs,
      {
        key: `${newKey}`,
        label: `${newKey}`,
        fiveMinutes: false,
        createdAt: new Date().toLocaleString(),
      },
    ]);
    setActiveKey(`${newKey}`);
    setCurrentBillingId(newKey);
  }, []);

  const addTab = () => {
    const newBillingId = bills.length + 1;
    const newKey = `${newBillingId}`;
    setTabs([
      ...tabs,
      {
        key: newKey,
        label: `${newKey}`,
        fiveMinutes: false,
        createdAt: new Date().toLocaleString(),
      },
    ]);
    setActiveKey(newKey);
    const newBill = {
      id: `${newKey}`,
      amount: 0,
      purchased: [],
      customer: null,
      discount: 0,
      total: 0,
      idx: bills.length,
    };
    addBill(newBill);
    setCurrentBillingId(newBillingId);
  };

  const removeTab = (targetKey: string) => {
    const idx = tabs.findIndex((tab) => tab.key === targetKey);
    let key = Number(tabs[idx].key);
    const newTabs = tabs.filter((tab) => tab.key !== targetKey);

    for (let i = idx; i < newTabs.length; i++) {
      newTabs[i].key = key + "";
      newTabs[i].label = `${key}`;
      key++;
    }

    setTabs(newTabs);
    removeBillFn(targetKey);

    if (newTabs.length === 0) {
      setActiveKey("");
      setCurrentBillingId(0);
    } else if (idx < newTabs.length) {
      setActiveKey(newTabs[idx].key);
      setCurrentBillingId(Number(newTabs[idx].key));
    } else {
      setActiveKey(newTabs[newTabs.length - 1].key);
      setCurrentBillingId(Number(newTabs[newTabs.length - 1].key));
    }
  };

  const removeBillFn = (targetKey: string) => {
    const idx = bills.findIndex((bill) => bill.id === targetKey);

    removeBill(bills[idx].id);
    if (Number(targetKey) === bills[bills.length - 1].idx) {
      // setCurrentBillingId(Number(bills[bills.length - 2].id));
    } else {
      // setCurrentBillingId(Number(bills[bills.length - 1].id));
    }
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
                className={`custom-tab ${
                  tab.fiveMinutes ? "five-minutes-tab" : ""
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
