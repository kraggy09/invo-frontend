import { Tabs, Button, Dropdown, MenuProps, App, Popconfirm } from "antd";
// import { modal } from "../utils/antdStatic"; // We will use useApp() directly for maximum reliability
import { PlusOutlined, CloseOutlined, FileTextOutlined, ShoppingCartOutlined, ShopOutlined, ThunderboltOutlined, WarningOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { useEffect } from "react";
import "./billingTabs.css";
import useCurrentBillStore from "../store/currentBill.store";
import useTabsStore from "../store/tabs.store";
import { useAddTab } from "../hooks/useAddTab";

const BillingTabs = () => {
  const { modal } = App.useApp();
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

  const addTab = useAddTab();

  useEffect(() => {
    const inter = setInterval(() => {
      updateFiveMinutesStatus(bills);
    }, 15000);

    return () => clearInterval(inter);
  }, [bills, updateFiveMinutesStatus]);

  // const addTab = useAddTab(); - defined above

  const menuItems: MenuProps["items"] = [
    {
      key: "RETAIL",
      label: "Retail Bill",
      icon: <ShoppingCartOutlined className="text-blue-500" />,
      onClick: () => addTab("RETAIL"),
    },
    {
      key: "WHOLESALE",
      label: "Wholesale Bill",
      icon: <ShopOutlined className="text-green-500" />,
      onClick: () => addTab("WHOLESALE"),
    },
    {
      key: "SUPERWHOLESALE",
      label: "Super Wholesale Bill",
      icon: <ThunderboltOutlined className="text-purple-500" />,
      onClick: () => addTab("SUPERWHOLESALE"),
    },
  ];

  const onConfirmDelete = (targetKey: string) => {
    removeTabAndBill(targetKey.toString(), bills, removeBill, setCurrentBillingId);
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      <style>{`
        @keyframes alert-glow {
          0% { border-color: #fca5a5; box-shadow: 0 0 0 0px rgba(239, 68, 68, 0.05); background-color: #fff; }
          50% { border-color: #f87171; box-shadow: 0 0 15px 0px rgba(239, 68, 68, 0.1); background-color: #fffafa; }
          100% { border-color: #fca5a5; box-shadow: 0 0 0 0px rgba(239, 68, 68, 0.05); background-color: #fff; }
        }
        .stale-blink {
          animation: alert-glow 4s infinite ease-in-out !important;
        }
        .stale-blink.border-indigo-600 {
          animation: alert-glow 3s infinite ease-in-out !important;
          border-width: 2px !important;
          border-color: #f87171 !important;
        }
        .pulse-dot {
          width: 6px;
          height: 6px;
          background-color: #ef4444;
          border-radius: 50%;
          animation: inner-pulse 1.5s infinite ease-in-out;
        }
      `}</style>
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-gray-800 tracking-tight">Active Invoices</h2>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Terminal Sessions</p>
        </div>
        <Dropdown menu={{ items: menuItems }} placement="bottomRight" trigger={["click"]}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            className="w-10 h-10 rounded-xl bg-indigo-600 border-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-100"
          />
        </Dropdown>
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
              className={`group relative p-4 rounded-2xl border-2 transition-all cursor-pointer ${tab.fiveMinutes ? "stale-blink" : ""} ${currentBillingId.toString() === tab.key
                ? "bg-white border-indigo-600 text-indigo-600 shadow-md scale-[1.02]"
                : "bg-white border-gray-50 text-gray-400 hover:border-indigo-100 hover:bg-indigo-50/10"
                }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-black uppercase tracking-widest ${currentBillingId.toString() === tab.key ? "text-indigo-600" : "text-gray-300"
                  }`}>
                  Invoice #{tab.key.slice(-4).toUpperCase()}
                </span>
                {(() => {
                  const bill = bills.find(b => b.id.toString() === tab.key.toString());
                  const hasItems = bill && bill.purchased && bill.purchased.length > 0;
                  const deleteButton = (
                    <Button
                      type="text"
                      size="middle"
                      icon={<CloseOutlined className="transition-all" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!hasItems) onConfirmDelete(tab.key);
                      }}
                      className={`opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center rounded-xl w-9 h-9 hover:bg-red-50 hover:text-red-600 ${currentBillingId.toString() === tab.key ? "text-indigo-600" : "text-gray-400"
                        }`}
                    />
                  );

                  return hasItems ? (
                    <Popconfirm
                      title="Close Active Invoice?"
                      description={`This invoice has ${bill?.purchased.length} items. All progress will be lost.`}
                      onConfirm={() => onConfirmDelete(tab.key)}
                      onCancel={(e) => e?.stopPropagation()}
                      okText="Yes, Close"
                      cancelText="No"
                      okButtonProps={{ danger: true }}
                      icon={<WarningOutlined className="text-red-500" />}
                      placement="right"
                    >
                      {deleteButton}
                    </Popconfirm>
                  ) : (
                    deleteButton
                  );
                })()}
              </div>

              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${currentBillingId.toString() === tab.key ? "bg-indigo-600" : "bg-gray-200"
                  }`} />
                <span className={`font-black text-sm tracking-tight ${currentBillingId.toString() === tab.key ? "text-indigo-900" : "text-gray-600"}`}>Session {tab.label}</span>
                {bills.find(b => b.id === tab.key)?.billType && (
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase ml-auto ${currentBillingId.toString() === tab.key ? "bg-indigo-50 text-indigo-600 border border-indigo-100" : "bg-gray-50 text-gray-400 border border-transparent"}`}>
                    {bills.find(b => b.id === tab.key)?.billType === "SUPERWHOLESALE" ? "SW" : bills.find(b => b.id === tab.key)?.billType === "WHOLESALE" ? "WS" : "RT"}
                  </span>
                )}
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
