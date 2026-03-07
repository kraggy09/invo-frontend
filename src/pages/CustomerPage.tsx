import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useCustomerStore, { ICustomer } from "../store/customer.store";
import { Table, Button, Select, Input } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

const ACCENT = "#2563eb";

type CustomerWithTransactions = ICustomer & { transactions?: any[] };

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
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Client Name</span>,
      dataIndex: "name",
      key: "name",
      render: (text: string) => (
        <span className="font-black text-gray-800 capitalize tracking-tight hover:text-indigo-600 transition-colors">
          {text}
        </span>
      ),
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Phone Number</span>,
      dataIndex: "phone",
      key: "phone",
      render: (text: string) => <span className="font-black text-gray-500 tracking-tighter">{text}</span>,
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Balance Due</span>,
      dataIndex: "outstanding",
      key: "outstanding",
      render: (text: number) => (
        <span className={`font-black px-3 py-1 rounded-lg ${text > 0 ? "text-red-600 bg-red-50" : "text-green-600 bg-green-50"}`}>
          ₹{text}
        </span>
      ),
      sorter: (a, b) => b.outstanding - a.outstanding,
    },
    {
      title: <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center block">Activity</span>,
      dataIndex: "transactions",
      key: "transactions",
      render: (_: any, record: CustomerWithTransactions) => (
        <div className="flex justify-center">
          <span className="bg-gray-100 text-gray-600 font-black text-[10px] px-2 py-0.5 rounded uppercase">
            {record.transactions?.length || 0} Txns
          </span>
        </div>
      ),
      sorter: (a, b) => (b.transactions?.length || 0) - (a.transactions?.length || 0),
    },
  ];

  return (
    <main className="p-4 sm:p-6 lg:p-10 min-h-screen bg-gray-50/20">
      {/* Header Section - Responsive scaling */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 lg:mb-12 max-w-[1600px] mx-auto w-full">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tight leading-none">Client Directory</h1>
          <p className="text-[10px] lg:text-[11px] font-black text-indigo-400 uppercase tracking-[0.2em] mt-2 ml-1">Enterprise Relationship Management</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto items-stretch sm:items-center">
          <div className="bg-white px-6 lg:px-10 py-4 lg:py-6 rounded-[28px] border border-gray-100 shadow-sm flex flex-col items-start sm:items-end group transition-all hover:shadow-indigo-100/50 flex-1 lg:flex-none">
            <p className="text-[9px] lg:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 group-hover:text-indigo-400 transition-colors">Cumulative Receivables</p>
            <span className="text-2xl lg:text-3xl font-black text-indigo-600 tracking-tighter">
              ₹{customers.reduce((sum, c) => sum + (c.outstanding || 0), 0).toLocaleString()}
            </span>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined className="transition-transform duration-500 group-hover:rotate-180" />}
            onClick={() => navigate("/newCustomer")}
            className="group flex justify-center items-center h-14 lg:h-16 px-8 lg:px-10 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_auto] hover:bg-right border-none rounded-[24px] text-[11px] font-black tracking-widest text-white shadow-xl shadow-indigo-500/30 hover:shadow-purple-500/40 uppercase transition-all duration-500 hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] w-full sm:w-auto gap-2"
          >
            Register Client
          </Button>
        </div>
      </div>

      {/* Filter Matrix - Premium card style */}
      <div className="bg-white/80 backdrop-blur-sm rounded-[32px] lg:rounded-[40px] shadow-sm p-6 lg:p-10 mb-8 border border-gray-100 max-w-[1600px] mx-auto w-full">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-end">
          <div className="flex-1 w-full text-left">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2 block">Advanced CRM Search</label>
            <Input
              placeholder="Search by name, identity or contact handle..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-14 lg:h-16 rounded-2xl lg:rounded-3xl border-2 border-gray-50 bg-gray-50/30 px-6 font-black focus:bg-white transition-all text-gray-700"
              allowClear
              prefix={<span className="text-indigo-400 mr-2 text-[10px] font-black uppercase tracking-widest">Query:</span>}
            />
          </div>
          <div className="w-full lg:w-80 text-left">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2 block">Sort Sequence</label>
            <Select
              value={sortType}
              onChange={setSortType}
              className="w-full h-14 lg:h-16 rounded-2xl lg:rounded-3xl font-black custom-pos-select"
              options={[
                { value: "name", label: "Alphabetical Order (A-Z)" },
                { value: "outstanding", label: "Financial Exposure (High)" },
                { value: "transaction", label: "High Volume Partners" },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Main Content Area - Mobile Cards vs Desktop Table */}
      <div className="max-w-[1600px] mx-auto w-full">
        {/* Mobile Card View (Hidden on larger screens) */}
        <div className="grid grid-cols-1 gap-4 md:hidden mb-10">
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map((customer) => (
              <div
                key={customer._id}
                onClick={() => navigate(`/customers/${customer._id}`)}
                className="bg-white p-5 rounded-3xl border border-gray-50 shadow-sm active:scale-[0.98] transition-all"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex flex-col">
                    <span className="text-base font-black text-gray-800 capitalize leading-tight">{customer.name}</span>
                    <span className="text-[11px] font-bold text-gray-400 mt-1">{customer.phone}</span>
                  </div>
                  <span className={`text-xs font-black px-3 py-1 rounded-xl ${customer.outstanding > 0 ? "text-red-600 bg-red-50" : "text-green-600 bg-green-50"}`}>
                    ₹{customer.outstanding}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-50 pt-3 mt-1">
                  <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">System Record</span>
                  <span className="bg-indigo-50 text-indigo-600 font-black text-[10px] px-3 py-1 rounded-lg uppercase">
                    {customer.transactions?.length || 0} Transactions
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white p-12 rounded-[32px] text-center border-2 border-dashed border-gray-100">
              <p className="text-gray-400 font-black text-[11px] uppercase tracking-widest">No matching records</p>
            </div>
          )}
        </div>

        {/* Desktop Table View (Hidden on mobile) */}
        <div className="hidden md:block bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Table<CustomerWithTransactions>
            columns={columns}
            dataSource={filteredCustomers}
            rowKey="_id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              className: "px-10 py-8",
              position: ["bottomCenter"]
            }}
            onRow={(record) => ({
              onClick: () => navigate(`/customers/${record._id}`),
            })}
            scroll={{ x: 1000 }}
            className="modern-table no-border-table"
            rowClassName="group cursor-pointer hover:bg-indigo-50/40 transition-all duration-300"
          />
        </div>
      </div>

      <style>{`
        .custom-pos-select .ant-select-selector {
          border-radius: 20px !important;
          border: 2px solid #f8fafc !important;
          background-color: #f8fafc !important;
          padding: 0 20px !important;
          height: 100% !important;
          display: flex !important;
          align-items: center !important;
        }
        .custom-pos-select .ant-select-selection-item {
          font-weight: 900 !important;
          color: #1e293b !important;
        }
        .modern-table .ant-table {
          background: transparent !important;
        }
        .modern-table .ant-table-thead > tr > th {
          background: transparent !important;
          border-bottom: 1px solid #f8fafc !important;
          padding: 1.5rem 1rem !important;
        }
        .modern-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f8fafc !important;
          padding: 1.25rem 1rem !important;
          transition: all 0.3s ease;
        }
        .modern-table .ant-table-tbody > tr:hover > td {
          background: #f5f3ff !important;
        }
      `}</style>
    </main>
  );
};

export default CustomerPage;
