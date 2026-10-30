import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCustomerMenuQuery, usePublicBootstrap } from '../../hooks/useAppDataQueries';
import { useShopStatus } from '../../context/ShopStatusContext';
import { QueryBoundary } from '../../components/common/QueryBoundary';
import QuickCheckoutModal from '../../components/customer/QuickCheckoutModal';
import VariantSelectionModal from '../../components/customer/VariantSelectionModal';

export default function CustomerMenu() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { shopStatus } = useShopStatus();
  const isShopOpen = shopStatus?.isOpen ?? true;
  
  const selectedCategory = searchParams.get('category') || 'All';
  const searchTerm = searchParams.get('search') || '';
  const [page, setPage] = useState(1);
  const [quickCheckoutOpen, setQuickCheckoutOpen] = useState(false);
  const [directCheckoutCart, setDirectCheckoutCart] = useState<any[]>([]);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [selectedItemForVariant, setSelectedItemForVariant] = useState<any | null>(null);

  useEffect(() => {
    const syncCart = () => {
      try {
        const stored = JSON.parse(localStorage.getItem('cart') || '[]');
        setCartItems(stored);
      } catch {
        setCartItems([]);
      }
    };
    syncCart();

    const handleUpdate = () => syncCart();
    window.addEventListener('cartUpdated', handleUpdate);
    return () => window.removeEventListener('cartUpdated', handleUpdate);
  }, []);

  const { categories = ["All"], isLoading: isBootstrapLoading } = usePublicBootstrap();
  const menuQuery = useCustomerMenuQuery({
    page,
    limit: 16,
    category: selectedCategory !== 'All' ? selectedCategory : undefined,
    search: searchTerm || undefined,
    sort: '-rating',
    isAvailable: true,
  });

  const handleCategoryChange = (category: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (category === 'All') newParams.delete('category');
    else newParams.set('category', category);
    setSearchParams(newParams);
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set('search', value);
    else newParams.delete('search');
    setSearchParams(newParams);
    setPage(1);
  };

  // Get total quantity of an item across all its variants in cart
  const getItemTotalCartQuantity = (itemId: string) => {
    return cartItems
      .filter((c: any) => c.menuItemId === itemId)
      .reduce((sum: number, c: any) => sum + (c.quantity || 0), 0);
  };

  // Handler passed to VariantSelectionModal to increment/decrement a specific variant
  const handleUpdateVariantQuantity = (item: any, variantQuantity: string, variantPrice: number, delta: number) => {
    try {
      const existing = JSON.parse(localStorage.getItem('cart') || '[]');
      const matchIndex = existing.findIndex(
        (c: any) => c.menuItemId === item._id && c.selectedVariant === variantQuantity
      );

      if (matchIndex > -1) {
        const newQty = existing[matchIndex].quantity + delta;
        if (newQty <= 0) {
          existing.splice(matchIndex, 1);
        } else {
          existing[matchIndex].quantity = newQty;
        }
      } else if (delta > 0) {
        existing.push({
          menuItemId: item._id,
          name: item.name,
          price: variantPrice,
          image: item.image,
          selectedVariant: variantQuantity,
          quantity: 1,
        });
      }

      localStorage.setItem('cart', JSON.stringify(existing));
      setCartItems(existing);
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err) {
      console.error('Failed to update variant cart quantity', err);
    }
  };

  return (
    <div className="min-h-screen pb-24 bg-[#F6F5F2] text-neutral-900 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-6 sm:py-8">
        {/* Search Bar */}
        <div className="space-y-3 mb-6">
          <div className="max-w-2xl">
            {/* Search Input */}
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search dishes, burgers..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full rounded-full border border-neutral-300/80 bg-white px-4 sm:px-5 py-2.5 sm:py-3 pl-10 sm:pl-11 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-black focus:outline-none shadow-2xs transition-all"
              />
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => handleSearchChange('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Quick Category Filter Pills */}
          <div className="flex overflow-x-auto no-scrollbar items-center gap-1.5 sm:gap-2 pt-1 pb-1">
            {isBootstrapLoading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-8 w-16 sm:w-20 rounded-full bg-neutral-200 animate-pulse flex-shrink-0" />
              ))
            ) : (
              categories.map((category) => {
                const isSelected = selectedCategory === category;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => handleCategoryChange(category)}
                    className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-extrabold whitespace-nowrap transition-all flex-shrink-0 ${
                      isSelected
                        ? 'bg-burgundy text-white shadow-xs'
                        : 'bg-white text-neutral-700 border border-neutral-200/90 hover:border-burgundy hover:text-burgundy'
                    }`}
                  >
                    {category}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Dishes Grid - 2 items per row on mobile (grid-cols-2) */}
        <QueryBoundary
          query={menuQuery}
          loadingComponent={
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-2xl sm:rounded-3xl border border-neutral-200/80 bg-white p-2.5 sm:p-4 space-y-3 animate-pulse">
                  <div className="w-full aspect-square rounded-xl sm:rounded-2xl bg-neutral-200" />
                  <div className="h-3 sm:h-4 bg-neutral-200 rounded w-3/4" />
                  <div className="h-3 sm:h-4 bg-neutral-200 rounded w-1/3" />
                </div>
              ))}
            </div>
          }
        >
          {(data) => {
            const menuItems = data.data.menuItems || [];
            const pagination = data.pagination;

            if (menuItems.length === 0) {
              return (
                <div className="py-16 sm:py-20 text-center rounded-3xl bg-white border border-neutral-200/70 p-6 sm:p-8">
                  <p className="text-sm sm:text-base font-bold text-neutral-800 mb-1">No dishes found</p>
                  <p className="text-xs text-neutral-500">Try adjusting your search or category filter.</p>
                </div>
              );
            }

            return (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                  {menuItems.map((item: any) => {
                    const lowestPrice = item.priceVariants && item.priceVariants.length > 0
                      ? Math.min(...item.priceVariants.map((v: any) => v.price))
                      : item.price || 120;
                    const hasVariants = item.priceVariants && item.priceVariants.length > 1;
                    const totalQtyInCart = getItemTotalCartQuantity(item._id);

                    return (
                      <div
                        key={item._id}
                        onClick={() => setSelectedItemForVariant(item)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedItemForVariant(item);
                          }
                        }}
                        className="rounded-2xl sm:rounded-3xl border border-neutral-200/90 bg-white p-2.5 sm:p-4 flex flex-col justify-between hover:shadow-xl hover:border-black/30 transition-all duration-300 group cursor-pointer active:scale-[0.99] text-left select-none relative"
                      >
                        <div>
                          {/* Image Box */}
                          <div className="relative w-full aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-neutral-100 mb-2 sm:mb-3.5">
                            <img
                              src={item.image || '/images/product/placeholder.jpg'}
                              alt={item.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/images/product/placeholder.jpg';
                              }}
                            />

                            {/* In-cart indicator badge */}
                            {totalQtyInCart > 0 && (
                              <div className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-burgundy text-white text-[9px] sm:text-[11px] font-black shadow-xs flex items-center gap-1">
                                <span>{totalQtyInCart} in cart</span>
                              </div>
                            )}

                            {/* Unavailable Overlay */}
                            {!item.isAvailable && (
                              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                                <span className="text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-neutral-900/90">
                                  Sold Out
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Item Meta */}
                          <div className="mb-1.5 sm:mb-2">
                            <h3 className="font-extrabold text-neutral-950 text-xs sm:text-base leading-tight sm:leading-snug line-clamp-1 group-hover:text-burgundy transition-colors mb-0.5 sm:mb-1">
                              {item.name}
                            </h3>

                            {/* Portion Variants Display */}
                            {item.priceVariants && item.priceVariants.length > 0 ? (
                              <p className="text-[9px] sm:text-[11px] font-bold text-neutral-400 uppercase tracking-wide line-clamp-1 mb-1 sm:mb-2">
                                {item.priceVariants.map((v: any) => v.quantity).join(' • ')}
                              </p>
                            ) : (
                              <p className="text-[9px] sm:text-[11px] text-neutral-400 line-clamp-1 mb-1 sm:mb-2">
                                Fresh & made to order
                              </p>
                            )}

                            {/* Price */}
                            <div className="flex items-baseline gap-0.5 sm:gap-1">
                              <span className="font-black text-neutral-950 text-sm sm:text-lg">
                                ₹{lowestPrice.toFixed(0)}
                              </span>
                              {hasVariants && (
                                <span className="text-[10px] sm:text-xs font-bold text-neutral-400">onwards</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Subtle Customization Pill Hint */}
                        <div className="pt-2 sm:pt-2.5 border-t border-neutral-100 flex items-center justify-between text-neutral-400 text-[10px] sm:text-[11px] font-bold group-hover:text-burgundy transition-colors">
                          <span>{hasVariants ? 'Select options' : 'Choose portion'}</span>
                          <span className="text-xs font-black">→</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="mt-12 flex justify-center items-center gap-3">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(p - 1, 1))}
                      className="px-5 py-2.5 rounded-full border border-neutral-300 text-xs font-bold disabled:opacity-40 hover:border-black"
                    >
                      ← Previous
                    </button>
                    <span className="text-xs font-semibold text-neutral-500">
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={page >= pagination.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="px-5 py-2.5 rounded-full border border-neutral-300 text-xs font-bold disabled:opacity-40 hover:border-black"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            );
          }}
        </QueryBoundary>
      </div>

      {/* 1-Click Fast Checkout Modal */}
      <QuickCheckoutModal
        isOpen={quickCheckoutOpen}
        onClose={() => setQuickCheckoutOpen(false)}
        cart={directCheckoutCart}
        onOrderPlaced={() => {
          setQuickCheckoutOpen(false);
          navigate("/customer/orders");
        }}
      />

      {/* Variant Selection Modal (Half/Full / Portion Selector) */}
      <VariantSelectionModal
        isOpen={Boolean(selectedItemForVariant)}
        onClose={() => setSelectedItemForVariant(null)}
        item={selectedItemForVariant}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateVariantQuantity}
      />
    </div>
  );
}
