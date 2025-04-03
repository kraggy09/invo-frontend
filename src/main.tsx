import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConfigProvider as AntdConfigProvider } from "antd";

import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AntdConfigProvider
      theme={{
        token: {
          fontFamily: "'Sora', sans-serif",
        },
      }}
    >
      <App />
    </AntdConfigProvider>
  </StrictMode>
);
