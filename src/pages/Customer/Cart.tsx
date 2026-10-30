import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartItem } from './ItemDetails';
import { useShopStatus } from '../../context/ShopStatusContext';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import QuickCheckoutModal from '../../components/customer/QuickCheckoutModal';

export default function Cart() {
  const navigate = useNavigate();
  const { shopStatus } = useShopStatus();
  const { isAuthenticated } = useCustomerAuth();
  const isShopOpen = shopStatus?.isOpen ?? true;
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [quickCheckoutOpen, setQuickCheckoutOpen] = useState(false);

  useEffect(() => {
    const loadCart = () => {
      const savedCart = JSON.parse(localStorage.getItem('cart') || '[]') as CartItem[];
      setCart(savedCart);
    };

    loadCart();

    const handleCartUpdate = () => loadCart();
    window.addEventListener('cartUpdated', handleCartUpdate);
    
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, []);

  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    const updatedCart = [...cart];
    updatedCart[index].quantity = newQuantity;
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const removeItem = (index: number) => {
    const updatedCart = cart.filter((_, i) => i !== index);
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleStartCheckout = () => {
    setQuickCheckoutOpen(true);
  };

  if (cart.length === 0 && !quickCheckoutOpen) {
    return (
      <div className="min-h-[75vh] bg-[#F6F5F2] flex items-center justify-center p-6 font-sans">
        <div className="text-center max-w-sm bg-white p-10 rounded-3xl border border-neutral-200/90 shadow-2xs">
          <div className="w-20 h-20 mx-auto mb-5 bg-[#F6F5F2] rounded-full flex items-center justify-center text-3xl shadow-inner">
            🛒
          </div>
          <h2 className="text-2xl font-extrabold text-neutral-950 mb-2">Your Cart is Empty</h2>
          <p className="text-xs text-neutral-500 mb-6 leading-relaxed">
            You haven't added any dishes yet. Explore our freshly made recipes and place your order in seconds.
          </p>
          <Link
            to="/customer/menu"
            className="inline-flex w-full justify-center items-center py-3.5 rounded-full bg-black text-white text-xs font-extrabold hover:bg-neutral-800 transition-all shadow-sm active:scale-98"
          >
            Explore Menu Now →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F5F2] text-neutral-900 font-sans pb-24">
      <div className="max-w-5xl mx-auto px-3.5 sm:px-6 lg:px-12 py-5 sm:py-10">
        {/* Header Bar */}
        <div className="flex items-center justify-between mb-5 sm:mb-8 pb-3 sm:pb-4 border-b border-neutral-200/80">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              {totalItemCount} {totalItemCount === 1 ? 'ITEM' : 'ITEMS'} IN YOUR ORDER
            </span>
            <h1 className="text-3xl font-extrabold text-neutral-950 tracking-tight mt-0.5">
              Your Cart
            </h1>
          </div>
          <Link
            to="/customer/menu"
            className="text-xs font-extrabold text-neutral-800 hover:text-black border border-neutral-300 rounded-full px-4 py-2 hover:border-black transition-all bg-white"
          >
            + Add more dishes
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start">
          {/* Cart Item Cards List */}
          <div className="lg:col-span-7 space-y-3">
            {cart.map((item, index) => (
              <div
                key={`${item.menuItemId}-${item.selectedVariant}-${index}`}
                className="p-3 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-neutral-200/90 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between gap-3 sm:gap-4"
              >
                {/* Dish Thumbnail */}
                <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl overflow-hidden bg-neutral-100 flex-shrink-0 relative">
                  <img
                    src={item.image || '/images/product/placeholder.jpg'}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/product/placeholder.jpg';
                    }}
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-extrabold text-xs sm:text-base text-neutral-950 truncate">
                    {item.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[9px] sm:text-[11px] font-bold text-neutral-400 uppercase tracking-wide px-1.5 sm:px-2 py-0.5 rounded-full bg-neutral-100">
                      {item.selectedVariant || 'Standard'}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-black text-neutral-950 mt-1">
                    ₹{item.price * item.quantity}
                    <span className="text-[10px] sm:text-xs text-neutral-400 font-medium ml-1">
                      (₹{item.price})
                    </span>
                  </p>
                </div>

                {/* Quantity Controls & Delete */}
                <div className="flex items-center gap-1.5 sm:gap-3">
                  <div className="flex items-center border border-neutral-300 rounded-full bg-[#F6F5F2] p-0.5 sm:p-1 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => updateQuantity(index, item.quantity - 1)}
                      className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-white flex items-center justify-center text-[10px] sm:text-xs font-black text-neutral-800 hover:bg-neutral-200 transition-colors shadow-2xs"
                      title="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="w-6 sm:w-8 text-center text-[11px] sm:text-xs font-black text-neutral-950">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(index, item.quantity + 1)}
                      className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-white flex items-center justify-center text-[10px] sm:text-xs font-black text-neutral-800 hover:bg-neutral-200 transition-colors shadow-2xs"
                      title="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-transparent hover:border-neutral-200 hover:bg-rose-50 text-neutral-400 hover:text-rose-600 transition-all flex items-center justify-center text-xs sm:text-sm"
                    title="Remove item"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Bill Summary & 1-Step Fast Checkout */}
          <div className="lg:col-span-5 p-4 sm:p-7 rounded-2xl sm:rounded-3xl bg-white border border-neutral-200/90 shadow-2xs space-y-4 sm:space-y-6 sticky top-24">
            <h2 className="text-base sm:text-lg font-black text-neutral-950">Order Summary</h2>

            <div className="space-y-2.5 sm:space-y-3 text-xs text-neutral-600 pb-4 sm:pb-5 border-b border-neutral-100">
              <div className="flex justify-between items-center">
                <span>Items Subtotal</span>
                <span className="font-extrabold text-neutral-950 text-xs sm:text-sm">₹{subtotal.toFixed(0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Estimated Taxes & Packing</span>
                <span className="font-extrabold text-emerald-600 text-xs">FREE</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Delivery Fee</span>
                <span className="text-neutral-500 font-medium text-xs">Calculated at address step</span>
              </div>
            </div>

            <div className="flex justify-between items-baseline pt-1">
              <div>
                <span className="text-[10px] sm:text-xs font-bold text-neutral-500 uppercase tracking-wider block">Estimated Total</span>
                <span className="text-xl sm:text-2xl font-black text-neutral-950">₹{subtotal.toFixed(0)}</span>
              </div>
              <span className="text-[10px] sm:text-[11px] font-bold text-neutral-400">COD / Online</span>
            </div>

            {!isShopOpen && (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
                ⏰ Kitchen is closed right now. Ordering will open shortly.
              </div>
            )}

            <button
              type="button"
              disabled={!isShopOpen}
              onClick={handleStartCheckout}
              className="w-full py-3 sm:py-4 rounded-full bg-burgundy hover:bg-burgundy-600 text-white font-extrabold text-xs sm:text-sm tracking-wide transition-all shadow-md active:scale-98 disabled:bg-neutral-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span>Instant 1-Click Checkout →</span>
            </button>

            <div className="pt-1 text-center">
              <p className="text-[10px] sm:text-[11px] text-neutral-500 flex items-center justify-center gap-1.5 font-medium">
                <span>⚡</span>
                <span>Fast preparation & hot doorstep delivery</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 1-Step Fast Checkout Modal */}
      <QuickCheckoutModal
        isOpen={quickCheckoutOpen}
        onClose={() => setQuickCheckoutOpen(false)}
        cart={cart}
      />
    </div>
  );
}

