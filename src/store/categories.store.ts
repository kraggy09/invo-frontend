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
  reset: () => void;
}
const useCategoriesStore = create<CategoriesStore>((set) => ({
  categories: [],
  setCategories: (categories: Category[]) =>
    set({ categories: Array.isArray(categories) ? categories.filter(Boolean) : [] }),
  addCategory: (category: Category) =>
    set((state) => ({
      categories: category ? [...state.categories, category] : state.categories,
    })),
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
  reset: () => set({ categories: [] }),
}));

export default useCategoriesStore;
