import { Tabs, Button } from "antd";
import { PlusOutlined, CloseOutlined, FileTextOutlined } from "@ant-design/icons";
import { useEffect } from "react";
import "./billingTabs.css";
import useCurrentBillStore from "../store/currentBill.store";
import useTabsStore from "../store/tabs.store";

const BillingTabs = () => {
  const { bills, initialBills, addBill, currentBillingId, setCurrentBillingId, removeBill } =
    useCurrentBillStore();
  const {
    tabs,
    activeKey,
    setTabs,
    addTab: addTabStore,
    setActiveKey,
    updateFiveMinutesStatus,
    removeTabAndBill,
  } = useTabsStore();

  useEffect(() => {
    if (bills.length === 0) {
      const newKey = 1;
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
    }
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

  const handleDeleteTab = (targetKey: string) => {
    removeTabAndBill(targetKey, bills, removeBill, setCurrentBillingId);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-gray-800 tracking-tight">Active Invoices</h2>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Terminal Sessions</p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={addTab}
          className="w-10 h-10 rounded-xl bg-indigo-600 border-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-100"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {tabs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No active bills</p>
          </div>
        ) : (
          tabs.map((tab) => (
            <div
              key={tab.key}
              onClick={() => setCurrentBillingId(parseInt(tab.key, 10))}
              className={`group relative p-4 rounded-2xl border-2 transition-all cursor-pointer ${currentBillingId.toString() === tab.key
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100 scale-[1.02]"
                  : "bg-white border-gray-50 text-gray-600 hover:border-indigo-100 hover:bg-indigo-50/30"
                }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-black uppercase tracking-widest ${currentBillingId.toString() === tab.key ? "text-indigo-200" : "text-gray-400"
                  }`}>
                  Invoice #{tab.key.slice(-4).toUpperCase()}
                </span>
                <Button
                  type="text"
                  size="small"
                  icon={<CloseOutlined className={currentBillingId.toString() === tab.key ? "text-white" : "text-gray-400"} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTab(tab.key);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${currentBillingId.toString() === tab.key ? "bg-white" : "bg-indigo-500"
                  }`} />
                <span className="font-black text-sm tracking-tight">Session {tab.label}</span>
              </div>

              {currentBillingId.toString() === tab.key && (
                <div className="absolute right-4 bottom-4 opacity-10">
                  <FileTextOutlined style={{ fontSize: 48 }} />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-gray-100 bg-gray-50/50">
        <div className="flex items-center justify-between px-2">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">System Load</span>
          <span className="text-[10px] font-black text-indigo-500 uppercase font-bold">Synchronized</span>
        </div>
      </div>
    </div>
  );
};

export default BillingTabs;
