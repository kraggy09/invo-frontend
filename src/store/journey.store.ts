import { create } from "zustand";
import apiCaller from "../utils/apiCaller";

export interface IJourneyLog {
    _id: string;
    event: string;
    description: string;
    user?: { _id: string; name: string; username: string };
    entityType?: string;
    entityId?: string;
    metadata?: any;
    createdAt: string;
    updatedAt: string;
}

interface JourneyStore {
    logs: IJourneyLog[];
    loading: boolean;
    total: number;
    page: number;
    limit: number;
    fetchLogs: (page?: number, limit?: number, startDate?: string, endDate?: string) => Promise<void>;
    addLogFromSocket: (log: IJourneyLog) => void;
}

export const useJourneyStore = create<JourneyStore>((set, get) => ({
    logs: [],
    loading: false,
    total: 0,
    page: 1,
    limit: 20,

    fetchLogs: async (page = 1, limit = 20, startDate?: string, endDate?: string) => {
        try {
            set({ loading: true });
            const params: any = { page, limit };
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;

            const res = await apiCaller.get(`/journey-logs`, { params });

            const { logs, total } = res.data.data;

            set((state) => ({
                logs: page === 1 ? logs : logs, // Could append but pagination handles data replacement
                total,
                page,
                limit,
                loading: false,
            }));
        } catch (error) {
            console.error("Failed to fetch journey logs:", error);
            set({ loading: false });
        }
    },

    addLogFromSocket: (log) => {
        set((state) => ({
            logs: [log, ...state.logs].slice(0, state.limit),
            total: state.total + 1
        }));
    }
}));
