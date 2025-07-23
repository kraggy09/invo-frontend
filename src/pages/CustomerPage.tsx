import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useCustomerStore, { Customer } from "../store/customer.store";
import { Table, Button, Select, Input } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

const ACCENT = "#2563eb";

type CustomerWithTransactions = Customer & { transactions?: any[] };

const sorters: Record<
  string,
  (a: CustomerWithTransactions, b: CustomerWithTransactions) => number
> = {
  name: (a, b) => a.name.localeCompare(b.name),
  outstanding: (a, b) => b.outstanding - a.outstanding,
  transaction: (a, b) =>
    (b.transactions?.length || 0) - (a.transactions?.length || 0),
};

const CustomerPage = () => {
  const navigate = useNavigate();
  const { customers, setCustomers } = useCustomerStore();
  const [sortType, setSortType] = useState<string>("name");
  const [search, setSearch] = useState("");

  // Fetch customers from backend (mocked here)
  useEffect(() => {
    async function fetchCustomers() {
      // Simulate API
      const res = await fetch("/api/customers");
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || []);
      }
    }
    if (customers.length === 0) fetchCustomers();
  }, [setCustomers, customers.length]);

  // Filter and sort
  const filteredCustomers = useMemo(() => {
    let arr: CustomerWithTransactions[] = [...customers];
    if (search) {
      arr = arr.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          String(c.phone).includes(search)
      );
    }
    if (sortType && sorters[sortType]) {
      arr = arr.sort(sorters[sortType]);
    }
    return arr;
  }, [customers, sortType, search]);

  const columns: ColumnsType<CustomerWithTransactions> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: CustomerWithTransactions) => (
        <span className="font-semibold capitalize text-blue-700 cursor-pointer hover:underline">
          {text}
        </span>
      ),
    },
    {
      title: "Mobile",
      dataIndex: "phone",
      key: "phone",
      render: (text: string) => <span className="font-mono">{text}</span>,
    },
    {
      title: "Outstanding",
      dataIndex: "outstanding",
      key: "outstanding",
      render: (text: number) => <span className="font-semibold">₹{text}</span>,
      sorter: (a, b) => b.outstanding - a.outstanding,
    },
    {
      title: "Transactions",
      dataIndex: "transactions",
      key: "transactions",
      render: (_: any, record: CustomerWithTransactions) => (
        <span>{record.transactions?.length || 0}</span>
      ),
      sorter: (a, b) =>
        (b.transactions?.length || 0) - (a.transactions?.length || 0),
    },
  ];

  return (
    <main className="min-h-screen bg-white p-4 md:p-10 relative">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight text-center md:text-left mb-0">
          Customers
        </h1>
        <div className="flex gap-2 items-center w-full md:w-auto">
          <Input.Search
            placeholder="Search by name or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            className="w-56"
          />
          <Select
            value={sortType}
            onChange={setSortType}
            style={{ width: 180 }}
            options={[
              { value: "name", label: "Sort by Name" },
              { value: "outstanding", label: "Sort by Outstanding" },
              { value: "transaction", label: "Sort by Transactions" },
            ]}
          />
          <Button
            type="primary"
            icon={<PlusOutlined style={{ fontSize: 20 }} />}
            style={{ background: ACCENT, border: `2px solid #fff` }}
            onClick={() => navigate("/newCustomer")}
            title="Add Customer"
            className="ml-2"
          >
            Add Customer
          </Button>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-md p-2">
        <Table<CustomerWithTransactions>
          columns={columns}
          dataSource={filteredCustomers}
          rowKey="_id"
          pagination={{ pageSize: 10, showSizeChanger: false }}
          onRow={(record) => ({
            onClick: () => navigate(`/customers/${record._id}`),
            style: { cursor: "pointer" },
          })}
        />
      </div>
    </main>
  );
};

export default CustomerPage;
