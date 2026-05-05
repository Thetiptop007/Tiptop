import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartItem } from './ItemDetails';
import { createOrder, getMyAddresses, Address, CreateOrderData } from '../../services/customer-web.service';
import { createAddress, AddressData } from '../../services/customer-operations.service';
import { getSettings } from '../../services/settings.service';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { useShopStatus } from '../../context/ShopStatusContext';
import { logger } from '../../utils/logger';

// Service areas configuration - matches mobile app
const SERVICE_AREAS = [
  { id: 'law_gate', name: 'Law Gate', city: 'Phagwara', state: 'Punjab', zipCode: '144401' },
  { id: 't_point', name: 'T Point', city: 'Phagwara', state: 'Punjab', zipCode: '144401' },
  { id: 'green_valley', name: 'Green Valley', city: 'Phagwara', state: 'Punjab', zipCode: '144401' },
  { id: 'bhutani_colony', name: 'Bhutani Colony', city: 'Phagwara', state: 'Punjab', zipCode: '144401' },
  { id: 'riya_girls_hostel', name: 'Riya Girls Hostel', city: 'Phagwara', state: 'Punjab', zipCode: '144401' },
];

export default function Payment() {
  const navigate = useNavigate();
  const { customer } = useCustomerAuth();
  const { shopStatus } = useShopStatus();
  const isShopOpen = shopStatus?.isOpen ?? true;
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [newAddress, setNewAddress] = useState<AddressData>({
    type: 'home',
    street: '',
    apartment: '',
    city: '',
    state: '',
    zipCode: '',
    landmark: '',
    isDefault: false,
  });
  const [guestInfo, setGuestInfo] = useState({
    name: '',
    phone: '',
    email: '',
  });
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [saveAddress, setSaveAddress] = useState(true); // Default to true - save by default
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
              logger.warn('Could not fetch addresses, user can add new one', {
                errorMessage: addrError instanceof Error ? addrError.message : String(addrError),
              });
            setShowAddressForm(true);
          }
        } else {
          setShowAddressForm(true);
        }
      } catch (error) {
          logger.error('Error fetching payment data', { errorMessage: error instanceof Error ? error.message : String(error) });
      }
    };

    fetchData();
  }, [customer]);

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal + (deliveryFee > 0 ? deliveryFee : 0);

  const handlePlaceOrder = async () => {
    logger.business('CHECKOUT_SUBMITTED', 'Place order clicked', {
      hasCustomer: !!customer,
      saveAddress,
      hasSelectedArea: !!selectedArea,
      hasSelectedAddress: !!selectedAddress,
      hasNewAddress: !!newAddress.street,
      showAddressForm,
      itemCount: cart.length,
    });
    
    // Validation
    if (!customer && (!guestInfo.name || !guestInfo.phone)) {
      alert('Please provide your name and phone number');
      return;
    }

    // For customers: must have selected address OR filled new address form
    if (customer) {
      // If no saved address is selected, check if they're adding a new one
      if (!selectedAddress || selectedAddress._id === 'temp') {
        if (!selectedArea) {
          alert('Please select a delivery area');
          return;
        }
        if (!newAddress.street || !newAddress.city || !newAddress.state || !newAddress.zipCode) {
          alert('Please fill in all required address fields');
          return;
        }
      }
    }

    // For guests: must have filled address form with area selection
    if (!customer) {
      if (!selectedArea) {
        alert('Please select a delivery area');
        return;
      }
      if (!newAddress.street || !newAddress.city || !newAddress.state || !newAddress.zipCode) {
        alert('Please fill in all required address fields');
        return;
      }
    }

    setSubmitting(true);

    try {
      let addressToSave = selectedAddress;
      let useNewAddress = false;

      // Determine if we're using a new address (for customers)
      // If the address form is showing, we're definitely using a new address
      if (customer && (showAddressForm || !selectedAddress || selectedAddress._id === 'temp')) {
        useNewAddress = true;
      }

      logger.network('ADDRESS_SAVE_EVALUATED', 'Evaluated whether to save address', {
        hasCustomer: !!customer,
        saveAddress,
        useNewAddress,
        hasSelectedArea: !!selectedArea,
        hasStreet: !!newAddress.street,
        willSave: !!(customer && saveAddress && useNewAddress && selectedArea && newAddress.street),
      });

      // If customer wants to save the new address, create it first
      if (customer && saveAddress && useNewAddress && selectedArea && newAddress.street) {
        try {
          // Get the selected area details and prepend to street
          const selectedAreaDetails = SERVICE_AREAS.find(area => area.id === selectedArea);
          const streetWithArea = selectedAreaDetails 
            ? `${selectedAreaDetails.name}, ${newAddress.street}` 
            : newAddress.street;

          const addressData = {
            ...newAddress,
            street: streetWithArea,
          };
          const savedAddr = await createAddress(addressData);
          // Extract the address from the response (API returns { status, message, data: { address } })
          const addressFromResponse = savedAddr.data?.address || savedAddr.data || savedAddr;
          // Use the saved address for this order
          addressToSave = addressFromResponse;
          useNewAddress = false; // Now using saved address
          setSelectedAddress(addressFromResponse);
        } catch (addrError) {
          logger.warn('Address save failed but order will continue', {
            errorMessage: addrError instanceof Error ? addrError.message : String(addrError),
          });
          alert('Address could not be saved, but order will continue.');
          // Continue with order even if address save fails
        }
      } else {
        logger.debug('Skipping address save - conditions not met', {
          hasCustomer: !!customer,
          saveAddress,
          useNewAddress,
          hasSelectedArea: !!selectedArea,
        });
      }

      // Prepare delivery address
      const selectedAreaDetails = SERVICE_AREAS.find(area => area.id === selectedArea);
      
      let deliveryAddress;
      if (customer && !useNewAddress && addressToSave) {
        // Use saved/selected address
        deliveryAddress = {
          street: addressToSave.street,
          apartment: addressToSave.apartment || addressToSave.area || '',
          city: addressToSave.city,
          state: addressToSave.state,
          zipCode: addressToSave.zipCode || addressToSave.postalCode || '',
          landmark: addressToSave.landmark,
        };
      } else {
        // Use new address (customer or guest)
        const streetWithArea = selectedAreaDetails
          ? `${selectedAreaDetails.name}, ${newAddress.street}`
          : newAddress.street;
        
        deliveryAddress = {
          street: streetWithArea,
          apartment: newAddress.apartment || '',
          city: newAddress.city,
          state: newAddress.state,
          zipCode: newAddress.zipCode,
          landmark: newAddress.landmark,
        };
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
        deliveryAddress,
        paymentMethod,
        totalAmount: total,
        deliveryFee: deliveryFee,
        ...((!customer && guestInfo.name && guestInfo.phone) ? {
          customerName: guestInfo.name,
          customerPhone: guestInfo.phone,
          customerEmail: guestInfo.email || undefined,
        } : {}),
      };

      logger.business('CHECKOUT_ORDER_SUBMITTING', 'Submitting checkout order', {
        hasCustomer: !!customer,
        orderType: customer ? 'customer' : 'guest',
        itemCount: orderData.items.length,
        totalAmount: orderData.totalAmount,
        paymentMethod,
      });

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
      logger.error('Error creating order', { errorMessage: error?.message || String(error) });
      
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
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">
                        {addr.label && <span className="text-indigo-600 dark:text-indigo-400">{addr.label} - </span>}
                        <span className="capitalize">{addr.type}</span>
                        {addr.isDefault && <span className="ml-2 px-2 py-0.5 bg-green-500 text-white text-xs rounded">Default</span>}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                        {addr.apartment && `${addr.apartment}, `}
                        {addr.street}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400 text-xs">
                        {addr.city}, {addr.state} {addr.zipCode || addr.postalCode}
                      </p>
                      {addr.landmark && (
                        <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">Near: {addr.landmark}</p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {showAddressForm && (
            <div className="space-y-3">
              {customer && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Address Type
                  </label>
                  <div className="flex gap-2">
                    {(['home', 'work', 'other'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setNewAddress({ ...newAddress, type })}
                        className={`flex-1 px-4 py-2 rounded-lg border text-sm transition-colors ${
                          newAddress.type === type
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-600'
                        }`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {customer && (
                <input
                  type="text"
                  placeholder="Label (e.g., My Home, Office)"
                  value={newAddress.label || ''}
                  onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-sm"
                />
              )}
              
              <input
                type="text"
                placeholder="Street Address *"
                value={newAddress.street}
                onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-sm"
              />
              <input
                type="text"
                placeholder="Apartment, Building (Optional)"
                value={newAddress.apartment || ''}
                onChange={(e) => setNewAddress({ ...newAddress, apartment: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-sm"
              />
              
              <input
                type="text"
                placeholder="Landmark (Optional)"
                value={newAddress.landmark || ''}
                onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-sm"
              />

              {/* Delivery Area Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Delivery Area <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SERVICE_AREAS.map((area) => (
                    <button
                      key={area.id}
                      type="button"
                      onClick={() => {
                          logger.ui('PAYMENT_AREA_SELECTED', 'Delivery area selected', { areaId: area.id, areaName: area.name });
                        setSelectedArea(area.id);
                        setNewAddress({
                          ...newAddress,
                          city: area.city,
                          state: area.state,
                          zipCode: area.zipCode,
                        });
                      }}
                      className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-left ${
                        selectedArea === area.id
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:border-indigo-400'
                          : 'border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500 bg-white dark:bg-gray-700'
                      }`}
                    >
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 ${
                        selectedArea === area.id
                          ? 'bg-indigo-600 dark:bg-indigo-500'
                          : 'bg-gray-100 dark:bg-gray-600'
                      }`}>
                        <svg className={`w-4 h-4 ${
                          selectedArea === area.id
                            ? 'text-white'
                            : 'text-gray-500 dark:text-gray-400'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-xs truncate ${
                          selectedArea === area.id
                            ? 'text-indigo-900 dark:text-indigo-100'
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {area.name}
                        </p>
                        <p className={`text-xs ${
                          selectedArea === area.id
                            ? 'text-indigo-600 dark:text-indigo-300'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {area.zipCode}
                        </p>
                      </div>
                      {selectedArea === area.id && (
                        <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto-filled fields display */}
              {selectedArea && (
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Auto-filled:</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">City</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{newAddress.city}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">State</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{newAddress.state}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">ZIP</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{newAddress.zipCode}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {customer && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveAddress}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      logger.ui('PAYMENT_SAVE_ADDRESS_TOGGLED', 'Save address checkbox changed', { checked });
                      setSaveAddress(checked);
                    }}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Save this address for future orders
                  </span>
                </label>
              )}

              {/* Confirm Address Button for visual feedback */}
              {showAddressForm && (
                <button
                  type="button"
                  onClick={() => {
                    logger.business('PAYMENT_CONFIRM_ADDRESS', 'Confirm address clicked', {
                      hasSelectedArea: !!selectedArea,
                      saveAddress,
                      hasStreet: !!newAddress.street,
                    });
                    // Validate address fields
                    if (!selectedArea) {
                      alert('Please select a delivery area');
                      return;
                    }
                    if (!newAddress.street) {
                      alert('Please enter street address');
                      return;
                    }
                    // Collapse the form to show the entered address
                    setShowAddressForm(false);
                    // Create a temporary selected address for display
                    const tempAddress: Address = {
                      _id: 'temp',
                      type: newAddress.type,
                      label: newAddress.label,
                      street: `${SERVICE_AREAS.find(a => a.id === selectedArea)?.name}, ${newAddress.street}`,
                      apartment: newAddress.apartment,
                      city: newAddress.city,
                      state: newAddress.state,
                      zipCode: newAddress.zipCode,
                      landmark: newAddress.landmark,
                      isDefault: false,
                    };
                    setSelectedAddress(tempAddress);
                  }}
                  className="w-full py-3 px-4 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Confirm Address
                </button>
              )}
            </div>
          )}

          {customer && !showAddressForm && selectedAddress?._id === 'temp' && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-green-900 dark:text-green-100 text-sm flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Address Confirmed
                  </p>
                  <p className="text-green-800 dark:text-green-200 text-xs mt-1">
                    {selectedAddress.street}
                    {selectedAddress.apartment && `, ${selectedAddress.apartment}`}
                  </p>
                  <p className="text-green-800 dark:text-green-200 text-xs">
                    {selectedAddress.city}, {selectedAddress.state} {selectedAddress.zipCode}
                  </p>
                  {saveAddress && (
                    <p className="text-green-700 dark:text-green-300 text-xs mt-1 italic">
                      Will be saved after placing order
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setShowAddressForm(true);
                    setSelectedAddress(null);
                  }}
                  className="text-green-700 dark:text-green-300 hover:text-green-800 dark:hover:text-green-200 text-sm font-medium"
                >
                  Edit
                </button>
              </div>
            </div>
          )}

          {customer && (
            <button
              onClick={() => {
                setShowAddressForm(!showAddressForm);
                if (selectedAddress?._id === 'temp') {
                  setSelectedAddress(null);
                }
              }}
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