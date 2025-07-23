import { useNavigate } from "react-router-dom";
import { Dropdown, Menu, Avatar } from "antd";
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
];

const Header = () => {
  const navigate = useNavigate();

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === "logout") {
      localStorage.clear();
      navigate("/login");
    } else {
      navigate(key);
    }
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
    <div className="h-16 bg-neutral-900 text-white w-full flex items-center shadow-sm">
      <div className="w-full h-full max-w-[1320px] mx-auto flex items-center justify-between px-6">
        <h1 className="text-3xl font-bold tracking-tight select-none">
          InvoSync
        </h1>
        <Dropdown overlay={menu} trigger={["hover"]} placement="bottomRight">
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
  );
};

export default Header;
