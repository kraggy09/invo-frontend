import { useState } from "react";
import { Drawer, Button, Dropdown, MenuProps } from "antd";
import {
  MenuUnfoldOutlined,
  ShoppingCartOutlined,
  ShopOutlined,
  ThunderboltOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import useTabsStore from "../store/tabs.store";
import useCurrentBillStore from "../store/currentBill.store";
import useUserStore from "../store/user.store";
import BillingBody from "./BillingBody";
import BillingHeader from "./BillingHeader";
import BillingTabs from "./BillingTabs";
import { useAddTab } from "../hooks/useAddTab";

const BillingPage = () => {
  const { tabs } = useTabsStore();
  const { currentBillingId, bills } = useCurrentBillStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const addTab = useAddTab();

  const pricingMode = useUserStore(
    (state) => state.user?.shopSettings?.pricingMode,
  );
  const isRetailOnly =
    pricingMode === "RETAIL_ONLY" ||
    (pricingMode as string)?.toUpperCase() === "RETAIL_ONLY" ||
    (pricingMode as string)?.toUpperCase() === "RETAIL";

  const currentBill = bills.find(
    (b) => b.id.toString() === currentBillingId?.toString(),
  );

  const addMenuItems: MenuProps["items"] = isRetailOnly
    ? [
        {
          key: "RETAIL",
          label: "Retail Bill",
          icon: <ShoppingCartOutlined className="text-blue-500" />,
          onClick: () => addTab("RETAIL"),
        },
      ]
    : [
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

  return (
    <div className="w-full min-h-[100dvh] lg:h-screen bg-gray-50/50 flex flex-col lg:flex-row overflow-x-hidden lg:overflow-hidden">
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
        width={300}
        closable={false}
      >
        <BillingTabs
          onSelectTab={() => setIsMenuOpen(false)}
          onClose={() => setIsMenuOpen(false)}
        />
      </Drawer>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0 lg:h-screen overflow-y-auto lg:overflow-hidden">
        {/* Mobile Header Access */}
        <div className="lg:hidden sticky top-0 z-30 p-2.5 sm:p-4 bg-white/95 backdrop-blur-md border-b border-gray-100 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <Button
              icon={<MenuUnfoldOutlined />}
              onClick={() => setIsMenuOpen(true)}
              className="border-none shadow-none bg-indigo-50 text-indigo-600 font-bold flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs"
            >
              BILLS ({tabs.length})
            </Button>
            {tabs.length > 0 && currentBill && (
              <span className="text-[11px] font-black px-2 py-1 rounded-lg bg-gray-100 text-gray-700">
                #{String(currentBill.id).slice(-4).toUpperCase()}
                <span className="text-[9px] ml-1 text-indigo-600 uppercase font-black">
                  {currentBill.billType === "SUPERWHOLESALE"
                    ? "SW"
                    : currentBill.billType === "WHOLESALE"
                      ? "WS"
                      : "RT"}
                </span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isRetailOnly ? (
              <Button
                type="primary"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => addTab("RETAIL")}
                className="h-9 px-3 rounded-xl bg-indigo-600 border-none font-bold text-xs flex items-center gap-1 shadow-sm shadow-indigo-100"
              >
                New
              </Button>
            ) : (
              <Dropdown
                menu={{ items: addMenuItems }}
                placement="bottomRight"
                trigger={["click"]}
              >
                <Button
                  type="primary"
                  size="small"
                  icon={<PlusOutlined />}
                  className="h-9 px-3 rounded-xl bg-indigo-600 border-none font-bold text-xs flex items-center gap-1 shadow-sm shadow-indigo-100"
                >
                  New
                </Button>
              </Dropdown>
            )}
            <div className="text-right hidden sm:block">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block leading-none">
                Billing
              </span>
              <span className="text-[10px] font-bold text-gray-400">v2.0</span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col p-2.5 sm:p-4 lg:p-8 max-w-[1400px] mx-auto w-full min-h-0 lg:overflow-hidden">
          {tabs.length > 0 ? (
            <>
              <BillingHeader />
              <BillingBody />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center py-6 sm:py-12">
              <div className="text-center p-5 sm:p-8 bg-white/80 backdrop-blur-sm rounded-3xl sm:rounded-[40px] border-2 border-gray-50 max-w-lg w-full shadow-2xl shadow-gray-100 mx-2">
                <div className="bg-indigo-50 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-[30px] flex items-center justify-center mx-auto mb-6 sm:mb-8 text-indigo-600 shadow-inner">
                  <PlusOutlined style={{ fontSize: 28 }} />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-gray-800 mb-1.5 sm:mb-2">
                  Start a New Bill
                </h3>
                <p className="text-gray-400 text-xs sm:text-sm font-medium mb-6 sm:mb-10">
                  Choose bill type to begin billing
                </p>

                <div className="space-y-3 sm:space-y-4">
                  {[
                    {
                      type: "RETAIL",
                      icon: <ShoppingCartOutlined />,
                      title: "Retail Bill",
                      desc: "Normal customer pricing",
                      color: "blue",
                    },
                    ...(!isRetailOnly
                      ? [
                          {
                            type: "WHOLESALE",
                            icon: <ShopOutlined />,
                            title: "Wholesale Bill",
                            desc: "Bulk wholesale pricing",
                            color: "green",
                          },
                          {
                            type: "SUPERWHOLESALE",
                            icon: <ThunderboltOutlined />,
                            title: "Super Wholesale Bill",
                            desc: "Special dealer pricing",
                            color: "purple",
                          },
                        ]
                      : []),
                  ].map((opt) => (
                    <div
                      key={opt.type}
                      onClick={() => addTab(opt.type as any)}
                      className="group flex items-center gap-3.5 sm:gap-5 p-3.5 sm:p-5 bg-white border-2 border-gray-50 rounded-2xl sm:rounded-3xl cursor-pointer transition-all hover:border-indigo-600 hover:shadow-xl hover:shadow-indigo-50 active:scale-[0.98]"
                    >
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gray-50 group-hover:bg-indigo-50 flex items-center justify-center text-gray-400 group-hover:text-indigo-600 transition-colors text-lg sm:text-xl shrink-0">
                        {opt.icon}
                      </div>
                      <div className="text-left min-w-0">
                        <h4 className="font-bold text-gray-800 group-hover:text-indigo-600 transition-colors m-0 text-sm sm:text-base leading-tight">
                          {opt.title}
                        </h4>
                        <p className="text-[11px] sm:text-xs text-gray-400 font-medium m-0 mt-0.5 sm:mt-1 uppercase tracking-wider truncate">
                          {opt.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 sm:mt-10 sm:pt-8 border-t border-gray-50 lg:hidden">
                  <Button
                    type="text"
                    icon={<MenuUnfoldOutlined />}
                    onClick={() => setIsMenuOpen(true)}
                    className="text-gray-400 font-bold text-xs uppercase tracking-widest hover:text-indigo-600"
                  >
                    Open Active Bills
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
