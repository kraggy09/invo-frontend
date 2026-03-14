import { App } from "antd";
import type { MessageInstance } from "antd/es/message/interface";

let message: MessageInstance;

/**
 * AntdStaticBridge
 * 
 * In Antd v5 the static `message.success()` / `message.error()` calls
 * don't render when an `<App>` wrapper is used.
 * 
 * This tiny component grabs the context-aware `message` instance via
 * `App.useApp()` and exports it so it can be imported as a normal module
 * anywhere in the app — no need to add `useApp()` in every single component.
 * 
 * Usage:
 *   1. Render <AntdStaticBridge /> inside <App> (done in App.tsx)
 *   2. import { message } from "../utils/antdStatic" instead of from "antd"
 */
const AntdStaticBridge = () => {
    const app = App.useApp();
    message = app.message;
    return null;
};

export { message };
export default AntdStaticBridge;
