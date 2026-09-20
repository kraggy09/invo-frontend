import { useEffect } from "react";
import { useSocket } from "../contexts/SocketContext";
import { resetAllStores } from "../utils/resetAllStores";

const Logout = () => {
  const { disconnect } = useSocket();

  useEffect(() => {
    disconnect();
    resetAllStores();
    window.location.href = "/login";
  }, [disconnect]);

  return null;
};

export default Logout;
