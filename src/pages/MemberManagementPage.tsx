import { useState, useEffect } from "react";
import {
    Button,
    Form,
    Input,
    Select,
    Table,
    Typography,
    Card,
    Space,
    Tag,
    Divider,
    Modal,
    Popconfirm,
    Tooltip,
} from "antd";
import { UserAddOutlined, TeamOutlined, LockOutlined, UserOutlined, SettingOutlined, DeleteOutlined } from "@ant-design/icons";
import { message } from "../utils/antdStatic";
import apiCaller from "../utils/apiCaller";

const { Title, Text } = Typography;
const { Option } = Select;

interface User {
    _id: string;
    name: string;
    username: string;
    roles: string[];
}

interface ACLRole {
    _id: string;
    name: string;
    description: string;
}

const MemberManagementPage = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<ACLRole[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [rolesLoading, setRolesLoading] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [assignLoading, setAssignLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedRole, setSelectedRole] = useState<string | null>(null);
    const [form] = Form.useForm();

    const loadData = async () => {
        setUsersLoading(true);
        setRolesLoading(true);
        try {
            const [usersRes, rolesRes] = await Promise.all([
                apiCaller.get("/admin/users"),
                apiCaller.get("/admin/acls")
            ]);

            if (usersRes.data) setUsers(usersRes.data.data.users);
            if (rolesRes.data) setRoles(rolesRes.data.data.acls);

        } catch (error: any) {
            console.error(error);
            message.error("Failed to load members or roles");
        } finally {
            setUsersLoading(false);
            setRolesLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const onFinish = async (values: any) => {
        setCreateLoading(true);
        try {
            const response = await apiCaller.post("/admin/users", values);

            if (response.data) {
                message.success("Member created successfully");
                form.resetFields();
                loadData();
            }
        } catch (error: any) {
            message.error(error?.response?.data?.message || "Failed to create member");
        } finally {
            setCreateLoading(false);
        }
    };

    const handleAssignRole = async () => {
        if (!selectedUser || !selectedRole) {
            message.error("Please select a role");
            return;
        }

        setAssignLoading(true);
        try {
            const response = await apiCaller.post("/admin/assign-role", {
                userId: selectedUser._id,
                aclId: selectedRole
            });

            if (response.data) {
                message.success("Role assigned successfully");
                setIsModalVisible(false);
                setSelectedUser(null);
                setSelectedRole(null);
                loadData();
            }
        } catch (error: any) {
            message.error(error?.response?.data?.message || "Failed to assign role");
        } finally {
            setAssignLoading(false);
        }
    };

    const openAssignModal = (user: User) => {
        setSelectedUser(user);
        setIsModalVisible(true);
    };

    const handleDeleteUser = async (userId: string) => {
        try {
            const response = await apiCaller.delete(`/admin/users/${userId}`);
            if (response.data) {
                message.success("Member deleted successfully");
                loadData();
            }
        } catch (error: any) {
            message.error(error?.response?.data?.message || "Failed to delete member");
        }
    };


    const columns = [
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
            render: (text: string) => <Text strong>{text}</Text>,
        },
        {
            title: "Username",
            dataIndex: "username",
            key: "username",
            render: (text: string) => <Tag color="blue">{text}</Tag>,
        },
        {
            title: "Roles",
            dataIndex: "roles",
            key: "roles",
            render: (roles: string[]) => (
                <>
                    {roles && roles.length > 0 ? (
                        roles.map((role) => {
                            let color = "default";
                            if (role === "CREATOR") color = "gold";
                            else if (role === "SUPER_ADMIN") color = "volcano";
                            else if (role === "ADMIN") color = "magenta";
                            else if (role === "WORKER") color = "green";
                            return (
                                <Tag color={color} key={role}>
                                    {role}
                                </Tag>
                            );
                        })
                    ) : (
                        <Tag color="default">No roles selected</Tag>
                    )}
                </>
            ),
        },
        {
            title: "Action",
            key: "action",
            render: (_: any, record: User) => {
                const isProtected = record.roles?.includes("SUPER_ADMIN") || record.roles?.includes("CREATOR");
                return (
                    <Space split={<Divider type="vertical" />}>
                        <Tooltip title="Manage roles">
                            <Button
                                type="link"
                                icon={<SettingOutlined />}
                                onClick={() => openAssignModal(record)}
                                className="text-indigo-600 font-bold p-0"
                            />
                        </Tooltip>
                        {isProtected ? (
                            <Tooltip title="Protected Role (Cannot Delete)">
                                <Button
                                    type="link"
                                    danger
                                    icon={<DeleteOutlined />}
                                    disabled
                                    className="p-0 opacity-20"
                                />
                            </Tooltip>
                        ) : (
                            <Popconfirm
                                title="Delete Member"
                                description={`Are you sure you want to delete ${record.name}?`}
                                onConfirm={() => handleDeleteUser(record._id)}
                                okText="Yes"
                                cancelText="No"
                                okButtonProps={{ danger: true, className: "rounded-lg" }}
                                cancelButtonProps={{ className: "rounded-lg" }}
                            >
                                <Tooltip title="Delete member">
                                    <Button
                                        type="link"
                                        danger
                                        icon={<DeleteOutlined />}
                                        className="p-0"
                                    />
                                </Tooltip>
                            </Popconfirm>
                        )}
                    </Space>
                )
            },
        },
    ];

    return (
        <div className="p-6 max-w-[1200px] mx-auto animate-in fade-in duration-700">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
                    <TeamOutlined className="text-white text-2xl" />
                </div>
                <div>
                    <Title level={2} className="!m-0 tracking-tighter">Member Management</Title>
                    <Text type="secondary" className="text-xs uppercase font-bold tracking-widest">System Access Control & Personnel</Text>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <Card
                        className="shadow-xl shadow-gray-100/50 border-gray-100 rounded-[32px] overflow-hidden"
                        title={
                            <div className="flex items-center gap-2 py-2">
                                <UserAddOutlined className="text-indigo-600" />
                                <span className="text-sm font-black uppercase tracking-widest">Initialize New Member</span>
                            </div>
                        }
                    >
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={onFinish}
                            requiredMark={false}
                            className="space-y-4"
                        >
                            <Form.Item
                                name="name"
                                label={<span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Full Name</span>}
                                rules={[{ required: true, message: "Name is required" }]}
                            >
                                <Input prefix={<UserOutlined className="text-indigo-400" />} placeholder="John Doe" className="member-field" />
                            </Form.Item>

                            <Form.Item
                                name="username"
                                label={<span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Identity UID</span>}
                                rules={[{ required: true, message: "Username is required" }]}
                            >
                                <Input prefix={<UserOutlined className="text-indigo-400" />} placeholder="johndoe" className="member-field" />
                            </Form.Item>

                            <Form.Item
                                name="password"
                                label={<span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Access Key</span>}
                                rules={[{ required: true, message: "Password is required" }]}
                            >
                                <Input.Password prefix={<LockOutlined className="text-indigo-400" />} placeholder="••••••••" className="member-field" />
                            </Form.Item>

                            <Form.Item
                                name="aclId"
                                label={<span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Privilege Cluster</span>}
                                rules={[{ required: true, message: "Role is required" }]}
                            >
                                <Select placeholder="Select a role" loading={rolesLoading} className="member-select">
                                    {roles && roles.map((role) => (
                                        <Option key={role._id} value={role._id}>
                                            <Space direction="vertical" size={0}>
                                                <Text strong className="text-xs">{role.name}</Text>
                                                <Text type="secondary" style={{ fontSize: '10px' }}>{role.description}</Text>
                                            </Space>
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>

                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={createLoading}
                                block
                                className="h-14 bg-indigo-600 hover:bg-indigo-700 border-none rounded-2xl text-xs font-black tracking-widest uppercase shadow-lg shadow-indigo-100"
                            >
                                Provision Account
                            </Button>
                        </Form>
                    </Card>
                </div>

                <div className="lg:col-span-2">
                    <Card
                        className="shadow-xl shadow-gray-100/50 border-gray-100 rounded-[32px] overflow-hidden"
                        bodyStyle={{ padding: 0 }}
                    >
                        <Table
                            dataSource={users}
                            columns={columns}
                            loading={usersLoading}
                            rowKey="_id"
                            pagination={{ pageSize: 10 }}
                            className="member-table"
                        />
                    </Card>
                </div>
            </div>

            <Modal
                title={`Assign Role to ${selectedUser?.name}`}
                open={isModalVisible}
                onOk={handleAssignRole}
                onCancel={() => setIsModalVisible(false)}
                confirmLoading={assignLoading}
                okButtonProps={{ className: "bg-indigo-600 hover:bg-indigo-700 border-none rounded-xl" }}
                cancelButtonProps={{ className: "rounded-xl" }}
            >
                <div className="py-4">
                    <Text type="secondary" className="block mb-4 text-xs font-bold uppercase tracking-widest">Select Privilege Cluster</Text>
                    <Select
                        placeholder="Select a role"
                        style={{ width: '100%' }}
                        onChange={(value) => setSelectedRole(value)}
                        className="member-select"
                        value={selectedRole}
                    >
                        {roles && roles.map((role) => (
                            <Option key={role._id} value={role._id}>
                                <Space direction="vertical" size={0}>
                                    <Text strong className="text-xs">{role.name}</Text>
                                    <Text type="secondary" style={{ fontSize: '10px' }}>{role.description}</Text>
                                </Space>
                            </Option>
                        ))}
                    </Select>
                </div>
            </Modal>

            <style>{`
        .member-field {
          height: 50px !important;
          border-radius: 12px !important;
          border: 1px solid #f1f5f9 !important;
          background: #f8fafc !important;
          transition: all 0.3s ease !important;
        }
        .member-field:hover, .member-field:focus {
          border-color: #6366f1 !important;
          background: #fff !important;
        }
        .member-select .ant-select-selector {
          height: 50px !important;
          border-radius: 12px !important;
          border: 1px solid #f1f5f9 !important;
          background: #f8fafc !important;
          display: flex !important;
          align-items: center !important;
        }
        .member-table .ant-table-thead > tr > th {
          background: #f1f5f9;
          font-weight: 900;
          text-transform: uppercase;
          font-size: 10px;
          letter-spacing: 0.1em;
          color: #64748b;
          border: none;
        }
        .member-table .ant-table-tbody > tr > td {
            border-bottom: 1px solid #f8fafc;
            padding: 20px 16px;
        }
      `}</style>
        </div>
    );
};

export default MemberManagementPage;
