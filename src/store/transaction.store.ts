import { create } from "zustand";

export interface ITransaction {
  _id: string;
  id: number;
  date: string;
  previousOutstanding?: number;
  newOutstanding?: number;
  customer: string; // ObjectId as string
  approved: boolean;
  approvedBy: string; // ObjectId as string
  name: string;
  purpose?: string;
  amount: number;
  taken?: boolean;
  paymentIn: boolean;
  createdAt: Date | string;
  paymentMode: "CASH" | "ONINE" | "PRODUCT_RETURN";
}

type TransactionStore = {
  transactionId: number;
  setTransactionId: (transactionId: number) => void;
  transactions: ITransaction[];
  loading: boolean;
  error: string | null;
  setTransactions: (transactions: ITransaction[]) => void;
  addTransaction: (transaction: ITransaction) => void;
  updateTransaction: (
    transactionId: string,
    updatedTransaction: Partial<ITransaction>
  ) => void;
  deleteTransaction: (transactionId: string) => void;
};

const useTransactionStore = create<TransactionStore>((set) => ({
  transactionId: 0,
  setTransactionId: (transactionId) => set({ transactionId }),
  transactions: [],
  loading: false,
  error: null,
  setTransactions: (transactions) => set({ transactions }),
  addTransaction: (transaction) =>
    set((state) => ({
      transactions: [...state.transactions, transaction],
    })),
  updateTransaction: (transactionId, updatedTransaction) =>
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t._id === transactionId ? { ...t, ...updatedTransaction } : t
      ),
    })),
  deleteTransaction: (transactionId) =>
    set((state) => ({
      transactions: state.transactions.filter((t) => t._id !== transactionId),
    })),
}));

export default useTransactionStore;
