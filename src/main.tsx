import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConfigProvider as AntdConfigProvider } from "antd";

import "./index.css";
import App from "./App.tsx";
import { Toaster } from "react-hot-toast";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AntdConfigProvider
      theme={{
        token: {
          fontFamily: "'Sora', sans-serif", // Apply custom font globally to Ant Design
        },
      }}
    >
      <Toaster />

      <App />
    </AntdConfigProvider>
  </StrictMode>
);
