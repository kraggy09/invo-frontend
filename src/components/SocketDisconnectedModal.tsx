import { Modal, Button } from "antd";
import { WifiOutlined, SyncOutlined } from "@ant-design/icons";
import { useSocket } from "../contexts/SocketContext";

const SocketDisconnectedModal = () => {
    const { isConnected, isReconnecting, isSessionBlocked, connect } = useSocket();

    // Don't show if connected, if the session is blocked, or if the user is not logged in (no token)
    const token = localStorage.getItem("token");
    const visible = !isConnected && !isSessionBlocked && !!token;

    return (
        <Modal
            open={visible}
            footer={null}
            closable={false}
            maskClosable={false}
            centered
            width={480}
            bodyStyle={{ padding: 0 }}
            className="socket-disconnected-modal"
        >
            <div className="bg-white rounded-[40px] overflow-hidden border border-gray-100/50">
                {/* Header — Red/Orange for disconnected */}
                <div className="bg-red-500 p-10 text-center relative overflow-hidden group">
                    <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000" />
                    <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-32 h-32 bg-red-400/20 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-1000" />

                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-[24px] mx-auto mb-6 flex items-center justify-center border border-white/20 shadow-2xl">
                            {isReconnecting ? (
                                <SyncOutlined spin className="text-white text-3xl" />
                            ) : (
                                <WifiOutlined className="text-white text-3xl" />
                            )}
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tighter leading-tight mb-2">
                            {isReconnecting ? "Reconnecting..." : "Connection Lost"}
                        </h1>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10">
                            <div className={`w-1.5 h-1.5 rounded-full ${isReconnecting ? 'bg-yellow-400 animate-pulse' : 'bg-red-200'}`} />
                            <span className="text-[9px] font-black text-red-500 uppercase tracking-[0.2em]">
                                {isReconnecting ? "Attempting to restore session" : "Offline Mode Active"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="p-10">
                    <div className="mb-6">
                        <h2 className="text-xl font-black text-gray-800 tracking-tighter">
                            Real-time Sync Paused
                        </h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 leading-relaxed">
                            Your connection to the server was interrupted
                        </p>
                    </div>

                    <p className="text-sm text-gray-500 leading-relaxed mb-8">
                        {isReconnecting
                            ? "We're automatically trying to reconnect you to the billing system. This usually takes just a few seconds."
                            : "The socket connection has timed out or was disconnected. You can try to reconnect manually or refresh the page."
                        }
                    </p>

                    <Button
                        type="primary"
                        onClick={() => connect()}
                        loading={isReconnecting}
                        className="w-full h-14 bg-red-500 hover:bg-red-600 text-white border-none rounded-[20px] text-[10px] font-black tracking-[0.2em] shadow-xl shadow-red-100 transition-all hover:translate-y-[-2px] active:scale-95 uppercase cursor-pointer"
                    >
                        {isReconnecting ? "Connecting..." : "Reconnect Now"}
                    </Button>

                    <div className="mt-8 pt-6 border-t border-gray-50 text-center">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                            InvoSync Core v2.4.0 • Socket Engine
                        </p>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default SocketDisconnectedModal;
