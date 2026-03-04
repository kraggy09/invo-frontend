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
  const { connect, isConnected } = useSocket();
  const [firstRender, setFirstRender] = useState(true);
  const { isAuthenticated, setIsAuthenticated, setUser } = useUserStore(
    (state) => state
  );

  const checkAuth = async () => {
    if (isAuthenticated) {
      if (!isConnected) {
        connect();
      }
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

      const response = await apiCaller.get("/users/check-auth");

      if (response?.status === 200 || response?.status === 304) {
        setIsChecking(false);
        console.log(response.data, "USER DATA");

        setIsAuthenticated(true);
        setUser({
          _id: response.data.data.user._id,
          username: response.data.data.user.username,
          token: response.data.data.token,
        });
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("isAuthenticated");
        setIsChecking(false);
      }

      if (response.status === 200) {
        if (!isConnected) {
          connect();
        }
      }
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("isAuthenticated");
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (!firstRender) {
      checkAuth();
    }
  }, [firstRender]);
  useEffect(() => {
    setFirstRender(false);
  }, []);

  if (isChecking) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated && !isChecking) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
