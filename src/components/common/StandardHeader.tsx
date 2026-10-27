import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { useShopStatus } from '../../context/ShopStatusContext';
import { usePublicBootstrap } from '../../hooks/useAppDataQueries';

export interface HeaderNavItem {
  path: string;
  label: string;
  exact?: boolean;
}

export interface StandardHeaderProps {
  /**
   * Title / Brand name. Defaults to settings?.siteName or "TipTop"
   */
  title?: string;
  /**
   * Optional custom logo link target, defaults to "/"
   */
  logoHref?: string;
  /**
   * Show/hide desktop navigation links. Defaults to true.
   */
  showNavLinks?: boolean;
  /**
   * Custom navigation items. If not provided, standard links (Home, Our Menu, Offers, Orders) are used.
   */
  navItems?: HeaderNavItem[];
  /**
   * Show/hide kitchen/shop open/closed status badge. Defaults to true.
   */
  showShopStatus?: boolean;
  /**
   * Show/hide search button icon. Defaults to false.
   */
  showSearch?: boolean;
  /**
   * Show/hide cart button icon with live badge counter. Defaults to true.
   */
  showCart?: boolean;
  /**
   * Show/hide customer auth/profile button. Defaults to true.
   */
  showAuth?: boolean;
  /**
   * Optional left/back button or custom action (useful on subpages like Item Details or Checkout).
   */
  leftSlot?: React.ReactNode;
  /**
   * Optional extra custom actions injected on the right side.
   */
  rightSlot?: React.ReactNode;
  /**
   * Optional sticky positioning behavior. Defaults to true.
   */
  sticky?: boolean;
}

export const StandardHeader: React.FC<StandardHeaderProps> = ({
  title,
  logoHref = '/',
  showNavLinks = true,
  navItems,
  showShopStatus = true,
  showSearch = false,
  showCart = true,
  showAuth = true,
  leftSlot,
  rightSlot,
  sticky = true,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { customer, logout, isAuthenticated } = useCustomerAuth();
  const { shopStatus } = useShopStatus();
  const { settings } = usePublicBootstrap();
  const isShopOpen = shopStatus?.isOpen ?? true;

  const [cartCount, setCartCount] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const updateCartCount = () => {
      try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const count = cart.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
        setCartCount(count);
      } catch {
        setCartCount(0);
      }
    };

    updateCartCount();

    const handleCartUpdate = () => updateCartCount();
    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, []);

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
    navigate('/');
  };

  const defaultNavItems: HeaderNavItem[] = [
    { path: '/', label: 'Home', exact: true },
    { path: '/customer/menu', label: 'Our Menu' },
    { path: '/customer/menu?category=Offer', label: 'Offers' },
    { path: '/customer/orders', label: 'My Orders' },
  ];

  const activeNavItems = navItems || defaultNavItems;

  const customerName = (() => {
    if (!customer?.name) return 'Customer';
    if (typeof customer.name === 'object') return (customer.name as any).first || 'Customer';
    return customer.name;
  })();

  const customerInitial = customerName[0]?.toUpperCase() || 'U';

  const isActivePath = (path: string, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
  };

  const brandName = title || settings?.siteName || 'TipTop';

  return (
    <header
      className={`${
        sticky ? 'sticky top-0 z-50' : 'relative z-30'
      } bg-[#F6F5F2]/90 backdrop-blur-md border-b border-neutral-200/80 transition-all`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-3.5 sm:py-4 flex items-center justify-between gap-3">
        {/* Left Side: Brand Logo or Custom Slot */}
        <div className="flex items-center gap-3">
          {leftSlot ? (
            leftSlot
          ) : (
            <Link to={logoHref} className="flex items-center group py-0.5">
              <img
                src="/logo-full.png"
                alt={brandName}
                className="h-8 sm:h-10 w-auto object-contain transition-transform group-hover:scale-105 drop-shadow-xs"
              />
            </Link>
          )}
        </div>

        {/* Center: Desktop Navigation Links */}
        {showNavLinks && (
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-xs sm:text-sm font-medium text-neutral-600">
            {activeNavItems.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`transition-colors py-1 ${
                  isActivePath(link.path, link.exact)
                    ? 'text-burgundy font-extrabold border-b-2 border-burgundy'
                    : 'hover:text-burgundy'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Custom right slot if provided */}
          {rightSlot}

          {/* Shop Status Indicator (Kitchen Open / Closed) */}
          {showShopStatus && (
            <span
              className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold ${
                isShopOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isShopOpen ? 'bg-emerald-600' : 'bg-rose-600'}`} />
              {isShopOpen ? 'Kitchen Open' : 'Closed'}
            </span>
          )}

          {/* Search Icon Button */}
          {showSearch && (
            <Link
              to="/customer/menu"
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-neutral-300/80 bg-white flex items-center justify-center text-neutral-700 hover:text-burgundy hover:border-burgundy transition-all shadow-2xs"
              title="Search menu"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>
          )}

          {/* Live Cart Icon Button with Count Badge */}
          {showCart && (
            <Link
              to="/customer/cart"
              className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-neutral-300/80 bg-white flex items-center justify-center text-neutral-700 hover:text-burgundy hover:border-burgundy transition-all shadow-2xs"
              title="View Cart"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-burgundy text-white text-[9px] sm:text-[10px] font-bold flex items-center justify-center shadow-xs">
                  {cartCount}
                </span>
              )}
            </Link>
          )}

          {/* Customer Auth / Profile Button */}
          {showAuth && (
            <>
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-1.5 p-1 sm:pl-3 sm:pr-2 sm:py-1.5 rounded-full border border-neutral-300 bg-white text-xs font-bold hover:border-burgundy transition-colors"
                    aria-label="User profile menu"
                  >
                    <span className="hidden sm:inline text-neutral-800">{customerName}</span>
                    <span className="w-6 h-6 sm:w-5 sm:h-5 rounded-full bg-burgundy text-white text-xs sm:text-[10px] flex items-center justify-center font-bold">
                      {customerInitial}
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white shadow-xl border border-neutral-200 py-2 z-50 animate-in fade-in">
                      <div className="px-4 py-2 border-b border-neutral-100">
                        <p className="text-xs font-extrabold text-neutral-950 truncate">{customerName}</p>
                        <p className="text-[10px] text-neutral-400 truncate">Customer Account</p>
                      </div>
                      <Link
                        to="/customer/orders"
                        onClick={() => setShowUserMenu(false)}
                        className="block px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 hover:text-burgundy transition-colors"
                      >
                        📦 My Orders
                      </Link>
                      <Link
                        to="/customer/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="block px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 hover:text-burgundy transition-colors"
                      >
                        👤 Account Profile
                      </Link>
                      <Link
                        to="/customer/addresses"
                        onClick={() => setShowUserMenu(false)}
                        className="block px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 hover:text-burgundy transition-colors"
                      >
                        📍 Saved Addresses
                      </Link>
                      <div className="border-t border-neutral-100 my-1" />
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-xs font-bold text-flag_red hover:bg-flag_red-900/30 transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/customer/login"
                  className="px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full bg-burgundy text-white text-xs font-bold hover:bg-burgundy-600 transition-all shadow-sm active:scale-95"
                >
                  Sign In
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default StandardHeader;
