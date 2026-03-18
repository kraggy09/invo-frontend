import { useEffect, useState } from "react";
import { Modal, Button, Input, Select, Switch } from "antd";
import { PlusOutlined, InfoCircleOutlined, BellOutlined } from "@ant-design/icons";
import useCustomerStore from "../store/customer.store";
import useCategoriesStore from "../store/categories.store";

const { Option } = Select;

interface NotificationModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    loading?: boolean;
}

const NotificationModal = ({ open, onClose, onSubmit, loading }: NotificationModalProps) => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isCustomer, setIsCustomer] = useState(false);
    const [customerId, setCustomerId] = useState<string | undefined>(undefined);
    const [category, setCategory] = useState<string | undefined>(undefined);

    const { customers } = useCustomerStore();
    const { categories } = useCategoriesStore();

    useEffect(() => {
        if (open) {
            resetForm();
        }
    }, [open]);

    const resetForm = () => {
        setName("");
        setDescription("");
        setIsCustomer(false);
        setCustomerId(undefined);
        setCategory(undefined);
    };

    const handleOk = () => {
        onSubmit({
            name,
            description,
            isCustomer,
            customerId,
            category,
        });
    };

    return (
        <Modal
            open={open}
            onCancel={onClose}
            onOk={handleOk}
            confirmLoading={loading}
            title={
                <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                        <BellOutlined className="text-blue-600" />
                    </div>
                    <span className="text-lg font-black text-gray-800 tracking-tight">
                        Add New Notification System
                    </span>
                </div>
            }
            centered
            width={500}
            okButtonProps={{
                className: "bg-blue-600 border-blue-600 font-bold rounded-lg h-9 hover:bg-blue-700 transition-all",
                disabled: !name || !description || !category || (isCustomer && !customerId)
            }}
            cancelButtonProps={{
                className: "rounded-lg font-bold h-9"
            }}
        >
            <div className="space-y-6 mt-8 py-2">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block">Rule Name</label>
                    <Input
                        placeholder="e.g. VIP Drinks Alert"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="rounded-xl h-11 font-bold"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block">Description</label>
                    <Input.TextArea
                        placeholder="Describe when this notification should trigger..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="rounded-xl font-bold"
                        rows={3}
                    />
                </div>

                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <div>
                        <p className="text-sm font-bold text-gray-800">Filter by Customer?</p>
                        <p className="text-[10px] text-gray-400 font-medium">Trigger only for a specific customer</p>
                    </div>
                    <Switch checked={isCustomer} onChange={setIsCustomer} />
                </div>

                {isCustomer && (
                    <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block">Select Customer</label>
                        <Select
                            className="w-full"
                            placeholder="Search customer..."
                            showSearch
                            optionFilterProp="children"
                            value={customerId}
                            onChange={setCustomerId}
                            size="large"
                        >
                            {customers.map((c) => (
                                <Option key={c._id} value={c._id}>{c.name}</Option>
                            ))}
                        </Select>
                    </div>
                )}

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block">Product Category</label>
                    <Select
                        className="w-full"
                        placeholder="Select a category..."
                        value={category}
                        onChange={setCategory}
                        size="large"
                    >
                        {categories.map((cat) => (
                            <Option key={cat._id} value={cat._id}>{cat.name}</Option>
                        ))}
                    </Select>
                    <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                        <InfoCircleOutlined /> Notification triggers if any item in the bill belongs to this category.
                    </p>
                </div>
            </div>
        </Modal>
    );
};

export default NotificationModal;
