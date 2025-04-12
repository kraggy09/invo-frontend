import { BrowserRouter } from "react-router-dom";
import { ConfigProvider } from "antd";
import { SocketProvider } from "./contexts/SocketContext";
import GlobalSocketHandlers from "./components/GlobalSocketHandlers";
import AppRoutes from "./routes";

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#1890ff",
        },
      }}
    >
      <SocketProvider>
        <GlobalSocketHandlers>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </GlobalSocketHandlers>
      </SocketProvider>
    </ConfigProvider>
  );
}

export default App;
