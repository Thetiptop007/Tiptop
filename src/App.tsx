import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import LandingPage from "./pages/LandingPage";
import GuestOrder from "./pages/GuestOrder";
import OrderManagement from "./pages/Orders/OrderManagement";
import AddOrder from "./pages/Orders/AddOrder";
import CustomerList from "./pages/Customers/CustomerList";
import MenuManagement from "./pages/Menu/MenuManagement";
import AddMenu from "./pages/Menu/AddMenu";
import DeliveryList from "./pages/Delivery/DeliveryList";
import AddDelivery from "./pages/Delivery/AddDelivery";
import CategoryManagement from "./pages/Categories/CategoryManagement";
import Settings from "./pages/Settings";
import Developer from "./pages/Developer";
import UserProfiles from "./pages/UserProfiles";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import { AuthProvider } from "./context/AuthContext";
import { ShopStatusProvider } from "./context/ShopStatusContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

export default function App() {
  return (
    <>
      <Router>
        <AuthProvider>
          <ShopStatusProvider>
            <ScrollToTop />
            <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Guest Order Page - Public */}
          <Route path="/order" element={<GuestOrder />} />

          {/* Admin Panel - All routes under /admin (Protected) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Home />} />

            {/* Orders */}
            <Route path="orders" element={<OrderManagement />} />
            <Route path="orders/add" element={<AddOrder />} />

            {/* Customers */}
            <Route path="customers" element={<CustomerList />} />

            {/* Menu */}
            <Route path="menu" element={<MenuManagement />} />
            <Route path="menu/add" element={<AddMenu />} />

            {/* Categories */}
            <Route path="categories" element={<CategoryManagement />} />

            {/* Delivery */}
            <Route path="delivery" element={<DeliveryList />} />
            <Route path="delivery/add" element={<AddDelivery />} />

            {/* Others */}
            <Route path="profile" element={<UserProfiles />} />
            <Route path="settings" element={<Settings />} />
            <Route path="developer" element={<Developer />} />
          </Route>

          {/* Public Privacy Policy */}
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />

          {/* Auth Layout */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
          </ShopStatusProvider>
        </AuthProvider>
      </Router>
    </>
  );
}
