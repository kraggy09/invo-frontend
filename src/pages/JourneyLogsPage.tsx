import { useEffect, useState } from "react";
import { Table, Tag, Typography, DatePicker } from "antd";
import { useJourneyStore, IJourneyLog } from "../store/journey.store";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const JourneyLogsPage = () => {
    const { logs, loading, fetchLogs, page, limit, total } = useJourneyStore();
    const navigate = useNavigate();
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([dayjs(), dayjs()]);

    useEffect(() => {
        if (dateRange && dateRange[0] && dateRange[1]) {
            fetchLogs(1, limit, dateRange[0].startOf('day').toISOString(), dateRange[1].endOf('day').toISOString());
        } else {
            fetchLogs(1, limit);
        }
    }, [dateRange]);

    const getEventColor = (event: string) => {
        if (event.includes("CREATED") || event.includes("APPROVED")) return "green";
        if (event.includes("UPDATED")) return "blue";
        if (event.includes("DELETED") || event.includes("REJECTED")) return "red";
        return "default";
    };

    const columns = [
        {
            title: "Date & Time",
            dataIndex: "createdAt",
            key: "createdAt",
            render: (date: string) => dayjs(date).format("DD/MM/YYYY hh:mm A"),
            width: 180,
        },
        {
            title: "Event",
            dataIndex: "event",
            key: "event",
            render: (event: string) => <Tag color={getEventColor(event)}>{event.replace(/_/g, " ")}</Tag>,
            width: 200,
        },
        {
            title: "Description",
            dataIndex: "description",
            key: "description",
            render: (text: string, record: IJourneyLog) => {
                let linkDetails = null;
                if (record.entityType === "Bill" && record.entityId) {
                    linkDetails = <a onClick={(e) => { e.stopPropagation(); navigate(`/bills/${record.entityId}`); }}>View Bill</a>;
                } else if (record.entityType === "Transaction" && record.entityId) {
                    linkDetails = <a onClick={(e) => { e.stopPropagation(); navigate(`/transactions/${record.entityId}`); }}>View Transaction</a>;
                } else if (record.entityType === "Product" && record.entityId) {
                    linkDetails = <a onClick={(e) => { e.stopPropagation(); navigate(`/products`); }}>View Products</a>;
                } else if (record.entityType === "Customer" && record.entityId) {
                    linkDetails = <a onClick={(e) => { e.stopPropagation(); navigate(`/customers/${record.entityId}`); }}>View Customer</a>;
                }

                return (
                    <div>
                        <Text>{text}</Text>
                        {linkDetails && <span style={{ marginLeft: 8 }}>({linkDetails})</span>}
                        {record.metadata && Object.keys(record.metadata).length > 0 && (
                            <div style={{ marginTop: 8 }}>
                                {Object.entries(record.metadata).map(([key, value]) => {
                                    if (typeof value === "object" && value !== null) {
                                        return (
                                            <div key={key} style={{ marginTop: 4 }}>
                                                <Text type="secondary" style={{ fontSize: '12px' }}>{key}: </Text>
                                                <pre style={{ margin: 0, padding: '4px', background: '#f5f5f5', borderRadius: '4px', fontSize: '11px', overflowX: 'auto' }}>
                                                    {JSON.stringify(value, null, 2)}
                                                </pre>
                                            </div>
                                        );
                                    }
                                    return (
                                        <Tag key={key} style={{ marginTop: 4, marginRight: 4, fontSize: '11px' }}>
                                            <span style={{ color: '#888' }}>{key}:</span> <span style={{ fontWeight: 600 }}>{String(value)}</span>
                                        </Tag>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            title: "User",
            dataIndex: "user",
            key: "user",
            render: (user: any) => user ? `${user.name} (${user.username})` : "System/Unknown",
            width: 200,
        },
    ];

    return (
        <div style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                <div>
                    <Title level={2}>Journey Logs</Title>
                    <Text type="secondary">App-wide activity history</Text>
                </div>
                <RangePicker
                    value={dateRange as any}
                    onChange={(dates: any) => setDateRange(dates)}
                    format="DD/MM/YYYY"
                    allowClear={true}
                />
            </div>

            <Table
                columns={columns}
                dataSource={logs}
                rowKey="_id"
                loading={loading}
                pagination={{
                    current: page,
                    pageSize: limit,
                    total: total,
                    onChange: (p, s) => {
                        if (dateRange && dateRange[0] && dateRange[1]) {
                            fetchLogs(p, s, dateRange[0].startOf('day').toISOString(), dateRange[1].endOf('day').toISOString());
                        } else {
                            fetchLogs(p, s);
                        }
                    }
                }}
                bordered
            />
        </div>
    );
};

export default JourneyLogsPage;
