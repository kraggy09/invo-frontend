import React, { useState, useMemo } from "react";
import {
  CheckCircleOutlined,
  ShopOutlined,
  DollarOutlined,
  CalendarOutlined,
  UserOutlined,
  RightOutlined,
  ExclamationCircleOutlined,
  CheckOutlined,
  CloseOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  UndoOutlined,
  DeleteOutlined,
  LockOutlined,
} from "@ant-design/icons";
import {
  Button,
  InputNumber,
  Radio,
  Popconfirm,
  Tag,
  Modal,
  Tooltip,
} from "antd";
import useUserStore from "../store/user.store";
import useSupplierStore from "../store/supplier.store";
import useSupplierPurchaseStore, {
  ISupplierPurchase,
  ISupplierPurchaseItem,
} from "../store/supplierPurchase.store";
import apiCaller from "../utils/apiCaller";
import { message } from "../utils/antdStatic";
import dayjs from "dayjs";
import { formatIndianNumber } from "../utils";

export interface IInventoryRequest {
  _id: string;
  [key: string]: any;
}

interface IProps {
  inventoryRequests?: IInventoryRequest[] | [];
  setInventoryRequests?: React.Dispatch<
    React.SetStateAction<IInventoryRequest[]>
  >;
}

interface ItemEditState {
  newCostPrice: number;
  newRetailPrice: number;
  newWholesalePrice: number;
  newSuperWholesalePrice: number;
  priceUpdated: boolean;
  lineTotal?: number;
  boxPrice?: number;
  packetPrice?: number;
}

const InventoryRequest: React.FC<IProps> = () => {
  const { user } = useUserStore();

  // Normalize user roles (case-insensitive and support both roles array and singular role)
  const userRoles = useMemo(() => {
    const roles: string[] = [];
    if (Array.isArray(user?.roles)) {
      roles.push(...user.roles);
    }
    if ((user as any)?.role) {
      roles.push((user as any).role);
    }
    return roles.map((r) => String(r).trim().toUpperCase());
  }, [user]);

  // Only SUPER_ADMIN, ADMIN, or CREATOR can open review modal and manage rates
  const canOpenModal = useMemo(() => {
    return userRoles.some((role) =>
      ["SUPER_ADMIN", "ADMIN", "CREATOR"].includes(role)
    );
  }, [userRoles]);

  const isAdmin = canOpenModal;

  const purchases = useSupplierPurchaseStore((state) => state.purchases);
  const pendingPurchases = useMemo(() => {
    return purchases.filter(
      (p) => p.status === "PENDING" || p.status === "ACCEPTED"
    );
  }, [purchases]);

  // Selected purchase for Modal review
  const [activePurchase, setActivePurchase] = useState<ISupplierPurchase | null>(
    null
  );
  const [modalOpen, setModalOpen] = useState(false);

  // Edit states for the items in the modal
  const [itemEdits, setItemEdits] = useState<Record<string, ItemEditState>>({});

  // Active pricing mode per item: "PIECE", "BOX", or "PACKET"
  const [rateModes, setRateModes] = useState<
    Record<string, "PIECE" | "BOX" | "PACKET">
  >({});

  // Payment settings for approval
  const [paymentMode, setPaymentMode] = useState<"CREDIT" | "CASH" | "PARTIAL">(
    "CREDIT"
  );
  const [cashPaid, setCashPaid] = useState<number>(0);
  const [processing, setProcessing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [discardingProductId, setDiscardingProductId] = useState<string | null>(
    null
  );

  const setPurchases = useSupplierPurchaseStore((state) => state.setPurchases);
  const setSuppliers = useSupplierStore((state) => state.setSuppliers);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const [purchasesRes, suppliersRes] = await Promise.all([
        apiCaller.get("/supplier-purchases?limit=100"),
        apiCaller.get("/suppliers"),
      ]);

      if (purchasesRes.data?.success) {
        setPurchases(purchasesRes.data.data.purchases || []);
      }
      if (suppliersRes.data?.success) {
        setSuppliers(suppliersRes.data.data.suppliers || []);
      }
      message.success("Party inward requests refreshed");
    } catch (err: any) {
      console.error(err);
      message.error(
        err?.response?.data?.message || "Failed to refresh party requests"
      );
    } finally {
      setRefreshing(false);
    }
  };

  // Open the review modal and initialize item rates
  const handleOpenReview = (purchase: ISupplierPurchase) => {
    if (!canOpenModal) {
      message.warning(
        "Access restricted: Inward review modal can only be opened by Super Admin, Admin, or Creator."
      );
      return;
    }

    setActivePurchase(purchase);
    const initialEdits: Record<string, ItemEditState> = {};
    const initialModes: Record<string, "PIECE" | "BOX" | "PACKET"> = {};

    purchase.items.forEach((item) => {
      const pid = item.product?._id;
      if (!pid) return;

      const boxSize = item.product?.box || 0;
      const packetSize = item.product?.packet || 0;
      const qty = item.quantity || 0;

      const currentCp =
        item.newCostPrice ?? item.previousCostPrice ?? item.product?.costPrice ?? 0;
      const currentRetail =
        item.newRetailPrice ??
        item.previousRetailPrice ??
        item.product?.retailPrice ??
        0;
      const currentWholesale =
        item.newWholesalePrice ??
        item.previousWholesalePrice ??
        item.product?.wholesalePrice ??
        0;
      const currentSuperWholesale =
        item.newSuperWholesalePrice ??
        item.previousSuperWholesalePrice ??
        item.product?.superWholesalePrice ??
        0;

      const initialLineTotal = Number((currentCp * qty).toFixed(2));
      const initialBoxPrice =
        boxSize > 0 ? Number((currentCp * boxSize).toFixed(2)) : 0;
      const initialPacketPrice =
        packetSize > 0 ? Number((currentCp * packetSize).toFixed(2)) : 0;

      initialEdits[pid] = {
        newCostPrice: currentCp,
        newRetailPrice: currentRetail,
        newWholesalePrice: currentWholesale,
        newSuperWholesalePrice: currentSuperWholesale,
        priceUpdated: item.priceUpdated || false,
        lineTotal: initialLineTotal,
        boxPrice: initialBoxPrice,
        packetPrice: initialPacketPrice,
      };

      // Default mode: if box exists, default to BOX or PIECE
      initialModes[pid] = "PIECE";
    });

    setItemEdits(initialEdits);
    setRateModes(initialModes);
    setPaymentMode("CREDIT");
    setCashPaid(0);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setActivePurchase(null);
    setItemEdits({});
    setRateModes({});
    setDiscardingProductId(null);
  };

  // Helper for per-pc cost price change
  const handleCostPriceChange = (
    productId: string,
    val: number | null,
    quantity?: number,
    boxSize?: number,
    packetSize?: number
  ) => {
    const cp = val === null ? 0 : Math.max(0, val);
    const q = quantity ?? 0;
    const b = boxSize ?? 0;
    const p = packetSize ?? 0;

    setItemEdits((prev) => {
      const current = prev[productId] || {
        newCostPrice: 0,
        newRetailPrice: 0,
        newWholesalePrice: 0,
        newSuperWholesalePrice: 0,
        priceUpdated: false,
      };
      return {
        ...prev,
        [productId]: {
          ...current,
          newCostPrice: cp,
          lineTotal: Number((cp * q).toFixed(2)),
          boxPrice: b > 0 ? Number((cp * b).toFixed(2)) : 0,
          packetPrice: p > 0 ? Number((cp * p).toFixed(2)) : 0,
          priceUpdated: true,
        },
      };
    });
  };

  // Helper for box price change -> recalculates per-pc cost price
  const handleBoxPriceChange = (
    productId: string,
    val: number | null,
    boxSize: number,
    quantity?: number,
    packetSize?: number
  ) => {
    const bPrice = val === null ? 0 : Math.max(0, val);
    const unitCp =
      boxSize > 0 && bPrice > 0 ? Number((bPrice / boxSize).toFixed(4)) : 0;
    const q = quantity ?? 0;
    const p = packetSize ?? 0;

    setItemEdits((prev) => {
      const current = prev[productId] || {
        newCostPrice: 0,
        newRetailPrice: 0,
        newWholesalePrice: 0,
        newSuperWholesalePrice: 0,
        priceUpdated: false,
      };
      return {
        ...prev,
        [productId]: {
          ...current,
          boxPrice: bPrice,
          newCostPrice: unitCp,
          lineTotal: Number((unitCp * q).toFixed(2)),
          packetPrice: p > 0 ? Number((unitCp * p).toFixed(2)) : 0,
          priceUpdated: true,
        },
      };
    });
  };

  // Helper for packet price change -> recalculates per-pc cost price
  const handlePacketPriceChange = (
    productId: string,
    val: number | null,
    packetSize: number,
    quantity?: number,
    boxSize?: number
  ) => {
    const pPrice = val === null ? 0 : Math.max(0, val);
    const unitCp =
      packetSize > 0 && pPrice > 0
        ? Number((pPrice / packetSize).toFixed(4))
        : 0;
    const q = quantity ?? 0;
    const b = boxSize ?? 0;

    setItemEdits((prev) => {
      const current = prev[productId] || {
        newCostPrice: 0,
        newRetailPrice: 0,
        newWholesalePrice: 0,
        newSuperWholesalePrice: 0,
        priceUpdated: false,
      };
      return {
        ...prev,
        [productId]: {
          ...current,
          packetPrice: pPrice,
          newCostPrice: unitCp,
          lineTotal: Number((unitCp * q).toFixed(2)),
          boxPrice: b > 0 ? Number((unitCp * b).toFixed(2)) : 0,
          priceUpdated: true,
        },
      };
    });
  };

  // Helper for line total change -> recalculates per-pc cost price
  const handleLineTotalChange = (
    productId: string,
    val: number | null,
    quantity: number,
    boxSize?: number,
    packetSize?: number
  ) => {
    const total = val === null ? 0 : Math.max(0, val);
    const unitCp =
      quantity > 0 && total > 0 ? Number((total / quantity).toFixed(4)) : 0;
    const b = boxSize ?? 0;
    const p = packetSize ?? 0;

    setItemEdits((prev) => {
      const current = prev[productId] || {
        newCostPrice: 0,
        newRetailPrice: 0,
        newWholesalePrice: 0,
        newSuperWholesalePrice: 0,
        priceUpdated: false,
      };
      return {
        ...prev,
        [productId]: {
          ...current,
          lineTotal: total,
          newCostPrice: unitCp,
          boxPrice: b > 0 ? Number((unitCp * b).toFixed(2)) : 0,
          packetPrice: p > 0 ? Number((unitCp * p).toFixed(2)) : 0,
          priceUpdated: true,
        },
      };
    });
  };

  // Quick nudge line total by +1 or -1
  const handleTotalNudge = (
    productId: string,
    delta: number,
    quantity: number,
    boxSize?: number,
    packetSize?: number
  ) => {
    if (quantity <= 0) return;
    const current = itemEdits[productId];
    const currentTotal =
      current?.lineTotal !== undefined
        ? current.lineTotal
        : Number(((current?.newCostPrice || 0) * quantity).toFixed(2));
    const newTotal = Math.max(0, Number((currentTotal + delta).toFixed(2)));
    handleLineTotalChange(productId, newTotal, quantity, boxSize, packetSize);
  };

  const handleItemFieldChange = (
    productId: string,
    field: keyof ItemEditState,
    value: any
  ) => {
    setItemEdits((prev) => {
      const current = prev[productId] || {
        newCostPrice: 0,
        newRetailPrice: 0,
        newWholesalePrice: 0,
        newSuperWholesalePrice: 0,
        priceUpdated: false,
      };

      const updated = {
        ...current,
        [field]: value,
      };

      // Auto-flag priceUpdated if retail/wholesale/super-wholesale differ from old
      if (
        field === "newRetailPrice" ||
        field === "newWholesalePrice" ||
        field === "newSuperWholesalePrice"
      ) {
        updated.priceUpdated = true;
      }

      return {
        ...prev,
        [productId]: updated,
      };
    });
  };

  // Compute live updated total bill
  const currentTotalBill = useMemo(() => {
    if (!activePurchase) return 0;
    return activePurchase.items.reduce((sum, item) => {
      const pid = item.product?._id;
      const edit = itemEdits[pid];
      if (edit?.lineTotal !== undefined && edit.lineTotal !== null) {
        return sum + edit.lineTotal;
      }
      const cp =
        edit?.newCostPrice ??
        item.newCostPrice ??
        item.previousCostPrice ??
        0;
      return sum + cp * (item.quantity || 0);
    }, 0);
  }, [activePurchase, itemEdits]);

  // Maximum allowed cash payment (Current Bill + Existing Party Udhaar)
  const maxPayable = useMemo(() => {
    const outstanding = activePurchase?.supplier?.outstanding || 0;
    return currentTotalBill + Math.max(0, outstanding);
  }, [currentTotalBill, activePurchase]);

  // Handle cash paid change with warning toast if exceeding total bill + udhar
  const handleCashPaidChange = (val: number | null) => {
    const entered = val ?? 0;
    if (entered > maxPayable) {
      message.warning(
        `Amount cannot exceed bill total (₹${formatIndianNumber(
          currentTotalBill
        )}) + udhaar (₹${formatIndianNumber(
          activePurchase?.supplier?.outstanding || 0
        )}) = ₹${formatIndianNumber(maxPayable)}`
      );
      setCashPaid(maxPayable);
    } else {
      setCashPaid(entered);
    }
  };

  // Compute breakdown of quantities
  const totalInwardUnits = useMemo(() => {
    if (!activePurchase) return 0;
    return activePurchase.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }, [activePurchase]);

  // Handle Accept (Rates Staged)
  const handleSaveRates = async () => {
    if (!activePurchase) return;
    setProcessing(true);
    try {
      const itemsPayload = activePurchase.items.map((item) => {
        const pid = item.product?._id;
        const edit = itemEdits[pid] || {
          newCostPrice: item.previousCostPrice || 0,
          newRetailPrice: item.previousRetailPrice || 0,
          newWholesalePrice: item.previousWholesalePrice || 0,
          newSuperWholesalePrice: item.previousSuperWholesalePrice || 0,
          priceUpdated: false,
        };

        return {
          productId: pid,
          newCostPrice: edit.newCostPrice,
          priceUpdated: edit.priceUpdated,
          newRetailPrice: edit.newRetailPrice,
          newWholesalePrice: edit.newWholesalePrice,
          newSuperWholesalePrice: edit.newSuperWholesalePrice,
        };
      });

      await apiCaller.patch(`/supplier-purchases/${activePurchase._id}/accept`, {
        items: itemsPayload,
      });

      message.success("Rates saved and staged for admin approval!");
      handleCloseModal();
    } catch (err: any) {
      console.error(err);
      message.error(
        err?.response?.data?.message || "Failed to save updated rates"
      );
    } finally {
      setProcessing(false);
    }
  };

  // Handle Approve & Update Stock (Admin)
  const handleApprovePurchase = async () => {
    if (!activePurchase) return;
    setProcessing(true);
    try {
      const itemsPayload = activePurchase.items.map((item) => {
        const pid = item.product?._id;
        const edit = itemEdits[pid] || {
          newCostPrice: item.previousCostPrice || 0,
          newRetailPrice: item.previousRetailPrice || 0,
          newWholesalePrice: item.previousWholesalePrice || 0,
          newSuperWholesalePrice: item.previousSuperWholesalePrice || 0,
          priceUpdated: false,
        };

        return {
          productId: pid,
          newCostPrice: edit.newCostPrice,
          priceUpdated: edit.priceUpdated,
          newRetailPrice: edit.newRetailPrice,
          newWholesalePrice: edit.newWholesalePrice,
          newSuperWholesalePrice: edit.newSuperWholesalePrice,
        };
      });

      if (paymentMode === "PARTIAL" && cashPaid > maxPayable) {
        message.warning(
          `Amount cannot exceed bill total + udhaar (₹${formatIndianNumber(
            maxPayable
          )})!`
        );
        return;
      }

      const actualCashPaid =
        paymentMode === "CASH"
          ? currentTotalBill
          : paymentMode === "CREDIT"
          ? 0
          : Math.min(cashPaid, maxPayable);

      await apiCaller.post(`/supplier-purchases/${activePurchase._id}/approve`, {
        paymentMode,
        cashPaid: actualCashPaid,
        items: itemsPayload,
      });

      message.success("Party inward approved! Product stock and ledger updated.");
      handleCloseModal();
    } catch (err: any) {
      console.error(err);
      message.error(
        err?.response?.data?.message || "Failed to approve inward request"
      );
    } finally {
      setProcessing(false);
    }
  };

  // Handle Discarding a single item
  const handleDiscardItem = async (productId: string, productName: string) => {
    if (!activePurchase) return;
    setDiscardingProductId(productId);
    try {
      const res = await apiCaller.delete(
        `/supplier-purchases/${activePurchase._id}/items/${productId}`
      );

      if (res.data?.success) {
        const data = res.data.data;
        if (data?.purchaseRejected) {
          message.warning(
            `"${productName}" was the only item. Party inward request has been rejected.`
          );
          if (data.purchase) {
            useSupplierPurchaseStore.getState().updatePurchase(data.purchase);
          } else {
            useSupplierPurchaseStore
              .getState()
              .rejectPurchase(activePurchase._id);
          }
          handleCloseModal();
        } else {
          message.success(`"${productName}" discarded from inward request`);
          const updatedPurchase = data?.purchase;
          if (updatedPurchase) {
            setActivePurchase(updatedPurchase);
            useSupplierPurchaseStore.getState().updatePurchase(updatedPurchase);
          } else {
            setActivePurchase((prev) => {
              if (!prev) return null;
              return {
                ...prev,
                items: prev.items.filter(
                  (item) =>
                    (item.product?._id || item.product).toString() !== productId
                ),
              };
            });
          }

          // Clean up local edit states for discarded item
          setItemEdits((prev) => {
            const next = { ...prev };
            delete next[productId];
            return next;
          });
          setRateModes((prev) => {
            const next = { ...prev };
            delete next[productId];
            return next;
          });
        }
      }
    } catch (err: any) {
      console.error(err);
      message.error(
        err?.response?.data?.message ||
          "Failed to discard item from inward request"
      );
    } finally {
      setDiscardingProductId(null);
    }
  };

  // Handle Reject
  const handleRejectPurchase = async () => {
    if (!activePurchase) return;
    setProcessing(true);
    try {
      await apiCaller.post(`/supplier-purchases/${activePurchase._id}/reject`);
      message.success("Party inward request rejected.");
      handleCloseModal();
    } catch (err: any) {
      console.error(err);
      message.error(
        err?.response?.data?.message || "Failed to reject inward request"
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-5 flex items-center justify-between border-b border-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg font-black">
            <ShopOutlined />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-gray-800 tracking-tight m-0">
                Party Inward Requests
              </h2>
              {pendingPurchases.length > 0 && (
                <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-[11px] font-black">
                  {pendingPurchases.length} Pending
                </span>
              )}
            </div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mt-0.5 m-0">
              Supplier purchase bills awaiting price and stock approval
            </p>
          </div>
        </div>

        <div>
          <Button
            type="text"
            icon={<ReloadOutlined spin={refreshing} />}
            loading={refreshing}
            onClick={handleRefresh}
            className="flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-bold text-gray-600 hover:text-indigo-600 hover:bg-indigo-50/60 border border-gray-100 transition-all shadow-none"
          >
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Main Content Area: Party Inward Requests */}
      <div className="p-5">
        {pendingPurchases.length === 0 ? (
          <div className="flex items-center justify-center min-h-[180px]">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-1">
                <CheckCircleOutlined className="text-2xl text-emerald-500" />
              </div>
              <p className="text-gray-800 font-black tracking-tight text-sm m-0">
                All Party Inwards Processed!
              </p>
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest m-0">
                No pending supplier bills to review
              </p>
              <Button
                size="small"
                icon={<ReloadOutlined spin={refreshing} />}
                loading={refreshing}
                onClick={handleRefresh}
                className="rounded-xl text-[11px] font-bold text-gray-500 hover:text-indigo-600 border-gray-200 mt-1"
              >
                Refresh List
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingPurchases.map((purchase) => {
              const isPending = purchase.status === "PENDING";
              const itemCount = purchase.items?.length || 0;
              const totalUnits = purchase.items?.reduce(
                (sum, it) => sum + (it.quantity || 0),
                0
              );
              const estValue = purchase.totalAmount || 0;

              return (
                <div
                  key={purchase._id}
                  onClick={() => handleOpenReview(purchase)}
                  className="group bg-gray-50/70 hover:bg-white rounded-2xl p-5 border border-gray-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50/50 transition-all duration-300 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    {/* Top row: Supplier & Status */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-gray-900 text-base group-hover:text-indigo-600 transition-colors">
                            {purchase.supplier?.name}
                          </span>
                          <Tag
                            color={isPending ? "orange" : "blue"}
                            className="font-black text-xs uppercase rounded-full border-none px-2.5 py-0.5"
                          >
                            {isPending ? "Awaiting Rates" : "Priced • Awaiting Admin"}
                          </Tag>
                        </div>
                        <div className="text-xs font-mono font-bold text-gray-600 mt-1">
                          {purchase.supplier?.phone} • Udhaar: ₹
                          {formatIndianNumber(purchase.supplier?.outstanding || 0)}
                        </div>
                      </div>

                      <div className="w-9 h-9 rounded-xl bg-gray-100 group-hover:bg-indigo-50 text-gray-500 group-hover:text-indigo-600 flex items-center justify-center text-sm transition-colors">
                        {canOpenModal ? (
                          <RightOutlined />
                        ) : (
                          <Tooltip title="Review restricted to Super Admin, Admin, or Creator">
                            <LockOutlined className="text-gray-400" />
                          </Tooltip>
                        )}
                      </div>
                    </div>

                    {/* Meta info: Requester and date */}
                    <div className="flex items-center gap-4 text-xs text-gray-600 font-bold mb-4">
                      <span className="flex items-center gap-1.5">
                        <UserOutlined />
                        {purchase.raisedBy?.name || "Requester"}
                      </span>
                      <span className="flex items-center gap-1.5 font-mono">
                        <CalendarOutlined />
                        {dayjs(purchase.raisedAt).format("DD MMM, hh:mm A")}
                      </span>
                    </div>

                    {/* Products chips preview */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {purchase.items.slice(0, 3).map((item, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 shadow-2xs"
                        >
                          {item.product?.name} ({item.quantity}{" "}
                          {item.product?.measuring || "pcs"})
                        </span>
                      ))}
                      {purchase.items.length > 3 && (
                        <span className="px-2.5 py-1 bg-gray-200/70 rounded-lg text-xs font-black text-gray-700">
                          +{purchase.items.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom summary bar */}
                  <div className="pt-3 border-t border-gray-200/70 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black uppercase text-gray-500 tracking-wider block">
                        Items Summary
                      </span>
                      <span className="text-sm font-black text-gray-800 font-mono">
                        {itemCount} Items • {totalUnits} Units
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black uppercase text-gray-500 tracking-wider block">
                        {estValue > 0 ? "Total Bill" : "Action Required"}
                      </span>
                      <span
                        className={`text-base font-black font-mono ${
                          estValue > 0 ? "text-indigo-700" : "text-amber-700"
                        }`}
                      >
                        {estValue > 0
                          ? `₹${formatIndianNumber(estValue)}`
                          : canOpenModal
                          ? "Review Rates"
                          : "Awaiting Admin"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review Dialog Box (Modal) */}
      <Modal
        open={modalOpen && canOpenModal}
        onCancel={handleCloseModal}
        width={1260}
        footer={null}
        destroyOnClose
        centered
        className="party-inward-review-modal"
      >
        {activePurchase && (
          <div className="p-2 sm:p-4">
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-gray-100 mb-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl font-black">
                  <ShopOutlined />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight m-0">
                      {activePurchase.supplier?.name}
                    </h2>
                    <Tag
                      color={
                        activePurchase.status === "PENDING" ? "orange" : "blue"
                      }
                      className="font-black text-xs uppercase rounded-full border-none px-3 py-1"
                    >
                      {activePurchase.status === "PENDING"
                        ? "Awaiting Rates"
                        : "Priced • Awaiting Approval"}
                    </Tag>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600 font-bold mt-1.5 flex-wrap">
                    <span>Phone: {activePurchase.supplier?.phone || "N/A"}</span>
                    <span>•</span>
                    <span>Raised by: {activePurchase.raisedBy?.name || "Staff"}</span>
                    <span>•</span>
                    <span className="font-mono text-gray-700">
                      {dayjs(activePurchase.raisedAt).format(
                        "DD MMM YYYY, hh:mm A"
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Current Udhaar Badge */}
              <div className="bg-amber-100/70 px-5 py-3 rounded-2xl border border-amber-300 text-right shadow-sm">
                <span className="text-xs font-black uppercase text-amber-900 tracking-wider block">
                  Current Party Udhaar
                </span>
                <span className="text-2xl font-black text-amber-900 font-mono">
                  ₹{formatIndianNumber(activePurchase.supplier?.outstanding || 0)}
                </span>
              </div>
            </div>

            {/* Products Pricing Table (Fast, Simple Tabular Format with Inline Rate Sync) */}
            <div className="overflow-x-auto mb-6 rounded-2xl border border-gray-200 shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-xs font-black uppercase tracking-wider text-slate-700 border-b border-gray-200">
                    <th className="py-3.5 px-4 min-w-[200px]">Product / SKU</th>
                    <th className="py-3.5 px-3 text-center min-w-[100px]">Inward Qty</th>
                    <th className="py-3.5 px-3 min-w-[150px]">
                      Cost Price (CP)
                      <span className="block text-xs font-bold text-indigo-700 normal-case mt-0.5">
                        Pc / Box / Pkt
                      </span>
                    </th>
                    <th className="py-3.5 px-3 min-w-[130px]">
                      Retail Price
                      <span className="block text-xs font-bold text-gray-500 normal-case mt-0.5">
                        Old vs New
                      </span>
                    </th>
                    <th className="py-3.5 px-3 min-w-[130px]">
                      Wholesale Price
                      <span className="block text-xs font-bold text-gray-500 normal-case mt-0.5">
                        Old vs New
                      </span>
                    </th>
                    <th className="py-3.5 px-3 min-w-[130px]">
                      Super Wholesale
                      <span className="block text-xs font-bold text-gray-500 normal-case mt-0.5">
                        Old vs New
                      </span>
                    </th>
                    <th className="py-3.5 px-4 text-right min-w-[210px]">
                      Total Cost
                      <span className="block text-xs font-black text-indigo-700 normal-case mt-0.5">
                        [-1] Edit [+1]
                      </span>
                    </th>
                    {isAdmin && (
                      <th className="py-3.5 px-3 text-center w-16 min-w-[60px]">
                        Action
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {activePurchase.items.map((item) => {
                    const pid = item.product?._id;
                    const edit = itemEdits[pid] || {
                      newCostPrice:
                        item.previousCostPrice || item.product?.costPrice || 0,
                      newRetailPrice:
                        item.previousRetailPrice || item.product?.retailPrice || 0,
                      newWholesalePrice:
                        item.previousWholesalePrice ||
                        item.product?.wholesalePrice ||
                        0,
                      newSuperWholesalePrice:
                        item.previousSuperWholesalePrice ||
                        item.product?.superWholesalePrice ||
                        0,
                      priceUpdated: false,
                    };

                    const oldCp =
                      item.previousCostPrice ?? item.product?.costPrice ?? 0;
                    const oldRetail =
                      item.previousRetailPrice ?? item.product?.retailPrice ?? 0;
                    const oldWholesale =
                      item.previousWholesalePrice ??
                      item.product?.wholesalePrice ??
                      0;
                    const oldSuperWholesale =
                      item.previousSuperWholesalePrice ??
                      item.product?.superWholesalePrice ??
                      0;

                    const boxSize = item.product?.box || 0;
                    const packetSize = item.product?.packet || 0;

                    const displayLineTotal =
                      edit.lineTotal !== undefined
                        ? edit.lineTotal
                        : Number(
                            (
                              (edit.newCostPrice || 0) *
                              (item.quantity || 0)
                            ).toFixed(2)
                          );

                    const oldLineTotal = Number(
                      (oldCp * (item.quantity || 0)).toFixed(2)
                    );

                    const displayBoxPrice =
                      edit.boxPrice !== undefined
                        ? edit.boxPrice
                        : boxSize > 0
                        ? Number(((edit.newCostPrice || 0) * boxSize).toFixed(2))
                        : 0;
                    const oldBoxPrice =
                      boxSize > 0 ? Number((oldCp * boxSize).toFixed(2)) : 0;

                    const displayPacketPrice =
                      edit.packetPrice !== undefined
                        ? edit.packetPrice
                        : packetSize > 0
                        ? Number(
                            (
                              (edit.newCostPrice || 0) * packetSize
                            ).toFixed(2)
                          )
                        : 0;
                    const oldPacketPrice =
                      packetSize > 0 ? Number((oldCp * packetSize).toFixed(2)) : 0;

                    // Active mode for CP input: "PIECE", "BOX", or "PACKET"
                    const mode = rateModes[pid] || "PIECE";

                    // Price validation checks
                    const cp = edit.newCostPrice || 0;
                    const retail = edit.newRetailPrice || 0;
                    const wholesale = edit.newWholesalePrice || 0;
                    const superWholesale = edit.newSuperWholesalePrice || 0;

                    const isLossOnRetail = retail > 0 && cp > retail;
                    const isLossOnWholesale = wholesale > 0 && cp > wholesale;
                    const isLossOnSuper = superWholesale > 0 && cp > superWholesale;
                    const isInvertedWholesale =
                      wholesale > 0 && retail > 0 && wholesale > retail;
                    const isInvertedSuper =
                      superWholesale > 0 &&
                      wholesale > 0 &&
                      superWholesale > wholesale;

                    const hasWarning =
                      isLossOnRetail ||
                      isLossOnWholesale ||
                      isLossOnSuper ||
                      isInvertedWholesale ||
                      isInvertedSuper;

                    const hasCpChanged = edit.newCostPrice !== oldCp;

                    return (
                      <tr
                        key={pid}
                        className={`transition-colors ${
                          isLossOnRetail || isLossOnWholesale || isLossOnSuper
                            ? "bg-red-50/40 hover:bg-red-50/70"
                            : hasWarning
                            ? "bg-amber-50/40 hover:bg-amber-50/70"
                            : "hover:bg-indigo-50/30"
                        }`}
                      >
                        {/* Product Info */}
                        <td className="py-4 px-4 align-top min-w-[200px]">
                          <div className="font-black text-gray-900 text-sm leading-snug">
                            {item.product?.name}
                          </div>
                          <div className="text-xs font-mono font-bold text-gray-600 mt-0.5">
                            {item.product?.barcode?.[0]
                              ? `SKU: ${item.product.barcode[0]}`
                              : item.product?.measuring || "Item"}
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                            {boxSize > 0 && (
                              <span className="text-xs font-mono font-black bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-md px-2 py-0.5 inline-block shadow-xs">
                                📦 1 Box = {boxSize} pcs
                              </span>
                            )}
                            {packetSize > 0 && (
                              <span className="text-xs font-mono font-black bg-purple-50 text-purple-800 border border-purple-200 rounded-md px-2 py-0.5 inline-block shadow-xs">
                                ✉️ 1 Pkt = {packetSize} pcs
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Inward Qty */}
                        <td className="py-4 px-3 text-center align-top min-w-[100px]">
                          <span className="font-black text-indigo-700 font-mono text-base block">
                            {item.quantity}
                          </span>
                          <span className="text-xs uppercase font-black text-gray-600 block mt-0.5">
                            {item.product?.measuring || "units"}
                          </span>
                          {boxSize > 0 && (
                            <span className="text-xs font-mono font-black text-indigo-700 block mt-1 bg-indigo-50/80 rounded px-1.5 py-0.5 border border-indigo-100">
                              ({(item.quantity / boxSize).toFixed(1)} boxes)
                            </span>
                          )}
                        </td>

                        {/* Cost Price: Clean Mode Switcher for Pc, Box, Pkt */}
                        <td className="py-4 px-3 align-top min-w-[150px]">
                          <div className="flex flex-col gap-1.5">
                            {/* Fast Packaging Mode Switcher Buttons */}
                            {(boxSize > 0 || packetSize > 0) && (
                              <div className="flex items-center gap-1 mb-0.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setRateModes((prev) => ({
                                      ...prev,
                                      [pid]: "PIECE",
                                    }))
                                  }
                                  className={`px-2 py-1 rounded-md text-xs font-black cursor-pointer transition-colors ${
                                    mode === "PIECE"
                                      ? "bg-gray-900 text-white shadow-sm"
                                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
                                  }`}
                                >
                                  Pc
                                </button>
                                {boxSize > 0 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setRateModes((prev) => ({
                                        ...prev,
                                        [pid]: "BOX",
                                      }))
                                    }
                                    className={`px-2 py-1 rounded-md text-xs font-black cursor-pointer transition-colors ${
                                      mode === "BOX"
                                        ? "bg-indigo-600 text-white shadow-sm"
                                        : "bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200"
                                    }`}
                                  >
                                    Box ({boxSize})
                                  </button>
                                )}
                                {packetSize > 0 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setRateModes((prev) => ({
                                        ...prev,
                                        [pid]: "PACKET",
                                      }))
                                    }
                                    className={`px-2 py-1 rounded-md text-xs font-black cursor-pointer transition-colors ${
                                      mode === "PACKET"
                                        ? "bg-purple-600 text-white shadow-sm"
                                        : "bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200"
                                    }`}
                                  >
                                    Pkt ({packetSize})
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Single Clean Input Adapts to the Active Mode */}
                            {mode === "PIECE" && (
                              <InputNumber
                                min={0}
                                step={0.01}
                                size="middle"
                                value={edit.newCostPrice}
                                onChange={(val) =>
                                  handleCostPriceChange(
                                    pid,
                                    val,
                                    item.quantity,
                                    boxSize,
                                    packetSize
                                  )
                                }
                                className="w-32 font-mono font-black text-gray-900 rounded-xl text-sm"
                                prefix="₹"
                              />
                            )}

                            {mode === "BOX" && (
                              <InputNumber
                                min={0}
                                step={0.5}
                                size="middle"
                                value={displayBoxPrice}
                                onChange={(val) =>
                                  handleBoxPriceChange(
                                    pid,
                                    val,
                                    boxSize,
                                    item.quantity,
                                    packetSize
                                  )
                                }
                                className="w-32 font-mono font-black text-indigo-800 rounded-xl border-indigo-300 text-sm"
                                prefix="₹"
                              />
                            )}

                            {mode === "PACKET" && (
                              <InputNumber
                                min={0}
                                step={0.5}
                                size="middle"
                                value={displayPacketPrice}
                                onChange={(val) =>
                                  handlePacketPriceChange(
                                    pid,
                                    val,
                                    packetSize,
                                    item.quantity,
                                    boxSize
                                  )
                                }
                                className="w-32 font-mono font-black text-purple-800 rounded-xl border-purple-300 text-sm"
                                prefix="₹"
                              />
                            )}
                          </div>
                        </td>

                        {/* Retail Price */}
                        <td className="py-4 px-3 align-top min-w-[130px]">
                          <div className="flex flex-col gap-1.5">
                            <span className="text-xs font-mono font-bold text-gray-700">
                              Old: <span className="font-black text-gray-900">₹{oldRetail}</span>
                            </span>
                            <InputNumber
                              min={0}
                              size="middle"
                              value={edit.newRetailPrice}
                              onChange={(val) =>
                                handleItemFieldChange(
                                  pid,
                                  "newRetailPrice",
                                  val ?? 0
                                )
                              }
                              className="w-28 font-mono font-black text-gray-900 rounded-xl text-sm"
                              prefix="₹"
                            />
                            {isLossOnRetail && (
                              <Tag
                                color="error"
                                className="text-xs font-black mt-1 m-0 px-2 py-0.5 rounded border border-red-300"
                              >
                                ⚠️ CP &gt; Retail
                              </Tag>
                            )}
                          </div>
                        </td>

                        {/* Wholesale Price */}
                        <td className="py-4 px-3 align-top min-w-[130px]">
                          <div className="flex flex-col gap-1.5">
                            <span className="text-xs font-mono font-bold text-gray-700">
                              Old:{" "}
                              <span className="font-black text-gray-900">₹{oldWholesale}</span>
                            </span>
                            <InputNumber
                              min={0}
                              size="middle"
                              value={edit.newWholesalePrice}
                              onChange={(val) =>
                                handleItemFieldChange(
                                  pid,
                                  "newWholesalePrice",
                                  val ?? 0
                                )
                              }
                              className="w-28 font-mono font-black text-gray-900 rounded-xl text-sm"
                              prefix="₹"
                            />
                            {isLossOnWholesale && (
                              <Tag
                                color="error"
                                className="text-xs font-black mt-1 m-0 px-2 py-0.5 rounded border border-red-300"
                              >
                                ⚠️ CP &gt; Wholesale
                              </Tag>
                            )}
                            {isInvertedWholesale && (
                              <Tag
                                color="warning"
                                className="text-xs font-black mt-1 m-0 px-2 py-0.5 rounded border border-amber-300"
                              >
                                ⚠️ WS &gt; Retail
                              </Tag>
                            )}
                          </div>
                        </td>

                        {/* Super Wholesale Price */}
                        <td className="py-4 px-3 align-top min-w-[130px]">
                          <div className="flex flex-col gap-1.5">
                            <span className="text-xs font-mono font-bold text-gray-700">
                              Old:{" "}
                              <span className="font-black text-gray-900">
                                ₹{oldSuperWholesale}
                              </span>
                            </span>
                            <InputNumber
                              min={0}
                              size="middle"
                              value={edit.newSuperWholesalePrice}
                              onChange={(val) =>
                                handleItemFieldChange(
                                  pid,
                                  "newSuperWholesalePrice",
                                  val ?? 0
                                )
                              }
                              className="w-28 font-mono font-black text-gray-900 rounded-xl text-sm"
                              prefix="₹"
                            />
                            {isLossOnSuper && (
                              <Tag
                                color="error"
                                className="text-xs font-black mt-1 m-0 px-2 py-0.5 rounded border border-red-300"
                              >
                                ⚠️ CP &gt; Super WS
                              </Tag>
                            )}
                            {isInvertedSuper && (
                              <Tag
                                color="warning"
                                className="text-xs font-black mt-1 m-0 px-2 py-0.5 rounded border border-amber-300"
                              >
                                ⚠️ Super &gt; WS
                              </Tag>
                            )}
                          </div>
                        </td>

                        {/* Total Cost Column: [-1] Input [+1] with Live Inline Rate Confirmation */}
                        <td className="py-4 px-4 text-right align-top min-w-[210px]">
                          <div className="flex flex-col items-end gap-1.5">
                            {/* Fast Stepper + Input */}
                            <div className="flex items-center gap-1.5 justify-end">
                              <Button
                                size="middle"
                                onClick={() =>
                                  handleTotalNudge(
                                    pid,
                                    -1,
                                    item.quantity,
                                    boxSize,
                                    packetSize
                                  )
                                }
                                className="h-9 w-9 p-0 flex items-center justify-center font-black text-sm rounded-xl bg-slate-100 hover:bg-indigo-50 border border-slate-300 hover:border-indigo-400 hover:text-indigo-700 active:scale-95 transition-all shadow-none"
                                title="Adjust line total by -₹1"
                              >
                                -1
                              </Button>

                              <InputNumber
                                min={0}
                                step={1}
                                size="middle"
                                value={displayLineTotal}
                                onChange={(val) =>
                                  handleLineTotalChange(
                                    pid,
                                    val,
                                    item.quantity,
                                    boxSize,
                                    packetSize
                                  )
                                }
                                className="w-32 font-mono font-black text-base text-gray-900 rounded-xl border border-indigo-300 focus:border-indigo-600 shadow-xs"
                                prefix="₹"
                              />

                              <Button
                                size="middle"
                                onClick={() =>
                                  handleTotalNudge(
                                    pid,
                                    1,
                                    item.quantity,
                                    boxSize,
                                    packetSize
                                  )
                                }
                                className="h-9 w-9 p-0 flex items-center justify-center font-black text-sm rounded-xl bg-slate-100 hover:bg-indigo-50 border border-slate-300 hover:border-indigo-400 hover:text-indigo-700 active:scale-95 transition-all shadow-none"
                                title="Adjust line total by +₹1"
                              >
                                +1
                              </Button>
                            </div>

                            {/* Simple, un-distorted rate changes aligned in straight lines below Total Cost */}
                            {hasCpChanged ? (
                              <div className="flex flex-col items-end gap-1 mt-1.5 font-mono text-xs">
                                {/* CP change line with reset button */}
                                <div className="flex items-center gap-1.5 font-black text-indigo-700">
                                  <span>CP: ₹{oldCp} → ₹{edit.newCostPrice}</span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleCostPriceChange(
                                        pid,
                                        oldCp,
                                        item.quantity,
                                        boxSize,
                                        packetSize
                                      )
                                    }
                                    className="text-gray-400 hover:text-red-600 cursor-pointer p-0.5 ml-0.5 transition-colors"
                                    title="Reset to old rates"
                                  >
                                    <UndoOutlined className="text-xs" />
                                  </button>
                                </div>

                                {/* Box change line */}
                                {boxSize > 0 && (
                                  <div className="font-bold text-gray-800">
                                    Box: ₹{oldBoxPrice} → ₹{displayBoxPrice}
                                  </div>
                                )}

                                {/* Packet change line */}
                                {packetSize > 0 && (
                                  <div className="font-bold text-gray-800">
                                    Pkt: ₹{oldPacketPrice} → ₹{displayPacketPrice}
                                  </div>
                                )}

                                {/* Formula line */}
                                <div className="text-[11px] font-semibold text-gray-500 mt-0.5">
                                  ₹{edit.newCostPrice} × {item.quantity} = ₹{displayLineTotal}
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-end gap-0.5 mt-1 font-mono text-xs text-gray-600">
                                <div className="font-bold">
                                  ₹{edit.newCostPrice} × {item.quantity} = ₹{displayLineTotal}
                                </div>
                                {boxSize > 0 && (
                                  <div className="text-[11px] text-gray-500">
                                    Box ({boxSize}): ₹{displayBoxPrice}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Discard Item Action */}
                        {isAdmin && (
                          <td className="py-4 px-3 text-center align-top w-16 min-w-[60px]">
                            <Popconfirm
                              title="Discard Item"
                              description={
                                activePurchase.items.length === 1
                                  ? `⚠️ "${item.product?.name}" is the only item. Discarding it will reject the entire inward request. Continue?`
                                  : `Discard "${item.product?.name}" from this inward request?`
                              }
                              okText="Yes, Discard"
                              cancelText="No"
                              okButtonProps={{
                                danger: true,
                                loading: discardingProductId === pid,
                              }}
                              onConfirm={() =>
                                handleDiscardItem(
                                  pid,
                                  item.product?.name || "Product"
                                )
                              }
                              disabled={
                                processing || discardingProductId !== null
                              }
                            >
                              <Tooltip title="Discard this item if entry is wrong">
                                <Button
                                  type="text"
                                  danger
                                  icon={<DeleteOutlined />}
                                  loading={discardingProductId === pid}
                                  disabled={
                                    processing ||
                                    (discardingProductId !== null &&
                                      discardingProductId !== pid)
                                  }
                                  className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors shadow-none"
                                />
                              </Tooltip>
                            </Popconfirm>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Total Bill Banner */}
            <div className="bg-gradient-to-r from-indigo-100/70 via-indigo-50/50 to-white rounded-2xl p-5 border border-indigo-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shadow-sm">
              <div>
                <span className="text-xs font-black uppercase text-indigo-900 tracking-widest block">
                  Cost Summary
                </span>
                <span className="text-sm text-gray-700 font-bold mt-1 block">
                  {activePurchase.items.length} Products • {totalInwardUnits} Total
                  Quantity
                </span>
              </div>

              <div className="text-right">
                <span className="text-xs font-black uppercase text-gray-600 tracking-wider block">
                  Updated Total Bill
                </span>
                <span className="text-3xl font-black text-indigo-700 font-mono">
                  ₹{formatIndianNumber(currentTotalBill)}
                </span>
              </div>
            </div>

            {/* Admin Settlement Options */}
            {isAdmin && (
              <div className="bg-slate-50/90 rounded-2xl p-5 border border-slate-200 mb-6 shadow-sm">
                <div className="flex items-center justify-between gap-2 mb-3.5">
                  <div className="flex items-center gap-2">
                    <DollarOutlined className="text-indigo-600 font-black text-base" />
                    <span className="text-sm font-black uppercase tracking-wider text-gray-800">
                      Payment Mode & Market Settlement
                    </span>
                  </div>
                  <span className="text-xs font-black text-gray-700 font-mono bg-white px-3 py-1 rounded-xl border border-gray-200 shadow-xs">
                    Max Payable: ₹{formatIndianNumber(maxPayable)}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <Radio.Group
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="flex flex-wrap gap-2"
                  >
                    <Radio.Button
                      value="CREDIT"
                      className="rounded-xl font-bold text-xs h-10 leading-9"
                    >
                      Full Credit (Market Udhaar)
                    </Radio.Button>
                    <Radio.Button
                      value="CASH"
                      className="rounded-xl font-bold text-xs h-10 leading-9"
                    >
                      Full Cash Paid
                    </Radio.Button>
                    <Radio.Button
                      value="PARTIAL"
                      className="rounded-xl font-bold text-xs h-10 leading-9"
                    >
                      Partial Payment
                    </Radio.Button>
                  </Radio.Group>

                  {paymentMode === "PARTIAL" && (
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-black text-gray-700">
                        Cash Paid Now:
                      </span>
                      <InputNumber
                        min={0}
                        max={maxPayable}
                        value={cashPaid}
                        onChange={handleCashPaidChange}
                        prefix="₹"
                        className="w-40 font-mono font-black text-base rounded-xl"
                      />
                    </div>
                  )}
                </div>

                {/* Settlement impact summary */}
                <div className="mt-4 pt-3.5 border-t border-gray-200 flex flex-wrap gap-8 text-sm font-mono">
                  <div>
                    <span className="text-xs text-gray-600 block uppercase font-sans font-black tracking-wide">
                      Cash Out Now
                    </span>
                    <span className="font-black text-lg text-emerald-700">
                      ₹
                      {formatIndianNumber(
                        paymentMode === "CASH"
                          ? currentTotalBill
                          : paymentMode === "CREDIT"
                          ? 0
                          : Math.min(cashPaid, maxPayable)
                      )}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-gray-600 block uppercase font-sans font-black tracking-wide">
                      {paymentMode === "PARTIAL" && cashPaid >= currentTotalBill
                        ? "Paid Towards Old Udhaar"
                        : "Added to Market Udhaar"}
                    </span>
                    <span
                      className={`font-black text-lg ${
                        paymentMode === "PARTIAL" && cashPaid >= currentTotalBill
                          ? "text-emerald-700"
                          : "text-amber-700"
                      }`}
                    >
                      ₹
                      {formatIndianNumber(
                        paymentMode === "CASH"
                          ? 0
                          : paymentMode === "CREDIT"
                          ? currentTotalBill
                          : cashPaid >= currentTotalBill
                          ? cashPaid - currentTotalBill
                          : currentTotalBill - cashPaid
                      )}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-gray-600 block uppercase font-sans font-black tracking-wide">
                      New Total Udhaar Balance
                    </span>
                    <span className="font-black text-lg text-gray-900">
                      ₹
                      {formatIndianNumber(
                        Math.max(
                          0,
                          (activePurchase.supplier?.outstanding || 0) +
                            currentTotalBill -
                            (paymentMode === "CASH"
                              ? currentTotalBill
                              : paymentMode === "CREDIT"
                              ? 0
                              : Math.min(cashPaid, maxPayable))
                        )
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-100">
              <div>
                <Popconfirm
                  title="Reject Inward Request"
                  description="Are you sure you want to reject this party inward request? Stock will not be added."
                  onConfirm={handleRejectPurchase}
                  okText="Yes, Reject"
                  cancelText="No"
                  okButtonProps={{ danger: true }}
                >
                  <Button danger type="text" className="font-bold text-xs">
                    Reject Request
                  </Button>
                </Popconfirm>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button
                  onClick={handleCloseModal}
                  disabled={processing}
                  className="rounded-xl font-bold text-xs h-11 px-5"
                >
                  Cancel
                </Button>

                <Button
                  onClick={handleSaveRates}
                  loading={processing}
                  className="rounded-xl font-bold text-xs h-11 px-5 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                >
                  Save Rates Only
                </Button>

                {isAdmin && (
                  <Button
                    type="primary"
                    onClick={handleApprovePurchase}
                    loading={processing}
                    icon={<CheckOutlined />}
                    className="rounded-xl font-bold text-xs h-11 px-7 bg-indigo-600 hover:bg-indigo-700 border-none shadow-lg shadow-indigo-100"
                  >
                    Approve & Update Stock
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InventoryRequest;
