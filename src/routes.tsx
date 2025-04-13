import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import BillingPage from "./billing/BillingPage";
import Header from "./common/Header";
import { useLocation } from "react-router";
import DashboardPage from "./pages/DashboardPage";
import BillPage from "./pages/BillPage";
const AppRoutes = () => {
  const location = useLocation();
  const path = location.pathname;
  return (
    <>
      {path !== "/login" && <Header />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/new-bill"
          element={
            <ProtectedRoute>
              <BillingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bills"
          element={
            <ProtectedRoute>
              <BillPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
};

export default AppRoutes;
