import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useCustomerAuth } from "../context/CustomerAuthContext";
import { useAuth } from "../context/AuthContext";
import { usePopularItemsQuery, usePublicBootstrap, useCategoriesQuery } from "../hooks/useAppDataQueries";
import { QueryBoundary } from "../components/common/QueryBoundary";
import StandardHeader from "../components/common/StandardHeader";
import VariantSelectionModal from "../components/customer/VariantSelectionModal";
import CustomerFooter from "../components/common/CustomerFooter";

// Curated Category Icons & Visuals matching the design
const CATEGORY_ITEMS = [
  {
    id: "burgers",
    name: "Burgers",
    tag: "Available",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 11a8 8 0 0116 0v1H4v-1zm0 4h16v1a3 3 0 01-3 3H7a3 3 0 01-3-3v-1zm1 3h14M3 13h18" />
      </svg>
    ),
  },
  {
    id: "juicy-fresh",
    name: "Juicy & Fresh",
    tag: "Available",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
      </svg>
    ),
  },
  {
    id: "hot-cheesy",
    name: "Hot & Cheesy",
    tag: "Available",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
  },
  {
    id: "chicken-fries",
    name: "Chicken Fries",
    tag: "Available",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    id: "pizza",
    name: "Pizza",
    tag: "Available",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 2L2 22h20L12 2zm0 6a2 2 0 110 4 2 2 0 010-4zm-3 8a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm6 0a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />
      </svg>
    ),
  },
  {
    id: "french-fries",
    name: "French-fries",
    tag: "Available",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
];

// Fallback high quality dishes matching design aesthetics
const FALLBACK_TODAYS_MENU = [
  {
    _id: "m1",
    name: "Classic Crispy Burger",
    price: 6.5,
    tag: "CHEF'S PICK",
    veg: true,
    time: "20 min",
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
  },
  {
    _id: "m2",
    name: "Cheese Burger",
    price: 8.0,
    tag: "NEW",
    veg: false,
    time: "25 min",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80",
  },
  {
    _id: "m3",
    name: "Loaded Fries",
    price: 5.0,
    tag: "POPULAR",
    veg: true,
    time: "15 min",
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=600&q=80",
  },
  {
    _id: "m4",
    name: "Grilled Chicken Wrap",
    price: 9.0,
    tag: "LIMITED",
    veg: false,
    time: "25 min",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=600&q=80",
  },
];

const FAQS = [
  {
    q: "How does the delivery process work?",
    a: "Orders are prepared hot & fresh and delivered directly to your doorstep with real-time updates.",
  },
  {
    q: "Can I customize ingredients in my meal?",
    a: "Yes! While selecting items on the menu, choose your preferred portion size and dietary preferences.",
  },
  {
    q: "What are your operational delivery hours?",
    a: "We deliver 7 days a week from 11:00 AM to 11:00 PM throughout our designated service areas.",
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated: isCustomer, authReady: customerAuthReady, customer } = useCustomerAuth();
  const { isAuthenticated: isAdmin, authReady: adminAuthReady } = useAuth();
  const { settings, isLoading: isBootstrapLoading } = usePublicBootstrap();
  const popularItemsQuery = usePopularItemsQuery(4);
  const categoriesQuery = useCategoriesQuery();

  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [selectedItemForVariant, setSelectedItemForVariant] = useState<any | null>(null);

  useEffect(() => {
    const syncCart = () => {
      try {
        const stored = JSON.parse(localStorage.getItem('cart') || '[]');
        setCartItems(stored);
      } catch {
        setCartItems([]);
      }
    };
    syncCart();

    const handleUpdate = () => syncCart();
    window.addEventListener('cartUpdated', handleUpdate);
    return () => window.removeEventListener('cartUpdated', handleUpdate);
  }, []);

  const isAuthReady = isCustomer ? customerAuthReady : isAdmin ? adminAuthReady : (customerAuthReady && adminAuthReady);
  const headerAuthReady = isAuthReady && !isBootstrapLoading;

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setNewsletterSubscribed(true);
      setNewsletterEmail("");
      setTimeout(() => setNewsletterSubscribed(false), 4000);
    }
  };

  const handleUpdateVariantQuantity = (item: any, variantQuantity: string, variantPrice: number, delta: number) => {
    try {
      const existing = JSON.parse(localStorage.getItem('cart') || '[]');
      const matchIndex = existing.findIndex(
        (c: any) => c.menuItemId === item._id && c.selectedVariant === variantQuantity
      );

      if (matchIndex > -1) {
        const newQty = existing[matchIndex].quantity + delta;
        if (newQty <= 0) {
          existing.splice(matchIndex, 1);
        } else {
          existing[matchIndex].quantity = newQty;
        }
      } else if (delta > 0) {
        existing.push({
          menuItemId: item._id,
          name: item.name,
          price: variantPrice,
          image: item.image,
          selectedVariant: variantQuantity,
          quantity: 1,
        });
      }

      localStorage.setItem('cart', JSON.stringify(existing));
      setCartItems(existing);
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err) {
      console.error('Failed to update variant cart quantity', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F5F2] text-[#1E1E1E] font-sans antialiased selection:bg-black selection:text-white">
      {/* =========================================================
          1. NAVIGATION BAR (Standard Header)
      ========================================================= */}
      <StandardHeader
        navItems={[
          { path: '/', label: 'Home', exact: true },
          { path: '/customer/menu', label: 'Our Menu' },
          { path: '/customer/menu?category=Offer', label: 'Offers' },
          { path: '/#how-it-works', label: 'How it Works' },
          { path: '/#faqs', label: 'FAQ' },
        ]}
      />

      {/* =========================================================
          2. HERO SECTION
      ========================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pt-4 pb-8 sm:pt-10 sm:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
          {/* Left Column Content */}
          <div className="lg:col-span-6 space-y-4 sm:space-y-6">
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-burgundy">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-burgundy"></span>
              HOME-COOKED • MADE FRESH DAILY
            </div>

            {/* Main Title */}
            <h1 className="text-3xl sm:text-5xl xl:text-[68px] font-extrabold text-neutral-900 tracking-tight leading-[1.1]">
              Real food,<br />
              <span className="text-burgundy">made to crave.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-base text-neutral-600 max-w-lg leading-relaxed">
              No dull meals, no waiting too long — just fresh, delicious food made for every craving delivered straight to your door.
            </p>

            {/* CTA Buttons */}
            <div className="pt-1 sm:pt-2">
              <Link
                to="/customer/menu"
                className="inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-3.5 rounded-full bg-burgundy text-white font-semibold text-xs sm:text-sm hover:bg-burgundy-600 transition-all shadow-md group"
              >
                <span>Order Now</span>
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Right Column Dish Showcase */}
          <div className="lg:col-span-6 relative flex items-center justify-center">
            {/* Hero Main Food Photo - Clean transparent showcase without background box/shadow */}
            <div className="relative w-full max-w-xl flex items-center justify-center transition-transform hover:scale-105 duration-500">
              <img
                src="/heroImage.webp"
                alt="Fresh Delicacy"
                className="w-full h-auto max-h-[460px] object-contain drop-shadow-2xl"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          3. BROWSE BY FOOD TYPE
      ========================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-6 sm:py-12">
        <div className="flex items-center justify-between mb-4 sm:mb-8">
          <div>
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-neutral-500 mb-0.5 sm:mb-2">
              WHAT ARE YOU CRAVING?
            </p>
            <h2 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-neutral-900 tracking-tight">
              Browse by food type
            </h2>
          </div>

          <Link
            to="/customer/menu"
            className="inline-flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-semibold text-neutral-700 hover:text-black transition-colors group"
          >
            <span>See full menu</span>
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>

        {/* Categories Grid - 3 cols on mobile, 6 cols on desktop */}
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-2.5 sm:gap-4">
          {(() => {
            const dynamicCategories = (categoriesQuery.data || [])
              .filter((cat: string) => cat.toLowerCase() !== 'all')
              .slice(0, 6);

            const displayList = dynamicCategories.length >= 6
              ? dynamicCategories.map((name: string) => {
                  const match = CATEGORY_ITEMS.find((c) => c.name.toLowerCase() === name.toLowerCase());
                  return {
                    id: name.toLowerCase().replace(/\s+/g, '-'),
                    name,
                    tag: 'Available',
                    icon: match?.icon || (
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ),
                  };
                })
              : CATEGORY_ITEMS.slice(0, 6);

            return displayList.map((cat: any) => (
              <Link
                key={cat.id || cat.name}
                to={`/customer/menu?category=${encodeURIComponent(cat.name)}`}
                className="flex flex-col items-center justify-center p-3 sm:p-6 rounded-2xl bg-white border border-neutral-200/70 hover:border-black hover:shadow-md transition-all duration-300 group text-center"
              >
                <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-700 mb-1.5 sm:mb-3 group-hover:bg-black group-hover:text-white transition-colors duration-300 [&>svg]:w-4 [&>svg]:h-4 sm:[&>svg]:w-6 sm:[&>svg]:h-6">
                  {cat.icon}
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-neutral-900 group-hover:text-black truncate w-full">
                  {cat.name}
                </h3>
                <p className="text-[9px] sm:text-[11px] text-neutral-400 mt-0.5 hidden sm:block">
                  {cat.tag || 'Available'}
                </p>
              </Link>
            ));
          })()}
        </div>
      </section>

      {/* =========================================================
          4. TODAY'S MENU (WHITE SECTION) - 2 ITEMS PER ROW ON MOBILE
      ========================================================= */}
      <section className="bg-white py-8 sm:py-16 md:py-20 border-y border-neutral-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex items-center justify-between mb-5 sm:mb-10">
            <div>
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-neutral-500 mb-0.5 sm:mb-1">
                COOKED FRESH • SERVED HOT
              </p>
              <h2 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-neutral-900 tracking-tight">
                Today's menu
              </h2>
            </div>

            <Link
              to="/customer/menu"
              className="inline-flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-semibold text-neutral-700 hover:text-black transition-colors group"
            >
              <span>Full menu</span>
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>

          {/* Dish Cards Carousel / Grid: 2 cols on mobile */}
          <QueryBoundary
            query={popularItemsQuery}
            loadingComponent={
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="rounded-2xl sm:rounded-3xl border border-neutral-100 p-2.5 sm:p-4 space-y-2 sm:space-y-4 bg-neutral-50 animate-pulse">
                    <div className="w-full aspect-square rounded-xl sm:rounded-2xl bg-neutral-200" />
                    <div className="h-4 bg-neutral-200 rounded w-3/4" />
                    <div className="h-3 bg-neutral-200 rounded w-1/2" />
                  </div>
                ))}
              </div>
            }
          >
            {(dishes) => {
              const displayDishes = (dishes && dishes.length >= 4) ? dishes.slice(0, 4) : FALLBACK_TODAYS_MENU;

              return (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                  {displayDishes.map((dish: any, idx: number) => {
                    const price = dish.priceVariants?.[0]?.price || dish.price || 120;
                    const hasVariants = dish.priceVariants && dish.priceVariants.length > 1;
                    const inCartCount = cartItems
                      .filter((c: any) => c.menuItemId === dish._id)
                      .reduce((sum: number, c: any) => sum + (c.quantity || 0), 0);

                    return (
                      <div
                        key={dish._id || idx}
                        onClick={() => setSelectedItemForVariant(dish)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedItemForVariant(dish);
                          }
                        }}
                        className="rounded-2xl sm:rounded-3xl border border-neutral-200/70 bg-[#FAFAFA] p-2.5 sm:p-4 flex flex-col justify-between hover:shadow-lg hover:border-neutral-400 transition-all duration-300 group cursor-pointer active:scale-[0.99] text-left select-none relative"
                      >
                        {/* Image */}
                        <div className="relative w-full aspect-square rounded-xl sm:rounded-2xl overflow-hidden mb-2.5 sm:mb-4 bg-neutral-200">
                          <img
                            src={dish.image || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80"}
                            alt={dish.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />

                          {inCartCount > 0 && (
                            <span className="absolute bottom-1.5 left-1.5 sm:bottom-3 sm:left-3 bg-burgundy text-white text-[8px] sm:text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                              {inCartCount} in cart
                            </span>
                          )}
                        </div>

                        {/* Title & Price */}
                        <div>
                          <div className="flex items-start justify-between gap-1 mb-1">
                            <h3 className="font-bold text-neutral-900 text-xs sm:text-base leading-tight line-clamp-1 group-hover:text-burgundy transition-colors">
                              {dish.name}
                            </h3>
                            <span className="font-extrabold text-neutral-900 text-xs sm:text-base shrink-0">
                              ₹{price}
                            </span>
                          </div>

                          {/* Portions or subtext */}
                          {dish.priceVariants && dish.priceVariants.length > 0 ? (
                            <p className="text-[9px] sm:text-[11px] font-bold text-neutral-400 uppercase tracking-wide line-clamp-1 mb-2.5 sm:mb-4">
                              {dish.priceVariants.map((v: any) => v.quantity).join(' • ')}
                            </p>
                          ) : (
                            <p className="text-[9px] sm:text-[11px] text-neutral-400 line-clamp-1 mb-2.5 sm:mb-4">
                              Fresh & made to order
                            </p>
                          )}
                        </div>

                        {/* Bottom Action Bar */}
                        <div className="pt-2 flex items-center justify-between border-t border-neutral-200/60 text-[10px] sm:text-xs text-neutral-500 font-bold group-hover:text-burgundy transition-colors">
                          <span>{hasVariants ? 'Select options' : 'Choose portion'}</span>
                          <span className="text-xs font-black">→</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            }}
          </QueryBoundary>
        </div>
      </section>

      {/* =========================================================
          5. HOW IT WORKS - 2 COLS ON MOBILE
      ========================================================= */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-10 sm:py-16 md:py-24">
        <div className="mb-6 sm:mb-12">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1 sm:mb-2">
            FROM YOUR DESIRE TO YOUR DOOR
          </p>
          <h2 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-neutral-900 tracking-tight">
            How it works
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {/* Step 1 */}
          <div className="p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-neutral-200/70 shadow-2xs hover:shadow-md transition-all">
            <span className="text-[10px] sm:text-xs font-bold text-neutral-400 mb-2 sm:mb-4 block">01</span>
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-neutral-900 text-white flex items-center justify-center mb-3 sm:mb-6">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xs sm:text-base font-bold text-neutral-900 mb-1 sm:mb-2">Pick your Food</h3>
            <p className="text-[10px] sm:text-xs text-neutral-500 leading-relaxed line-clamp-2 sm:line-clamp-none">
              Choose from our fresh burgers, crispy sides, pizzas and more.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-neutral-200/70 shadow-2xs hover:shadow-md transition-all">
            <span className="text-[10px] sm:text-xs font-bold text-neutral-400 mb-2 sm:mb-4 block">02</span>
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-neutral-900 text-white flex items-center justify-center mb-3 sm:mb-6">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xs sm:text-base font-bold text-neutral-900 mb-1 sm:mb-2">Add to cart</h3>
            <p className="text-[10px] sm:text-xs text-neutral-500 leading-relaxed line-clamp-2 sm:line-clamp-none">
              Build your order with favourite meals, sides, and chilled beverages.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-neutral-200/70 shadow-2xs hover:shadow-md transition-all">
            <span className="text-[10px] sm:text-xs font-bold text-neutral-400 mb-2 sm:mb-4 block">03</span>
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-neutral-900 text-white flex items-center justify-center mb-3 sm:mb-6">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <h3 className="text-xs sm:text-base font-bold text-neutral-900 mb-1 sm:mb-2">Packed fresh</h3>
            <p className="text-[10px] sm:text-xs text-neutral-500 leading-relaxed line-clamp-2 sm:line-clamp-none">
              Every dish is freshly cooked and sealed for delivery freshness.
            </p>
          </div>

          {/* Step 4 */}
          <div className="p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-neutral-200/70 shadow-2xs hover:shadow-md transition-all">
            <span className="text-[10px] sm:text-xs font-bold text-neutral-400 mb-2 sm:mb-4 block">04</span>
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-neutral-900 text-white flex items-center justify-center mb-3 sm:mb-6">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xs sm:text-base font-bold text-neutral-900 mb-1 sm:mb-2">Fast delivery</h3>
            <p className="text-[10px] sm:text-xs text-neutral-500 leading-relaxed line-clamp-2 sm:line-clamp-none">
              Track rider in real time and enjoy hot meals at home.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================
          6. CHEF FEATURE SECTION (WHITE BACKGROUND)
      ========================================================= */}
      <section className="bg-white py-10 sm:py-16 md:py-24 border-y border-neutral-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Chef Portrait */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-xs sm:max-w-md aspect-[4/3] sm:aspect-[3/4] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl bg-neutral-100">
                <img
                  src="https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=800&q=80"
                  alt="Professional Chef"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Chef Details */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-6">
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-neutral-500">
                MEET OUR CHEFS
              </p>
              <h2 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-neutral-900 tracking-tight leading-snug">
                Cooked with care, served with flavor.
              </h2>
              <p className="text-neutral-600 text-xs sm:text-base leading-relaxed">
                Every dish is made with fresh ingredients, bold flavours and recipes we truly love. That's the difference you can taste in every single bite.
              </p>

              <div className="space-y-3 sm:space-y-4 pt-1 sm:pt-2">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-neutral-900 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-neutral-900">Fresh ingredients</h4>
                    <p className="text-[10px] sm:text-xs text-neutral-500">Carefully selected farm produce make every meal taste significantly better.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-neutral-900 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-neutral-900">Made to order</h4>
                    <p className="text-[10px] sm:text-xs text-neutral-500">Every dish is prepared fresh right when your order is placed, never pre-packed.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-neutral-900 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-neutral-900">Real, simple flavors</h4>
                    <p className="text-[10px] sm:text-xs text-neutral-500">No unnecessary additives, just honest home-style delicious food crafted right.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          7. FAQ
      ========================================================= */}
      <section id="faqs" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-10 sm:py-16 md:py-24">
        <div className="text-center mb-6 sm:mb-12">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1 sm:mb-2">HAVE QUESTIONS?</p>
          <h2 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-neutral-900 tracking-tight">
            Quick questions, quick answers
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center">
          {/* FAQ Accordions */}
          <div className="lg:col-span-8 space-y-2.5 sm:space-y-4">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className="rounded-xl sm:rounded-2xl border border-neutral-200/80 bg-white p-3.5 sm:p-5 cursor-pointer transition-all hover:border-black"
                onClick={() => setFaqOpen(faqOpen === i ? null : i)}
              >
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-xs sm:text-base font-bold text-neutral-900">
                    {faq.q}
                  </h4>
                  <span className="text-neutral-500 text-base sm:text-lg font-bold">
                    {faqOpen === i ? "−" : "+"}
                  </span>
                </div>
                {faqOpen === i && (
                  <p className="mt-2.5 sm:mt-3 text-[11px] sm:text-sm text-neutral-600 leading-relaxed pt-2 border-t border-neutral-100">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Side Chef Badge */}
          <div className="lg:col-span-4 flex justify-center hidden sm:flex">
            <div className="relative w-48 sm:w-64 aspect-[3/4] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl bg-neutral-200">
              <img
                src="https://images.unsplash.com/photo-1581299894007-aaa50297cf16?auto=format&fit=crop&w=600&q=80"
                alt="Chef Portrait"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

{/* Standard Unified Customer Footer */}
      <CustomerFooter />

      {/* Variant Selection Modal (Half/Full / Portion Selector) */}
      <VariantSelectionModal
        isOpen={Boolean(selectedItemForVariant)}
        onClose={() => setSelectedItemForVariant(null)}
        item={selectedItemForVariant}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateVariantQuantity}
      />
    </div>
  );
}
