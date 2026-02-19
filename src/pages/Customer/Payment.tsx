import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartItem } from './ItemDetails';
import { createOrder, getMyAddresses, Address, CreateOrderData } from '../../services/customer-web.service';
import { getSettings } from '../../services/settings.service';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { useShopStatus } from '../../context/ShopStatusContext';

export default function Payment() {
  const navigate = useNavigate();
  const { customer } = useCustomerAuth();
  const { shopStatus } = useShopStatus();
  const isShopOpen = shopStatus?.isOpen ?? true;
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [newAddress, setNewAddress] = useState({
    street: '',
    area: '',
    city: '',
    state: '',
    postalCode: '',
  });
  const [guestInfo, setGuestInfo] = useState({
    name: '',
    phone: '',
    email: '',
  });
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [paymentMethod] = useState<'COD'>('COD');
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Load cart from localStorage
    const savedCart = JSON.parse(localStorage.getItem('cart') || '[]') as CartItem[];
    setCart(savedCart);

    // Redirect if cart is empty
    if (savedCart.length === 0) {
      navigate('/customer/cart');
    }
  }, [navigate]);

  useEffect(() => {
    // Fetch addresses and settings
    const fetchData = async () => {
      try {
        const setts = await getSettings();
        if (setts?.delivery?.fee) {
          setDeliveryFee(setts.delivery.fee);
        }

        if (customer) {
          try {
            const addrs = await getMyAddresses();
            setAddresses(addrs);
            if (addrs.length > 0) {
              const defaultAddr = addrs.find(a => a.isDefault) || addrs[0];
              setSelectedAddress(defaultAddr);
            } else {
              setShowAddressForm(true);
            }
          } catch (addrError) {
            console.warn('Could not fetch addresses, user can add new one:', addrError);
            setShowAddressForm(true);
          }
        } else {
          setShowAddressForm(true);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [customer]);

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal + (deliveryFee > 0 ? deliveryFee : 0);

  const handlePlaceOrder = async () => {
    // Validation
    if (!customer && (!guestInfo.name || !guestInfo.phone)) {
      alert('Please provide your name and phone number');
      return;
    }

    if (showAddressForm && (!newAddress.street || !newAddress.city || !newAddress.state || !newAddress.postalCode)) {
      alert('Please fill in all required address fields');
      return;
    }

    if (!customer && !showAddressForm) {
      alert('Please provide a delivery address');
      return;
    }

    if (customer && !selectedAddress && !showAddressForm) {
      alert('Please select or add a delivery address');
      return;
    }

    setSubmitting(true);

    try {
      const orderData: CreateOrderData = {
        items: cart.map(item => ({
          menuItem: item.menuItemId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          portion: item.selectedVariant,
          subtotal: item.price * item.quantity,
        })),
        deliveryAddress: showAddressForm ? {
          street: newAddress.street,
          city: newAddress.city,
          state: newAddress.state,
          zipCode: newAddress.postalCode,
          apartment: newAddress.area || '',
        } : {
          street: selectedAddress!.street,
          city: selectedAddress!.city,
          state: selectedAddress!.state,
          zipCode: selectedAddress!.zipCode || selectedAddress!.postalCode || '',
          apartment: selectedAddress!.area || selectedAddress!.apartment || '',
        },
        paymentMethod,
        totalAmount: total,
        deliveryFee: deliveryFee,
        ...((!customer && guestInfo.name && guestInfo.phone) ? {
          customerName: guestInfo.name,
          customerPhone: guestInfo.phone,
          customerEmail: guestInfo.email || undefined,
        } : {}),
      };

      console.log('📦 [Payment] Order data being sent:', orderData);

      const order = await createOrder(orderData);
      
      // Clear cart
      localStorage.removeItem('cart');
      window.dispatchEvent(new Event('cartUpdated'));
      
      // Redirect
      if (customer) {
        navigate(`/customer/orders/${order._id}`);
      } else {
        alert(`Order placed successfully! Your order ID is: ${order._id}. Please save this for tracking.`);
        navigate('/customer/menu');
      }
    } catch (error: any) {
      console.error('Error creating order:', error);
      
      // Show detailed error message
      const errorMsg = error.message || 'Failed to create order. Please try again.';
      alert(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-outfit pb-24">
        <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/customer/cart')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Checkout</h1>
        </div>

        {!isShopOpen && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 dark:border-yellow-400 text-yellow-800 dark:text-yellow-200 p-4 mb-6 rounded-r-xl">
            <div className="flex items-start">
              <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-semibold text-sm">We're currently closed. Orders cannot be placed.</p>
                {shopStatus?.message && <p className="text-xs mt-1">{shopStatus.message}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Delivery Address */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Delivery Address</h2>
          
          {addresses.length > 0 && !showAddressForm && customer && (
            <div className="space-y-3 mb-4">
              {addresses.map((addr) => (
                <button
                  key={addr._id}
                  onClick={() => setSelectedAddress(addr)}
                  className={`w-full text-left p-4 border-2 rounded-xl transition-all duration-200 ${
                    selectedAddress?._id === addr._id
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-400 shadow-sm'
                      : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600'
                  }`}
                >
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">
                    {addr.label && <span className="text-indigo-600 dark:text-indigo-400">{addr.label} - </span>}
                    {addr.street}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                    {addr.area && `${addr.area}, `}{addr.city}, {addr.state} {addr.postalCode}
                  </p>
                </button>
              ))}
            </div>
          )}

          {showAddressForm && (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Street Address *"
                value={newAddress.street}
                onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-sm"
              />
              <input
                type="text"
                placeholder="Area"
                value={newAddress.area}
                onChange={(e) => setNewAddress({ ...newAddress, area: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="City *"
                  value={newAddress.city}
                  onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                  className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-sm"
                />
                <input
                  type="text"
                  placeholder="State *"
                  value={newAddress.state}
                  onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                  className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-sm"
                />
              </div>
              <input
                type="text"
                placeholder="Postal Code *"
                value={newAddress.postalCode}
                onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-sm"
              />
            </div>
          )}

          {customer && (
            <button
              onClick={() => setShowAddressForm(!showAddressForm)}
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold mt-4 text-sm flex items-center gap-1"
            >
              {showAddressForm ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Use Saved Address
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add New Address
                </>
              )}
            </button>
          )}
        </div>

        {/* Guest Contact Information */}
        {!customer && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Contact Information</h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Full Name *"
                value={guestInfo.name}
                onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-sm"
                required
              />
              <input
                type="tel"
                placeholder="Phone Number *"
                value={guestInfo.phone}
                onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-sm"
                required
              />
              <input
                type="email"
                placeholder="Email (optional)"
                value={guestInfo.email}
                onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-sm"
              />
            </div>
          </div>
        )}

        {/* Payment Method */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Payment Method</h2>
          <div className="py-3 px-4 rounded-xl border-2 border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-400">
            <span className="font-semibold text-gray-900 dark:text-white text-sm">Cash on Delivery (COD)</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 block mt-0.5">Pay when you receive your order</span>
          </div>
        </div>

        {/* Bill Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Bill Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Item Total</span>
              <span className="font-semibold text-gray-900 dark:text-white">₹{subtotal.toFixed(2)}</span>
            </div>
            {deliveryFee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Delivery Fee</span>
                <span className="font-semibold text-gray-900 dark:text-white">₹{deliveryFee.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between">
              <span className="font-bold text-gray-900 dark:text-white">Total</span>
              <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg">
        <div className="container mx-auto max-w-2xl">
          <button
            onClick={handlePlaceOrder}
            disabled={!isShopOpen || submitting}
            className="w-full bg-indigo-600 dark:bg-indigo-500 text-white py-4 rounded-xl font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2 text-sm"
          >
            {submitting ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Placing Order...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Place Order</span>
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}