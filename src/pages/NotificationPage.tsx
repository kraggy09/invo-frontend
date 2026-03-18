import { useEffect, useState } from "react";
import { Button, Modal, Card, Tag, Tooltip } from "antd";
import apiCaller from "../utils/apiCaller";
import { message } from "../utils/antdStatic";
import { PlusOutlined, DeleteOutlined, ExclamationCircleOutlined, BellOutlined, UserOutlined, AppstoreOutlined } from "@ant-design/icons";
import NotificationModal from "../components/NotificationModal";

const { confirm } = Modal;

const NotificationPage = () => {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await apiCaller.get("/notifications");
            console.log(res.data.data.notifications);

            setNotifications(res.data.data.notifications || []);
        } catch (err) {
            console.error("Failed to fetch notifications", err);
            message.error("Failed to load notification settings");
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (data: any) => {
        setLoading(true);
        try {
            await apiCaller.post("/notifications", data);
            message.success("Notification rule added successfully");
            setModalOpen(false);
            fetchNotifications();
        } catch (err: any) {
            message.error(err?.response?.data?.message || "Failed to add notification rule");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id: string, name: string) => {
        confirm({
            title: `Delete Notification Rule: ${name}?`,
            icon: <ExclamationCircleOutlined className="text-red-500" />,
            content: "This will stop future alerts for this specific rule. Confirm deletion?",
            okText: "Delete",
            okType: "danger",
            cancelText: "Cancel",
            centered: true,
            async onOk() {
                try {
                    await apiCaller.delete(`/notifications/${id}`);
                    message.success("Notification rule deleted");
                    fetchNotifications();
                } catch (err) {
                    message.error("Failed to delete notification rule");
                }
            },
        });
    };

    return (
        <main className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-50/50">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                    <div>
                        <h1 className="text-2xl font-black text-gray-800 tracking-tight leading-tight flex items-center gap-2">
                            <BellOutlined className="text-blue-600" /> Notification Management
                        </h1>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Configure Discord Alert Triggers</p>
                    </div>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setModalOpen(true)}
                        className="h-12 px-8 bg-blue-600 hover:bg-blue-700 border-none rounded-2xl text-[10px] font-black tracking-widest shadow-xl shadow-blue-100 uppercase w-full sm:w-auto"
                    >
                        New Notification System
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {notifications.map((notif) => (
                        <div
                            key={notif._id}
                            className="bg-white rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col p-8 relative group"
                        >
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all">
                                <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => handleDelete(notif._id, notif.name)}
                                    className="w-10 h-10 rounded-xl hover:bg-red-50 flex items-center justify-center p-0"
                                />
                            </div>

                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                                    <BellOutlined className="text-xl text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-gray-800 tracking-tighter capitalize">{notif.name}</h2>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{notif.description}</p>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-gray-50">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                        <AppstoreOutlined /> Category
                                    </span>
                                    <Tag className="rounded-lg bg-blue-100 text-blue-700 border-none font-black text-[10px] px-3 py-1 uppercase">
                                        {notif.category?.name || "N/A"}
                                    </Tag>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                        <UserOutlined /> Filter Customer
                                    </span>
                                    {notif.isCustomer ? (
                                        <Tag className="rounded-lg bg-orange-100 text-orange-700 border-none font-black text-[10px] px-3 py-1 uppercase max-w-[150px] truncate">
                                            {notif.customerId?.name || "Customer Not Found"}
                                        </Tag>
                                    ) : (
                                        <Tag className="rounded-lg bg-gray-100 text-gray-500 border-none font-black text-[10px] px-3 py-1 uppercase">
                                            DISABLED
                                        </Tag>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {notifications.length === 0 && !loading && (
                        <div className="col-span-full py-20 bg-gray-50/30 rounded-[40px] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
                            <BellOutlined className="text-5xl text-gray-200 mb-4" />
                            <h3 className="text-lg font-black text-gray-400 tracking-tight">No notification rules found</h3>
                            <p className="text-xs text-gray-400 mt-1 max-w-xs">Create your first discord trigger to start receiving alerts when specific items are billed.</p>
                        </div>
                    )}
                </div>

                <NotificationModal
                    open={modalOpen}
                    onClose={() => setModalOpen(false)}
                    onSubmit={handleAdd}
                    loading={loading}
                />
            </div>
        </main>
    );
};

export default NotificationPage;
