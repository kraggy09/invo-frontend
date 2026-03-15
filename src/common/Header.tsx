import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Dropdown, Menu, Avatar, Drawer, Button } from "antd";
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
} from "@ant-design/icons";

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
  },
  {
    label: "Journey Logs",
    path: "/journey-logs",
    icon: <HistoryOutlined className="text-base mr-2" />,
  },
  {
    label: "Members",
    path: "/members",
    icon: <TeamOutlined className="text-base mr-2" />,
  },
];

const Header = () => {
  const navigate = useNavigate();
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === "logout") {
      localStorage.clear();
      navigate("/login");
    } else {
      navigate(key);
    }
    setMobileMenuVisible(false);
  };

  const menu = (
    <Menu
      onClick={handleMenuClick}
      style={{
        minWidth: 200,
        borderRadius: 10,
        overflow: "hidden",
        padding: 4,
      }}
      items={[
        ...navLinks.map((item) => ({
          key: item.path,
          label: (
            <span className="flex items-center gap-2 py-1.5 px-1 text-base">
              {item.icon}
              <span>{item.label}</span>
            </span>
          ),
        })),
        { type: "divider" },
        {
          key: "logout",
          label: (
            <span className="text-red-600 font-semibold flex items-center gap-2 py-1.5 px-1">
              <LogoutOutlined /> Logout
            </span>
          ),
        },
      ]}
    />
  );

  return (
    <div className="h-16 bg-neutral-900 text-white w-full flex items-center shadow-sm sticky top-0 z-50">
      <div className="w-full h-full max-w-[1320px] mx-auto flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Button
            type="text"
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
        </div>

        <div className="flex items-center gap-4">

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
            ...navLinks.map((item) => ({
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
    </div>
  );
};

export default Header;
