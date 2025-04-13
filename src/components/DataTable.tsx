import React, { useState } from "react";
import { Table, Pagination, ConfigProvider } from "antd";
import type { TableProps } from "antd";

interface DataTableProps<T> {
  data: T[];
  columns: TableProps<T>["columns"];
  pageSize?: number;
  onRowClick?: (record: T) => void;
}

const DataTable = <T extends object>({
  data,
  columns,
  pageSize = 10,
  onRowClick,
}: DataTableProps<T>) => {
  const [currentPage, setCurrentPage] = useState(1);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getRowKey = (record: T) => {
    if ("_id" in record) return (record as { _id: string | number })._id;
    if ("id" in record) return (record as { id: string | number }).id;
    return Math.random();
  };

  return (
    <ConfigProvider
      theme={{
        components: {
          Table: {
            headerBg: "#f8fafc",
            headerColor: "#1e293b",
            rowHoverBg: "#f1f5f9",
          },
        },
      }}
    >
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <Table
          dataSource={data}
          columns={columns}
          pagination={false}
          rowKey={getRowKey}
          onRow={(record) => ({
            onClick: () => onRowClick?.(record),
            className: onRowClick ? "cursor-pointer" : "",
          })}
        />
        {data.length > pageSize && (
          <div className="flex justify-end p-4 border-t">
            <Pagination
              current={currentPage}
              total={data.length}
              pageSize={pageSize}
              onChange={handlePageChange}
              showSizeChanger={false}
            />
          </div>
        )}
      </div>
    </ConfigProvider>
  );
};

export default DataTable;
