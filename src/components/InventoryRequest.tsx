import { useState } from "react";
import {
  CheckOutlined,
  CloseOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import useUserStore from "../store/user.store";
import apiCaller from "../utils/apiCaller";
import { message } from "../utils/antdStatic";

// Nested type for the 'createdBy' user object
type User = {
  _id: string;
  name: string;
  username: string;
  __v: number;
};

// Nested type for the 'product' object
type Product = {
  _id: string;
  name: string;
  mrp: number;
  costPrice: number;
  measuring: string;
  retailPrice: number;
  wholesalePrice: number;
  barcode: number[];
  stock: number;
  packet: number;
  box: number;
  minQuantity: number;
  __v: number;
  superWholesalePrice: number;
  category: string;
  hi: string; // Seems like a Hindi/translated name
};

// Main type for each inventory request (based on your sample data)
export interface IInventoryRequest {
  _id: string;
  createdBy: User;
  approved: boolean;
  product: Product;
  oldStock: number;
  quantity: number;
  newStock: number;
  purpose: string; // e.g., "STOCK_UPDATE"
  date: string; // ISO string; could be Date if parsed
  __v: number;
}

// Props interface for a React component
interface IProps {
  inventoryRequests: IInventoryRequest[] | [];
  setInventoryRequests: React.Dispatch<
    React.SetStateAction<IInventoryRequest[]>
  >;
}

const InventoryRequest = ({
  inventoryRequests,
  setInventoryRequests,
}: IProps) => {
  const { user } = useUserStore();
  const isAdmin = user?.roles?.some(role => ["SUPER_ADMIN", "ADMIN", "CREATOR"].includes(role)) || false;

  const handleRejection = async (id: string) => {
    try {
      // API call to reject the inventory request
      await apiCaller.get(`/stocks/requests/${id}/reject`);
      message.success("Request Rejected");
      const updatedRequests = inventoryRequests.filter(
        (request) => request._id !== id
      );
      setInventoryRequests(updatedRequests);
    } catch (error: any) {
      console.error("Error handling rejection:", error);
      message.error(error?.response?.data?.message || error?.response?.data?.msg || "Failed to reject request");
    }
  };

  const handleInventoryAcceptance = async (inv: IInventoryRequest) => {
    if (inv.approved) return; // Skip if already approved

    try {
      // Optimistic update: Remove from list immediately
      setInventoryRequests((prev) => prev.filter((req) => req._id !== inv._id));

      // Call API with single ID in array
      await apiCaller.post("/stocks/requests/accept-all", {
        // Adjust endpoint if needed
        inventoryRequests: [inv._id],
      });

      message.success(`Request ${inv._id} Accepted`);
    } catch (error: any) {
      console.error("Error handling acceptance:", error);
      // Rollback optimistic update on error
      setInventoryRequests((prev) => [...prev, inv]);
      message.error(error?.response?.data?.message || error?.response?.data?.msg || "Failed to accept request");
    }
  };

  const handleAllInventoryAccept = async () => {
    if (!inventoryRequests || inventoryRequests.length === 0) return;

    // Collect only unapproved request IDs
    const pendingIds = inventoryRequests
      .filter((inv) => !inv.approved)
      .map((inv) => inv._id);

    if (pendingIds.length === 0) {
      message.info("No pending requests to accept");
      return;
    }

    try {
      // Optimistic update: Clear the list
      setInventoryRequests([]);

      // Call API with all IDs
      await apiCaller.post("/stocks/requests/accept-all", {
        // Adjust endpoint if needed
        inventoryRequests: pendingIds,
      });

      message.success("All Requests Accepted");
    } catch (error: any) {
      console.error("Error handling all acceptances:", error);
      // Rollback on error (restore original list)
      setInventoryRequests(inventoryRequests);
      message.error(error?.response?.data?.message || error?.response?.data?.msg || "Failed to accept all requests");
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 sm:p-8 flex items-center justify-between border-b border-gray-50">
        <div>
          <h2 className="text-xl font-black text-gray-800 tracking-tight">
            Inventory Handover
          </h2>
          <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mt-1">
            Review and approve stock adjustments
          </p>
        </div>

        {isAdmin && inventoryRequests && inventoryRequests.length > 0 && (
          <button
            onClick={handleAllInventoryAccept}
            className="h-10 px-6 bg-green-500 hover:bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-100 transition-all active:scale-95 flex items-center gap-2"
          >
            <CheckOutlined />
            <span>Accept All</span>
          </button>
        )}
      </div>

      <div className="p-2 sm:p-4">
        {inventoryRequests && inventoryRequests.length === 0 ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-2">
                <CheckCircleOutlined className="text-3xl text-green-500" />
              </div>
              <div>
                <p className="text-gray-800 font-black tracking-tight text-lg">
                  All Caught Up!
                </p>
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mt-1">
                  No pending inventory requests
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200">
            <table className="min-w-full divide-y divide-gray-100 border-separate border-spacing-y-2">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-4 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] rounded-l-xl">
                    Requested At
                  </th>
                  <th className="px-4 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                    Requester
                  </th>
                  <th className="px-4 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                    Product Details
                  </th>
                  <th className="px-4 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                    Previous
                  </th>
                  <th className="px-4 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                    Adjustment
                  </th>
                  <th className="px-4 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                    New Balance
                  </th>
                  {isAdmin && (
                    <th className="px-4 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] rounded-r-xl">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y-0">
                {inventoryRequests &&
                  inventoryRequests.map((inv) => (
                    <tr key={inv._id} className="group transition-all hover:bg-gray-50/50 rounded-xl overflow-hidden">
                      <td className="px-4 py-5 whitespace-nowrap rounded-l-xl">
                        <div className="text-xs font-black text-gray-800 tracking-tight">
                          {formatDate(new Date(inv.date))}
                        </div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">
                          {formatTime(new Date(inv.date))}
                        </div>
                      </td>
                      <td className="px-4 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-700">{inv.createdBy.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-5 whitespace-nowrap">
                        <div className="text-xs font-black text-indigo-600 uppercase tracking-tight">
                          {inv.product.name}
                        </div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">
                          MRP: ₹{inv.product.mrp}
                        </div>
                      </td>
                      <td className="px-4 py-5 whitespace-nowrap text-right">
                        <div className="text-xs font-bold text-gray-500">
                          {inv.oldStock % 1 !== 0 ? inv.oldStock.toFixed(2) : inv.oldStock}
                        </div>
                      </td>
                      <td className="px-4 py-5 whitespace-nowrap text-right">
                        <div className={`text-xs font-black ${inv.quantity >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {inv.quantity >= 0 ? '+' : ''}{inv.quantity % 1 !== 0 ? inv.quantity.toFixed(2) : inv.quantity}
                        </div>
                      </td>
                      <td className="px-4 py-5 whitespace-nowrap text-right">
                        <div className="text-xs font-black text-gray-800">
                          {inv.newStock % 1 !== 0
                            ? inv.newStock.toFixed(2)
                            : inv.newStock}
                        </div>
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-5 whitespace-nowrap rounded-r-xl">
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={() => handleInventoryAcceptance(inv)}
                              className="w-10 h-10 rounded-xl bg-green-50 text-green-600 hover:bg-green-500 hover:text-white transition-all flex items-center justify-center shadow-sm"
                              disabled={inv.approved}
                              title="Accept"
                            >
                              <CheckOutlined className="text-sm font-bold" />
                            </button>
                            <button
                              onClick={() => handleRejection(inv._id)}
                              className="w-10 h-10 rounded-xl bg-red-50 text-red-600 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-sm"
                              title="Reject"
                            >
                              <CloseOutlined className="text-sm font-bold" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryRequest;
