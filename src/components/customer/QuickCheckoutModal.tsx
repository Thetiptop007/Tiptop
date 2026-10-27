import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { createOrder, getMyAddresses, Address, CreateOrderData } from '../../services/customer-web.service';
import { getSettings } from '../../services/settings.service';
import { logger } from '../../utils/logger';

interface QuickCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart?: Array<{
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
    selectedVariant: string;
    image?: string;
  }>;
  cartItems?: Array<{
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
    selectedVariant: string;
    image?: string;
  }>;
  onOrderPlaced?: () => void;
}

const SERVICE_AREAS = [
  { id: 'law_gate', name: 'Law Gate' },
  { id: 't_point', name: 'T Point' },
  { id: 'green_valley', name: 'Green Valley' },
  { id: 'bhutani_colony', name: 'Bhutani Colony' },
  { id: 'riya_girls_hostel', name: 'Riya Girls Hostel' },
];

export const QuickCheckoutModal: React.FC<QuickCheckoutModalProps> = ({
  isOpen,
  onClose,
  cart,
  cartItems,
  onOrderPlaced,
}) => {
  const navigate = useNavigate();
  const { customer, isAuthenticated } = useCustomerAuth();
  const activeCart = cart || cartItems || [];

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [newArea, setNewArea] = useState<string>('Law Gate');
  const [newAddressLine, setNewAddressLine] = useState<string>('');
  const [newLandmark, setNewLandmark] = useState<string>('');
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = activeCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + deliveryFee;

  useEffect(() => {
    if (!isOpen) return;

    if (!isAuthenticated) {
      onClose();
      navigate('/customer/login', {
        state: { from: { pathname: '/customer/menu' } },
      });
      return;
    }

    const loadData = async () => {
      try {
        const [setts, addrs] = await Promise.all([
          getSettings(),
          getMyAddresses().catch(() => [] as Address[]),
        ]);

        if (setts?.delivery?.fee) {
          setDeliveryFee(setts.delivery.fee);
        }

        if (addrs && addrs.length > 0) {
          setAddresses(addrs);
          const defaultAddr = addrs.find((a) => a.isDefault) || addrs[0];
          setSelectedAddressId(defaultAddr._id);
          setIsAddingNewAddress(false);
        } else {
          setIsAddingNewAddress(true);
        }
      } catch (err) {
        logger.warn('Could not load checkout data', { err });
      }
    };

    loadData();
  }, [isOpen, isAuthenticated, navigate, onClose]);

  if (!isOpen) return null;

  const handlePlaceOrderInstant = async () => {
    setError(null);

    let finalAddress;
    if (isAddingNewAddress) {
      if (!newAddressLine.trim()) {
        setError('Please enter your specific room / flat / hostel address.');
        return;
      }
      finalAddress = {
        area: newArea,
        addressLine: newAddressLine.trim(),
        landmark: newLandmark.trim() || undefined,
      };
    } else {
      const selected = addresses.find((a) => a._id === selectedAddressId);
      if (!selected) {
        setError('Please choose or enter a delivery address.');
        return;
      }
      finalAddress = {
        area: selected.area,
        addressLine: selected.addressLine,
        landmark: selected.landmark,
      };
    }

    setSubmitting(true);
    try {
      const orderPayload: CreateOrderData = {
        items: activeCart.map((i) => ({
          menuItem: i.menuItemId,
          name: i.name,
          quantity: i.quantity,
          price: i.price,
          portion: i.selectedVariant,
          subtotal: i.price * i.quantity,
        })),
        deliveryAddress: finalAddress as any,
        paymentMethod: 'COD',
        totalAmount: total,
        deliveryFee,
      };

      const order = await createOrder(orderPayload);

      // Clear Cart
      localStorage.removeItem('cart');
      window.dispatchEvent(new Event('cartUpdated'));

      if (onOrderPlaced) {
        onOrderPlaced();
      } else {
        onClose();
        navigate(`/customer/orders/${order._id}`);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-neutral-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-neutral-200 dark:border-neutral-800 relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              1-CLICK CHECKOUT
            </span>
            <h3 className="text-xl font-extrabold text-neutral-950 dark:text-white">
              Complete Your Order
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-black dark:hover:text-white flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        {/* Order Items Summary */}
        <div className="py-4 border-b border-neutral-100 dark:border-neutral-800">
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
            Items ({cart.length})
          </p>
          <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
            {cart.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm">
                <span className="text-neutral-800 dark:text-neutral-200 font-medium">
                  {item.quantity}x {item.name} <span className="text-xs text-neutral-400">({item.selectedVariant})</span>
                </span>
                <span className="font-bold text-neutral-900 dark:text-white">
                  ₹{item.price * item.quantity}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Address Section */}
        <div className="py-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Delivery Destination
            </label>
            {addresses.length > 0 && (
              <button
                type="button"
                onClick={() => setIsAddingNewAddress(!isAddingNewAddress)}
                className="text-xs font-bold text-neutral-900 dark:text-neutral-200 hover:underline"
              >
                {isAddingNewAddress ? 'Choose Saved Address' : '+ New Address'}
              </button>
            )}
          </div>

          {!isAddingNewAddress && addresses.length > 0 ? (
            <div className="space-y-2">
              {addresses.map((addr) => (
                <label
                  key={addr._id}
                  className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                    selectedAddressId === addr._id
                      ? 'border-black dark:border-white bg-neutral-50 dark:bg-neutral-800'
                      : 'border-neutral-200 dark:border-neutral-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="selectedAddress"
                    checked={selectedAddressId === addr._id}
                    onChange={() => setSelectedAddressId(addr._id)}
                    className="mt-1 accent-black"
                  />
                  <div className="text-xs">
                    <p className="font-bold text-neutral-900 dark:text-white capitalize">
                      {addr.area}
                    </p>
                    <p className="text-neutral-500 dark:text-neutral-400">
                      {addr.addressLine} {addr.landmark ? `(Near ${addr.landmark})` : ''}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-neutral-500 mb-1">
                  Area / Locality
                </label>
                <select
                  value={newArea}
                  onChange={(e) => setNewArea(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-medium text-neutral-900 dark:text-white outline-none focus:border-black"
                >
                  {SERVICE_AREAS.map((a) => (
                    <option key={a.id} value={a.name}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-500 mb-1">
                  Hostel / Building / Room Details
                </label>
                <input
                  type="text"
                  placeholder="e.g. Block B, Room 402, Royal Girls Hostel"
                  value={newAddressLine}
                  onChange={(e) => setNewAddressLine(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 outline-none focus:border-black"
                />
              </div>
            </div>
          )}
        </div>

        {/* Payment Summary & Instant Order Action */}
        <div className="pt-4 space-y-3">
          <div className="flex justify-between text-xs text-neutral-500">
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(0)}</span>
          </div>
          <div className="flex justify-between text-xs text-neutral-500">
            <span>Delivery Fee</span>
            <span>{deliveryFee > 0 ? `₹${deliveryFee}` : 'FREE'}</span>
          </div>
          <div className="flex justify-between text-sm font-black text-neutral-950 dark:text-white pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <span>Total Payable (Cash/UPI on Delivery)</span>
            <span className="text-base font-extrabold">₹{total.toFixed(0)}</span>
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={handlePlaceOrderInstant}
            className="w-full mt-4 py-4 rounded-full bg-burgundy hover:bg-burgundy-600 text-white font-bold text-sm transition-all shadow-md active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <span>Placing Order...</span>
            ) : (
              <span>Confirm & Place Order (₹{total.toFixed(0)}) →</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
export default QuickCheckoutModal;
