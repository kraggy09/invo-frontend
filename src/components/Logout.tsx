import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../contexts/SocketContext";

const Logout = () => {
  const navigate = useNavigate();
  const { disconnect } = useSocket();

  useEffect(() => {
    // Remove token
    localStorage.removeItem("token");

    // Disconnect socket
    disconnect();

    // Redirect to login
    navigate("/login");
  }, [navigate, disconnect]);

  return null;
};

export default Logout;
