import { useState, useEffect } from 'react';
import { useShopStatus } from '../context/ShopStatusContext';

export interface CartItem {
  menuItemId: string;
  name: string;
  image: string;
  selectedVariant: string;
  price: number;
  quantity: number;
}

export function useCartOrchestrator() {
  const { shopStatus } = useShopStatus();
  const [items, setItems] = useState<CartItem[]>([]);

  const loadCart = () => {
    const saved = JSON.parse(localStorage.getItem('cart') || '[]');
    setItems(saved);
  };

  useEffect(() => {
    loadCart();
    const handleUpdate = () => loadCart();
    window.addEventListener('cartUpdated', handleUpdate);
    return () => window.removeEventListener('cartUpdated', handleUpdate);
  }, []);

  const updateQuantity = (index: number, delta: number) => {
    const updated = [...items];
    const newQty = updated[index].quantity + delta;
    if (newQty < 1) return;
    
    updated[index].quantity = newQty;
    saveCart(updated);
  };

  const removeItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    saveCart(updated);
  };

  const saveCart = (newItems: CartItem[]) => {
    localStorage.setItem('cart', JSON.stringify(newItems));
    setItems(newItems);
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return {
    items,
    summary: { subtotal, total: subtotal },
    status: { isOpen: shopStatus?.isOpen ?? true },
    actions: { updateQuantity, removeItem }
  };
}
