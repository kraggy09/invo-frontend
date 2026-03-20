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
  addCategory: (category: Category) => void;
  updateCategory: (category: Category) => void;
  removeCategory: (categoryId: string) => void;
}
const useCategoriesStore = create<CategoriesStore>((set) => ({
  categories: [],
  setCategories: (categories: Category[]) => set({ categories }),
  addCategory: (category: Category) =>
    set((state) => ({ categories: [...state.categories, category] })),
  updateCategory: (category: Category) =>
    set((state) => ({
      categories: state.categories.map((c) =>
        c._id === category._id ? { ...c, ...category } : c
      ),
    })),
  removeCategory: (categoryId: string) =>
    set((state) => ({
      categories: state.categories.filter((c) => c._id !== categoryId),
    })),
}));

export default useCategoriesStore;
