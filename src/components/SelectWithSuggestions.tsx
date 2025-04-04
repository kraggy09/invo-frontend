import { Select } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";

interface SelectWithSuggestionsProps<T> {
  data: T[];
  onSelect: (item: T) => void;
  placeholder?: string;
  label?: string;
  icon?: React.ReactNode;
  className?: string;
  searchKeys?: (keyof T)[];
  displayKeys?: (keyof T)[];
  primaryKey: keyof T;
  value?: string | null;
  onClear?: () => void;
}

const SelectWithSuggestions = <T extends { _id: string }>({
  data,
  onSelect,
  placeholder = "Search...",
  label,
  icon = <SearchOutlined className="text-gray-400" />,
  className = "",
  searchKeys = ["label" as keyof T],
  displayKeys = ["label" as keyof T],
  primaryKey,
  value = "",
  onClear,
}: SelectWithSuggestionsProps<T>) => {
  const [search, setSearch] = useState(value || "");
  const [filteredData, setFilteredData] = useState(data);
  const [selectedValue, setSelectedValue] = useState<string | null>(
    value || null
  );

  useEffect(() => {
    if (value === null || value === undefined) {
      setSearch("");
      setSelectedValue(null);
    } else {
      setSearch(value);
      setSelectedValue(value);
    }
  }, [value]);

  useEffect(() => {
    const filtered = data.filter((item) =>
      searchKeys.some((key) =>
        String(item[key]).toLowerCase().includes(search.toLowerCase())
      )
    );
    setFilteredData(filtered);
  }, [search, data, searchKeys]);

  const handleSearch = (value: string) => {
    setSearch(value);

    // If the user is modifying search and there was a selection, clear it
    if (selectedValue && value !== selectedValue) {
      setSelectedValue(null);
      onClear?.();
    }

    // If search is completely cleared, also trigger onClear
    if (value === "" && onClear) {
      setSelectedValue(null);
      onClear();
    }
  };

  const handleSelect = (
    value: string,
    option: { item: T } | { item: T }[] | undefined
  ) => {
    if (option && !Array.isArray(option)) {
      onSelect(option.item);
      const valueStr = String(option.item[primaryKey]);
      setSearch(valueStr);
      setSelectedValue(valueStr);
    }
  };

  const handleClear = () => {
    setSearch("");
    setSelectedValue(null);
    onClear?.();
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="text-gray-500 text-sm font-medium flex items-center gap-1">
          {icon}
          {label}
        </label>
      )}
      <Select
        showSearch
        value={search}
        placeholder={placeholder}
        defaultActiveFirstOption={false}
        showArrow={false}
        filterOption={false}
        onSearch={handleSearch}
        onChange={handleSelect}
        onClear={handleClear}
        className="w-full"
        notFoundContent={null}
        allowClear
      >
        {filteredData.map((item) => (
          <Select.Option
            key={item._id}
            value={String(item[primaryKey])}
            item={item}
          >
            <div className="flex justify-between items-center">
              {displayKeys.map((key) => (
                <span key={String(key)} className="text-gray-700">
                  {String(item[key])}
                </span>
              ))}
            </div>
          </Select.Option>
        ))}
      </Select>
    </div>
  );
};

export default SelectWithSuggestions;
