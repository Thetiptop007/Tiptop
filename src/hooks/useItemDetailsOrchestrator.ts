import { useState, useEffect } from 'react';
import { useMenuItemQuery, useCustomerMenuQuery } from './useAppDataQueries';
import { useToast } from '../context/ToastContext';

export function useItemDetailsOrchestrator(id: string | undefined) {
  const { showToast } = useToast();
  const itemQuery = useMenuItemQuery(id);
  
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [selectedPrice, setSelectedPrice] = useState<number>(0);
  const [quantity, setQuantity] = useState(1);
  const [cartQuantity, setCartQuantity] = useState(0);

  const relatedQuery = useCustomerMenuQuery({
    category: itemQuery.data?.categories?.[0],
    limit: 6
  });

  useEffect(() => {
    if (itemQuery.data?.priceVariants?.length) {
      const first = itemQuery.data.priceVariants[0];
      setSelectedVariant(first.quantity);
      setSelectedPrice(first.price);
    }
  }, [itemQuery.data]);

  const syncCart = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find((i: any) => i.menuItemId === id && i.selectedVariant === selectedVariant);
    setCartQuantity(existing?.quantity || 0);
  };

  useEffect(() => {
    if (id && selectedVariant) syncCart();
  }, [id, selectedVariant]);

  const addToCart = () => {
    if (!itemQuery.data) return;
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const index = cart.findIndex((i: any) => i.menuItemId === id && i.selectedVariant === selectedVariant);
    
    if (index > -1) cart[index].quantity += quantity;
    else cart.push({
      menuItemId: id,
      name: itemQuery.data.name,
      image: itemQuery.data.image,
      selectedVariant,
      price: selectedPrice,
      quantity
    });

    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
    syncCart();
    showToast('Added to cart', 'success');
  };

  const updateCartQuantity = (newQty: number) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const index = cart.findIndex((i: any) => i.menuItemId === id && i.selectedVariant === selectedVariant);
    
    if (index > -1) {
      if (newQty <= 0) cart.splice(index, 1);
      else cart[index].quantity = newQty;
      
      localStorage.setItem('cart', JSON.stringify(cart));
      window.dispatchEvent(new Event('cartUpdated'));
      syncCart();
    }
  };

  return {
    queries: { item: itemQuery, related: relatedQuery },
    selection: {
      variant: { 
        value: selectedVariant, 
        price: selectedPrice,
        set: (v: string, p: number) => { setSelectedVariant(v); setSelectedPrice(p); } 
      },
      quantity: { value: quantity, set: setQuantity },
      cartQuantity
    },
    actions: { addToCart, updateCartQuantity }
  };
}
