import React, { useState, useMemo } from "react";
import { Table, Pagination, ConfigProvider } from "antd";
import type { TableProps, ColumnType } from "antd/es/table";

export interface UniversalColumnType<T> {
  column: ColumnType<T>;
  onCellClick?: (record: T, rowIndex: number, colIndex: number) => void;
  onHeaderClick?: (col: UniversalColumnType<T>, colIndex: number) => void;
}

export interface UniversalTableProps<T> {
  data: T[];
  columns: UniversalColumnType<T>[];
  pageSize?: number;
  onRowClick?: (record: T, rowIndex: number) => void;
}

const UniversalTable = <T extends object>({
  data,
  columns,
  pageSize = 10,
  onRowClick,
}: UniversalTableProps<T>) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Pagination logic: slice data for current page
  const pagedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, currentPage, pageSize]);

  // Enhance columns with cell/header click handlers
  const enhancedColumns = useMemo(
    () =>
      columns.map((col, colIndex) => ({
        ...col.column,
        onCell: (record: T, rowIndex: number) => ({
          onClick: col.onCellClick
            ? () => col.onCellClick?.(record, rowIndex, colIndex)
            : undefined,
          style: { cursor: col.onCellClick ? "pointer" : undefined },
        }),
        onHeaderCell: () => ({
          onClick: col.onHeaderClick
            ? () => col.onHeaderClick?.(col, colIndex)
            : undefined,
          style: { cursor: col.onHeaderClick ? "pointer" : undefined },
        }),
      })),
    [columns]
  );

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
          dataSource={pagedData}
          columns={enhancedColumns as ColumnType<T>[]}
          pagination={false}
          rowKey={getRowKey}
          onRow={(record, rowIndex) => ({
            onClick: () => onRowClick?.(record, rowIndex ?? -1),
            className: onRowClick ? "cursor-pointer" : "",
          })}
        />
        {data.length > pageSize && (
          <div className="flex justify-end p-4 border-t">
            <Pagination
              current={currentPage}
              total={data.length}
              pageSize={pageSize}
              onChange={setCurrentPage}
              showSizeChanger={false}
            />
          </div>
        )}
      </div>
    </ConfigProvider>
  );
};

export default UniversalTable;
