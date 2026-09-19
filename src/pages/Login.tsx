import { Button, Form, Input, Typography, Modal, List, Tag } from "antd";
import { message } from "../utils/antdStatic";
import {
  UserOutlined,
  LockOutlined,
  ShopOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { useSocket } from "../contexts/SocketContext";
import useUserStore, { User, ShopOption } from "../store/user.store";
import { useFetch } from "../hooks/useFetch";
import { useState } from "react";
import axios from "axios";
import apiCaller from "../utils/apiCaller";

const { Title } = Typography;

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

interface LoginRequest {
  username: string;
  password: string;
}

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { connect } = useSocket();
  const {
    setUser,
    setIsAuthenticated,
    setPendingShopSelection,
    setAvailableShops,
    availableShops,
    pendingShopSelection,
    pendingUserId,
    setPendingUserId,
  } = useUserStore((state) => state);
  const { fetchData, loading } = useFetch<any>();
  const [selectingShop, setSelectingShop] = useState(false);

  const handleLoginSuccess = (data: any) => {
    const { user, token, shops } = data;
    localStorage.setItem("token", token);
    localStorage.setItem("isAuthenticated", "true");
    setIsAuthenticated(true);
    if (shops && shops.length > 0) {
      setAvailableShops(shops);
    }
    connect();
    message.success(`Welcome back, ${user.username}!`);

    const newUser: User = {
      _id: user._id,
      username: user.username,
      token: token,
      roles: user.roles,
      pin: user.pin,
      shopId: user.shopId?.toString(),
      shopName: user.shopName,
      shopAddress: user.shopAddress || "",
      shopPhone: user.shopPhone || "",
      shopSettings: user.shopSettings,
    };
    setUser(newUser);

    const from =
      (location.state as { from?: { pathname: string } })?.from?.pathname ||
      "/";
    setTimeout(() => navigate(from), 500);
  };

  const onFinish = async (values: LoginRequest) => {
    try {
      const response = await fetchData("/users/login", {
        method: "POST",
        data: {
          username: values.username,
          password: values.password,
        },
      });

      if (response) {
        const data = response.data;

        console.log(data, "This is the data");

        if (data.requireShopSelection) {
          // User belongs to multiple shops — show shop selection modal
          setAvailableShops(data.shops);
          setPendingUserId(data.userId);
          setPendingShopSelection(true);
        } else {
          // Single shop — auto-login
          handleLoginSuccess(data);
        }
      }
    } catch (error: any) {
      console.log(error, "This is the error");

      message.error(
        error?.response?.data?.message ||
          error?.response?.data?.msg ||
          "Access Denied. Please verify credentials.",
      );
    }
  };

  const handleShopSelect = async (shop: ShopOption) => {
    if (!pendingUserId) return;
    setSelectingShop(true);
    try {
      const response = await apiCaller.post("/users/select-shop", {
        userId: pendingUserId,
        shopId: shop.shopId,
      });
      if (response.data?.success) {
        setPendingShopSelection(false);
        setPendingUserId(null);
        handleLoginSuccess(response.data.data);
      }
    } catch (error: any) {
      message.error(
        error?.response?.data?.message ||
          "Failed to select shop. Please try again.",
      );
    } finally {
      setSelectingShop(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50/50 p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-600 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-[460px] animate-in fade-in zoom-in duration-1000 relative z-10">
        <div className="bg-white rounded-[40px] shadow-2xl shadow-indigo-100/50 overflow-hidden border border-gray-100/50">
          {/* High Impact Header */}
          <div className="bg-indigo-600 p-12 text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000" />
            <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-1000" />

            <div className="relative z-10">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-[28px] mx-auto mb-8 flex items-center justify-center border border-white/20 shadow-2xl group-hover:rotate-6 transition-all duration-500">
                <LockOutlined className="text-white text-4xl" />
              </div>
              <h1 className="text-4xl font-black text-white tracking-tighter leading-tight mb-2">
                InvoSync
              </h1>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-300 animate-pulse" />
                <span className="text-[9px] font-black text-indigo-100 uppercase tracking-[0.2em]">
                  Secured Login
                </span>
              </div>
            </div>
          </div>

          {/* Authentication Layer */}
          <div className="p-10 sm:p-14">
            <div className="mb-10">
              <h2 className="text-2xl font-black text-gray-800 tracking-tighter">
                Login
              </h2>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1.5 leading-relaxed">
                Enter your credentials to login
              </p>
            </div>

            <Form
              name="login"
              onFinish={onFinish}
              layout="vertical"
              className="space-y-6"
              requiredMark={false}
            >
              <Form.Item
                name="username"
                label={
                  <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-1">
                    User ID
                  </span>
                }
                rules={[
                  { required: true, message: "Please enter your User ID" },
                ]}
              >
                <Input
                  prefix={<UserOutlined className="text-indigo-400 mr-2" />}
                  placeholder="Username / Operator ID"
                  className="login-field"
                  autoFocus
                />
              </Form.Item>

              <Form.Item
                name="password"
                label={
                  <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-1">
                    Password
                  </span>
                }
                rules={[{ required: true, message: "Password is required" }]}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-indigo-400 mr-2" />}
                  placeholder="••••••••••••"
                  className="login-field"
                />
              </Form.Item>

              <Form.Item className="pt-6 mb-0">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  className="w-full h-16 bg-indigo-600 hover:bg-indigo-700 border-none rounded-[24px] text-xs font-black tracking-[0.2em] shadow-xl shadow-indigo-200 transition-all hover:translate-y-[-2px] active:scale-95 uppercase"
                >
                  Login
                </Button>
              </Form.Item>
            </Form>

            <div className="mt-12 pt-6 border-t border-gray-50 text-center">
              <p className="text-[10px] font-black text-indigo-500/50 uppercase tracking-widest">
                Contact System Administrator for credentials
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Shop Selection Modal */}
      <Modal
        open={pendingShopSelection}
        onCancel={() => setPendingShopSelection(false)}
        footer={null}
        centered
        title={
          <div className="flex items-center gap-3 py-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <ShopOutlined className="text-white text-lg" />
            </div>
            <div>
              <div className="font-black text-gray-800 text-base">
                Select a Shop
              </div>
              <div className="text-xs text-gray-400">
                You have access to multiple shops
              </div>
            </div>
          </div>
        }
        closable={!selectingShop}
        maskClosable={!selectingShop}
      >
        <List
          dataSource={availableShops}
          renderItem={(shop: ShopOption) => (
            <List.Item
              onClick={() => handleShopSelect(shop)}
              className="cursor-pointer hover:bg-indigo-50 rounded-xl px-4 transition-all border border-transparent hover:border-indigo-100 mb-2"
              style={{ borderRadius: 12, padding: "12px 16px" }}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <ShopOutlined className="text-indigo-600 text-base" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-800">
                      {shop.shopName}
                    </div>
                    <div className="flex gap-1 mt-0.5">
                      {shop.roles.map((role) => (
                        <Tag key={role} color="blue" className="text-xs m-0">
                          {role}
                        </Tag>
                      ))}
                    </div>
                  </div>
                </div>
                <RightOutlined className="text-gray-300" />
              </div>
            </List.Item>
          )}
        />
      </Modal>

      <style>{`
        .login-field {
          height: 60px !important;
          border-radius: 20px !important;
          border: 2px solid #f8fafc !important;
          background: #f8fafc !important;
          font-weight: 900 !important;
          font-size: 14px !important;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
          padding: 0 24px !important;
        }
        .login-field:hover, .login-field:focus {
          border-color: #e2e8f0 !important;
          background: #fff !important;
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.05) !important;
        }
        .login-field-focused {
           border-color: #6366f1 !important;
           background: #fff !important;
        }
        .login-field .ant-input-prefix { color: #6366f1 !important; }
        .login-field .ant-input-password-icon { color: #94a3b8 !important; }
      `}</style>
    </main>
  );
};

export default Login;
