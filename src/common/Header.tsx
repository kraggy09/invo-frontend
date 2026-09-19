import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Dropdown, Menu, Avatar, Drawer, Button, Tag, Modal, List } from "antd";
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
} from "@ant-design/icons";
import { message } from "../utils/antdStatic";
import apiCaller from "../utils/apiCaller";
import useUserStore, { ShopOption } from "../store/user.store";
import { useSocket } from "../contexts/SocketContext";

const navLinks = [
  {
    label: "Dashboard",
    path: "/",
    icon: <DashboardOutlined className="text-base mr-2" />,
  },
  {
    label: "Daily Report",
    path: "/daily-report",
    icon: <CalendarOutlined className="text-base mr-2" />,
  },
  {
    label: "Transactions",
    path: "/transactions",
    icon: <SwapOutlined className="text-base mr-2" />,
  },
  {
    label: "Customers",
    path: "/customers",
    icon: <TeamOutlined className="text-base mr-2" />,
  },
  {
    label: "Bills",
    path: "/bills",
    icon: <FileTextOutlined className="text-base mr-2" />,
  },
  {
    label: "Products",
    path: "/products",
    icon: <ShoppingOutlined className="text-base mr-2" />,
  },
  {
    label: "Barcode",
    path: "/barcode",
    icon: <BarcodeOutlined className="text-base mr-2" />,
  },
  {
    label: "Returns",
    path: "/returns",
    icon: <RollbackOutlined className="text-base mr-2" />,
  },
  {
    label: "Categories",
    path: "/categories",
    icon: <AppstoreOutlined className="text-base mr-2" />,
    roles: ["SUPER_ADMIN", "CREATOR"],
  },
  {
    label: "Journey Logs",
    path: "/journey-logs",
    icon: <HistoryOutlined className="text-base mr-2" />,
    roles: ["SUPER_ADMIN", "CREATOR"],
  },
  {
    label: "Members",
    path: "/members",
    icon: <TeamOutlined className="text-base mr-2" />,
    roles: ["SUPER_ADMIN", "CREATOR"],
  },
  {
    label: "Notifications",
    path: "/notifications",
    icon: <BellOutlined className="text-base mr-2" />,
    roles: ["SUPER_ADMIN", "CREATOR"],
  },
];

const Header = () => {
  const navigate = useNavigate();
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);
  const [switchShopModalVisible, setSwitchShopModalVisible] = useState(false);
  const [switchingShop, setSwitchingShop] = useState(false);

  const { user, availableShops, setUser, logout } = useUserStore();
  const { disconnect, connect } = useSocket();

  const filteredNavLinks = navLinks.filter((link) => {
    if (!link.roles) return true;
    return user?.roles?.some((role) => link.roles?.includes(role));
  });

  const shopName = user?.shopName;

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === "logout") {
      disconnect();
      localStorage.clear();
      logout();
      navigate("/login");
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
      const response = await apiCaller.post("/users/switch-shop", { shopId: targetShopId });
      if (response.data?.success) {
        const { user: updatedUser, token } = response.data.data;
        localStorage.setItem("token", token);
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

        // Reconnect socket to leave old shop room and join new shop room
        disconnect();
        setTimeout(() => {
          connect();
        }, 100);

        message.success(`Switched to ${updatedUser.shopName}`);
        setSwitchShopModalVisible(false);
        navigate("/");
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to switch shop");
    } finally {
      setSwitchingShop(false);
    }
  };

  const menuItems: any[] = [
    ...filteredNavLinks.map((item) => ({
      key: item.path,
      label: (
        <span className="flex items-center gap-2 py-1.5 px-1 text-base">
          {item.icon}
          <span>{item.label}</span>
        </span>
      ),
    })),
  ];

  if (availableShops && availableShops.length > 1) {
    menuItems.push(
      { type: "divider" },
      {
        key: "switch-shop",
        label: (
          <span className="flex items-center gap-2 py-1.5 px-1 text-base text-indigo-400 font-medium">
            <ShopOutlined /> Switch Shop
          </span>
        ),
      }
    );
  }

  menuItems.push(
    { type: "divider" },
    {
      key: "logout",
      label: (
        <span className="text-red-600 font-semibold flex items-center gap-2 py-1.5 px-1">
          <LogoutOutlined /> Logout
        </span>
      ),
    }
  );

  const menu = (
    <Menu
      onClick={handleMenuClick}
      style={{
        minWidth: 200,
        borderRadius: 10,
        overflow: "hidden",
        padding: 4,
      }}
      items={menuItems}
    />
  );

  return (
    <div className="h-16 bg-neutral-900 text-white w-full flex items-center shadow-sm sticky top-0 z-50">
      <div className="w-full h-full max-w-[1320px] mx-auto flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Button
            type="text"
            style={{ color: "white" }}
            className="lg:hidden text-white flex items-center justify-center p-0 h-10 w-10"
            icon={<MenuOutlined style={{ fontSize: "20px" }} />}
            onClick={() => setMobileMenuVisible(true)}
          />
          <h1
            className="text-2xl sm:text-3xl font-bold tracking-tight select-none cursor-pointer"
            onClick={() => navigate("/")}
          >
            InvoSync
          </h1>
          {shopName && (
            <div
              onClick={() => {
                if (availableShops && availableShops.length > 1) {
                  setSwitchShopModalVisible(true);
                }
              }}
              className={`hidden sm:flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/20 transition-all ${
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
              <span className="text-xs font-semibold text-white/80 truncate max-w-[120px]">{shopName}</span>
              {availableShops && availableShops.length > 1 && (
                <span className="text-[10px] text-indigo-300 font-bold ml-0.5">▾</span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-6 mr-4">
            <div
              onClick={() => navigate("/new-bill")}
              className="flex items-center gap-2 cursor-pointer hover:bg-white/10 px-3 py-1.5 rounded-lg transition-all border border-transparent hover:border-white/20 active:scale-95 group"
            >
              <PlusOutlined className="text-lg group-hover:scale-110 transition-transform" />
              <span className="font-semibold tracking-wide text-sm uppercase">New Bill</span>
            </div>
            <div
              onClick={() => navigate("/transactions")}
              className="flex items-center gap-2 cursor-pointer hover:bg-white/10 px-3 py-1.5 rounded-lg transition-all border border-transparent hover:border-white/20 active:scale-95 group"
            >
              <SwapOutlined className="text-lg group-hover:scale-110 transition-transform" />
              <span className="font-semibold tracking-wide text-sm uppercase">Transactions</span>
            </div>
            <div
              onClick={() => navigate("/products/updateStock")}
              className="flex items-center gap-2 cursor-pointer hover:bg-white/10 px-3 py-1.5 rounded-lg transition-all border border-transparent hover:border-white/20 active:scale-95 group"
            >
              <DatabaseOutlined className="text-lg group-hover:scale-110 transition-transform" />
              <span className="font-semibold tracking-wide text-sm uppercase">Update Stock</span>
            </div>
          </div>

          <Dropdown overlay={menu} trigger={["click", "hover"]} placement="bottomRight">
            <div className="flex items-center cursor-pointer select-none">
              <Avatar
                size={40}
                icon={<UserOutlined style={{ fontSize: 22 }} />}
                style={{ background: "#23272f" }}
              />
            </div>
          </Dropdown>
        </div>
      </div>

      <Drawer
        title={<span className="text-xl font-bold">InvoSync Menu</span>}
        placement="left"
        onClose={() => setMobileMenuVisible(false)}
        open={mobileMenuVisible}
        width={280}
        bodyStyle={{ padding: 0 }}
      >
        <Menu
          mode="inline"
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
          items={[
            ...filteredNavLinks.map((item) => ({
              key: item.path,
              icon: item.icon,
              label: <span className="text-base font-medium">{item.label}</span>,
            })),
            { type: "divider" },
            {
              key: "logout",
              icon: <LogoutOutlined />,
              label: <span className="text-red-500 font-semibold">Logout</span>,
            },
          ]}
        />
      </Drawer>

      <Modal
        title={
          <div className="flex items-center gap-2 text-lg font-bold">
            <ShopOutlined className="text-indigo-600" />
            <span>Switch Shop</span>
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
                className={`p-3 rounded-xl border mb-2 transition-all ${
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
                    <div className="flex gap-1 mt-1">
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
