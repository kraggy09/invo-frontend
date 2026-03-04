import { Button, Form, Input, Typography, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { useSocket } from "../contexts/SocketContext";
import useUserStore from "../store/user.store";
import { useFetch } from "../hooks/useFetch";

const { Title } = Typography;

interface LoginResponse {
  data: {
    token: string;
    user: {
      _id: string;
      username: string;
    };
  };
}

interface LoginRequest {
  username: string;
  password: string;
}

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { connect } = useSocket();
  const { setUser, setIsAuthenticated } = useUserStore((state) => state);
  const { fetchData, loading } = useFetch<LoginResponse>();

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
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("isAuthenticated", "true");
        setIsAuthenticated(true);
        connect();

        message.success("Success! Session synchronized.");

        setUser({
          _id: response.data.user._id,
          username: response.data.user.username,
          token: response.data.token,
        });

        const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/";
        setTimeout(() => navigate(from), 500);
      }
    } catch (error: unknown) {
      message.error("Access Denied. Please verify credentials.");
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
              <h1 className="text-4xl font-black text-white tracking-tighter leading-tight mb-2">InvoSync</h1>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-300 animate-pulse" />
                <span className="text-[9px] font-black text-indigo-100 uppercase tracking-[0.2em]">Authorized Terminal Access</span>
              </div>
            </div>
          </div>

          {/* Authentication Layer */}
          <div className="p-10 sm:p-14">
            <div className="mb-10">
              <h2 className="text-2xl font-black text-gray-800 tracking-tighter">Identity Validation</h2>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1.5 leading-relaxed">Cross-reference security parameters to initialize session</p>
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
                label={<span className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-1">Identity UID</span>}
                rules={[{ required: true, message: "Registry identifier required" }]}
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
                label={<span className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-1">Secure Key Hash</span>}
                rules={[{ required: true, message: "Cryptography key mismatch" }]}
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
                  Synchronize Access
                </Button>
              </Form.Item>
            </Form>

            <div className="mt-12 pt-10 border-t border-gray-50 text-center">
              <div className="inline-block px-4 py-1.5 bg-gray-50 rounded-xl text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">
                Core Engine v2.4.0-Stable
              </div>
              <p className="text-[10px] font-black text-indigo-500/50 uppercase tracking-widest">
                Contact System Administrator for credentials
              </p>
            </div>
          </div>
        </div>
      </div>

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
