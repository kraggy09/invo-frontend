import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConfigProvider as AntdConfigProvider } from "antd";

import "./index.css";
import App from "./App.tsx";

// Globally prevent mouse wheel from changing number input values
document.addEventListener(
  "wheel",
  (e) => {
    const el = document.activeElement as HTMLElement | null;
    if (el?.tagName === "INPUT" && (el as HTMLInputElement).type === "number") {
      el.blur();
    }
  },
  { passive: true }
);
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
