import axios, { InternalAxiosRequestConfig, AxiosResponse } from "axios";
axios.defaults.withCredentials = true;

const apiCaller = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1",
});

const exemptedRoutes = ["/login", "/signup"];

const isExemptedRoute = (url: string): boolean => {
  return exemptedRoutes.some((route) => url.includes(route));
};

apiCaller.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("token");

    if (config.url && isExemptedRoute(config.url)) {
      return config;
    }

    // Check for token
    if (!token) {
      return Promise.reject(new Error("Token not found"));
    }

    if (config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401 errors
apiCaller.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("isAuthenticated");
    }
    return Promise.reject(error);
  }
);

export default apiCaller;
