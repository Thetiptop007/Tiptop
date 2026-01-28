import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
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
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

export default function App() {
  return (
    <>
      <Router>
        <AuthProvider>
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

            {/* Others Page */}
            <Route path="profile" element={<UserProfiles />} />
            <Route path="settings" element={<Settings />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="blank" element={<Blank />} />

            {/* Forms */}
            <Route path="form-elements" element={<FormElements />} />

            {/* Tables */}
            <Route path="basic-tables" element={<BasicTables />} />

            {/* Ui Elements */}
            <Route path="alerts" element={<Alerts />} />
            <Route path="avatars" element={<Avatars />} />
            <Route path="badge" element={<Badges />} />
            <Route path="buttons" element={<Buttons />} />
            <Route path="images" element={<Images />} />
            <Route path="videos" element={<Videos />} />

            {/* Charts */}
            <Route path="line-chart" element={<LineChart />} />
            <Route path="bar-chart" element={<BarChart />} />
          </Route>

          {/* Auth Layout */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </AuthProvider>
      </Router>
    </>
  );
}
