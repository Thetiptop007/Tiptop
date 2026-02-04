import { useState, useEffect, useRef } from "react";
import { getSettings, type Settings } from "../services/settings.service";
import { Link } from "react-router";
import { getApiUrl } from "../config/api";
import { useDebounceSearch } from "../hooks/useDebounceSearch";
import { useShopStatus } from "../context/ShopStatusContext";

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

export default function GuestOrder() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  
  // Shop status from context
  const { shopStatus } = useShopStatus();
  const isShopOpen = shopStatus?.isOpen ?? true;
  
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
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string>("");
  
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
        console.log('💰 Tax rate:', settingsData?.taxRate, 'Delivery charge:', settingsData?.deliveryCharge);
        
        // Auto-fill city, state, zip from business address
        if (settingsData.businessAddress) {
          const addressParts = settingsData.businessAddress.split(',').map(part => part.trim());
          if (addressParts.length >= 3) {
            const city = addressParts[addressParts.length - 2] || '';
            const lastPart = addressParts[addressParts.length - 1] || '';
            
            // Extract state and zip code from last part (e.g., "Punjab 144411")
            const zipMatch = lastPart.match(/\b\d{5,6}\b/);
            if (zipMatch) {
              const zipCode = zipMatch[0];
              const state = lastPart.replace(zipCode, '').trim();
              setDeliveryState(state);
              setDeliveryZipCode(zipCode);
            } else {
              setDeliveryState(lastPart);
            }
            
            setDeliveryCity(city);
          }
        }
        
        // Fetch categories from public endpoint with a high limit to get all categories
        const categoriesResponse = await fetch(getApiUrl('categories?limit=100'));
        if (categoriesResponse.ok) {
          const categoriesResult = await categoriesResponse.json();
          console.log('📦 Categories response:', categoriesResult);
          if (categoriesResult.status === 'success' && categoriesResult.data?.categories) {
            const categoryNames = categoriesResult.data.categories
              .filter((cat: any) => cat.isActive)
              .map((cat: any) => cat.name);
            setCategories(["All", ...categoryNames]);
            console.log('✅ Categories loaded:', categoryNames);
          }
        } else {
          console.error('❌ Failed to fetch categories:', categoriesResponse.status);
        }
        
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch menu items when search or category changes
  useEffect(() => {
    const fetchMenuItems = async () => {
      setLoading(true);
      try {
        // Build query parameters with cache busting
        let url = 'menu?limit=100';
        if (selectedCategory !== 'All') {
          url += `&category=${encodeURIComponent(selectedCategory)}`;
        }
        if (debouncedSearch) {
          url += `&search=${encodeURIComponent(debouncedSearch)}`;
        }
        // Add cache busting timestamp
        url += `&_t=${Date.now()}`;

        const menuResponse = await fetch(getApiUrl(url), {
          cache: 'no-cache'
        });
        if (menuResponse.ok) {
          const menuResult = await menuResponse.json();
          console.log('📦 Menu response:', menuResult);
          if (menuResult.status === 'success' && menuResult.data?.menuItems) {
            // Log raw items count and first item
            console.log(`📊 Raw items from backend: ${menuResult.data.menuItems.length} items`);
            if (menuResult.data.menuItems.length > 0) {
              console.log('📝 Sample item from backend:', menuResult.data.menuItems[0]);
              console.log('🔍 isActive:', menuResult.data.menuItems[0].isActive, 'isAvailable:', menuResult.data.menuItems[0].isAvailable);
            }
            
            // Transform to match expected structure
            const items = menuResult.data.menuItems
              .filter((item: any) => item.isActive && item.isAvailable)
              .map((item: any, index: number) => {
                // Get base price from priceVariants (use first variant or lowest price)
                let basePrice = 0;
                if (item.priceVariants && item.priceVariants.length > 0) {
                  // Use the lowest price from variants as base price
                  basePrice = Math.min(...item.priceVariants.map((v: any) => v.price));
                }
                
                const transformedItem = {
                  id: item._id,
                  name: item.name,
                  price: basePrice,
                  category: item.categories?.[0] || item.category || 'Other',
                  image: item.image || item.images?.[0] || '',
                  description: item.description || '',
                  priceVariants: item.priceVariants || [],
                  isAvailable: item.isAvailable
                };
                // Log first transformed item
                if (index === 0) {
                  console.log('🔄 Transformed item:', transformedItem);
                  console.log('🔍 Price details - priceVariants:', item.priceVariants, 'calculated basePrice:', basePrice);
                }
                return transformedItem;
              });
            setMenuItems(items);
            console.log(`✅ Loaded ${items.length} menu items`);
          }
        } else {
          console.error('❌ Failed to fetch menu:', menuResponse.status);
        }
      } catch (error) {
        console.error('Error fetching menu items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, [debouncedSearch, selectedCategory]);

  // Backend handles filtering, so we just use menuItems directly
  const filteredItems = menuItems;

  // Close category dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryFilterRef.current && !categoryFilterRef.current.contains(event.target as Node)) {
        setShowCategoryFilter(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const openVariantModal = (item: MenuItem) => {
    setSelectedItem(item);
    setShowVariantModal(true);
  };

  const addToCart = (item: MenuItem, variant?: string, variantPrice?: number) => {
    const existingItemIndex = cart.findIndex(
      cartItem => cartItem.id === item.id && cartItem.selectedVariant === variant
    );

    if (existingItemIndex !== -1) {
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += 1;
      setCart(updatedCart);
    } else {
      const newItem = {
        ...item,
        quantity: 1,
        selectedVariant: variant,
        variantPrice: variantPrice
      };
      console.log('🛒 Adding to cart:', {
        name: item.name,
        basePrice: item.price,
        variantPrice,
        selectedVariant: variant
      });
      setCart([...cart, newItem]);
    }
    setShowVariantModal(false);
  };

  const updateQuantity = (id: string, quantity: number, variant?: string) => {
    if (quantity === 0) {
      setCart(cart.filter(item => !(item.id === id && item.selectedVariant === variant)));
    } else {
      setCart(cart.map(item =>
        item.id === id && item.selectedVariant === variant
          ? { ...item, quantity }
          : item
      ));
    }
  };

  const getSubtotal = () => {
    const subtotal = cart.reduce((total, item) => {
      const itemPrice = item.variantPrice || item.price;
      return total + (itemPrice * item.quantity);
    }, 0);
    console.log('💵 Subtotal calculation:', { cart: cart.length, subtotal });
    return subtotal;
  };

  const getTax = () => {
    const subtotal = getSubtotal();
    const taxRate = settings?.taxRate || 0;
    return (subtotal * taxRate) / 100;
  };

  const getDeliveryFee = () => {
    return settings?.deliveryCharge || 0;
  };

  const getTotalAmount = () => {
    return getSubtotal() + getTax() + getDeliveryFee();
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

    if (!deliveryStreet.trim() || !deliveryCity.trim() || !deliveryState.trim() || !deliveryZipCode.trim()) {
      alert("Please fill in all delivery address fields");
      return;
    }

    setSubmitting(true);

    try {
      // Format price helper - remove .00 decimals
      const formatPrice = (price: number) => {
        return price % 1 === 0 ? price.toFixed(0) : price.toFixed(2);
      };

      // Calculate totals
      const subtotal = cart.reduce((sum, item) => sum + (item.variantPrice || item.price) * item.quantity, 0);
      const taxRate = settings?.taxRate || 0;
      const deliveryCharge = settings?.deliveryCharge || 0;
      const tax = subtotal * (taxRate / 100);
      const total = subtotal + tax + deliveryCharge;

      // Format order details for WhatsApp
      let message = `*═══════════════*\n`;
      message += `*THE TIP TOP*\n`;
      message += `NEAR ASHIANA PG, LAW GATE\n`;
      message += `MAHERU, PHAGWARA\n`;
      message += `*═══════════════*\n\n`;
      
      message += `*Customer:* ${customerName}\n`;
      message += `*Phone:* ${customerPhone}\n\n`;
      
      message += `*Delivery Address:*\n`;
      message += `${deliveryStreet}\n`;
      message += `${deliveryCity}, ${deliveryState} ${deliveryZipCode}\n`;
      message += `*═══════════════*\n\n`;
      
      message += `*ITEMS:*\n`;
      message += `- - - - - - - - - - - - - -\n`;
      
      cart.forEach((item) => {
        const itemPrice = item.variantPrice || item.price;
        message += `*${item.name.toUpperCase()}*`;
        if (item.selectedVariant) {
          message += ` (${item.selectedVariant})`;
        }
        message += `\n`;
        message += `₹${formatPrice(itemPrice)} × ${item.quantity}\n\n`;
      });
      
      message += `*═══════════════*\n\n`;
      message += `*SUB TOTAL:* ₹${formatPrice(subtotal)}\n`;
      if (deliveryCharge > 0) {
        message += `*DELIVERY FEE:* ₹${formatPrice(deliveryCharge)}\n`;
      }
      if (tax > 0) {
        message += `*TAX (${taxRate}%):* ₹${formatPrice(tax)}\n`;
      }
      message += `\n*GRAND TOTAL: ₹${formatPrice(total)}*\n`;
      message += `*═══════════════*`;

      // Send to WhatsApp - phone number from settings
      const whatsappNumber = settings?.contactPhone ? settings.contactPhone.replace(/\D/g, '') : '919060557296';
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
      
      // Open WhatsApp in new tab
      window.open(whatsappUrl, '_blank');
      
      // Show success message
      setOrderNumber(`WA-${Date.now()}`);
      setOrderSuccess(true);
      
      // Reset form
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setDeliveryStreet("");
      setDeliveryCity("");
      setDeliveryState("");
      setDeliveryZipCode("");
      
    } catch (error: any) {
      console.error("❌ Error preparing order:", error);
      alert("Failed to prepare order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  console.log('🎨 Render state:', { loading, orderSuccess, menuItemsCount: menuItems.length, categoriesCount: categories.length });

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-8 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <svg className="h-10 w-10 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90 mb-2">
            Order Placed Successfully!
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Your order has been received and is being processed.
          </p>
          <div className="mb-6 rounded-lg bg-red-50 dark:bg-red-950/20 p-4">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Order Number</p>
            <p className="text-2xl font-bold text-[#e36057]">{orderNumber}</p>
          </div>
          {/* <div className="mb-6 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 p-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Note:</strong> As a guest user, you won't be able to track your order status. 
              <Link to="/" className="text-[#e36057] hover:underline ml-1">
                Download our app
              </Link> to access order tracking, exclusive discounts, and more features!
            </p>
          </div> */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                setOrderSuccess(false);
                setOrderNumber("");
              }}
              className="w-full rounded-lg bg-[#e36057] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#d14f47] transition-colors"
            >
              Place Another Order
            </button>
            <Link
              to="/"
              className="w-full rounded-lg border-2 border-gray-200 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 text-center"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-4 md:px-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center">
              <img src="/logo-full.png" alt="The Tip Top" className="h-10" />
            </Link>
            <div className="flex items-center gap-3">
              {/* Cart Button - visible on mobile */}
              <button
                onClick={() => {
                  const cartSection = document.getElementById('cart-section');
                  cartSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="relative lg:hidden rounded-lg p-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.6 5.2M17 13l1.6 5.2M9 21a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z" />
                </svg>
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#e36057] text-xs font-bold text-white">
                    {getTotalItems()}
                  </span>
                )}
              </button>
              
              {/* <Link
                to="/#download"
                className="text-sm font-medium text-[#e36057] hover:text-[#d14f47]"
              >
                Download App
              </Link> */}
            </div>
          </div>
        </div>
      </header>

      {/* Shop Closed Banner */}
      {!isShopOpen && (
        <div className="bg-red-600 text-white">
          <div className="mx-auto max-w-7xl px-4 py-3 md:px-6">
            <div className="flex items-center justify-center gap-2">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium">
                Sorry, we're currently closed. Orders are temporarily unavailable.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">        
      <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Order as Guest
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Browse our menu and place your order.
            {/* <Link to="/#download" className="ml-1 text-[#e36057] hover:underline">
              Download our app
            </Link> for order tracking, exclusive discounts, and more features! */}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Menu Items Section */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              {/* Search and Filter */}
              <div className="border-b border-gray-200 p-4 dark:border-gray-800">
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Search menu items... (min 2 characters)"
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pl-10 text-sm text-gray-700 placeholder-gray-400 focus:border-[#e36057] focus:outline-none focus:ring-1 focus:ring-[#e36057] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      />
                      <svg className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>

                    <div className="relative" ref={categoryFilterRef}>
                      <button
                        onClick={() => setShowCategoryFilter(!showCategoryFilter)}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        {selectedCategory === "All" ? "All Categories" : selectedCategory}
                      </button>

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
                                    ? "bg-red-50 text-[#e36057] dark:bg-red-900/10"
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

                  {(searchQuery || selectedCategory !== "All") && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} found
                    </div>
                  )}
                </div>
              </div>

              {/* Menu Grid */}
              <div className="p-4">
                {loading ? (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                    {[...Array(8)].map((_, idx) => (
                      <div key={idx} className="animate-pulse">
                        <div className="mb-2 aspect-square rounded-lg bg-gray-200 dark:bg-gray-800"></div>
                        <div className="mb-2 h-4 rounded bg-gray-200 dark:bg-gray-800"></div>
                      </div>
                    ))}
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-sm font-medium text-gray-900 dark:text-white/90">No items found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                    {filteredItems.map((item) => {
                      const isAvailable = item.isAvailable !== false;
                      return (
                        <div
                          key={item.id}
                          onClick={() => isAvailable && openVariantModal(item)}
                          className={`group rounded-xl border bg-white p-3 transition-all dark:bg-white/[0.03] ${
                            isAvailable
                              ? 'cursor-pointer border-gray-200 hover:border-[#e36057] hover:shadow-md dark:border-gray-800'
                              : 'cursor-not-allowed border-gray-300 opacity-60 dark:border-gray-700'
                          }`}
                        >
                          <div className="relative mb-2 aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                            <img
                              src={item.image}
                              alt={item.name}
                              className={`h-full w-full object-cover ${!isAvailable ? 'grayscale' : ''}`}
                            />
                            {!isAvailable && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                                <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">
                                  Unavailable
                                </span>
                              </div>
                            )}
                          </div>
                          <h3 className="mb-1 text-sm font-semibold text-gray-800 dark:text-white/90 line-clamp-2">
                            {item.name}
                          </h3>
                          <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                            {item.category}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-bold ${isAvailable ? 'text-[#e36057]' : 'text-gray-400'}`}>
                              ₹{item.price.toFixed(2)}
                            </span>
                            {item.priceVariants && item.priceVariants.length > 0 && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {item.priceVariants.length} variants
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cart Section */}
          <div id="cart-section" className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="border-b border-gray-200 p-4 dark:border-gray-800">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  Order Cart
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {getTotalItems()} items
                </p>
              </div>

              <div className="max-h-[300px] overflow-y-auto border-b border-gray-200 p-4 dark:border-gray-800">
                {cart.length === 0 ? (
                  <div className="py-8 text-center">
                    <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                        <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.6 5.2M17 13l1.6 5.2M9 21a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Your cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div key={`${item.id}-${item.selectedVariant || 'default'}`} className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-800">
                        <img src={item.image} alt={item.name} className="h-16 w-16 rounded-lg object-cover" />
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">{item.name}</h4>
                          {item.selectedVariant && (
                            <p className="text-xs text-[#e36057]">{item.selectedVariant}</p>
                          )}
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            ₹{(item.variantPrice || item.price).toFixed(2)} each
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQuantity(item.id, item.quantity - 1, item.selectedVariant);
                              }}
                              className="flex h-6 w-6 items-center justify-center rounded bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                            >
                              -
                            </button>
                            <span className="text-sm font-medium text-gray-800 dark:text-white/90">{item.quantity}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQuantity(item.id, item.quantity + 1, item.selectedVariant);
                              }}
                              className="flex h-6 w-6 items-center justify-center rounded bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-800 dark:text-white/90">
                            ₹{((item.variantPrice || item.price) * item.quantity).toFixed(2)}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(item.id, 0, item.selectedVariant);
                            }}
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

              {cart.length > 0 && (
                <>
                  <div className="border-b border-gray-200 p-4 dark:border-gray-800">
                    <h3 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">Customer Details</h3>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Your name *"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#e36057] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
                      />
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="Phone number *"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#e36057] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
                      />
                    </div>
                  </div>

                  <div className="border-b border-gray-200 p-4 dark:border-gray-800">
                      <h3 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">Delivery Address</h3>
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={deliveryStreet}
                          onChange={(e) => setDeliveryStreet(e.target.value)}
                          placeholder="Street address *"
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#e36057] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
                        />
                        <input
                          type="text"
                          value={deliveryCity}
                          onChange={(e) => setDeliveryCity(e.target.value)}
                          placeholder="City *"
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#e36057] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={deliveryState}
                            onChange={(e) => setDeliveryState(e.target.value)}
                            placeholder="State *"
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#e36057] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
                          />
                          <input
                            type="text"
                            value={deliveryZipCode}
                            onChange={(e) => setDeliveryZipCode(e.target.value)}
                            placeholder="Zip Code *"
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#e36057] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
                          />
                        </div>
                      </div>
                    </div>


                  <div className="p-4">
                    <div className="mb-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                        <span className="font-medium text-gray-800 dark:text-white/90">₹{getSubtotal().toFixed(2)}</span>
                      </div>
                      {settings && settings.taxRate > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Tax ({settings.taxRate}%)</span>
                          <span className="font-medium text-gray-800 dark:text-white/90">₹{getTax().toFixed(2)}</span>
                        </div>
                      )}
                      {settings && settings.deliveryCharge > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Delivery Fee</span>
                          <span className="font-medium text-gray-800 dark:text-white/90">₹{getDeliveryFee().toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between border-t border-gray-200 pt-2 dark:border-gray-800">
                        <span className="font-semibold text-gray-800 dark:text-white/90">Total</span>
                        <span className="text-xl font-bold text-[#e36057]">₹{getTotalAmount().toFixed(2)}</span>
                      </div>
                    </div>
                    <button
                      onClick={handlePlaceOrder}
                      disabled={submitting || cart.length === 0 || !isShopOpen}
                      className="w-full rounded-lg bg-[#e36057] px-4 py-3 text-sm font-medium text-white hover:bg-[#d14f47] disabled:opacity-50 disabled:cursor-not-allowed dark:hover:bg-[#e36057]"
                    >
                      {submitting ? "Placing Order..." : !isShopOpen ? "Shop Closed - Cannot Order" : "Place Order"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Variant Modal */}
      {showVariantModal && selectedItem && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowVariantModal(false)}
        >
          <div 
            className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowVariantModal(false)}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="p-6">
              <img
                src={selectedItem.image}
                alt={selectedItem.name}
                className="mb-4 h-48 w-full rounded-lg object-cover"
              />
              <h3 className="mb-2 text-xl font-bold text-gray-800 dark:text-white/90">{selectedItem.name}</h3>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">{selectedItem.description}</p>

              {selectedItem.priceVariants && selectedItem.priceVariants.length > 0 ? (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select Variant:</label>
                  {selectedItem.priceVariants.map((variant) => (
                    <button
                      key={variant.quantity}
                      onClick={() => addToCart(selectedItem, variant.quantity, variant.price)}
                      className="flex w-full items-center justify-between rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium transition-all hover:border-[#e36057] hover:bg-red-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-[#e36057] dark:hover:bg-red-900/10"
                    >
                      <span className="text-gray-800 dark:text-white/90">{variant.quantity}</span>
                      <span className="font-bold text-[#e36057]">₹{variant.price.toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  onClick={() => addToCart(selectedItem)}
                  className="w-full rounded-lg bg-[#e36057] px-4 py-3 text-sm font-medium text-white hover:bg-[#d14f47]"
                >
                  Add to Cart - ₹{selectedItem.price.toFixed(2)}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
