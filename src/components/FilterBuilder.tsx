import { useState, useEffect } from "react";
import { Input, Select, DatePicker, Button, Modal } from "antd";
import { SearchOutlined, FilterOutlined } from "@ant-design/icons";
import type { RangePickerProps } from "antd/es/date-picker";
import type { Dayjs } from "dayjs";
import { useSearchParams } from "react-router-dom";
import dayjs from "dayjs";

interface FilterOption {
  key: string;
  label: string;
  type: "text" | "select" | "dateRange" | "number";
  options?: { label: string; value: string }[];
}

interface FilterValues {
  [key: string]: string | [Dayjs, Dayjs] | number | undefined;
}

interface FilterBuilderProps {
  filters: FilterOption[];
  onFilterChange: (filters: FilterValues) => void;
  onSearch: (query: string) => void;
  searchPlaceholder?: string;
}

const { RangePicker } = DatePicker;

const FilterBuilder = ({
  filters,
  onFilterChange,
  onSearch,
  searchPlaceholder = "Search by name, ID, or any other field...",
}: FilterBuilderProps) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterValues>({});
  const [searchValue, setSearchValue] = useState(searchParams.get("q") || "");

  // Initialize filters from URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    const initialFilters: FilterValues = {};

    filters.forEach((filter) => {
      const value = params.get(filter.key);
      if (value) {
        if (filter.type === "dateRange") {
          const [start, end] = value.split(",");
          if (start && end) {
            initialFilters[filter.key] = [dayjs(start), dayjs(end)] as [
              Dayjs,
              Dayjs
            ];
          }
        } else if (filter.type === "number") {
          initialFilters[filter.key] = Number(value);
        } else {
          initialFilters[filter.key] = value;
        }
      }
    });

    setActiveFilters(initialFilters);
    onFilterChange(initialFilters);
  }, []);

  const handleFilterChange = (
    key: string,
    value: string | [Dayjs, Dayjs] | number | undefined
  ) => {
    const newFilters = { ...activeFilters, [key]: value };
    setActiveFilters(newFilters);
  };

  const handleSearch = (value: string) => {
    setSearchValue(value);
    onSearch(value);

    // Update URL with search query
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("q", value);
    } else {
      params.delete("q");
    }
    setSearchParams(params);
  };

  const handleApplyFilters = () => {
    onFilterChange(activeFilters);
    setIsModalOpen(false);

    // Update URL with filters
    const params = new URLSearchParams();
    if (searchValue) {
      params.set("q", searchValue);
    }

    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value) {
        if (Array.isArray(value)) {
          params.set(key, value.map((date) => date.toISOString()).join(","));
        } else {
          params.set(key, String(value));
        }
      }
    });

    setSearchParams(params);
  };

  const handleResetFilters = () => {
    setActiveFilters({});
    setSearchValue("");
    onFilterChange({});
    onSearch("");
    setSearchParams(new URLSearchParams());
  };

  const disabledDate: RangePickerProps["disabledDate"] = (current) => {
    return current && current.isAfter(new Date());
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <SearchOutlined className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder={searchPlaceholder}
            className="w-full pl-10 pr-4 py-2"
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            allowClear
          />
        </div>
        <Button
          icon={<FilterOutlined />}
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2"
        >
          Filters
        </Button>
      </div>

      <Modal
        title="Filter Options"
        open={isModalOpen}
        onOk={handleApplyFilters}
        onCancel={() => setIsModalOpen(false)}
        width={600}
        footer={[
          <Button key="reset" onClick={handleResetFilters}>
            Reset
          </Button>,
          <Button key="cancel" onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>,
          <Button key="apply" type="primary" onClick={handleApplyFilters}>
            Apply Filters
          </Button>,
        ]}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4">
          {filters.map((filter) => (
            <div key={filter.key} className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">
                {filter.label}
              </label>
              {filter.type === "text" && (
                <Input
                  value={activeFilters[filter.key] as string}
                  onChange={(e) =>
                    handleFilterChange(filter.key, e.target.value)
                  }
                  placeholder={`Enter ${filter.label.toLowerCase()}`}
                />
              )}
              {filter.type === "select" && (
                <Select
                  value={activeFilters[filter.key] as string}
                  onChange={(value) => handleFilterChange(filter.key, value)}
                  options={filter.options}
                  className="w-full"
                  placeholder={`Select ${filter.label.toLowerCase()}`}
                  allowClear
                />
              )}
              {filter.type === "dateRange" && (
                <RangePicker
                  value={activeFilters[filter.key] as [Dayjs, Dayjs]}
                  onChange={(dates) => handleFilterChange(filter.key, dates)}
                  className="w-full"
                  disabledDate={disabledDate}
                />
              )}
              {filter.type === "number" && (
                <Input
                  type="number"
                  value={activeFilters[filter.key] as number}
                  onChange={(e) =>
                    handleFilterChange(filter.key, Number(e.target.value))
                  }
                  placeholder={`Enter ${filter.label.toLowerCase()}`}
                />
              )}
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default FilterBuilder;
