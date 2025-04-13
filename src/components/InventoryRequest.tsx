import { useState } from "react";
import {
  CheckOutlined,
  CloseOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { Toaster, toast } from "react-hot-toast";

// Dummy data for inventory requests
const dummyInventoryRequests = [
  {
    _id: "1",
    date: new Date(),
    createdBy: "John Doe",
    product: {
      name: "Product A",
      stock: 150.5,
    },
    oldStock: 100.0,
    quantity: 50.5,
  },
  {
    _id: "2",
    date: new Date(),
    createdBy: "Jane Smith",
    product: {
      name: "Product B",
      stock: 200.0,
    },
    oldStock: 180.0,
    quantity: 20.0,
  },
  {
    _id: "3",
    date: new Date(),
    createdBy: "Mike Johnson",
    product: {
      name: "Product C",
      stock: 75.25,
    },
    oldStock: 50.0,
    quantity: 25.25,
  },
];

const InventoryRequest = () => {
  const [inventoryRequests, setInventoryRequests] = useState(
    dummyInventoryRequests
  );
  const [isAdmin] = useState(true); // For demo purposes

  const handleRejection = async (id: string) => {
    try {
      setInventoryRequests((prev) => prev.filter((req) => req._id !== id));
      toast.success("Request Rejected");
    } catch (error) {
      console.error("Error handling rejection:", error);
    }
  };

  const handleInventoryAcceptance = async (data: { _id: string }) => {
    try {
      setInventoryRequests((prev) =>
        prev.filter((req) => req._id !== data._id)
      );
      toast.success("Request Accepted");
    } catch (error) {
      console.error("Error handling acceptance:", error);
    }
  };

  const handleAllInventoryAccept = async () => {
    try {
      setInventoryRequests([]);
      toast.success("All Requests Accepted");
    } catch (error) {
      console.error("Error handling all acceptances:", error);
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
      <Toaster position="top-center" reverseOrder={false} />

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
          Inventory Update Requests
        </h2>
        {isAdmin && inventoryRequests.length > 0 && (
          <button
            onClick={handleAllInventoryAccept}
            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm sm:text-base flex items-center gap-1 transition-colors"
          >
            <CheckOutlined />
            <span>Accept All</span>
          </button>
        )}
      </div>

      {inventoryRequests.length === 0 ? (
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
                  Current Stock
                </th>
                <th className="px-3 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                  New Stock
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
              {inventoryRequests.map((inv) => (
                <tr key={inv._id} className="hover:bg-gray-50">
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(new Date(inv.date))}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatTime(new Date(inv.date))}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                    {inv.createdBy}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
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
