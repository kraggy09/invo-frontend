import { BrowserRouter } from "react-router-dom";
import { ConfigProvider, App } from "antd";
import { SocketProvider } from "./contexts/SocketContext";
import GlobalSocketHandlers from "./components/GlobalSocketHandlers";
import AppRoutes from "./routes";

function AppWrapper() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#1890ff",
        },
      }}
    >
      <App>
        <SocketProvider>
          <GlobalSocketHandlers>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </GlobalSocketHandlers>
        </SocketProvider>
      </App>
    </ConfigProvider>
  );
}

export default AppWrapper;
