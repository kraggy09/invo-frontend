import { Navigate, useLocation } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { useEffect, useState } from "react";
import apiCaller from "../utils/apiCaller";
import { useSocket } from "../contexts/SocketContext";
import useUserStore from "../store/user.store";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const { connect } = useSocket();
  const { isAuthenticated, setIsAuthenticated } = useUserStore(
    (state) => state
  );

  useEffect(() => {
    const checkAuth = async () => {
      if (isAuthenticated) {
        setIsChecking(false);
        return;
      }
      try {
        console.log("CHekcing auth");

        const token = localStorage.getItem("token");
        if (!token) {
          setIsChecking(false);
          return;
        }

        const response = await apiCaller.get("/check-auth");

        if (response?.status === 200 || response?.status === 304) {
          setIsChecking(false);
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem("token");
          localStorage.removeItem("isAuthenticated");
          setIsChecking(false);
        }

        if (response.status === 200) {
          connect();
        }
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("isAuthenticated");
        setIsChecking(false);
      }
    };

    checkAuth();
  }, []);

  if (isChecking) {
    return <div>Loading...</div>; // or a loading spinner
  }

  if (!isAuthenticated && !isChecking) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
