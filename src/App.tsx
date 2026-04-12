import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import AppLayout from "./layout/AppLayout";
import CustomerLayout from "./layout/CustomerLayout";
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
import OfferList from "./pages/Offers/OfferList";
import CreateOffer from "./pages/Offers/CreateOffer";
import Settings from "./pages/Settings";
import Developer from "./pages/Developer";
import UserProfiles from "./pages/UserProfiles";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CustomerLogin from "./pages/Customer/CustomerLogin";
import CustomerSignUp from "./pages/Customer/CustomerSignUp";
import VerifyOTP from "./pages/Customer/VerifyOTP";
import CustomerHome from "./pages/Customer/CustomerHome";
import CustomerMenu from "./pages/Customer/CustomerMenu";
import ItemDetails from "./pages/Customer/ItemDetails";
import Cart from "./pages/Customer/Cart";
import Payment from "./pages/Customer/Payment";
import CustomerOrders from "./pages/Customer/CustomerOrders";
import CustomerProfile from "./pages/Customer/CustomerProfile";
import EditProfile from "./pages/Customer/EditProfile";
import SavedAddresses from "./pages/Customer/SavedAddresses";
import HelpSupport from "./pages/Customer/HelpSupport";
import CustomerPrivacyPolicy from "./pages/Customer/CustomerPrivacyPolicy";
import { AuthProvider } from "./context/AuthContext";
import { CustomerAuthProvider, useCustomerAuth } from "./context/CustomerAuthContext";
import { ShopStatusProvider } from "./context/ShopStatusContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { useEffect } from "react";
import { logger } from "./utils/logger";

function AppContent() {
  const { isLoading } = useCustomerAuth();
  
  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <Routes>
      {/* Public Landing Page */}
      <Route path="/" element={<LandingPage />} />
                
                {/* Guest Order Page - Public */}
                <Route path="/order" element={<GuestOrder />} />

                {/* Customer Auth Routes */}
                <Route path="/customer/login" element={<CustomerLogin />} />
                <Route path="/customer/signup" element={<CustomerSignUp />} />
                <Route path="/customer/verify-otp" element={<VerifyOTP />} />

                {/* Customer Web App - All routes under /customer (Public/Protected) */}
                <Route path="/customer" element={<CustomerLayout />}>
                  <Route index element={<CustomerHome />} />
                  <Route path="menu" element={<CustomerMenu />} />
                  <Route path="menu/:id" element={<ItemDetails />} />
                  <Route path="cart" element={<Cart />} />
                  <Route path="payment" element={<Payment />} />
                  <Route path="orders" element={<CustomerOrders />} />
                  <Route path="orders/:orderId" element={<CustomerOrders />} />
                  <Route path="profile" element={<CustomerProfile />} />
                  <Route path="profile/edit" element={<EditProfile />} />
                  <Route path="addresses" element={<SavedAddresses />} />
                  <Route path="help" element={<HelpSupport />} />
                  <Route path="privacy" element={<CustomerPrivacyPolicy />} />
                </Route>

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

                  {/* Offers */}
                  <Route path="offers" element={<OfferList />} />
                  <Route path="offers/create" element={<CreateOffer />} />
                  <Route path="offers/edit/:id" element={<CreateOffer />} />

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

                {/* Admin Auth Layout */}
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />

                {/* Fallback Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
  );
}

function LocationLogger() {
  const location = useLocation();
  
  useEffect(() => {
    logger.debug('Route changed', { pathname: location.pathname });
  }, [location]);
  
  return null;
}

export default function App() {
  return (
    <>
      <Router>
        <LocationLogger />
        <AuthProvider>
          <CustomerAuthProvider>
            <ShopStatusProvider>
              <ScrollToTop />
              <AppContent />
            </ShopStatusProvider>
          </CustomerAuthProvider>
        </AuthProvider>
      </Router>
    </>
  );
}
