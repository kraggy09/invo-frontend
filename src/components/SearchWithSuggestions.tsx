import { Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useState, useRef, useEffect } from "react";

interface SearchWithSuggestionsProps {
  data: any[];
  onSelect: (item: any) => void;
  placeholder?: string;
  label?: string;
  icon?: React.ReactNode;
  className?: string;
  searchKeys?: string[];
  autoSelect?: boolean;
  displayKeys?: string[];
  primaryKey?: string;
  reset?: () => void;
  intialValue?: string;
  stockRequired?: boolean;
}

const binarySearchMatches = (dataArr: any[], key: string, search: string) => {
  let left = 0;
  let right = dataArr.length - 1;
  let foundIdx = -1;
  search = search.toLowerCase();
  // Find one match
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const value = String(dataArr[mid][key]).toLowerCase();
    if (value.startsWith(search)) {
      foundIdx = mid;
      break;
    } else if (value < search) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  if (foundIdx === -1) return [];
  // Expand to all contiguous matches
  let start = foundIdx;
  let end = foundIdx;
  while (
    start > 0 &&
    String(dataArr[start - 1][key])
      .toLowerCase()
      .startsWith(search)
  ) {
    start--;
  }
  while (
    end < dataArr.length - 1 &&
    String(dataArr[end + 1][key])
      .toLowerCase()
      .startsWith(search)
  ) {
    end++;
  }
  return dataArr.slice(start, end + 1);
};

const SearchWithSuggestions = ({
  data,
  stockRequired = true,
  onSelect,
  placeholder = "Search...",
  label,
  icon = <SearchOutlined className="text-gray-400" />,
  className = "",
  searchKeys = ["label"],
  displayKeys = ["label"],
  primaryKey = "label",
  autoSelect = false,
  intialValue,
  reset,
}: SearchWithSuggestionsProps) => {
  const [search, setSearch] = useState(intialValue || "");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  let filteredData: any[];
  const isNumeric = !isNaN(Number(search)) && search.trim() !== "";

  if (
    searchKeys.length === 1 &&
    searchKeys[0] === "name" &&
    Array.isArray(data) &&
    data.length > 0 &&
    search.length > 0
  ) {
    filteredData = binarySearchMatches(data, "name", search).filter(
      (item) => item.stock === undefined || item.stock > 0
    );
  } else {
    filteredData = data.filter((item) => {
      // Only show items with stock > 0 (or undefined)
      if (item.stock !== undefined && item.stock <= 0 && stockRequired)
        return false;

      // Barcode search (if barcode is an array)
      if (isNumeric && item.barcode && Array.isArray(item.barcode)) {
        return item.barcode.includes(Number(search));
      }

      // Normal search
      return searchKeys.some((key) =>
        String(item[key]).toLowerCase().includes(search.toLowerCase())
      );
    });
  }

  const handleSelect = (item: any) => {
    onSelect(item);
    console.log("I am called with item", item);

    if (!autoSelect) {
      setSearch(item[primaryKey] as string);
    } else {
      setSearch("");
    }
    setShowDropdown(false);
    setSelectedIndex(-1);
    // containerRef.current?.querySelector("input")?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!search) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!showDropdown) {
          setShowDropdown(true);
        }
        setSelectedIndex((prev) =>
          prev < filteredData.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        if (!showDropdown) {
          setShowDropdown(true);
        }
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredData.length) {
          handleSelect(filteredData[selectedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
      case "Backspace":
        if (search.length > 0) {
          setShowDropdown(true);
          reset?.();
        }
        break;
    }
  };

  useEffect(() => {
    if (autoSelect && filteredData.length === 1 && search) {
      const singleItem = filteredData[0];
      handleSelect(singleItem);
    }
  }, [filteredData, search, autoSelect]);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [search]);

  useEffect(() => {
    if (selectedIndex >= 0 && dropdownRef.current) {
      const selectedElement = dropdownRef.current.children[
        selectedIndex
      ] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`space-y-1.5 relative ${className}`} ref={containerRef}>
      {label && (
        <label className="text-gray-500 text-sm font-medium flex items-center gap-1">
          {icon}
          {label}
        </label>
      )}
      <Input
        prefix={!label && icon}
        placeholder={placeholder}
        className="w-full"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setShowDropdown(e.target.value.length >= 2);
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => setShowDropdown(search.length >= 2)}
      />
      {showDropdown && search.length >= 2 && (
        <div className="absolute z-10 w-full mt-1">
          <div
            ref={dropdownRef}
            className="bg-white rounded-lg shadow-lg border border-gray-100 max-h-60 overflow-y-auto"
          >
            {filteredData.length > 0 ? (
              filteredData.map((item, index) => (
                <div
                  key={index}
                  className={`px-4 py-2 hover:bg-gray-50 cursor-pointer ${
                    index === selectedIndex ? "bg-gray-100" : ""
                  }`}
                  onClick={() => handleSelect(item)}
                >
                  <div className="flex justify-between items-center">
                    {displayKeys.map((key) => (
                      <span key={key} className="text-gray-700">
                        {item[key]}
                      </span>
                    ))}
                    {item.price && (
                      <span className="text-gray-500">{item.price}</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-2 text-gray-500">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchWithSuggestions;
