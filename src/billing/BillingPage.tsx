import { useState } from "react";
import { Drawer, Button, Empty } from "antd";
import { MenuUnfoldOutlined } from "@ant-design/icons";
import useTabsStore from "../store/tabs.store";
import BillingBody from "./BillingBody";
import BillingHeader from "./BillingHeader";
import BillingTabs from "./BillingTabs";

const BillingPage = () => {
  const { tabs } = useTabsStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
              <div className="text-center p-12 bg-white rounded-3xl border-2 border-dashed border-gray-100 max-w-sm">
                <div className="bg-indigo-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-indigo-600">
                  <MenuUnfoldOutlined style={{ fontSize: 24 }} />
                </div>
                <h3 className="text-xl font-black text-gray-800 mb-2">No Active Invoices</h3>
                <p className="text-gray-500 text-sm mb-6">Open the tabs menu to create a new billing instance or continue existing ones.</p>
                <Button
                  type="primary"
                  onClick={() => setIsMenuOpen(true)}
                  className="lg:hidden h-11 rounded-xl bg-indigo-600 font-bold px-8"
                >
                  OPEN MENU
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BillingPage;
