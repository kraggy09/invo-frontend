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
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
          Inventory Update Requests
        </h2>
        {isAdmin && inventoryRequests && inventoryRequests.length > 0 && (
          <button
            onClick={handleAllInventoryAccept}
            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm sm:text-base flex items-center gap-1 transition-colors"
          >
            <CheckOutlined />
            <span>Accept All</span>
          </button>
        )}
      </div>

      {inventoryRequests && inventoryRequests.length === 0 ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="flex flex-col items-center gap-2 text-center">
            <CheckCircleOutlined className="text-4xl text-green-500" />
            <p className="text-gray-600 font-medium">
              No new requests! Inventory is up to date
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-3 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-3 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Requested By
                </th>
                <th className="px-3 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-3 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Request Stock
                </th>
                <th className="px-3 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Current Stock
                </th>
                <th className="px-3 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Change
                </th>
                {isAdmin && (
                  <>
                    <th className="px-3 py-3 text-center text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inventoryRequests &&
                inventoryRequests.map((inv) => (
                  <tr key={inv._id} className="hover:bg-gray-50">
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(new Date(inv.date))}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTime(new Date(inv.date))}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                      {inv.createdBy.name}
                    </td>
                    <td className="px-3 capitalize py-4 whitespace-nowrap text-sm text-gray-900">
                      {inv.product.name}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                      {inv.oldStock % 1 !== 0
                        ? inv.oldStock.toFixed(2)
                        : inv.oldStock}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                      {inv.product.stock % 1 !== 0
                        ? inv.product.stock.toFixed(2)
                        : inv.product.stock}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                      {inv.quantity % 1 !== 0
                        ? inv.quantity.toFixed(2)
                        : inv.quantity}
                    </td>
                    {isAdmin && (
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleInventoryAcceptance(inv)}
                            className="p-1 text-green-600 hover:text-green-800 transition-colors"
                            disabled={inv.approved} // Disable if already approved
                          >
                            <CheckOutlined className="text-lg" />
                          </button>
                          <button
                            onClick={() => handleRejection(inv._id)}
                            className="p-1 text-red-600 hover:text-red-800 transition-colors"
                          >
                            <CloseOutlined className="text-lg" />
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
  );
};

export default InventoryRequest;
