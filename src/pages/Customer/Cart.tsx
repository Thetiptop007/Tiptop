import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartItem } from './ItemDetails';
import { useShopStatus } from '../../context/ShopStatusContext';
import ApplicableOffers from '../../components/customer/ApplicableOffers';

export default function Cart() {
  const navigate = useNavigate();
  const { shopStatus } = useShopStatus();
  const isShopOpen = shopStatus?.isOpen ?? true;
  
  const [cart, setCart] = useState<CartItem[]>([]);

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

  const handleProceedToCheckout = () => {
    navigate('/customer/payment');
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center font-outfit">
        <div className="text-center px-4">
          <div className="w-32 h-32 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <svg className="w-16 h-16 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Your Cart is Empty</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Add some delicious items to get started</p>
          <Link to="/customer/menu" className="inline-flex items-center gap-2 bg-indigo-600 dark:bg-indigo-500 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all duration-200 font-semibold shadow-sm hover:shadow-md text-sm">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            Browse Menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-outfit pb-24">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-6">Your Cart</h1>

        {!isShopOpen && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 dark:border-yellow-400 text-yellow-800 dark:text-yellow-200 p-4 mb-6 rounded-r-xl">
            <div className="flex items-start">
              <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-semibold text-sm">We are currently closed. You can review your cart but orders cannot be placed.</p>
                {shopStatus?.message && <p className="text-xs mt-1">{shopStatus.message}</p>}
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          {cart.map((item, index) => (
            <div key={`${item.menuItemId}-${item.selectedVariant}`} className="p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
              <div className="flex gap-3">
                <img src={item.image || '/images/product/placeholder.jpg'} alt={item.name} className="w-20 h-20 object-cover rounded-lg flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).src = '/images/product/placeholder.jpg'; }} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2 flex-1">{item.name}</h3>
                    <button onClick={() => removeItem(index)} className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1" title="Remove item">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{item.selectedVariant}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-base font-bold text-indigo-600 dark:text-indigo-400">₹{item.price.toFixed(0)}</p>
                    <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
                      <button onClick={() => updateQuantity(index, item.quantity - 1)} className="w-8 h-8 rounded-l-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                        </svg>
                      </button>
                      <span className="w-8 text-center text-sm font-semibold text-gray-900 dark:text-white">{item.quantity}</span>
                      <button onClick={() => updateQuantity(index, item.quantity + 1)} className="w-8 h-8 rounded-r-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Item Total</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">₹{(item.price * item.quantity).toFixed(0)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Applicable Offers */}
        <ApplicableOffers
          cartItems={cart.map(item => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            price: item.price
          }))}
          orderAmount={subtotal}
        />

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Bill Details</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Item Total</span>
              <span className="font-semibold text-gray-900 dark:text-white">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between">
              <span className="font-bold text-gray-900 dark:text-white">To Pay</span>
              <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">₹{subtotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg">
        <div className="container mx-auto max-w-2xl">
          <button onClick={handleProceedToCheckout} disabled={!isShopOpen} className="w-full bg-indigo-600 dark:bg-indigo-500 text-white py-4 rounded-xl font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2 text-sm">
            <span>Proceed to Checkout</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
