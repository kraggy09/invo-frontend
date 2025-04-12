import { useGlobalSocketHandlers } from "../hooks/useGlobalSocketHandlers";

const GlobalSocketHandlers = ({ children }: { children: React.ReactNode }) => {
  // This will set up all global socket handlers that persist throughout the session
  useGlobalSocketHandlers();

  return <>{children}</>;
};

export default GlobalSocketHandlers;
