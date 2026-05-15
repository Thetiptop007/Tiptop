import { useState, useMemo, useEffect } from 'react';
import { useAddressesQuery, useSettingsQuery } from './useAppDataQueries';
import { apiRequest, parseApiResponse } from '../config/api';
import { useToast } from '../context/ToastContext';

export function usePaymentOrchestrator() {
  const { showToast } = useToast();
  
  const [cartItems, setCartItems] = useState<any[]>([]);
  
  const addressesQuery = useAddressesQuery();
  const { data: settings } = useSettingsQuery();

  useEffect(() => {
    const loadCart = () => {
      const saved = JSON.parse(localStorage.getItem('cart') || '[]');
      setCartItems(saved);
    };
    loadCart();
  }, []);

  const clearCart = () => {
    localStorage.removeItem('cart');
    setCartItems([]);
    window.dispatchEvent(new Event('cartUpdated'));
  };

  // Selection State
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'UPI'>('COD');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon] = useState<any>(null);

  // UI State
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);

  const summary = useMemo(() => {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = (subtotal * (settings?.taxRate || 0)) / 100;
    const delivery = settings?.deliveryCharge || 0;
    const discount = appliedCoupon ? (subtotal * appliedCoupon.discountPercentage / 100) : 0;
    
    return {
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      delivery: delivery.toFixed(2),
      discount: discount.toFixed(2),
      total: (subtotal + tax + delivery - discount).toFixed(2)
    };
  }, [cartItems, settings, appliedCoupon]);

  const placeOrder = async () => {
    if (!selectedAddressId) return showToast('Please select an address', 'error');
    if (cartItems.length === 0) return showToast('Cart is empty', 'error');
    
    setSubmitting(true);
    try {
      const payload = {
        items: cartItems.map(item => ({
          menuItem: item.menuItemId,
          quantity: item.quantity,
          price: item.price,
          portion: item.selectedVariant || 'Full'
        })),
        addressId: selectedAddressId,
        paymentMethod,
        couponCode: appliedCoupon?.code,
        orderType: 'DELIVERY'
      };

      const response = await apiRequest('orders/create', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      const result = await parseApiResponse<any>(response);
      if (result.status === 'success') {
        setOrderData(result.data.order);
        setOrderSuccess(true);
        clearCart();
        showToast('Order placed successfully!', 'success');
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to place order', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return {
    queries: { addresses: addressesQuery },
    cart: { items: cartItems, summary },
    selection: {
      addressId: { value: selectedAddressId, set: setSelectedAddressId },
      paymentMethod: { value: paymentMethod, set: setPaymentMethod },
      coupon: { value: couponCode, set: setCouponCode, applied: appliedCoupon }
    },
    status: { submitting, orderSuccess, orderData },
    actions: { placeOrder, applyCoupon: () => {/* Logic for coupon */} }
  };
}
