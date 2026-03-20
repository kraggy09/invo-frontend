import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState, useCallback, useRef } from "react";
import apiCaller from "../utils/apiCaller";
import { useSocket } from "../contexts/SocketContext";
import useUserStore from "../store/user.store";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const { connect, isConnected } = useSocket();

  const { isAuthenticated, setIsAuthenticated, setUser, user } = useUserStore(
    (state) => state
  );

  const isCheckingAuthRef = useRef(false);

  const checkAuth = useCallback(async () => {
    // If we are already authenticated and connected, or in the process of checking, skip
    if (isCheckingAuthRef.current) return;

    if (isAuthenticated) {
      console.log("[ProtectedRoute] Already authenticated, ensuring socket is connected.");
      if (!isConnected) {
        connect();
      }
      setIsChecking(false);
      return;
    }

    try {
      isCheckingAuthRef.current = true;
      console.log("[ProtectedRoute] Checking auth via API...");

      const token = localStorage.getItem("token");
      if (!token) {
        console.log("[ProtectedRoute] No token found in localStorage.");
        setIsChecking(false);
        isCheckingAuthRef.current = false;
        return;
      }

      const response = await apiCaller.get("/users/check-auth");

      if (response?.status === 200 || response?.status === 304) {
        console.log("[ProtectedRoute] Auth successful, setting user state and connecting socket.");

        setIsAuthenticated(true);
        // pin: response.data.data.user.pin,

        const newUser: any = {
          _id: response.data.data.user._id,
          username: response.data.data.user.username,
          token: response.data.data.token,
          roles: response.data.data.user.roles,
        }
        if (response.data.data.user.pin) {
          newUser["pin"] = response.data.data.user.pin;
        }
        setUser(newUser);

        // The socket connection should happen AFTER we are sure we are authenticated
        connect();
      } else {
        console.log("[ProtectedRoute] Auth failed with status:", response?.status);
        localStorage.removeItem("token");
        localStorage.removeItem("isAuthenticated");
      }
      setIsChecking(false);
    } catch (error) {
      console.error("[ProtectedRoute] Auth check failed with error:", error);
      localStorage.removeItem("token");
      localStorage.removeItem("isAuthenticated");
      setIsChecking(false);
    } finally {
      isCheckingAuthRef.current = false;
    }
  }, [isAuthenticated, isConnected, connect, setIsAuthenticated, setUser]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isChecking) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated && !isChecking) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role check
  if (allowedRoles && user) {
    const hasRole = user.roles?.some((role) => allowedRoles.includes(role));
    if (!hasRole) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
