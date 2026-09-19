import { create } from "zustand";

export type ShopSettings = {
  currency?: string;
  invoicePrefix?: string;
  lowStockAlert?: number;
  discordWebhookUrl?: string;
  pricingMode?: "RETAIL_ONLY" | "MULTI_TIER";
  printType?: "A4" | "THERMAL";
};

export type User = {
  _id: string;
  username: string;
  token: string;
  roles?: string[];
  pin?: string;
  shopId?: string;
  shopName?: string;
  shopAddress?: string;
  shopPhone?: string;
  shopSettings?: ShopSettings;
};

export type ShopOption = {
  shopId: string;
  shopName: string;
  shopSlug: string;
  roles: string[];
};

type UserStore = {
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  socketId: string;
  setSocketId: (socketId: string) => void;
  // Multi-shop state
  pendingShopSelection: boolean;
  setPendingShopSelection: (pending: boolean) => void;
  availableShops: ShopOption[];
  setAvailableShops: (shops: ShopOption[]) => void;
  pendingUserId: string | null;
  setPendingUserId: (userId: string | null) => void;
  logout: () => void;
};

const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  isAuthenticated: false,
  setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  socketId: "",
  setSocketId: (socketId) => set({ socketId }),
  // Multi-shop state
  pendingShopSelection: false,
  setPendingShopSelection: (pendingShopSelection) =>
    set({ pendingShopSelection }),
  availableShops: [],
  setAvailableShops: (availableShops) => set({ availableShops }),
  pendingUserId: null,
  setPendingUserId: (pendingUserId) => set({ pendingUserId }),
  logout: () =>
    set({
      user: null,
      isAuthenticated: false,
      socketId: "",
      availableShops: [],
      pendingShopSelection: false,
      pendingUserId: null,
    }),
}));

export default useUserStore;
