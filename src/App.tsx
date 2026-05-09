import { BrowserRouter as Router, Navigate, Routes, Route, useLocation, Outlet } from "react-router";
import { useEffect } from "react";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import AppLayout from "./layout/AppLayout";
import CustomerLayout from "./layout/CustomerLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import { AppRouteGate } from "./components/auth/AppRouteGate";
import Home from "./pages/Dashboard/Home";
import BusinessInsights from "./pages/BusinessInsights";
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
import { CustomerAuthProvider } from "./context/CustomerAuthContext";
import { ShopStatusProvider } from "./context/ShopStatusContext";
import { ToastProvider } from "./context/ToastContext";
import { ToastContainer } from "./components/Toast";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { CustomerProtectedRoute } from "./components/auth/CustomerProtectedRoute";
import { logger } from "./utils/logger";
import { SocketProvider } from "./context/SocketContext";
import { getAccessToken } from "./services/auth-session.store";
import { useAuth } from "./context/AuthContext";
import { useCustomerAuth } from "./context/CustomerAuthContext";

function PublicApp() {
  return <Outlet />;
}

function AdminAppContent() {
  return <Outlet />;
}

function AdminApp() {
  return <AdminAppContent />;
}

function CustomerAppContent() {
  return <Outlet />;
}

function CustomerApp() {
  return <CustomerAppContent />;
}

function AdminPublicApp() {
  return <Outlet />;
}

function CustomerPublicApp() {
  return <Outlet />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes - No Auth Providers */}
      <Route element={<PublicApp />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/order" element={<GuestOrder />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      </Route>

      {/* Admin Public App - No Auth Provider */}
      <Route element={<AdminPublicApp />}>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
      </Route>

      {/* Admin App - Admin Auth Provider */}
      <Route element={<AdminApp />}>
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Home />} />
          <Route path="insights" element={<BusinessInsights />} />

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
      </Route>

      {/* Customer Public App - No Auth Provider */}
      <Route element={<CustomerPublicApp />}>
        <Route path="/customer/login" element={<CustomerLogin />} />
        <Route path="/customer/signup" element={<CustomerSignUp />} />
      </Route>

      {/* Customer App - Customer Auth Provider */}
      <Route path="/customer" element={<CustomerApp />}>

        <Route element={<CustomerLayout />}>
          <Route index element={<CustomerHome />} />
          <Route path="menu" element={<CustomerMenu />} />
          <Route path="menu/:id" element={<ItemDetails />} />
          <Route path="cart" element={<Cart />} />
          <Route path="help" element={<HelpSupport />} />
          <Route path="privacy" element={<CustomerPrivacyPolicy />} />

          <Route
            path="payment"
            element={
              <CustomerProtectedRoute>
                <Payment />
              </CustomerProtectedRoute>
            }
          />
          <Route
            path="orders"
            element={
              <CustomerProtectedRoute>
                <CustomerOrders />
              </CustomerProtectedRoute>
            }
          />
          <Route
            path="orders/:orderId"
            element={
              <CustomerProtectedRoute>
                <CustomerOrders />
              </CustomerProtectedRoute>
            }
          />
          <Route
            path="profile"
            element={
              <CustomerProtectedRoute>
                <CustomerProfile />
              </CustomerProtectedRoute>
            }
          />
          <Route
            path="profile/edit"
            element={
              <CustomerProtectedRoute>
                <EditProfile />
              </CustomerProtectedRoute>
            }
          />
          <Route
            path="addresses"
            element={
              <CustomerProtectedRoute>
                <SavedAddresses />
              </CustomerProtectedRoute>
            }
          />
        </Route>
      </Route>

      {/* Fallback Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function LocationLogger() {
  const location = useLocation();
  
  useEffect(() => {
    // Suppressed in production-ready clean up
  }, [location]);
  
  return null;
}

function AppContent() {
  const { isAuthenticated: isCustomerAuth, customer } = useCustomerAuth();
  const { isAuthenticated: isAdminAuth, user: adminUser } = useAuth();
  
  const customerName = customer?.name && typeof customer.name === 'object' 
    ? customer.name.first 
    : (customer?.name || 'Customer');



  // Decide which token to use for the socket based on active session
  const customerToken = getAccessToken('customer');
  const adminToken = getAccessToken('admin');
  
  const activeToken = adminToken || customerToken;
  const isSocketAuth = isAdminAuth || isCustomerAuth;

  return (
    <SocketProvider token={activeToken} isAuthenticated={isSocketAuth}>
      <AppRouteGate>
        <AppRoutes />
      </AppRouteGate>
    </SocketProvider>
  );
}

function RootProviders({ children }: { children: React.ReactNode }) {
  return (
    <Router>
      <LocationLogger />
      <ToastProvider>
        <ShopStatusProvider>
          <ScrollToTop />
          <ToastContainer />
          <AuthProvider>
            <CustomerAuthProvider>
              {children}
            </CustomerAuthProvider>
          </AuthProvider>
        </ShopStatusProvider>
      </ToastProvider>
    </Router>
  );
}

export default function App() {
  return (
    <RootProviders>
      <AppContent />
    </RootProviders>
  );
}
