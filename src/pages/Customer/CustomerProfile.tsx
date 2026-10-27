import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { logger } from '../../utils/logger';
import { useAuthStore } from '../../services/auth.store';
import SessionManagerCard from '../../components/UserProfile/SessionManagerCard';

export default function CustomerProfile() {
  const { customer, logout, authReady } = useCustomerAuth();
  const { user, role } = useAuthStore();
  const navigate = useNavigate();
  const profileUser = role === 'customer' && user ? (user as typeof customer) : customer;

  logger.ui('CUSTOMER_PROFILE_VIEW', 'Customer profile viewed', {
    hasCustomer: !!profileUser,
    role: profileUser?.role || 'CUSTOMER',
  });

  const handleLogout = async () => {
    if (!confirm('Are you sure you want to sign out?')) return;
    
    await logout();
    navigate('/');
  };

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#F6F5F2] flex items-center justify-center font-sans">
        <div className="text-sm font-bold text-neutral-500">Loading your profile...</div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-[#F6F5F2] flex items-center justify-center p-6 font-sans">
        <div className="text-center bg-white p-10 rounded-3xl border border-neutral-200/80 shadow-xs max-w-md w-full">
          <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4 text-2xl">
            🔒
          </div>
          <h2 className="text-2xl font-extrabold text-neutral-950 mb-2">Sign in to TipTop</h2>
          <p className="text-sm text-neutral-600 mb-6">
            View your order history, manage delivery addresses, and enjoy fast 1-click checkout.
          </p>
          <Link
            to="/customer/login"
            className="inline-block w-full bg-burgundy text-white py-3.5 rounded-full text-sm font-extrabold hover:bg-burgundy-600 transition-all shadow-sm"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const customerName = typeof profileUser.name === 'object'
    ? `${profileUser.name.first} ${profileUser.name.last || ''}`.trim()
    : (profileUser.name || 'Valued Customer');

  const customerEmail = typeof profileUser.email === 'object'
    ? profileUser.email.address
    : profileUser.email;

  return (
    <div className="min-h-screen bg-[#F6F5F2] text-neutral-900 font-sans pb-24">
      <div className="max-w-2xl mx-auto px-3.5 sm:px-6 py-6 sm:py-10">
        {/* Header */}
        <div className="mb-5 sm:mb-8">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-neutral-500">
            ACCOUNT
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-950 tracking-tight mt-0.5 sm:mt-1">
            Customer Profile
          </h1>
        </div>

        {/* User Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-neutral-200/80 p-5 sm:p-8 mb-4 sm:mb-6 shadow-2xs flex flex-col items-center text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black text-white text-xl sm:text-2xl font-black flex items-center justify-center mb-3 sm:mb-4 shadow-sm">
            {customerName[0]?.toUpperCase() || 'C'}
          </div>

          <h2 className="text-lg sm:text-xl font-extrabold text-neutral-950 mb-0.5 sm:mb-1">
            {customerName}
          </h2>

          <p className="text-xs text-neutral-500 mb-3">
            {customerEmail}
          </p>

          <span className="px-3 py-0.5 sm:px-3.5 sm:py-1 rounded-full bg-neutral-100 text-neutral-800 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider border border-neutral-200">
            {profileUser.role || 'CUSTOMER'} ACCOUNT
          </span>
        </div>

        {/* Profile Navigation Links */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-neutral-200/80 p-2 sm:p-3 space-y-1 mb-4 sm:mb-6 shadow-2xs">
          <Link
            to="/customer/orders"
            className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl sm:rounded-2xl hover:bg-neutral-50 transition-all group"
          >
            <div className="flex items-center gap-3.5">
              <span className="text-lg">📦</span>
              <span className="text-sm font-bold text-neutral-900 group-hover:text-black">
                My Orders & History
              </span>
            </div>
            <span className="text-xs font-bold text-neutral-400 group-hover:text-black transition-colors">
              →
            </span>
          </Link>

          <Link
            to="/customer/profile/edit"
            className="flex items-center justify-between p-4 rounded-2xl hover:bg-neutral-50 transition-all group"
          >
            <div className="flex items-center gap-3.5">
              <span className="text-lg">✏️</span>
              <span className="text-sm font-bold text-neutral-900 group-hover:text-black">
                Edit Profile Information
              </span>
            </div>
            <span className="text-xs font-bold text-neutral-400 group-hover:text-black transition-colors">
              →
            </span>
          </Link>

          <Link
            to="/customer/addresses"
            className="flex items-center justify-between p-4 rounded-2xl hover:bg-neutral-50 transition-all group"
          >
            <div className="flex items-center gap-3.5">
              <span className="text-lg">📍</span>
              <span className="text-sm font-bold text-neutral-900 group-hover:text-black">
                Saved Delivery Addresses
              </span>
            </div>
            <span className="text-xs font-bold text-neutral-400 group-hover:text-black transition-colors">
              →
            </span>
          </Link>

          <Link
            to="/customer/help"
            className="flex items-center justify-between p-4 rounded-2xl hover:bg-neutral-50 transition-all group"
          >
            <div className="flex items-center gap-3.5">
              <span className="text-lg">💬</span>
              <span className="text-sm font-bold text-neutral-900 group-hover:text-black">
                Help & Support
              </span>
            </div>
            <span className="text-xs font-bold text-neutral-400 group-hover:text-black transition-colors">
              →
            </span>
          </Link>

          <Link
            to="/customer/privacy"
            className="flex items-center justify-between p-4 rounded-2xl hover:bg-neutral-50 transition-all group"
          >
            <div className="flex items-center gap-3.5">
              <span className="text-lg">🛡️</span>
              <span className="text-sm font-bold text-neutral-900 group-hover:text-black">
                Privacy Policy
              </span>
            </div>
            <span className="text-xs font-bold text-neutral-400 group-hover:text-black transition-colors">
              →
            </span>
          </Link>
        </div>

        {/* Active Sessions */}
        <div className="mb-6">
          <SessionManagerCard role="customer" />
        </div>

        {/* Sign Out Action */}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full py-4 rounded-full border border-neutral-300 hover:border-black text-rose-600 hover:bg-rose-50 text-sm font-extrabold transition-all"
        >
          Sign Out of Account
        </button>
      </div>
    </div>
  );
}

