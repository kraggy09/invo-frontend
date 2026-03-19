import { useState } from "react";
import { Drawer, Button, Empty } from "antd";
import { MenuUnfoldOutlined } from "@ant-design/icons";
import useTabsStore from "../store/tabs.store";
import BillingBody from "./BillingBody";
import BillingHeader from "./BillingHeader";
import BillingTabs from "./BillingTabs";
import { useAddTab } from "../hooks/useAddTab";
import { ShoppingCartOutlined, ShopOutlined, ThunderboltOutlined, PlusOutlined } from "@ant-design/icons";

const BillingPage = () => {
  const { tabs } = useTabsStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const addTab = useAddTab();

  return (
    <div className="w-full h-screen bg-gray-50/50 flex overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block flex-shrink-0 h-full border-r border-gray-100 bg-white shadow-sm w-72">
        <BillingTabs />
      </div>

      {/* Mobile Drawer */}
      <Drawer
        placement="left"
        onClose={() => setIsMenuOpen(false)}
        open={isMenuOpen}
        bodyStyle={{ padding: 0 }}
        width={280}
        closable={false}
      >
        <BillingTabs />
      </Drawer>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header Access */}
        <div className="lg:hidden p-4 bg-white border-b border-gray-100 flex items-center justify-between">
          <Button
            icon={<MenuUnfoldOutlined />}
            onClick={() => setIsMenuOpen(true)}
            className="border-none shadow-none bg-indigo-50 text-indigo-600 font-bold flex items-center gap-2"
          >
            BILL TABS ({tabs.length})
          </Button>
          <div className="text-right">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block leading-none">POS Terminal</span>
            <span className="text-[10px] font-bold text-gray-400">v2.0</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto w-full overflow-hidden">
          {tabs.length > 0 ? (
            <>
              <BillingHeader />
              <BillingBody />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center p-8 bg-white/50 backdrop-blur-sm rounded-[40px] border-2 border-gray-50 max-w-lg w-full shadow-2xl shadow-gray-100">
                <div className="bg-indigo-50 w-20 h-20 rounded-[30px] flex items-center justify-center mx-auto mb-8 text-indigo-600 shadow-inner">
                  <PlusOutlined style={{ fontSize: 32 }} />
                </div>
                <h3 className="text-2xl font-black text-gray-800 mb-2">Initialize Terminal</h3>
                <p className="text-gray-400 font-medium mb-10">Select a billing engine to start your next session</p>

                <div className="space-y-4">
                  {[
                    { type: "RETAIL", icon: <ShoppingCartOutlined />, title: "Retail Store", desc: "Direct consumer pricing & simple checkout", color: "blue" },
                    { type: "WHOLESALE", icon: <ShopOutlined />, title: "Wholesale", desc: "Volume-based tiered pricing models", color: "green" },
                    { type: "SUPERWHOLESALE", icon: <ThunderboltOutlined />, title: "Super Wholesale", desc: "Corporate contracts & maximum discounts", color: "purple" }
                  ].map((opt) => (
                    <div
                      key={opt.type}
                      onClick={() => addTab(opt.type as any)}
                      className="group flex items-center gap-5 p-5 bg-white border-2 border-gray-50 rounded-3xl cursor-pointer transition-all hover:border-indigo-600 hover:shadow-xl hover:shadow-indigo-50 active:scale-[0.98]"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-gray-50 group-hover:bg-indigo-50 flex items-center justify-center text-gray-400 group-hover:text-indigo-600 transition-colors text-xl">
                        {opt.icon}
                      </div>
                      <div className="text-left">
                        <h4 className="font-bold text-gray-800 group-hover:text-indigo-600 transition-colors m-0 leading-tight">{opt.title}</h4>
                        <p className="text-xs text-gray-400 font-medium m-0 mt-1 uppercase tracking-wider">{opt.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-10 pt-8 border-t border-gray-50 lg:hidden">
                  <Button
                    type="text"
                    icon={<MenuUnfoldOutlined />}
                    onClick={() => setIsMenuOpen(true)}
                    className="text-gray-400 font-bold text-xs uppercase tracking-widest hover:text-indigo-600"
                  >
                    Open Active Sessions
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BillingPage;
