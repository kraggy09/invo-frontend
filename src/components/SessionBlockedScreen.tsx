import { WifiOutlined } from "@ant-design/icons";

const SessionBlockedScreen = () => {
    return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50/50 p-6 relative overflow-hidden">
            {/* Background Decor — same as Login */}
            <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-600 rounded-full blur-[120px]" />
            </div>

            <div className="w-full max-w-[460px] animate-in fade-in zoom-in duration-1000 relative z-10">
                <div className="bg-white rounded-[40px] shadow-2xl shadow-indigo-100/50 overflow-hidden border border-gray-100/50">

                    {/* Header — indigo, same style as Login */}
                    <div className="bg-indigo-600 p-12 text-center relative overflow-hidden group">
                        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000" />
                        <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-1000" />

                        <div className="relative z-10">
                            <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-[28px] mx-auto mb-8 flex items-center justify-center border border-white/20 shadow-2xl">
                                <WifiOutlined className="text-white text-4xl" style={{ transform: "rotate(0deg)" }} />
                            </div>
                            <h1 className="text-4xl font-black text-white tracking-tighter leading-tight mb-2">
                                Session Lost
                            </h1>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                                <span className="text-[9px] font-black text-indigo-100 uppercase tracking-[0.2em]">
                                    Socket Disconnected
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-10 sm:p-14">
                        <div className="mb-10">
                            <h2 className="text-2xl font-black text-gray-800 tracking-tighter">
                                No Active Connection
                            </h2>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1.5 leading-relaxed">
                                This tab does not have an active socket session
                            </p>
                        </div>

                        <p className="text-sm text-gray-500 leading-relaxed mb-10">
                            Your session is either active in another tab or has been disconnected.
                            You must have an active connection to use InvoSync. Reload this page to reconnect.
                        </p>

                        <button
                            onClick={() => window.location.reload()}
                            className="w-full h-16 bg-indigo-600 hover:bg-indigo-700 text-white border-none rounded-[24px] text-xs font-black tracking-[0.2em] shadow-xl shadow-indigo-200 transition-all hover:translate-y-[-2px] active:scale-95 uppercase cursor-pointer"
                        >
                            Reload &amp; Reconnect
                        </button>

                        <div className="mt-12 pt-10 border-t border-gray-50 text-center">
                            <div className="inline-block px-4 py-1.5 bg-gray-50 rounded-xl text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">
                                Core Engine v2.4.0-Stable
                            </div>
                            <p className="text-[10px] font-black text-indigo-500/50 uppercase tracking-widest">
                                Contact System Administrator if the issue persists
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </main>
    );
};

export default SessionBlockedScreen;
