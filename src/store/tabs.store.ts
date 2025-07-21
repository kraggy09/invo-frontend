import { create } from "zustand";
import { Bill } from "./currentBill.store";

export type BillingTab = {
  key: string;
  label: string;
  fiveMinutes: boolean;
  createdAt: string;
};

type TabsStore = {
  tabs: BillingTab[];
  activeKey: string;
  setTabs: (tabs: BillingTab[]) => void;
  addTab: (tab: BillingTab) => void;
  removeTab: (targetKey: string) => void;
  setActiveKey: (key: string) => void;
  updateFiveMinutesStatus: (bills: Bill[]) => void;
  removeTabAndBill: (
    targetKey: string,
    bills: Bill[],
    removeBill: (id: string) => void,
    setCurrentBillingId: (id: number) => void
  ) => void;
};

const useTabsStore = create<TabsStore>((set, get) => ({
  tabs: [],
  activeKey: "1",
  setTabs: (tabs) => set({ tabs }),
  addTab: (tab) => set((state) => ({ tabs: [...state.tabs, tab] })),
  removeTab: (targetKey) =>
    set((state) => {
      const idx = state.tabs.findIndex((tab) => tab.key === targetKey);
      let key = Number(state.tabs[idx]?.key);
      const newTabs = state.tabs.filter((tab) => tab.key !== targetKey);
      for (let i = idx; i < newTabs.length; i++) {
        newTabs[i].key = key + "";
        newTabs[i].label = `${key}`;
        key++;
      }
      return { tabs: newTabs };
    }),
  setActiveKey: (key) => set({ activeKey: key }),
  updateFiveMinutesStatus: (bills) => {
    set((state) => {
      const currentTime = new Date();
      const fiveMinutesAgo = new Date(currentTime.getTime() - 1 * 60 * 1000); // test value
      const newTabs = state.tabs.map((tab) => {
        const tabCreatedAt = new Date(tab.createdAt);
        const isOverFive = tabCreatedAt <= fiveMinutesAgo;
        const currentBill = bills.find((bill) => bill.id === tab.key);
        const shouldBlink = !!(
          isOverFive &&
          currentBill &&
          currentBill.total > 0
        );
        return {
          ...tab,
          fiveMinutes: shouldBlink,
        };
      });
      return { tabs: newTabs };
    });
  },
  removeTabAndBill: (targetKey, bills, removeBill, setCurrentBillingId) => {
    const tabs = get().tabs;
    const idx = tabs.findIndex((tab) => tab.key === targetKey);
    let key = Number(tabs[idx]?.key);
    const newTabs = tabs.filter((tab) => tab.key !== targetKey);
    for (let i = idx; i < newTabs.length; i++) {
      newTabs[i].key = key + "";
      newTabs[i].label = `${key}`;
      key++;
    }
    // Remove the bill
    const billIdx = bills.findIndex((bill) => bill.id === targetKey);
    if (billIdx !== -1) {
      removeBill(bills[billIdx].id);
    }
    // Update activeKey and currentBillingId
    let newActiveKey = "";
    let newCurrentBillingId = 0;
    if (newTabs.length === 0) {
      newActiveKey = "";
      newCurrentBillingId = 0;
    } else if (idx < newTabs.length) {
      newActiveKey = newTabs[idx].key;
      newCurrentBillingId = Number(newTabs[idx].key);
    } else {
      newActiveKey = newTabs[newTabs.length - 1].key;
      newCurrentBillingId = Number(newTabs[newTabs.length - 1].key);
    }
    set({ tabs: newTabs, activeKey: newActiveKey });
    setCurrentBillingId(newCurrentBillingId);
  },
}));

export default useTabsStore;
