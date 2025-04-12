import { useState, useCallback } from "react";
import apiCaller from "../utils/apiCaller";
import { AxiosResponse } from "axios";

type Method = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface FetchOptions<T = unknown> {
  method?: Method;
  data?: T;
  headers?: Record<string, string>;
}

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export const useFetch = <T>() => {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const fetchData = useCallback(
    async (url: string, options: FetchOptions = {}) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        let response: AxiosResponse<T>;

        switch (options.method) {
          case "POST":
            response = await apiCaller.post<T>(url, options.data);
            break;
          case "PUT":
            response = await apiCaller.put<T>(url, options.data);
            break;
          case "DELETE":
            response = await apiCaller.delete<T>(url);
            break;
          case "PATCH":
            response = await apiCaller.patch<T>(url, options.data);
            break;
          default:
            response = await apiCaller.get<T>(url);
        }

        setState({ data: response.data, loading: false, error: null });
        return response.data;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "An error occurred";
        setState({ data: null, loading: false, error: errorMessage });
        throw error;
      }
    },
    []
  );

  return {
    ...state,
    fetchData,
  };
};
