import React, { useState, useEffect, useMemo } from "react";
import { Input, Button, Spin, Select, AutoComplete, Tag, Segmented, Empty, Tooltip, Pagination } from "antd";
import { message } from "../utils/antdStatic";
import {
    SearchOutlined,
    CheckCircleOutlined,
    ReloadOutlined,
    UserOutlined,
    ShoppingOutlined,
    FileTextOutlined,
    ArrowRightOutlined,
    RollbackOutlined,
    ClockCircleOutlined,
    FilterOutlined,
    ClearOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import apiCaller from "../utils/apiCaller";
import ReturnProductModal from "../components/ReturnProductModal";
import dayjs from "dayjs";
import useCustomerStore from "../store/customer.store";
import useProductStore from "../store/product.store";

interface BillSearchItem {
    _id: string;
    id: number;
    date: string;
    createdAt: string;
    customer: any;
    createdBy: any;
    items: any[];
    productsTotal: number;
    total: number;
    returnedQuantities?: Record<string, number>;
    totalItemsPurchased?: number;
    totalItemsReturned?: number;
    isFullyReturned?: boolean;
}

const ReturnBillPage: React.FC = () => {
    const navigate = useNavigate();
    const { customers, setCustomers } = useCustomerStore();
    const { products, setProducts } = useProductStore();

    // Mode: 'customer_product' (search by customer and/or product) vs 'invoice' (search by invoice ID)
    const [searchMode, setSearchMode] = useState<"customer_product" | "invoice">("customer_product");

    // Search filters
    const [searchId, setSearchId] = useState("");
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [customerSearchText, setCustomerSearchText] = useState("");
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [productSearchText, setProductSearchText] = useState("");

    // Loading & state
    const [loading, setLoading] = useState(false);
    const [matchingBills, setMatchingBills] = useState<BillSearchItem[]>([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [selectedBill, setSelectedBill] = useState<any>(null);
    const [targetProductId, setTargetProductId] = useState<string | undefined>(undefined);
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

    // Pagination state (default 20 items per page)
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [totalBills, setTotalBills] = useState(0);

    // Last created return bill for post-return confirmation
    const [lastCreatedReturn, setLastCreatedReturn] = useState<any>(null);

    // Ensure customer and product catalog are loaded
    useEffect(() => {
        if (!customers || customers.length === 0) {
            apiCaller.get("/customers").then((res) => {
                if (res.data?.success && res.data?.data) {
                    setCustomers(res.data.data.customers || res.data.data);
                }
            }).catch(() => {});
        }
        if (!products || products.length === 0) {
            apiCaller.get("/products").then((res) => {
                if (res.data?.success && res.data?.data) {
                    setProducts(res.data.data.products || res.data.data);
                }
            }).catch(() => {});
        }

        // Load initial page of 20 recent bills
        fetchBills(1, 20, false);
    }, []);

    // Autocomplete customer options
    const customerOptions = useMemo(() => {
        if (!customers) return [];
        const query = customerSearchText.trim().toLowerCase();
        return customers
            .filter((c) => {
                if (!query) return true;
                const name = c.name ? c.name.toLowerCase() : "";
                const phone = c.phone ? String(c.phone) : "";
                return name.includes(query) || phone.includes(query);
            })
            .slice(0, 15)
            .map((c) => ({
                value: c._id,
                label: (
                    <div className="flex justify-between items-center py-1">
                        <div>
                            <span className="font-bold text-gray-800 capitalize mr-2">{c.name}</span>
                            {c.phone && <span className="text-xs text-gray-400 font-mono">({c.phone})</span>}
                        </div>
                        {c.outstanding !== undefined && (
                            <span className="text-xs font-bold text-red-500">
                                Due: ₹{Number(c.outstanding).toLocaleString()}
                            </span>
                        )}
                    </div>
                ),
                customer: c,
            }));
    }, [customers, customerSearchText]);

    // Autocomplete product options
    const productOptions = useMemo(() => {
        if (!products) return [];
        const query = productSearchText.trim().toLowerCase();
        return products
            .filter((p) => {
                if (!query) return true;
                const name = p.name ? p.name.toLowerCase() : "";
                const category = p.category ? p.category.toLowerCase() : "";
                const barcode = p.barcode ? p.barcode.join(" ") : "";
                return name.includes(query) || category.includes(query) || barcode.includes(query);
            })
            .slice(0, 15)
            .map((p) => ({
                value: p._id,
                label: (
                    <div className="flex justify-between items-center py-1">
                        <div>
                            <span className="font-bold text-gray-800 capitalize mr-2">{p.name}</span>
                            {p.category && (
                                <Tag color="blue" className="text-[9px] uppercase font-bold border-0">
                                    {p.category}
                                </Tag>
                            )}
                        </div>
                        <span className="text-xs font-black text-indigo-600">
                            ₹{Number(p.retailPrice || 0).toLocaleString()}
                        </span>
                    </div>
                ),
                product: p,
            }));
    }, [products, productSearchText]);

    // Check if user has active filters
    const hasFilterApplied = useMemo(() => {
        return Boolean(selectedCustomerId || customerSearchText.trim() || selectedProductId || productSearchText.trim());
    }, [selectedCustomerId, customerSearchText, selectedProductId, productSearchText]);

    // Fetch bills with pagination (20 items per page by default)
    const fetchBills = async (
        page: number = 1,
        limit: number = pageSize,
        isSearchTrigger: boolean = false,
        overrideCustomerId?: string | null,
        overrideCustomerQuery?: string,
        overrideProductId?: string | null,
        overrideProductQuery?: string
    ) => {
        setLoading(true);
        if (isSearchTrigger) {
            setSelectedBill(null);
            setHasSearched(true);
        }

        try {
            const params: any = {
                page,
                limit,
            };

            const custId = overrideCustomerId !== undefined ? overrideCustomerId : selectedCustomerId;
            const custQuery = overrideCustomerQuery !== undefined ? overrideCustomerQuery : customerSearchText.trim();
            const prodId = overrideProductId !== undefined ? overrideProductId : selectedProductId;
            const prodQuery = overrideProductQuery !== undefined ? overrideProductQuery : productSearchText.trim();

            const hasCustomer = Boolean(custId || custQuery);
            const hasProduct = Boolean(prodId || prodQuery);

            if (custId) {
                params.customerId = custId;
            } else if (custQuery) {
                params.customerQuery = custQuery;
            }

            if (prodId) {
                params.productId = prodId;
            }
            if (prodQuery) {
                params.productQuery = prodQuery;
            }

            const res = await apiCaller.get("/bills/search-for-return", { params });

            if (res.data?.success && res.data?.data) {
                const bills: BillSearchItem[] = res.data.data.bills || [];
                const total: number = res.data.data.total ?? bills.length;
                setMatchingBills(bills);
                setTotalBills(total);
                setCurrentPage(page);

                // If explicit manual search with filter matched exactly one bill and has available items, select it directly
                if (isSearchTrigger && (hasCustomer || hasProduct) && total === 1 && bills.length === 1 && !bills[0].isFullyReturned) {
                    setSelectedBill(bills[0]);
                    setTargetProductId(prodId || undefined);
                } else if (bills.length === 0 && (hasCustomer || hasProduct)) {
                    message.info("No matching purchase bills found for this customer/product.");
                }
            } else {
                setMatchingBills([]);
                setTotalBills(0);
                if (hasCustomer || hasProduct) {
                    message.warning("No purchase records found.");
                }
            }
        } catch (error: any) {
            console.error("Search error:", error);
            message.error(error.response?.data?.message || "Failed to search customer purchase records");
            setMatchingBills([]);
            setTotalBills(0);
        } finally {
            setLoading(false);
        }
    };

    // Handle Quick Search by Invoice ID
    const handleInvoiceSearch = async (invId?: string) => {
        const idToSearch = (invId || searchId).trim();
        if (!idToSearch) {
            message.warning("Please enter a valid Invoice ID (e.g. 1042)");
            return;
        }

        setLoading(true);
        setSelectedBill(null);
        setMatchingBills([]);
        setTotalBills(0);
        setHasSearched(true);

        try {
            const res = await apiCaller.get(`/bills/${idToSearch}`);
            if (res.data?.success && res.data?.data?.bill) {
                setSelectedBill(res.data.data.bill);
                setTargetProductId(undefined);
            } else {
                message.warning("Invoice not found.");
            }
        } catch (error: any) {
            if (error.response?.status === 404) {
                message.warning("Invoice not found.");
            } else {
                message.error(error?.response?.data?.message || "Failed to fetch bill details.");
            }
        } finally {
            setLoading(false);
        }
    };

    // Handle Multi-field Search (Customer and/or Product and/or Invoice)
    const handleAdvancedSearch = () => {
        fetchBills(1, pageSize, true);
    };

    // Reset filters and reload default 20 recent bills
    const handleReset = () => {
        setSelectedCustomerId(null);
        setCustomerSearchText("");
        setSelectedProductId(null);
        setProductSearchText("");
        setSearchId("");
        setSelectedBill(null);
        setHasSearched(false);
        setTargetProductId(undefined);
        setCurrentPage(1);

        fetchBills(1, pageSize, false, null, "", null, "");
    };

    // Select a bill from results list to initiate return
    const handleSelectBill = (bill: BillSearchItem, targetPid?: string) => {
        setSelectedBill(bill);
        setTargetProductId(targetPid || selectedProductId || undefined);
        setIsReturnModalOpen(true);
    };

    const billProductTotal =
        selectedBill?.productsTotal ??
        selectedBill?.items?.reduce((sum: number, item: any) => sum + (item.total || 0), 0) ??
        0;

    return (
        <main className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-50/50 flex flex-col items-center">
            <div className="w-full max-w-5xl">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100/60 rounded-full mb-2 border border-orange-200">
                            <RollbackOutlined className="text-orange-600 text-xs" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-orange-700">
                                Sales Returns & Refunds
                            </span>
                        </div>
                        <h1 className="text-3xl font-black tracking-tighter leading-tight text-gray-800">
                            Return Center
                        </h1>
                        <span className="text-[11px] font-bold text-gray-400 block mt-0.5">
                            Search by Customer & Product (e.g. Gold Small) or directly by Invoice ID
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => navigate("/bills")}
                            className="h-10 px-4 rounded-xl text-xs font-bold text-gray-600 border-gray-200 hover:border-indigo-400"
                        >
                            View All Invoices
                        </Button>
                        <Button
                            onClick={() => navigate("/transactions")}
                            className="h-10 px-4 rounded-xl text-xs font-bold text-gray-600 border-gray-200 hover:border-indigo-400"
                        >
                            Return History
                        </Button>
                    </div>
                </div>

                {/* Mode Selector */}
                <div className="mb-4 flex items-center justify-between">
                    <Segmented
                        value={searchMode}
                        onChange={(val: any) => {
                            setSearchMode(val);
                            setSelectedBill(null);
                            if (val === "invoice") {
                                setMatchingBills([]);
                                setHasSearched(false);
                            } else {
                                if (matchingBills.length === 0) {
                                    fetchBills(1, pageSize, false);
                                }
                            }
                        }}
                        options={[
                            {
                                label: (
                                    <div className="flex items-center gap-2 px-3 py-1">
                                        <ShoppingOutlined />
                                        <span className="font-black text-xs uppercase tracking-wider">
                                            Search by Customer & Product
                                        </span>
                                    </div>
                                ),
                                value: "customer_product",
                            },
                            {
                                label: (
                                    <div className="flex items-center gap-2 px-3 py-1">
                                        <FileTextOutlined />
                                        <span className="font-black text-xs uppercase tracking-wider">
                                            Quick Invoice #
                                        </span>
                                    </div>
                                ),
                                value: "invoice",
                            },
                        ]}
                        className="p-1 bg-white border border-gray-200 rounded-2xl shadow-sm"
                    />

                    {(customerSearchText || productSearchText || searchId || selectedBill || matchingBills.length > 0) && (
                        <Button
                            icon={<ClearOutlined />}
                            type="text"
                            onClick={handleReset}
                            className="text-xs font-bold text-gray-400 hover:text-gray-700"
                        >
                            Reset Search
                        </Button>
                    )}
                </div>

                {/* Search Panel: Mode 1 - Customer & Product */}
                {searchMode === "customer_product" && (
                    <div className="bg-white rounded-[32px] shadow-sm p-6 sm:p-8 mb-8 border border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {/* Customer Input */}
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                                    <UserOutlined className="mr-1 text-indigo-500" /> Customer (Name or Phone)
                                </label>
                                <AutoComplete
                                    value={customerSearchText}
                                    options={customerOptions}
                                    onSelect={(val, option) => {
                                        setSelectedCustomerId(val);
                                        const c = option.customer;
                                        setCustomerSearchText(c?.name || "");
                                    }}
                                    onChange={(val) => {
                                        setCustomerSearchText(val);
                                        if (!val) setSelectedCustomerId(null);
                                    }}
                                    placeholder="Select or type customer name / phone..."
                                    className="w-full"
                                    allowClear
                                >
                                    <Input
                                        className="h-12 rounded-2xl border-gray-200 bg-gray-50/50 text-sm font-bold shadow-inner"
                                        onPressEnter={handleAdvancedSearch}
                                    />
                                </AutoComplete>
                            </div>

                            {/* Product Input */}
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                                    <ShoppingOutlined className="mr-1 text-orange-500" /> Product Name (e.g. Gold Small)
                                </label>
                                <AutoComplete
                                    value={productSearchText}
                                    options={productOptions}
                                    onSelect={(val, option) => {
                                        setSelectedProductId(val);
                                        const p = option.product;
                                        setProductSearchText(p?.name || "");
                                    }}
                                    onChange={(val) => {
                                        setProductSearchText(val);
                                        if (!val) setSelectedProductId(null);
                                    }}
                                    placeholder="Type product name (e.g. Gold Small, barcode)..."
                                    className="w-full"
                                    allowClear
                                >
                                    <Input
                                        className="h-12 rounded-2xl border-gray-200 bg-gray-50/50 text-sm font-bold shadow-inner"
                                        onPressEnter={handleAdvancedSearch}
                                    />
                                </AutoComplete>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2 border-t border-gray-50">
                            <span className="text-[11px] text-gray-400 font-semibold">
                                Tip: Enter either Customer, Product name, or both to locate original bill
                            </span>
                            <Button
                                type="primary"
                                icon={<SearchOutlined />}
                                onClick={handleAdvancedSearch}
                                loading={loading}
                                className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 border-none rounded-2xl text-[10px] font-black tracking-widest shadow-md shadow-indigo-100 uppercase sm:w-auto w-full"
                            >
                                Find Bills
                            </Button>
                        </div>
                    </div>
                )}

                {/* Search Panel: Mode 2 - Invoice ID */}
                {searchMode === "invoice" && (
                    <div className="bg-white rounded-[32px] shadow-sm p-6 sm:p-8 mb-8 border border-gray-100 flex flex-col sm:flex-row gap-4 items-center">
                        <Input
                            prefix={<SearchOutlined className="text-gray-400 mr-2" />}
                            placeholder="Enter Invoice ID (e.g. 1042)"
                            value={searchId}
                            onChange={(e) => setSearchId(e.target.value)}
                            onPressEnter={() => handleInvoiceSearch()}
                            className="h-14 rounded-2xl border-gray-200 bg-gray-50/50 text-base font-bold flex-1 focus:bg-white transition-all shadow-inner"
                        />
                        <Button
                            type="primary"
                            onClick={() => handleInvoiceSearch()}
                            loading={loading}
                            className="h-14 px-8 bg-indigo-600 hover:bg-indigo-700 border-none rounded-2xl text-[10px] font-black tracking-widest shadow-md shadow-indigo-100 uppercase sm:w-auto w-full"
                        >
                            Find Invoice
                        </Button>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="py-20 text-center flex flex-col items-center">
                        <Spin size="large" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-4">
                            Searching Purchase Archives...
                        </span>
                    </div>
                )}

                {/* Post-Return Success Alert */}
                {lastCreatedReturn && !loading && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-xl shadow-md shadow-emerald-200">
                                <CheckCircleOutlined />
                            </div>
                            <div>
                                <h3 className="font-black text-emerald-900 text-lg m-0">
                                    Return #{lastCreatedReturn.id} Recorded Successfully!
                                </h3>
                                <p className="text-xs text-emerald-700 font-semibold m-0">
                                    Return bill initiated for {lastCreatedReturn.customer?.name || "Customer"}. Awaiting admin approval.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                type="primary"
                                onClick={() => navigate(`/return-bills/${lastCreatedReturn._id}`)}
                                className="bg-emerald-600 hover:bg-emerald-700 border-none rounded-xl font-black text-xs h-10 px-4"
                            >
                                View Return Bill
                            </Button>
                            <Button
                                onClick={() => setLastCreatedReturn(null)}
                                className="rounded-xl font-bold text-xs h-10 px-4 border-emerald-300 text-emerald-800"
                            >
                                Dismiss
                            </Button>
                        </div>
                    </div>
                )}

                {/* Matching Bills Results List (from Customer/Product search) */}
                {!loading && matchingBills.length > 0 && !selectedBill && (
                    <div className="space-y-6 mb-8">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div>
                                <h2 className="text-xl font-black text-gray-800 m-0">
                                    {hasFilterApplied
                                        ? `Found ${totalBills} Matching ${totalBills === 1 ? "Bill" : "Bills"}`
                                        : `Recent Purchase Bills (${totalBills} Total)`}
                                </h2>
                                <span className="text-xs font-bold text-gray-400">
                                    Showing page {currentPage} of {Math.ceil(totalBills / pageSize) || 1} · Select invoice to record return
                                </span>
                            </div>

                            {totalBills > pageSize && (
                                <Pagination
                                    size="small"
                                    current={currentPage}
                                    pageSize={pageSize}
                                    total={totalBills}
                                    onChange={(page, newPageSize) => {
                                        setCurrentPage(page);
                                        if (newPageSize && newPageSize !== pageSize) {
                                            setPageSize(newPageSize);
                                            fetchBills(1, newPageSize, false);
                                        } else {
                                            fetchBills(page, pageSize, false);
                                        }
                                    }}
                                    showSizeChanger={false}
                                />
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {matchingBills.map((bill) => {
                                const isFullyReturned = bill.isFullyReturned;
                                const dateFormatted = dayjs(bill.createdAt || bill.date).format("DD MMM YYYY · hh:mm A");
                                const totalAmt = bill.productsTotal ?? bill.items?.reduce((s, i) => s + (i.total || 0), 0) ?? 0;

                                // Check if this bill contains the product searched
                                const searchKeyword = productSearchText.trim().toLowerCase();

                                return (
                                    <div
                                        key={bill._id}
                                        className={`bg-white rounded-3xl p-6 border transition-all ${
                                            isFullyReturned
                                                ? "border-gray-200 opacity-60 bg-gray-50/50"
                                                : "border-gray-100 hover:border-indigo-200 hover:shadow-md"
                                        }`}
                                    >
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg font-black font-mono">
                                                    #{bill.id}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-base font-black text-gray-800 m-0 capitalize">
                                                            {bill.customer?.name || "Walk-in Customer"}
                                                        </h3>
                                                        {bill.customer?.phone && (
                                                            <span className="text-xs font-mono font-bold text-gray-400">
                                                                ({bill.customer.phone})
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-xs font-bold text-gray-400 flex items-center gap-1 mt-0.5">
                                                        <ClockCircleOutlined className="text-[10px]" /> {dateFormatted}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                                                <div className="text-right">
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                                                        Invoice Total
                                                    </span>
                                                    <span className="text-lg font-black text-indigo-600">
                                                        ₹{Number(totalAmt).toLocaleString()}
                                                    </span>
                                                </div>

                                                {isFullyReturned ? (
                                                    <Tag color="default" className="text-xs font-black uppercase rounded-xl px-3 py-1 border-0">
                                                        Fully Returned
                                                    </Tag>
                                                ) : (
                                                    <Button
                                                        type="primary"
                                                        icon={<RollbackOutlined />}
                                                        onClick={() => {
                                                            // Find matched item id if any
                                                            const matched = bill.items.find((item: any) => {
                                                                const name = (item.product?.name || item.productSnapshot?.name || "").toLowerCase();
                                                                return searchKeyword && name.includes(searchKeyword);
                                                            });
                                                            const matchedPid = matched ? (matched.product?._id || matched.product) : undefined;
                                                            handleSelectBill(bill, matchedPid);
                                                        }}
                                                        className="h-11 px-6 bg-orange-500 hover:bg-orange-600 border-none rounded-xl text-xs font-black tracking-wider uppercase shadow-md shadow-orange-100"
                                                    >
                                                        Select for Return
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Items inside this bill */}
                                        <div className="mt-4 pt-1">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                                                Purchased Items in this Invoice:
                                            </span>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                                {bill.items.map((item: any, idx: number) => {
                                                    const prodName = item.product?.name || item.productSnapshot?.name || "Product";
                                                    const isMatched = searchKeyword && prodName.toLowerCase().includes(searchKeyword);
                                                    const retQty = item.returnedQuantity || 0;
                                                    const remQty = item.remainingQuantity !== undefined
                                                        ? item.remainingQuantity
                                                        : Math.max(0, item.quantity - retQty);

                                                    return (
                                                        <div
                                                            key={item._id || idx}
                                                            className={`p-3 rounded-2xl border text-xs flex flex-col justify-between ${
                                                                isMatched
                                                                    ? "border-orange-200 bg-orange-50/50"
                                                                    : "border-gray-100 bg-gray-50/50"
                                                            }`}
                                                        >
                                                            <div className="flex items-center justify-between gap-1 mb-1">
                                                                <span className="font-bold text-gray-800 capitalize truncate" title={prodName}>
                                                                    {prodName}
                                                                </span>
                                                                {isMatched && (
                                                                    <Tag color="orange" className="text-[8px] font-black uppercase rounded-full border-0 px-1.5 py-0 m-0">
                                                                        Match
                                                                    </Tag>
                                                                )}
                                                            </div>

                                                            <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500 mt-1">
                                                                <span>Qty: {item.quantity}</span>
                                                                {retQty > 0 && (
                                                                    <span className="text-orange-600 font-bold">({retQty} ret.)</span>
                                                                )}
                                                                <span className={remQty > 0 ? "text-emerald-600 font-black" : "text-gray-400 font-bold"}>
                                                                    {remQty > 0 ? `${remQty} returnable` : "Returned"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Bottom Pagination */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-gray-100 shadow-sm mt-6">
                            <span className="text-xs font-bold text-gray-400">
                                Showing {Math.min((currentPage - 1) * pageSize + 1, totalBills)} - {Math.min(currentPage * pageSize, totalBills)} of {totalBills} bills
                            </span>
                            <Pagination
                                current={currentPage}
                                pageSize={pageSize}
                                total={totalBills}
                                onChange={(page, newPageSize) => {
                                    setCurrentPage(page);
                                    if (newPageSize && newPageSize !== pageSize) {
                                        setPageSize(newPageSize);
                                        fetchBills(1, newPageSize, false);
                                    } else {
                                        fetchBills(page, pageSize, false);
                                    }
                                }}
                                showSizeChanger
                                pageSizeOptions={["10", "20", "50"]}
                            />
                        </div>
                    </div>
                )}

                {/* Empty State when Search returns 0 bills */}
                {!loading && matchingBills.length === 0 && !selectedBill && (
                    <div className="bg-white rounded-[32px] p-12 text-center border border-gray-100">
                        <Empty
                            description={
                                <div className="mt-2">
                                    <p className="text-base font-bold text-gray-700 m-0">No Purchase Bills Found</p>
                                    <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
                                        {hasSearched
                                            ? "We could not find any bills matching the selected customer or product name. Try checking the invoice number directly."
                                            : "No recent purchase bills found in the system."}
                                    </p>
                                </div>
                            }
                        />
                    </div>
                )}

                {/* Result Card (Single Selected Bill) */}
                {selectedBill && !loading && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        {matchingBills.length > 0 && (
                            <div className="flex items-center justify-between bg-white px-6 py-3 rounded-2xl border border-gray-100">
                                <span className="text-xs font-bold text-gray-500">
                                    Viewing Bill #{selectedBill?.id} · Total {totalBills} bills found
                                </span>
                                <Button
                                    type="link"
                                    onClick={() => setSelectedBill(null)}
                                    className="text-xs font-black text-indigo-600 p-0"
                                >
                                    ← Back to All Matching Bills
                                </Button>
                            </div>
                        )}

                        <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden relative group">
                            {/* Bill Header Banner */}
                            <div className="bg-emerald-600 p-8 sm:p-10 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative overflow-hidden">
                                <div className="relative z-10 flex items-center gap-5">
                                    <div className="w-16 h-16 rounded-[24px] bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner border border-white/20">
                                        <CheckCircleOutlined />
                                    </div>
                                    <div>
                                        <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-emerald-500/50 rounded-full mb-1 border border-emerald-400/30 backdrop-blur-sm">
                                            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                            <span className="text-[8px] font-black uppercase tracking-widest">
                                                Invoice Verified
                                            </span>
                                        </div>
                                        <h2 className="text-2xl font-black tracking-tighter m-0">
                                            Invoice #{selectedBill?.id ? selectedBill.id : selectedBill?._id?.slice(-8).toUpperCase()}
                                        </h2>
                                        <span className="text-[10px] font-bold text-emerald-100/70 block mt-1">
                                            {dayjs(selectedBill.createdAt || selectedBill.date).format("DD MMM YYYY · hh:mm A")}
                                        </span>
                                    </div>
                                </div>

                                <div className="relative z-10 w-full sm:w-auto mt-4 sm:mt-0 flex items-center gap-3">
                                    <Button
                                        icon={<ReloadOutlined />}
                                        onClick={() => setIsReturnModalOpen(true)}
                                        className="h-14 w-full sm:w-auto px-8 bg-orange-500 hover:bg-orange-400 border-none text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2 text-[10px] tracking-[0.2em] uppercase shadow-xl shadow-orange-500/30 group-hover:scale-105"
                                    >
                                        INITIATE RETURN
                                    </Button>
                                </div>

                                <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-1000 rotate-12">
                                    <CheckCircleOutlined style={{ fontSize: 240 }} />
                                </div>
                            </div>

                            {/* Bill Details Grid */}
                            <div className="p-8 sm:p-10 grid grid-cols-1 sm:grid-cols-4 gap-6 border-b border-gray-100">
                                <div>
                                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest block mb-1">
                                        Billed To
                                    </span>
                                    <p className="text-base font-black text-gray-800 tracking-tight capitalize m-0">
                                        {selectedBill?.customer?.name || "Walk-in Customer"}
                                    </p>
                                    {selectedBill?.customer?.phone && (
                                        <span className="text-xs font-mono font-bold text-gray-400">
                                            {selectedBill.customer.phone}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest block mb-1">
                                        Original Total
                                    </span>
                                    <p className="text-base font-black text-indigo-600 tracking-tight m-0">
                                        ₹{Number(billProductTotal).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest block mb-1">
                                        Customer Balance
                                    </span>
                                    <p className="text-base font-black text-red-500 tracking-tight m-0">
                                        ₹{Number(selectedBill?.customer?.outstanding || 0).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest block mb-1">
                                        Listed Items
                                    </span>
                                    <p className="text-base font-bold text-gray-600 m-0">
                                        {selectedBill?.items?.length || 0} Products
                                    </p>
                                </div>
                            </div>

                            {/* Items List inside Selected Bill */}
                            <div className="p-8 sm:p-10 bg-gray-50/30">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-4">
                                    Items In This Bill & Return Eligibility:
                                </span>
                                <div className="space-y-3">
                                    {selectedBill?.items?.map((item: any, idx: number) => {
                                        const prodName = item.product?.name || item.productSnapshot?.name || "Product";
                                        const retQty = item.returnedQuantity || 0;
                                        const remQty = item.remainingQuantity !== undefined
                                            ? item.remainingQuantity
                                            : Math.max(0, item.quantity - retQty);
                                        const isTarget = targetProductId && (String(item.product?._id || item.product) === String(targetProductId));

                                        return (
                                            <div
                                                key={item._id || idx}
                                                className={`p-4 rounded-2xl bg-white border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
                                                    isTarget ? "border-orange-300 shadow-sm bg-orange-50/20" : "border-gray-100"
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-gray-50 text-gray-500 flex items-center justify-center font-bold text-xs">
                                                        {idx + 1}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-black text-gray-800 text-sm capitalize">
                                                                {prodName}
                                                            </span>
                                                            {isTarget && (
                                                                <Tag color="orange" className="text-[9px] font-black uppercase border-0 rounded-full px-2">
                                                                    Selected for Return
                                                                </Tag>
                                                            )}
                                                        </div>
                                                        <span className="text-xs text-gray-400 font-semibold">
                                                            Original Unit Price: ₹{item.quantity > 0 ? Math.round(item.total / item.quantity).toLocaleString() : 0}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                                                    <div className="text-center">
                                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">
                                                            Purchased
                                                        </span>
                                                        <span className="text-sm font-bold text-gray-700">{item.quantity}</span>
                                                    </div>
                                                    <div className="text-center">
                                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">
                                                            Returned
                                                        </span>
                                                        <span className={`text-sm font-bold ${retQty > 0 ? "text-orange-500" : "text-gray-400"}`}>
                                                            {retQty}
                                                        </span>
                                                    </div>
                                                    <div className="text-center">
                                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">
                                                            Returnable
                                                        </span>
                                                        <span className={`text-sm font-black ${remQty > 0 ? "text-emerald-600" : "text-gray-300"}`}>
                                                            {remQty}
                                                        </span>
                                                    </div>
                                                    <div className="text-right min-w-[80px]">
                                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">
                                                            Item Total
                                                        </span>
                                                        <span className="text-sm font-black text-indigo-600">
                                                            ₹{Number(item.total || 0).toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Modal to Process Return on Selected Bill */}
                        <ReturnProductModal
                            isOpen={isReturnModalOpen}
                            onClose={() => setIsReturnModalOpen(false)}
                            bill={selectedBill}
                            initialProductId={targetProductId}
                            onSuccess={(createdReturn) => {
                                setLastCreatedReturn(createdReturn || { id: "Success", customer: selectedBill?.customer });
                                setSelectedBill(null);
                                setSearchId("");
                                // Refresh current page of bills if in customer_product mode
                                if (searchMode === "customer_product") {
                                    fetchBills(currentPage, pageSize, false);
                                }
                            }}
                        />
                    </div>
                )}
            </div>
        </main>
    );
};

export default ReturnBillPage;
