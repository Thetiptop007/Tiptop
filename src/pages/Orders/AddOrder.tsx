import { useState, useEffect, useRef } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { getCategories } from "../../services/menu-management.service";
import { getPOSMenuItems, createAdminOrder, type CreateAdminOrderData } from "../../services/order-management.service";
import { getSettings, type Settings } from "../../services/settings.service";
import { useNavigate } from "react-router-dom";
import { useDebounceSearch } from "../../hooks/useDebounceSearch";

// Define the TypeScript interface for menu items
interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  description: string;
  priceVariants?: Array<{
    quantity: string;
    price: number;
  }>;
  isAvailable?: boolean;
}

// Define the TypeScript interface for cart items
interface CartItem extends MenuItem {
  quantity: number;
  selectedVariant?: string;
  variantPrice?: number;
}



export default function AddOrder() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [orderType, setOrderType] = useState<"DELIVERY" | "TAKEAWAY">("DELIVERY");
  
  // Customer details state
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  
  // Delivery address state
  const [deliveryStreet, setDeliveryStreet] = useState<string>("");
  const [deliveryCity, setDeliveryCity] = useState<string>("");
  const [deliveryState, setDeliveryState] = useState<string>("");
  const [deliveryZipCode, setDeliveryZipCode] = useState<string>("");

  // Dynamic data state
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const categoryFilterRef = useRef<HTMLDivElement>(null);
  
  // Debounced search
  const { localValue: searchQuery, debouncedValue: debouncedSearch, handleChange: handleSearchChange } = useDebounceSearch();
  
  // Settings state for tax and charges
  const [settings, setSettings] = useState<Settings | null>(null);
  
  // Modal state
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [showVariantModal, setShowVariantModal] = useState(false);

  // Fetch categories, menu items, and settings
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch settings for tax and charges
        const settingsData = await getSettings();
        setSettings(settingsData);
        console.log('⚙️ Settings loaded:', settingsData);
        
        // Auto-fill city, state, zip from business address
        if (settingsData.businessAddress) {
          const addressParts = settingsData.businessAddress.split(',').map(part => part.trim());
          if (addressParts.length >= 3) {
            const city = addressParts[addressParts.length - 2] || '';
            const lastPart = addressParts[addressParts.length - 1] || '';
            
            // Extract state and zip code from last part (e.g., "Punjab 144411")
            const zipMatch = lastPart.match(/\b\d{5,6}\b/); // Match 5-6 digit zip code
            if (zipMatch) {
              const zipCode = zipMatch[0];
              const state = lastPart.replace(zipCode, '').trim();
              setDeliveryState(state);
              setDeliveryZipCode(zipCode);
            } else {
              // No zip found, just set the whole thing as state
              setDeliveryState(lastPart);
            }
            
            setDeliveryCity(city);
          }
        }
        
        // Fetch categories
        const categoriesData: any = await getCategories();
        if (categoriesData?.categories && Array.isArray(categoriesData.categories)) {
          setCategories(["All", ...categoriesData.categories]);
        } else if (Array.isArray(categoriesData)) {
          setCategories(["All", ...categoriesData]);
        }

        // Fetch POS menu items (minimal data for fast loading)
        // Using larger limit to fetch all items
        const menuData = await getPOSMenuItems(1, 500);
        console.log('📦 POS Menu Data:', menuData);
        
        if (menuData && menuData.items && Array.isArray(menuData.items)) {
          // Transform API data to match our interface
          const transformedItems: MenuItem[] = menuData.items.map((item: any) => ({
            id: item.id,
            name: item.name,
            price: item.priceVariants && item.priceVariants.length > 0 
              ? item.priceVariants[0].price 
              : 0,
            category: item.category,
            image: item.image || "/images/product/placeholder.jpg",
            description: "",
            priceVariants: item.priceVariants,
            isAvailable: item.isAvailable
          }));
          
          console.log('✅ Total Items Loaded:', transformedItems.length);
          
          // Group items by category and log counts
          const itemsByCategory = transformedItems.reduce((acc, item) => {
            acc[item.category] = (acc[item.category] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          
          console.log('📊 Items by Category:', itemsByCategory);
          
          setMenuItems(transformedItems);
        }
      } catch (error) {
        console.error("Error fetching menu data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryFilterRef.current && !categoryFilterRef.current.contains(event.target as Node)) {
        setShowCategoryFilter(false);
      }
    };

    if (showCategoryFilter) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCategoryFilter]);

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch = debouncedSearch === "" || 
      item.name.toLowerCase().includes(debouncedSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (item: MenuItem, variant?: string, variantPrice?: number) => {
    const existingItem = cart.find(cartItem => 
      cartItem.id === item.id && cartItem.selectedVariant === variant
    );
    
    if (existingItem) {
      setCart(cart.map(cartItem =>
        cartItem.id === item.id && cartItem.selectedVariant === variant
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, { 
        ...item, 
        quantity: 1,
        selectedVariant: variant,
        variantPrice: variantPrice || item.price,
        price: variantPrice || item.price
      }]);
    }
    
    // Close modal after adding to cart
    setShowVariantModal(false);
    setSelectedItem(null);
  };

  const openVariantModal = (item: MenuItem) => {
    setSelectedItem(item);
    setShowVariantModal(true);
  };

  const updateQuantity = (id: string, quantity: number, variant?: string) => {
    if (quantity === 0) {
      setCart(cart.filter(item => !(item.id === id && item.selectedVariant === variant)));
    } else {
      setCart(cart.map(item =>
        item.id === id && item.selectedVariant === variant ? { ...item, quantity } : item
      ));
    }
  };

  const getSubtotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTax = () => {
    const taxRate = settings?.taxRate || 0;
    return (getSubtotal() * taxRate) / 100;
  };

  const getDeliveryFee = () => {
    return orderType === 'DELIVERY' ? (settings?.deliveryCharge || 0) : 0;
  };

  const getTotalAmount = () => {
    return (getSubtotal() + getTax() + getDeliveryFee()).toFixed(2);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const handlePlaceOrder = async () => {
    // Validation
    if (cart.length === 0) {
      alert("Please add items to cart");
      return;
    }

    if (!customerName.trim()) {
      alert("Please enter customer name");
      return;
    }

    if (!customerPhone.trim()) {
      alert("Please enter customer phone number");
      return;
    }

    if (orderType === "DELIVERY") {
      if (!deliveryStreet.trim() || !deliveryCity.trim() || !deliveryState.trim() || !deliveryZipCode.trim()) {
        alert("Please fill in all delivery address fields");
        return;
      }
    }

    setSubmitting(true);

    try {
      const orderData: CreateAdminOrderData = {
        items: cart.map(item => ({
          menuItem: item.id,
          quantity: item.quantity,
          portion: item.selectedVariant,
          price: item.variantPrice || item.price
        })),
        customer: {
          name: customerName,
          phone: customerPhone
        },
        orderType,
        paymentMethod: "COD" // Cash On Delivery
      };

      if (orderType === "DELIVERY") {
        orderData.deliveryAddress = {
          street: deliveryStreet,
          city: deliveryCity,
          state: deliveryState,
          zipCode: deliveryZipCode
        };
      }

      console.log('📤 Submitting order:', orderData);
      const result = await createAdminOrder(orderData);
      console.log('✅ Order result:', result);

      if (result && result.order) {
        alert(`Order placed successfully! Order Number: ${result.order.orderNumber}`);
        // Reset form
        setCart([]);
        setCustomerName("");
        setCustomerPhone("");
        setDeliveryStreet("");
        // Keep city, state, zip for next order (pre-filled from settings)
        // Navigate to order management
        navigate("/admin/orders");
      } else {
        throw new Error('Order creation failed - no result returned');
      }
    } catch (error: any) {
      console.error("❌ Error placing order:", error);
      const errorMessage = error?.message || error?.error?.message || "Failed to place order. Please try again.";
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Add New Order | Admin Dashboard"
        description="Create a new order"
      />
      <PageBreadcrumb pageTitle="Add New Order" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Menu Items Section - Left Side (2/3 width on large screens) */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            {/* Search and Filter Section */}
            <div className="border-b border-gray-200 p-4 dark:border-gray-800">
              <div className="space-y-4">
                {/* Search Bar and Category Filter */}
                <div className="flex gap-3">
                  {/* Search Bar */}
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Search menu items... (min 2 characters)"
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pl-10 text-sm text-gray-700 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:placeholder-gray-500"
                    />
                    <svg
                      className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>

                  {/* Category Filter Dropdown Button */}
                  <div className="relative" ref={categoryFilterRef}>
                    <button
                      onClick={() => setShowCategoryFilter(!showCategoryFilter)}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                        />
                      </svg>
                      {selectedCategory === "All" ? "All Categories" : selectedCategory}
                      <svg
                        className={`h-4 w-4 transition-transform ${showCategoryFilter ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {/* Category Dropdown */}
                    {showCategoryFilter && (
                      <div className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                        <div className="max-h-64 overflow-y-auto p-1">
                          {categories.map((category) => (
                            <button
                              key={category}
                              onClick={() => {
                                setSelectedCategory(category);
                                setShowCategoryFilter(false);
                              }}
                              className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                                selectedCategory === category
                                  ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
                                  : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                              }`}
                            >
                              {category}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Results count */}
                {(searchQuery || selectedCategory !== "All") && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} found
                    {selectedCategory !== "All" && ` in ${selectedCategory}`}
                    {searchQuery && ` matching "${searchQuery}"`}
                  </div>
                )}
              </div>
            </div>

            {/* Menu Items Grid */}
            <div className="p-4">
              {loading ? (
                // Loading skeleton
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {[...Array(8)].map((_, idx) => (
                    <div key={idx} className="animate-pulse">
                      <div className="mb-2 aspect-square rounded-lg bg-gray-200 dark:bg-gray-800"></div>
                      <div className="mb-2 h-4 rounded bg-gray-200 dark:bg-gray-800"></div>
                      <div className="h-3 w-2/3 rounded bg-gray-200 dark:bg-gray-800"></div>
                    </div>
                  ))}
                </div>
              ) : filteredItems.length === 0 ? (
                // Empty state
                <div className="py-12 text-center">
                  <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                    <svg
                      className="h-10 w-10 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white/90">
                    No items found
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Try selecting a different category
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => openVariantModal(item)}
                      className="group cursor-pointer rounded-xl border border-gray-200 bg-white p-3 transition-all hover:border-indigo-500 hover:shadow-md dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-indigo-500"
                    >
                      <div className="mb-2 aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/images/product/placeholder.jpg";
                          }}
                        />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90 line-clamp-2">
                        {item.name}
                      </h3>
                      {item.priceVariants && item.priceVariants.length > 0 && (
                        <p className="mt-2 text-xs text-indigo-600 dark:text-indigo-400">
                          {item.priceVariants.length} variants available
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cart Section - Right Side (1/3 width on large screens) */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="border-b border-gray-200 p-4 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Order Cart
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {getTotalItems()} items
              </p>
            </div>

            {/* Cart Items Section */}
            <div className="max-h-[300px] overflow-y-auto border-b border-gray-200 p-4 dark:border-gray-800">
              {cart.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-gray-400"
                    >
                      <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.6 5.2M17 13l1.6 5.2M9 21a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Your cart is empty
                  </p>
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    Add items from the menu
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={`${item.id}-${item.selectedVariant || 'default'}`}
                      className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-800"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-16 w-16 rounded-lg object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/images/product/placeholder.jpg";
                        }}
                      />
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                          {item.name}
                        </h4>
                        {item.selectedVariant && (
                          <p className="text-xs text-indigo-600 dark:text-indigo-400">
                            {item.selectedVariant}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          ${(item.variantPrice || item.price).toFixed(2)} each
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1, item.selectedVariant)}
                            className="flex h-6 w-6 items-center justify-center rounded bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                          >
                            -
                          </button>
                          <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1, item.selectedVariant)}
                            className="flex h-6 w-6 items-center justify-center rounded bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-800 dark:text-white/90">
                          ${((item.variantPrice || item.price) * item.quantity).toFixed(2)}
                        </p>
                        <button
                          onClick={() => updateQuantity(item.id, 0, item.selectedVariant)}
                          className="mt-1 text-xs text-red-600 hover:text-red-700 dark:text-red-400"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Order Type Selection */}
            <div className="border-b border-gray-200 p-4 dark:border-gray-800">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Order Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setOrderType("DELIVERY")}
                  className={`flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all ${
                    orderType === "DELIVERY"
                      ? "border-indigo-600 bg-indigo-50 text-indigo-600 dark:border-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
                    />
                  </svg>
                  Delivery
                </button>
                <button
                  onClick={() => setOrderType("TAKEAWAY")}
                  className={`flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all ${
                    orderType === "TAKEAWAY"
                      ? "border-indigo-600 bg-indigo-50 text-indigo-600 dark:border-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                  Takeaway
                </button>
              </div>
            </div>

            {/* Customer Details Section */}
            <div className="border-b border-gray-200 p-4 dark:border-gray-800">
              <h3 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">
                Customer Details
              </h3>
              <div className="space-y-3">
                {/* Customer Name */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter customer name"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
                  />
                </div>

                {/* Customer Phone */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Enter phone number"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
                  />
                </div>
              </div>
            </div>

            {/* Delivery Address Section - Only shown for DELIVERY orders */}
            {orderType === "DELIVERY" && (
              <div className="border-b border-gray-200 p-4 dark:border-gray-800">
                <div className="mb-3 flex items-center gap-2">
                  <svg
                    className="h-4 w-4 text-indigo-600 dark:text-indigo-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                    Delivery Address
                  </h3>
                </div>
                
                <div className="space-y-3">
                  {/* Street Address */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
                      Street Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={deliveryStreet}
                      onChange={(e) => setDeliveryStreet(e.target.value)}
                      placeholder="Street address"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
                    />
                  </div>

                  {/* City */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={deliveryCity}
                      onChange={(e) => setDeliveryCity(e.target.value)}
                      placeholder="City"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* State */}
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
                        State <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={deliveryState}
                        onChange={(e) => setDeliveryState(e.target.value)}
                        placeholder="State"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
                      />
                    </div>

                    {/* Zip Code */}
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
                        Zip Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={deliveryZipCode}
                        onChange={(e) => setDeliveryZipCode(e.target.value)}
                        placeholder="Zip Code"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {cart.length > 0 && (
              <div className="border-t border-gray-200 p-4 dark:border-gray-800">
                <div className="mb-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                    <span className="font-medium text-gray-800 dark:text-white/90">
                      ${getSubtotal().toFixed(2)}
                    </span>
                  </div>
                  {settings && settings.taxRate > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Tax ({settings.taxRate}%)</span>
                      <span className="font-medium text-gray-800 dark:text-white/90">
                        ${getTax().toFixed(2)}
                      </span>
                    </div>
                  )}
                  {orderType === 'DELIVERY' && settings && settings.deliveryCharge > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Delivery Fee</span>
                      <span className="font-medium text-gray-800 dark:text-white/90">
                        ${getDeliveryFee().toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-gray-200 pt-2 dark:border-gray-800">
                    <span className="font-semibold text-gray-800 dark:text-white/90">
                      Total
                    </span>
                    <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                      ${getTotalAmount()}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={handlePlaceOrder}
                  disabled={submitting || cart.length === 0}
                  className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-indigo-500 dark:hover:bg-indigo-600"
                >
                  {submitting ? "Placing Order..." : "Place Order"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Variant Selection Modal */}
      {showVariantModal && selectedItem && (
        <div 
          className="fixed inset-0 flex items-center justify-center bg-black/50 p-4"
          style={{ zIndex: 99999 }}
        >
          <div 
            className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900"
            style={{ zIndex: 100000 }}
          >
            {/* Close button */}
            <button
              onClick={() => {
                setShowVariantModal(false);
                setSelectedItem(null);
              }}
              className="absolute right-4 top-4 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Item Details */}
            <div className="p-6">
              <div className="mb-4 flex gap-4">
                <img
                  src={selectedItem.image}
                  alt={selectedItem.name}
                  className="h-24 w-24 rounded-lg object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/images/product/placeholder.jpg";
                  }}
                />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                    {selectedItem.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {selectedItem.category}
                  </p>
                  {selectedItem.description && (
                    <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                      {selectedItem.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Variants Selection */}
              <div>
                <h4 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Select Variant
                </h4>
                <div className="space-y-2">
                  {selectedItem.priceVariants && selectedItem.priceVariants.length > 0 ? (
                    selectedItem.priceVariants.map((variant) => (
                      <button
                        key={variant.quantity}
                        onClick={() => addToCart(selectedItem, variant.quantity, variant.price)}
                        className="flex w-full items-center justify-between rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium transition-all hover:border-indigo-500 hover:bg-indigo-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-indigo-500 dark:hover:bg-indigo-500/10"
                      >
                        <span className="text-gray-800 dark:text-white/90">{variant.quantity}</span>
                        <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                          ${variant.price.toFixed(2)}
                        </span>
                      </button>
                    ))
                  ) : (
                    <button
                      onClick={() => addToCart(selectedItem)}
                      className="flex w-full items-center justify-between rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium transition-all hover:border-indigo-500 hover:bg-indigo-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-indigo-500 dark:hover:bg-indigo-500/10"
                    >
                      <span className="text-gray-800 dark:text-white/90">Regular</span>
                      <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                        ${selectedItem.price.toFixed(2)}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
