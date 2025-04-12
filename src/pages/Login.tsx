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
      const response = await fetchData("/login", {
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

        // Show success message
        message.success("Login successful!");

        setUser({
          _id: response.data.user._id,
          username: response.data.user.username,
          token: response.data.token,
        });

        // Get redirect path
        const from =
          (location.state as { from?: { pathname: string } })?.from?.pathname ||
          "/";

        // Navigate after a short delay to ensure message is shown
        setTimeout(() => {
          navigate(from);
        }, 500);
      }
    } catch (error: unknown) {
      if (error) {
        message.error("Login failed. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 p-4 sm:p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <Title
            level={2}
            className="text-gray-900 text-xl sm:text-2xl md:text-3xl"
          >
            Welcome to InvoSync
          </Title>
          <p className="mt-2 text-sm text-gray-600">
            Please sign in to your account
          </p>
        </div>

        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          className="mt-6 space-y-4 sm:space-y-6"
          layout="vertical"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: "Please input your username!" }]}
          >
            <Input
              prefix={<UserOutlined className="text-gray-400" />}
              placeholder="Username"
              size="large"
              className="h-10 sm:h-12"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: "Please input your password!" }]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="Password"
              size="large"
              className="h-10 sm:h-12"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="w-full h-10 sm:h-12 bg-blue-500 hover:bg-blue-600 text-base"
            >
              Sign in
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center text-sm text-gray-600">
          <p>Don't have an account? Contact your administrator</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
