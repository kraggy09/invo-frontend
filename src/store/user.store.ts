import { create } from "zustand";

type User = {
  _id: string;
  username: string;
  token: string;
};

type UserStore = {
  user: User | null;
  setUser: (user: User) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (isAutehnitated: boolean) => void;
  socketId: string;
  setSocketId: (socketId: string) => void;
};

const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  isAuthenticated: false,
  setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  socketId: "",
  setSocketId: (socketId) => set({ socketId }),
}));

export default useUserStore;
