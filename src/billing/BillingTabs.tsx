import { Tabs } from "antd";
import { useState } from "react";
import "./billingTabs.css";

const BillingTabs = () => {
  const [activeKey, setActiveKey] = useState("1");
  const [tabs, setTabs] = useState([
    { key: "1", label: "Invoice 1", fiveMinutes: false },
    { key: "2", label: "Invoice 2", fiveMinutes: true }, // This one should be red
  ]);

  const addTab = () => {
    const newKey = `${tabs.length + 1}`;
    setTabs([
      ...tabs,
      {
        key: newKey,
        label: `Invoice ${newKey}`,
        fiveMinutes: false,
      },
    ]);
    setActiveKey(newKey);
  };

  const removeTab = (targetKey: string) => {
    const newTabs = tabs.filter((tab) => tab.key !== targetKey);
    setTabs(newTabs);
    if (targetKey === activeKey && newTabs.length) {
      setActiveKey(newTabs[newTabs.length - 1].key);
    }
  };

  return (
    <div className="h-full max-h-[90vh] flex flex-col overflow-hidden">
      <Tabs
        type="editable-card"
        activeKey={activeKey}
        onChange={setActiveKey}
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
