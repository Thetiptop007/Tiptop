import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartItem } from './ItemDetails';
import { createOrder, getMyAddresses, Address, CreateOrderData } from '../../services/customer-web.service';
import { createAddress, AddressData } from '../../services/customer-operations.service';
import { getSettings } from '../../services/settings.service';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { useShopStatus } from '../../context/ShopStatusContext';
import { logger } from '../../utils/logger';
import { formatOrderNumberForDisplay } from '../../utils/orderNumber';


// Service areas configuration
const SERVICE_AREAS = [
  { id: 'law_gate', name: 'Law Gate' },
  { id: 't_point', name: 'T Point' },
  { id: 'green_valley', name: 'Green Valley' },
  { id: 'bhutani_colony', name: 'Bhutani Colony' },
  { id: 'riya_girls_hostel', name: 'Riya Girls Hostel' },
];

export default function Payment() {
  const navigate = useNavigate();
  const { customer, isLoading } = useCustomerAuth();
  const { shopStatus } = useShopStatus();
  const isShopOpen = shopStatus?.isOpen ?? true;
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [newAddress, setNewAddress] = useState<AddressData>({
    type: 'home',
    area: '',
    addressLine: '',
    landmark: '',
    isDefault: false,
  });
  const [guestInfo, setGuestInfo] = useState({
    name: '',
    phone: '',
    email: '',
  });
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [saveAddress, setSaveAddress] = useState(true);
  const [paymentMethod] = useState<'COD'>('COD');
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('cart') || '[]') as CartItem[];
    setCart(savedCart);

    if (savedCart.length === 0) {
      navigate('/customer/cart');
    }
  }, [navigate]);

  useEffect(() => {
    if (isLoading) return;

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
              setShowAddressForm(false);
            } else {
              setShowAddressForm(true);
            }
          } catch (addrError) {
            logger.warn('Could not fetch addresses', { error: addrError });
            setShowAddressForm(true);
          }
        } else {
          setShowAddressForm(true);
        }
      } catch (error) {
        logger.error('Error fetching payment data', { error });
      }
    };

    fetchData();
  }, [customer, isLoading]);

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal + (deliveryFee > 0 ? deliveryFee : 0);

  const handlePlaceOrder = async () => {
    if (!customer && (!guestInfo.name || !guestInfo.phone)) {
      alert('Please provide your name and phone number');
      return;
    }

    if (customer && (showAddressForm || !selectedAddress)) {
      if (!selectedArea || !newAddress.addressLine) {
        alert('Please select an area and enter your exact address');
        return;
      }
    }

    if (!customer && (!selectedArea || !newAddress.addressLine)) {
      alert('Please select an area and enter your exact address');
      return;
    }

    setSubmitting(true);

    try {
      let finalDeliveryAddress;

      if (customer && !showAddressForm && selectedAddress) {
        finalDeliveryAddress = {
          area: selectedAddress.area,
          addressLine: selectedAddress.addressLine,
          landmark: selectedAddress.landmark
        };
      } else {
        const areaName = SERVICE_AREAS.find(a => a.id === selectedArea)?.name || selectedArea;
        finalDeliveryAddress = {
          area: areaName,
          addressLine: newAddress.addressLine,
          landmark: newAddress.landmark
        };

        if (customer && saveAddress) {
          try {
            await createAddress({
              ...newAddress,
              area: areaName,
            });
          } catch (e) {
            logger.warn('Failed to save address', { error: e });
          }
        }
      }

      const orderData: CreateOrderData = {
        items: cart.map(item => ({
          menuItem: item.menuItemId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          portion: item.selectedVariant,
          subtotal: item.price * item.quantity,
        })),
        deliveryAddress: finalDeliveryAddress as any, // Cast due to internal type mismatch in legacy interface
        paymentMethod,
        totalAmount: total,
        deliveryFee: deliveryFee,
        ...((!customer) ? {
          customerName: guestInfo.name,
          customerPhone: guestInfo.phone,
          customerEmail: guestInfo.email || undefined,
        } : {}),
      };

      const order = await createOrder(orderData);
      localStorage.removeItem('cart');
      window.dispatchEvent(new Event('cartUpdated'));
      
      if (customer) {
        navigate(`/customer/orders/${order._id}`);
      } else {
        alert(`Order placed successfully! Your order number is: ${formatOrderNumberForDisplay(order.orderNumber)}`);
        navigate('/customer/menu');
      }
    } catch (error: any) {
      logger.error('Error creating order', { error });
      alert(error.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-outfit pb-24">
        <div className="container mx-auto px-4 py-6 max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => navigate('/customer/cart')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Checkout</h1>
          </div>

          {!isShopOpen && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 dark:border-yellow-400 text-yellow-800 dark:text-yellow-200 p-4 mb-6 rounded-r-xl">
              <p className="font-semibold text-sm">We're currently closed. Orders cannot be placed.</p>
            </div>
          )}

          {/* Delivery Address */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Delivery Address</h2>
            
            {customer && addresses.length > 0 && !showAddressForm && (
              <div className="space-y-3 mb-4">
                {addresses.map((addr) => (
                  <button
                    key={addr._id}
                    onClick={() => setSelectedAddress(addr)}
                    className={`w-full text-left p-4 border-2 rounded-xl transition-all ${
                      selectedAddress?._id === addr._id
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-400'
                        : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-sm text-gray-900 dark:text-white capitalize">{addr.type} {addr.label && `(${addr.label})`}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{addr.area}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{addr.addressLine}</p>
                      </div>
                      {selectedAddress?._id === addr._id && (
                        <div className="bg-indigo-600 rounded-full p-1">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {(showAddressForm || (!customer)) && (
              <div className="space-y-4">
                {customer && (
                  <div className="flex gap-2">
                    {(['home', 'work', 'other'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setNewAddress({ ...newAddress, type })}
                        className={`flex-1 py-2 rounded-lg border text-xs font-bold transition-colors ${
                          newAddress.type === type ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {type.toUpperCase()}
                      </button>
                    ))}
                  </div>
                )}

                <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-500 uppercase">Select Area</label>
                  <div className="grid grid-cols-2 gap-2">
                    {SERVICE_AREAS.map((area) => (
                      <button
                        key={area.id}
                        type="button"
                        onClick={() => setSelectedArea(area.id)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          selectedArea === area.id ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <p className="font-bold text-xs text-gray-900 dark:text-white">{area.name}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Exact Location</label>
                  <textarea
                    placeholder="House No, Apartment name, Landmark etc."
                    value={newAddress.addressLine}
                    onChange={(e) => setNewAddress({ ...newAddress, addressLine: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    rows={3}
                  />
                </div>

                {customer && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="w-4 h-4 rounded text-indigo-600" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">Save address for future</span>
                  </label>
                )}
              </div>
            )}

            {customer && (
              <button
                onClick={() => setShowAddressForm(!showAddressForm)}
                className="text-indigo-600 dark:text-indigo-400 font-bold text-sm mt-4"
              >
                {showAddressForm ? '← Use Saved Address' : '+ Add New Address'}
              </button>
            )}
          </div>

          {!customer && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Contact Details</h2>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Full Name *"
                  value={guestInfo.name}
                  onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl text-sm"
                />
                <input
                  type="tel"
                  placeholder="Phone Number *"
                  value={guestInfo.phone}
                  onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl text-sm"
                />
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Bill Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Item Total</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Delivery Fee</span>
                <span>₹{deliveryFee.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-100 dark:border-gray-700 pt-2 flex justify-between font-bold text-gray-900 dark:text-white text-base">
                <span>To Pay</span>
                <span className="text-indigo-600 dark:text-indigo-400">₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg z-20">
        <div className="container mx-auto max-w-2xl">
          <button
            onClick={handlePlaceOrder}
            disabled={!isShopOpen || submitting}
            className="w-full bg-indigo-600 dark:bg-indigo-500 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:bg-gray-400 flex items-center justify-center gap-2"
          >
            {submitting ? 'Placing Order...' : 'Place Order ₹' + total.toFixed(0)}
          </button>
        </div>
      </div>
    </>
  );
}