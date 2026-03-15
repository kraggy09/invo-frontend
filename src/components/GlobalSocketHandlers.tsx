import { useGlobalSocketHandlers } from "../hooks/useGlobalSocketHandlers";
import { useSocket } from "../contexts/SocketContext";
import SessionBlockedScreen from "./SessionBlockedScreen";

const GlobalSocketHandlers = ({ children }: { children: React.ReactNode }) => {
  // This will set up all global socket handlers that persist throughout the session
  useGlobalSocketHandlers();
  const { isSessionBlocked } = useSocket();

  if (isSessionBlocked) {
    return <SessionBlockedScreen />;
  }

  return <>{children}</>;
};

export default GlobalSocketHandlers;
