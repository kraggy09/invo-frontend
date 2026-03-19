import useCurrentBillStore from "../store/currentBill.store";
import useTabsStore from "../store/tabs.store";

export const useAddTab = () => {
    const { bills, addBill, setCurrentBillingId } = useCurrentBillStore();
    const { addTab: addTabStore, setActiveKey } = useTabsStore();

    const handleAddTab = (billType: "RETAIL" | "WHOLESALE" | "SUPERWHOLESALE" = "RETAIL") => {
        // Generate new ID based on current max ID or length to avoid collisions if possible
        // Here we use length+1 as per existing logic, but we should be careful
        const newBillingId = bills.length + 1;
        const newKey = `${newBillingId}`;

        addTabStore({
            key: newKey,
            label: `${newKey}`,
            fiveMinutes: false,
            createdAt: new Date().toISOString(),
        });

        setActiveKey(newKey);

        const newBill = {
            id: `${newKey}`,
            amount: 0,
            purchased: [],
            customer: null,
            discount: 0,
            total: 0,
            idx: bills.length,
            createdAt: new Date().toISOString(),
            lastActivityAt: new Date().toISOString(),
            billType: billType as "RETAIL" | "WHOLESALE" | "SUPERWHOLESALE",
        };

        addBill(newBill);
        setCurrentBillingId(newBillingId);
    };

    return handleAddTab;
};
