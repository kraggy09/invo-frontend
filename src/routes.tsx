import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import BillingBody from "./billing/BillingBody";
import ProtectedRoute from "./components/ProtectedRoute";
import BillingPage from "./billing/BillingPage";
import Header from "./common/Header";
const AppRoutes = () => {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <BillingBody />
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
      </Routes>
    </>
  );
};

export default AppRoutes;
