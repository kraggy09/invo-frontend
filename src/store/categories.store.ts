import { create } from "zustand";

export interface Category {
  _id: string;
  name: string;
  wholesale: number;
  superWholeSale: number;
}

interface CategoriesStore {
  categories: Category[];
  setCategories: (categories: Category[]) => void;
}
const useCategoriesStore = create<CategoriesStore>((set) => ({
  categories: [],
  setCategories: (categories: Category[]) => set({ categories }),
}));

export default useCategoriesStore;
