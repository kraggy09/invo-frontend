import useBillStore from "../store/bill.store";
import useCategoriesStore from "../store/categories.store";
import useCurrentBillStore from "../store/currentBill.store";
import useCustomerStore from "../store/customer.store";
import { useJourneyStore } from "../store/journey.store";
import useProductStore from "../store/product.store";
import { useInventoryRequestStore } from "../store/requests.store";
import useReturnBillStore from "../store/returnBill.store";
import useTabsStore from "../store/tabs.store";
import useTransactionStore from "../store/transaction.store";
import useUserStore from "../store/user.store";

/**
 * Resets all domain stores that hold shop-specific data.
 * Used when switching shops so no previous shop data leaks across shops.
 */
export const resetShopScopedStores = () => {
  try {
    useProductStore.getState().reset();
    useCategoriesStore.getState().reset();
    useCustomerStore.getState().reset();
    useBillStore.getState().reset();
    useCurrentBillStore.getState().reset();
    useTabsStore.getState().reset();
    useTransactionStore.getState().reset();
    useInventoryRequestStore.getState().reset();
    useReturnBillStore.getState().reset();
    useJourneyStore.getState().reset();
    console.log("[resetShopScopedStores] All shop-scoped stores have been successfully reset.");
  } catch (error) {
    console.error("[resetShopScopedStores] Error resetting shop stores:", error);
  }
};

/**
 * Resets ALL stores including the user session, and clears localStorage.
 * Used during user logout or session termination.
 */
export const resetAllStores = () => {
  try {
    resetShopScopedStores();
    useUserStore.getState().reset();
    localStorage.clear();
    console.log("[resetAllStores] All stores and storage have been completely cleared.");
  } catch (error) {
    console.error("[resetAllStores] Error resetting all stores:", error);
  }
};
