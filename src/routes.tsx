import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import BillingPage from "./billing/BillingPage";
import Header from "./common/Header";
import { useLocation } from "react-router";
import DashboardPage from "./pages/DashboardPage";
import BillPage from "./pages/BillPage";
import DailyReportPage from "./pages/DailyReportPage";
import SingleBillPage from "./pages/SingleBillPage";
import BarcodePage from "./pages/BarcodePage";
import CategoryPage from "./pages/CategoryPage";
import CustomerPage from "./pages/CustomerPage";
import IndividualCustomerPage from "./pages/IndividualCustomerPage";
import ProductPage from "./pages/ProductPage";
import NewProductPage from "./pages/NewProductPage";
import EditProductPage from "./pages/EditProductPage";
import UpdateStock from "./pages/UpdateStock";
import NewCustomer from "./components/NewCustomer";
import NewTransaction from "./components/NewTransaction";
import TransactionPage from "./pages/TransactionPage";
import SingleTransactionPage from "./pages/SingleTransactionPage";
import UpdateStockRequest from "./pages/UpdateStockRequest";
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
        <Route
          path="/bills/:id"
          element={
            <ProtectedRoute>
              <SingleBillPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/daily-report"
          element={
            <ProtectedRoute>
              <DailyReportPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/barcode"
          element={
            <ProtectedRoute>
              <BarcodePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/categories"
          element={
            <ProtectedRoute>
              <CategoryPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/customers"
          element={
            <ProtectedRoute>
              <CustomerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers/:id"
          element={
            <ProtectedRoute>
              <IndividualCustomerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <ProductPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/newProduct"
          element={
            <ProtectedRoute>
              <NewProductPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products/:id"
          element={
            <ProtectedRoute>
              <EditProductPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products/updateStock"
          element={
            <ProtectedRoute>
              <UpdateStock />
            </ProtectedRoute>
          }
        />
        <Route
          path="/newCustomer"
          element={
            <ProtectedRoute>
              <NewCustomer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/transactions"
          element={
            <ProtectedRoute>
              <TransactionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/transactions/:id"
          element={
            <ProtectedRoute>
              <SingleTransactionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/new-transaction"
          element={
            <ProtectedRoute>
              <NewTransaction />
            </ProtectedRoute>
          }
        />

      </Routes>
    </>
  );
};

export default AppRoutes;
