import { useState, useCallback, useMemo } from 'react';
import { useSettingsQuery } from './useAppDataQueries';
import { useShopStatus } from '../context/ShopStatusContext';
import { requestFcmToken } from '../config/firebase';
import { apiRequest, parseApiResponse } from '../config/api';
import { useToast } from '../context/ToastContext';
import { logger } from '../utils/logger';

export function useGuestOrderOrchestrator() {
  const { showToast } = useToast();
  const { shopStatus } = useShopStatus();
  const { data: settings } = useSettingsQuery();

  // Menu State
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Cart State
  const [cart, setCart] = useState<any[]>([]);
  
  // Customer State
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    area: 'Law Gate',
    apartmentName: ''
  });

  // UI State
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  const cartSummary = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = (subtotal * (settings?.taxRate || 0)) / 100;
    const delivery = settings?.deliveryCharge || 0;
    return { subtotal, tax, delivery, total: subtotal + tax + delivery };
  }, [cart, settings]);

  const addToCart = useCallback((item: any, variant: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item._id && i.variant === variant.quantity);
      if (existing) {
        return prev.map(i => i === existing ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { 
        id: item._id, 
        name: item.name, 
        price: variant.price, 
        variant: variant.quantity,
        quantity: 1 
      }];
    });
    showToast('Added to cart', 'success');
  }, [showToast]);

  const updateQuantity = useCallback((id: string, variant: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id && item.variant === variant) {
        const newQty = Math.max(0, item.quantity + delta);
        return newQty === 0 ? null : { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean) as any[]);
  }, []);

  const placeOrder = async () => {
    if (cart.length === 0) return showToast('Cart is empty', 'error');
    if (!customerInfo.name || !customerInfo.phone || !customerInfo.apartmentName) {
      return showToast('Please fill all required fields', 'error');
    }

    setSubmitting(true);
    try {
      const fcmToken = await requestFcmToken().catch(() => null);
      
      const orderData = {
        customer: { name: customerInfo.name, phone: customerInfo.phone },
        items: cart.map(item => ({
          menuItem: item.id,
          quantity: item.quantity,
          price: item.price,
          portion: item.variant
        })),
        orderType: 'DELIVERY',
        deliveryAddress: {
          area: customerInfo.area,
          addressLine: customerInfo.apartmentName
        },
        paymentMethod: 'COD',
        fcmToken
      };

      const response = await apiRequest('orders/guest/create', {
        method: 'POST',
        body: JSON.stringify(orderData)
      });
      
      const result = await parseApiResponse<any>(response);
      if (result.status === 'success') {
        const order = result.data.order;
        
        // Support both legacy ORD-XXXXXX and new ORD-YYMMDD-XXX formats
        const orderNumberPattern = /^ORD-\d{6,}(-\d{3,})?$/;
        if (!order.orderNumber || !orderNumberPattern.test(order.orderNumber)) {
          throw new Error('Invalid order confirmation received. Please contact support.');
        }

        setOrderNumber(order.orderNumber);
        setOrderSuccess(true);
        setCart([]);
        showToast('Order placed successfully!', 'success');
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      logger.error('GUEST_ORDER_FAILED', error.message);
      showToast(error.message || 'Failed to place order', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return {
    menu: {
      category: { selected: selectedCategory, set: setSelectedCategory },
      search: { value: searchQuery, set: setSearchQuery }
    },
    cart: {
      items: cart,
      summary: cartSummary,
      actions: { add: addToCart, update: updateQuantity }
    },
    customer: { info: customerInfo, set: (info: any) => setCustomerInfo(info) },
    status: { submitting, orderSuccess, orderNumber, reset: () => setOrderSuccess(false) },
    actions: { placeOrder },
    shopOpen: shopStatus?.isOpen ?? true
  };
}
