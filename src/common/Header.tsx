import { useNavigate, useLocation } from "react-router-dom";
import { useState, useMemo } from "react";
import { Dropdown, Menu, Avatar, Drawer, Button, Tag, Modal, List } from "antd";
import type { MenuProps } from "antd";
import {
  UserOutlined,
  LogoutOutlined,
  DashboardOutlined,
  CalendarOutlined,
  SwapOutlined,
  TeamOutlined,
  FileTextOutlined,
  ShoppingOutlined,
  BarcodeOutlined,
  RollbackOutlined,
  AppstoreOutlined,
  MenuOutlined,
  HistoryOutlined,
  BellOutlined,
  PlusOutlined,
  DatabaseOutlined,
  ShopOutlined,
  RightOutlined,
  SafetyCertificateOutlined,
  PlusCircleOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { message } from "../utils/antdStatic";
import apiCaller from "../utils/apiCaller";
import useUserStore, { ShopOption } from "../store/user.store";
import { useSocket } from "../contexts/SocketContext";
import { resetAllStores, resetShopScopedStores } from "../utils/resetAllStores";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);
  const [switchShopModalVisible, setSwitchShopModalVisible] = useState(false);
  const [switchingShop, setSwitchingShop] = useState(false);

  const { user, availableShops, setUser } = useUserStore();
  const { disconnect, connect } = useSocket();

  const hasRole = (roles?: string[]) => {
    if (!roles || roles.length === 0) return true;
    return user?.roles?.some((role) => roles.includes(role)) ?? false;
  };

  const isSuperAdminOrCreator = hasRole(["SUPER_ADMIN", "CREATOR"]);
  const canReconcileStock = hasRole(["SUPER_ADMIN", "ADMIN", "CREATOR"]);
  const canManageCategories = hasRole(["SUPER_ADMIN", "CREATOR"]);

  const shopName = user?.shopName;

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === "logout") {
      disconnect();
      resetAllStores();
      window.location.href = "/login";
    } else if (key === "switch-shop") {
      setSwitchShopModalVisible(true);
    } else {
      navigate(key);
    }
    setMobileMenuVisible(false);
  };

  const handleSwitchShop = async (targetShopId: string) => {
    if (targetShopId === user?.shopId) {
      setSwitchShopModalVisible(false);
      return;
    }

    setSwitchingShop(true);
    try {
      const response = await apiCaller.post("/users/switch-shop", {
        shopId: targetShopId,
      });
      if (response.data?.success) {
        const { user: updatedUser, token } = response.data.data;
        localStorage.setItem("token", token);

        resetShopScopedStores();

        setUser({
          ...user,
          ...updatedUser,
          token: token,
          shopId: updatedUser.shopId,
          shopName: updatedUser.shopName,
          shopAddress: updatedUser.shopAddress || "",
          shopPhone: updatedUser.shopPhone || "",
          roles: updatedUser.roles,
          shopSettings: updatedUser.shopSettings,
        });

        disconnect();
        setTimeout(() => {
          connect();
        }, 100);

        message.success(`Switched to ${updatedUser.shopName}`);
        setSwitchShopModalVisible(false);
        setMobileMenuVisible(false);
        navigate("/");
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to switch shop");
    } finally {
      setSwitchingShop(false);
    }
  };

  // Avatar Menu items with spacious layout & side-flyout submenus
  const avatarMenuItems: MenuProps["items"] = useMemo(() => {
    const items: MenuProps["items"] = [
      {
        key: "user-profile-header",
        disabled: true,
        label: (
          <div className="py-2 px-2 cursor-default text-gray-800">
            <div className="font-bold text-sm text-gray-900 tracking-tight">
              {user?.username || "User"}
            </div>
            <div className="text-xs text-gray-500 truncate max-w-[200px] mt-0.5">
              {shopName || "Active Shop"}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {user?.roles?.map((r) => (
                <Tag
                  key={r}
                  color="blue"
                  className="text-[10px] m-0 font-medium px-1.5 py-0.5 rounded"
                >
                  {r}
                </Tag>
              ))}
            </div>
          </div>
        ),
      },
      { type: "divider" },
      // Direct Link 1: Dashboard
      {
        key: "/",
        icon: <DashboardOutlined className="text-base text-indigo-500" />,
        label: (
          <span className="font-medium text-sm py-1 inline-block">
            Dashboard
          </span>
        ),
      },
      // Direct Link 2: Daily Report
      {
        key: "/daily-report",
        icon: <CalendarOutlined className="text-base text-emerald-500" />,
        label: (
          <span className="font-medium text-sm py-1 inline-block">
            Daily Report
          </span>
        ),
      },
      // Direct Link 3: Products (brought out for quick direct access)
      {
        key: "/products",
        icon: <ShoppingOutlined className="text-base text-blue-500" />,
        label: (
          <span className="font-medium text-sm py-1 inline-block">
            Products
          </span>
        ),
      },
      // Direct Link 4: Customers (brought out for quick direct access)
      {
        key: "/customers",
        icon: <TeamOutlined className="text-base text-amber-500" />,
        label: (
          <span className="font-medium text-sm py-1 inline-block">
            Customers
          </span>
        ),
      },
      { type: "divider" },
      // Side Flyout Sub-menu 1: Bills & Returns
      {
        key: "bills-returns-sub",
        icon: <FileTextOutlined className="text-base text-indigo-500" />,
        label: (
          <span className="font-medium text-sm py-1 inline-block">
            Bills & Returns
          </span>
        ),
        children: [
          {
            key: "/bills",
            icon: <FileTextOutlined className="text-sm" />,
            label: (
              <span className="font-medium text-sm py-1 inline-block">
                Bills & Invoices
              </span>
            ),
          },
          {
            key: "/returns",
            icon: <RollbackOutlined className="text-sm" />,
            label: (
              <span className="font-medium text-sm py-1 inline-block">
                Sales Returns
              </span>
            ),
          },
        ],
      },
      // Side Flyout Sub-menu 2: Stock Management
      {
        key: "stock-sub",
        icon: <DatabaseOutlined className="text-base text-teal-500" />,
        label: (
          <span className="font-medium text-sm py-1 inline-block">
            Stock Management
          </span>
        ),
        children: [
          {
            key: "/products/updateStock",
            icon: <DatabaseOutlined className="text-sm" />,
            label: (
              <span className="font-medium text-sm py-1 inline-block">
                Update Stock
              </span>
            ),
          },
          ...(canReconcileStock
            ? [
                {
                  key: "/products/reconcile",
                  icon: (
                    <SafetyCertificateOutlined className="text-sm text-purple-500" />
                  ),
                  label: (
                    <span className="font-medium text-sm py-1 inline-block">
                      Reconcile Stock
                    </span>
                  ),
                },
              ]
            : []),
          ...(canManageCategories
            ? [
                {
                  key: "/categories",
                  icon: (
                    <AppstoreOutlined className="text-sm text-orange-500" />
                  ),
                  label: (
                    <span className="font-medium text-sm py-1 inline-block">
                      Categories
                    </span>
                  ),
                },
              ]
            : []),
          {
            key: "/barcode",
            icon: <BarcodeOutlined className="text-sm text-sky-500" />,
            label: (
              <span className="font-medium text-sm py-1 inline-block">
                Barcode Generator
              </span>
            ),
          },
        ],
      },
      // Side Flyout Sub-menu 3: Suppliers & Purchases
      {
        key: "parties-sub",
        icon: <ShopOutlined className="text-base text-amber-500" />,
        label: (
          <span className="font-medium text-sm py-1 inline-block">
            Suppliers & Purchases
          </span>
        ),
        children: [
          {
            key: "/suppliers",
            icon: <ShopOutlined className="text-sm" />,
            label: (
              <span className="font-medium text-sm py-1 inline-block">
                Suppliers
              </span>
            ),
          },
          {
            key: "/supplier-purchases",
            icon: <DatabaseOutlined className="text-sm" />,
            label: (
              <span className="font-medium text-sm py-1 inline-block">
                Supplier Purchases
              </span>
            ),
          },
        ],
      },
    ];

    // Direct Admin Links (if role allows)
    if (isSuperAdminOrCreator) {
      items.push(
        { type: "divider" },
        {
          key: "/journey-logs",
          icon: <HistoryOutlined className="text-base text-cyan-500" />,
          label: (
            <span className="font-medium text-sm py-1 inline-block">
              Activity History
            </span>
          ),
        },
        {
          key: "/members",
          icon: <TeamOutlined className="text-base text-indigo-500" />,
          label: (
            <span className="font-medium text-sm py-1 inline-block">
              Members
            </span>
          ),
        },
        {
          key: "/notifications",
          icon: <BellOutlined className="text-base text-rose-500" />,
          label: (
            <span className="font-medium text-sm py-1 inline-block">
              Notifications
            </span>
          ),
        },
      );
    }

    // Switch Shop
    if (availableShops && availableShops.length > 1) {
      items.push(
        { type: "divider" },
        {
          key: "switch-shop",
          icon: <ShopOutlined className="text-base text-indigo-500" />,
          label: (
            <span className="font-medium text-sm text-indigo-600 py-1 inline-block">
              Switch Shop
            </span>
          ),
        },
      );
    }

    // Logout
    items.push(
      { type: "divider" },
      {
        key: "logout",
        icon: <LogoutOutlined className="text-base text-red-500" />,
        label: (
          <span className="text-red-600 font-semibold text-sm py-1 inline-block">
            Logout
          </span>
        ),
      },
    );

    return items;
  }, [
    user,
    shopName,
    availableShops,
    canReconcileStock,
    canManageCategories,
    isSuperAdminOrCreator,
  ]);

  // Sidebar Drawer Items with clean spacing
  const drawerMenuItems: MenuProps["items"] = useMemo(() => {
    const items: MenuProps["items"] = [
      {
        key: "/",
        icon: <DashboardOutlined className="text-base text-indigo-500" />,
        label: <span className="font-medium text-sm">Dashboard</span>,
      },
      {
        key: "/daily-report",
        icon: <CalendarOutlined className="text-base text-emerald-500" />,
        label: <span className="font-medium text-sm">Daily Report</span>,
      },
      {
        key: "/products",
        icon: <ShoppingOutlined className="text-base text-blue-500" />,
        label: <span className="font-medium text-sm">Products</span>,
      },
      {
        key: "/customers",
        icon: <TeamOutlined className="text-base text-amber-500" />,
        label: <span className="font-medium text-sm">Customers</span>,
      },
      { type: "divider" },
      {
        key: "drawer-bills-returns",
        icon: <FileTextOutlined className="text-base text-indigo-500" />,
        label: (
          <span className="font-semibold text-gray-800">Bills & Returns</span>
        ),
        children: [
          {
            key: "/bills",
            icon: <FileTextOutlined />,
            label: "Bills & Invoices",
          },
          {
            key: "/returns",
            icon: <RollbackOutlined />,
            label: "Sales Returns",
          },
        ],
      },
      {
        key: "drawer-stock",
        icon: <DatabaseOutlined className="text-base text-teal-500" />,
        label: (
          <span className="font-semibold text-gray-800">Stock Management</span>
        ),
        children: [
          {
            key: "/products/updateStock",
            icon: <DatabaseOutlined />,
            label: "Update Stock",
          },
          ...(canReconcileStock
            ? [
                {
                  key: "/products/reconcile",
                  icon: <SafetyCertificateOutlined />,
                  label: "Reconcile Stock",
                },
              ]
            : []),
          ...(canManageCategories
            ? [
                {
                  key: "/categories",
                  icon: <AppstoreOutlined />,
                  label: "Categories",
                },
              ]
            : []),
          {
            key: "/barcode",
            icon: <BarcodeOutlined />,
            label: "Barcode Generator",
          },
        ],
      },
      {
        key: "drawer-parties",
        icon: <ShopOutlined className="text-base text-amber-500" />,
        label: (
          <span className="font-semibold text-gray-800">
            Suppliers & Purchases
          </span>
        ),
        children: [
          { key: "/suppliers", icon: <ShopOutlined />, label: "Suppliers" },
          {
            key: "/supplier-purchases",
            icon: <DatabaseOutlined />,
            label: "Supplier Purchases",
          },
        ],
      },
    ];

    if (isSuperAdminOrCreator) {
      items.push(
        { type: "divider" },
        {
          key: "/journey-logs",
          icon: <HistoryOutlined />,
          label: "Activity History",
        },
        { key: "/members", icon: <TeamOutlined />, label: "Members" },
        {
          key: "/notifications",
          icon: <BellOutlined />,
          label: "Notifications",
        },
      );
    }

    return items;
  }, [canReconcileStock, canManageCategories, isSuperAdminOrCreator]);

  return (
    <div className="h-16 bg-neutral-900 text-white w-full flex items-center shadow-sm sticky top-0 z-50">
      <div className="w-full h-full max-w-[1360px] mx-auto flex items-center justify-between px-4 sm:px-6">
        {/* Left Section: Sidebar Toggle, Logo & Current Shop */}
        <div className="flex items-center gap-4">
          <Button
            type="text"
            style={{ color: "white" }}
            className="text-white hover:text-indigo-400 hover:bg-white/10 flex items-center justify-center p-0 h-10 w-10 rounded-xl transition-colors cursor-pointer"
            icon={<MenuOutlined style={{ fontSize: "20px", color: "white" }} />}
            onClick={() => setMobileMenuVisible(true)}
            title="Open Navigation Menu"
          />
          <h1
            className="text-2xl sm:text-3xl font-bold tracking-tight select-none cursor-pointer flex items-center gap-1.5 hover:text-indigo-300 transition-colors"
            onClick={() => navigate("/")}
          >
            <span>InvoSync</span>
          </h1>

          {shopName && (
            <div
              onClick={() => {
                if (availableShops && availableShops.length > 1) {
                  setSwitchShopModalVisible(true);
                }
              }}
              className={`hidden sm:flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full border border-white/20 transition-all ${
                availableShops && availableShops.length > 1
                  ? "cursor-pointer hover:bg-white/20 hover:border-indigo-400"
                  : ""
              }`}
              title={
                availableShops && availableShops.length > 1
                  ? "Click to switch shop"
                  : undefined
              }
            >
              <ShopOutlined className="text-indigo-300 text-xs" />
              <span className="text-xs font-semibold text-white/90 truncate max-w-[130px]">
                {shopName}
              </span>
              {availableShops && availableShops.length > 1 && (
                <span className="text-[10px] text-indigo-300 font-bold ml-0.5">
                  ▾
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right Section: ONLY the 3 Quick Actions at the top + Side-Hover Sub-menu Avatar */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* The 3 Important Actions (Always at the top for fast direct access, with generous spacing) */}
          <div className="hidden lg:flex items-center gap-4 xl:gap-5 mr-3">
            {/* 1. New Bill */}
            <div
              onClick={() => navigate("/new-bill")}
              className={`flex items-center gap-2.5 cursor-pointer hover:bg-white/10 px-3.5 py-2 rounded-xl transition-all border border-transparent hover:border-white/20 active:scale-95 group ${
                location.pathname === "/new-bill"
                  ? "bg-white/15 border-white/20 shadow-xs"
                  : ""
              }`}
            >
              <PlusOutlined className="text-base group-hover:scale-110 transition-transform text-emerald-400" />
              <span className="font-semibold tracking-wide text-sm uppercase">
                New Bill
              </span>
            </div>

            {/* 2. Transactions */}
            <div
              onClick={() => navigate("/transactions")}
              className={`flex items-center gap-2.5 cursor-pointer hover:bg-white/10 px-3.5 py-2 rounded-xl transition-all border border-transparent hover:border-white/20 active:scale-95 group ${
                location.pathname === "/transactions"
                  ? "bg-white/15 border-white/20 shadow-xs"
                  : ""
              }`}
            >
              <SwapOutlined className="text-base group-hover:scale-110 transition-transform text-blue-400" />
              <span className="font-semibold tracking-wide text-sm uppercase">
                Transactions
              </span>
            </div>

            {/* 3. Update Stock */}
            <div
              onClick={() => navigate("/products/updateStock")}
              className={`flex items-center gap-2.5 cursor-pointer hover:bg-white/10 px-3.5 py-2 rounded-xl transition-all border border-transparent hover:border-white/20 active:scale-95 group ${
                location.pathname === "/products/updateStock"
                  ? "bg-white/15 border-white/20 shadow-xs"
                  : ""
              }`}
            >
              <DatabaseOutlined className="text-lg group-hover:scale-110 transition-transform text-teal-400" />
              <span className="font-semibold tracking-wide text-sm uppercase">
                Update Stock
              </span>
            </div>
          </div>

          {/* User Profile Avatar with Hover Sub-menus (Spacious side-flyout menu) */}
          <Dropdown
            menu={{
              items: avatarMenuItems,
              onClick: handleMenuClick,
              style: {
                minWidth: 235,
                borderRadius: 14,
                padding: "8px 6px",
                boxShadow:
                  "0 10px 30px -5px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
              },
            }}
            trigger={["hover", "click"]}
            placement="bottomRight"
          >
            <div className="flex items-center cursor-pointer select-none p-1 rounded-full hover:ring-2 hover:ring-white/25 transition-all">
              <Avatar
                size={40}
                icon={<UserOutlined style={{ fontSize: 22 }} />}
                style={{
                  background: "#23272f",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              />
            </div>
          </Dropdown>
        </div>
      </div>

      {/* Sidebar Navigation Drawer (Spacious Accordion Model) */}
      <Drawer
        title={
          <div className="flex items-center  justify-between w-full pr-1">
            <div className="flex flex-col items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-gray-900">
                InvoSync Menu
              </span>
              <span>
                {shopName && (
                  <Tag color="indigo" className="text-xs font-semibold m-0">
                    {shopName}
                  </Tag>
                )}
              </span>
            </div>
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={() => setMobileMenuVisible(false)}
              className="text-gray-400 hover:text-gray-600"
            />
          </div>
        }
        closeIcon={null}
        placement="left"
        onClose={() => setMobileMenuVisible(false)}
        open={mobileMenuVisible}
        width={310}
        styles={{
          body: {
            padding: 0,
            display: "flex",
            flexDirection: "column",
            height: "100%",
          },
        }}
        footer={
          <div className="p-3.5 bg-gray-50 border-t border-gray-100 flex flex-col gap-2.5">
            {/* User Info Bar */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2.5">
                <Avatar
                  size={34}
                  icon={<UserOutlined />}
                  style={{ background: "#1f2937" }}
                />
                <div className="leading-tight">
                  <div className="text-xs font-bold text-gray-800">
                    {user?.username || "User"}
                  </div>
                  <div className="text-[11px] text-gray-500 capitalize">
                    {user?.roles?.[0] || "Staff"}
                  </div>
                </div>
              </div>

              {availableShops && availableShops.length > 1 && (
                <Button
                  size="small"
                  icon={<ShopOutlined />}
                  onClick={() => {
                    setMobileMenuVisible(false);
                    setSwitchShopModalVisible(true);
                  }}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                >
                  Switch
                </Button>
              )}
            </div>

            {/* Logout Button */}
            <Button
              danger
              block
              icon={<LogoutOutlined />}
              onClick={() => handleMenuClick({ key: "logout" })}
              className="font-semibold mt-1 h-9 rounded-xl"
            >
              Logout
            </Button>
          </div>
        }
      >
        <div className="flex-1 overflow-y-auto">
          {/* Quick Shortcuts Section */}
          <div className="p-3.5 border-b border-gray-100 bg-gray-50/70 flex flex-col gap-2.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-1">
              Quick Shortcuts
            </div>
            <button
              onClick={() => {
                navigate("/new-bill");
                setMobileMenuVisible(false);
              }}
              className={`w-full flex items-center justify-between py-2.5 px-3.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
                location.pathname === "/new-bill"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-white border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/40 text-gray-800"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <PlusCircleOutlined className="text-base text-indigo-500" />
                <span>New Bill</span>
              </div>
              <Tag color="indigo" className="text-[10px] m-0">
                POS
              </Tag>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  navigate("/transactions");
                  setMobileMenuVisible(false);
                }}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                  location.pathname === "/transactions"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-white border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/40 text-gray-700"
                }`}
              >
                <SwapOutlined className="text-sm text-blue-500" />
                <span>Transactions</span>
              </button>

              <button
                onClick={() => {
                  navigate("/products/updateStock");
                  setMobileMenuVisible(false);
                }}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                  location.pathname === "/products/updateStock"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-white border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/40 text-gray-700"
                }`}
              >
                <DatabaseOutlined className="text-sm text-teal-500" />
                <span>Update Stock</span>
              </button>
            </div>
          </div>

          {/* Inline Navigation Menu with comfortable row spacing */}
          <div className="py-2">
            <Menu
              mode="inline"
              selectedKeys={[location.pathname]}
              onClick={handleMenuClick}
              style={{ borderRight: 0 }}
              items={drawerMenuItems}
              className="font-medium text-sm"
            />
          </div>
        </div>
      </Drawer>

      {/* Switch Shop Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-lg font-bold">
            <ShopOutlined className="text-indigo-600" />
            <span>Switch Active Shop</span>
          </div>
        }
        open={switchShopModalVisible}
        onCancel={() => setSwitchShopModalVisible(false)}
        footer={null}
        destroyOnClose
        centered
      >
        <p className="text-sm text-gray-500 mb-4">
          Select a shop to switch your active workspace session:
        </p>
        <List
          loading={switchingShop}
          dataSource={availableShops}
          renderItem={(shop: ShopOption) => {
            const isCurrent = shop.shopId === user?.shopId;
            return (
              <List.Item
                key={shop.shopId}
                onClick={() => !isCurrent && handleSwitchShop(shop.shopId)}
                className={`p-3.5 rounded-xl border mb-2 transition-all ${
                  isCurrent
                    ? "bg-indigo-50 border-indigo-200 cursor-default"
                    : "hover:bg-gray-50 cursor-pointer border-gray-100 hover:border-indigo-200"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800">
                        {shop.shopName}
                      </span>
                      {isCurrent && (
                        <Tag color="indigo" className="text-[10px]">
                          Current
                        </Tag>
                      )}
                    </div>
                    <div className="flex gap-1.5 mt-1.5">
                      {shop.roles?.map((r) => (
                        <Tag key={r} className="text-[10px] m-0">
                          {r}
                        </Tag>
                      ))}
                    </div>
                  </div>
                  {!isCurrent && <RightOutlined className="text-gray-400" />}
                </div>
              </List.Item>
            );
          }}
        />
      </Modal>
    </div>
  );
};

export default Header;
