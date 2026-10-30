import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useItemDetailsOrchestrator } from '../../hooks/useItemDetailsOrchestrator';
import { useShopStatus } from '../../context/ShopStatusContext';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { QueryBoundary } from '../../components/common/QueryBoundary';
import QuickCheckoutModal from '../../components/customer/QuickCheckoutModal';

export interface CartItem {
  menuItemId: string;
  name: string;
  image: string;
  selectedVariant: string;
  price: number;
  quantity: number;
}

export default function ItemDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { shopStatus } = useShopStatus();
  const { customer } = useCustomerAuth();
  const orchestrator = useItemDetailsOrchestrator(id);
  const isShopOpen = shopStatus?.isOpen ?? true;
  const [quickCheckoutOpen, setQuickCheckoutOpen] = useState(false);

  const handleUpdateQuantity = (newQuantity: number) => {
    orchestrator.actions.updateCartQuantity(newQuantity);
  };

  const handleQuickCheckout = () => {
    setQuickCheckoutOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F6F5F2] text-neutral-900 font-sans pb-24">
      <div className="max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-12 py-4 sm:py-8">
        {/* Back Link */}
        <button
          onClick={() => navigate('/customer/menu')}
          className="inline-flex items-center text-[10px] sm:text-xs font-bold uppercase tracking-wider text-neutral-500 hover:text-black mb-4 sm:mb-8 transition-colors group"
        >
          <svg className="w-3.5 h-3.5 mr-1.5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Menu
        </button>

        <QueryBoundary query={orchestrator.queries.item}>
          {(item) => {
            const currentPrice = (orchestrator.selection.variant.price || 0) * (orchestrator.selection.cartQuantity > 0 ? orchestrator.selection.cartQuantity : orchestrator.selection.quantity.value);
            const selectedVariantName = orchestrator.selection.variant.value || 'Standard';

            return (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-start">
                  {/* Left: Product Image Card */}
                  <div className="relative aspect-4/3 sm:aspect-square rounded-2xl sm:rounded-3xl overflow-hidden bg-neutral-200 border border-neutral-200/80 shadow-xs">
                    <img
                      src={item.image || '/images/product/placeholder.jpg'}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/product/placeholder.jpg';
                      }}
                    />

                    {!item.isAvailable && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                        <span className="text-white font-extrabold text-sm uppercase tracking-wider px-4 py-2 rounded-full bg-rose-600/90">
                          Currently Sold Out
                        </span>
                      </div>
                    )}

                    {/* Floating Badges */}
                    <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                      {item.categories && item.categories.length > 0 && (
                        <span className="px-3 py-1 rounded-full bg-white/95 text-neutral-900 text-[11px] font-bold shadow-xs">
                          {item.categories[0]}
                        </span>
                      )}
                      {item.isAvailable && isShopOpen && (
                        <span className="px-3 py-1 rounded-full bg-emerald-600/90 text-white text-[11px] font-bold shadow-xs flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          Freshly Made
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Item Details & Fast Ordering */}
                  <div className="flex flex-col justify-between">
                    <div>
                      {/* Rating & Review Header */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-extrabold">
                          <svg className="w-3.5 h-3.5 fill-amber-400 text-amber-400" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span>{item.rating?.toFixed(1) || '4.8'}</span>
                        </div>
                        <span className="text-xs text-neutral-500 font-medium">
                          ({item.reviews || 42} reviews)
                        </span>
                      </div>

                      <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-950 tracking-tight mb-3">
                        {item.name}
                      </h1>

                      <p className="text-sm text-neutral-600 leading-relaxed mb-6">
                        {item.description || 'Prepared with handpicked ingredients, traditional recipes, and authentic love for wholesome flavors.'}
                      </p>

                      {/* Size / Variant Selector */}
                      {item.priceVariants && item.priceVariants.length > 0 && (
                        <div className="mb-6">
                          <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
                            Select Portion Size
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {item.priceVariants.map((variant) => {
                              const isSelected = orchestrator.selection.variant.value === variant.quantity;
                              return (
                                <button
                                  key={variant.quantity}
                                  type="button"
                                  onClick={() => orchestrator.selection.variant.set(variant.quantity, variant.price)}
                                  className={`p-3.5 rounded-2xl text-left border transition-all ${
                                    isSelected
                                      ? 'border-black bg-neutral-950 text-white shadow-xs'
                                      : 'border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400'
                                  } ${!item.isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  disabled={!item.isAvailable}
                                >
                                  <div className={`text-xs font-bold uppercase tracking-wider ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>
                                    {variant.quantity}
                                  </div>
                                  <div className="text-base font-extrabold mt-0.5">
                                    ₹{variant.price.toFixed(0)}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Order Actions Box */}
                    <div className="pt-6 border-t border-neutral-200/80 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                          Price
                        </span>
                        <span className="text-3xl font-extrabold text-neutral-950">
                          ₹{currentPrice.toFixed(0)}
                        </span>
                      </div>

                      {!isShopOpen && (
                        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2">
                          <span>⏰ Kitchen is currently closed. Ordering opens soon.</span>
                        </div>
                      )}

                      {/* Instant Actions (1-Click Order + Add to Cart) */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        {/* 1-Step Fast Checkout */}
                        <button
                          type="button"
                          onClick={handleQuickCheckout}
                          disabled={!item.isAvailable || !isShopOpen}
                          className="flex-1 py-4 px-6 rounded-full bg-burgundy text-white text-sm font-extrabold hover:bg-burgundy-600 transition-all shadow-sm hover:scale-[1.01] active:scale-[0.99] disabled:bg-neutral-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4 text-sunflower_gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span>Order Now (1-Click)</span>
                        </button>

                        {/* Cart Stepper or Add to Cart Button */}
                        {orchestrator.selection.cartQuantity > 0 ? (
                          <div className="flex items-center justify-between border border-burgundy bg-white rounded-full px-2 py-1 sm:w-44">
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(orchestrator.selection.cartQuantity - 1)}
                              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-burgundy hover:bg-burgundy-900/10 transition-colors"
                            >
                              -
                            </button>
                            <span className="text-xs font-extrabold text-neutral-900">
                              {orchestrator.selection.cartQuantity} in cart
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(orchestrator.selection.cartQuantity + 1)}
                              disabled={!item.isAvailable || !isShopOpen}
                              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-burgundy hover:bg-burgundy-900/10 transition-colors"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={orchestrator.actions.addToCart}
                            disabled={!item.isAvailable || !isShopOpen}
                            className="py-4 px-6 rounded-full border border-neutral-300 bg-white text-neutral-900 text-sm font-extrabold hover:border-burgundy hover:text-burgundy transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                            <span>Add to Cart</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* You Might Also Like Section */}
                <div className="mt-16 pt-12 border-t border-neutral-200/80">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                    RECOMMENDED DISHES
                  </span>
                  <h3 className="text-2xl font-extrabold text-neutral-950 tracking-tight mt-1 mb-6">
                    You Might Also Love
                  </h3>

                  <QueryBoundary query={orchestrator.queries.related}>
                    {(related) => (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {related.data.menuItems.filter((i: any) => i._id !== id).slice(0, 4).map((relatedItem: any) => {
                          const lowestPrice = relatedItem.priceVariants && relatedItem.priceVariants.length > 0
                            ? Math.min(...relatedItem.priceVariants.map((v: any) => v.price))
                            : relatedItem.price || 0;

                          return (
                            <Link
                              key={relatedItem._id}
                              to={`/customer/menu/${relatedItem._id}`}
                              className="group bg-white rounded-3xl border border-neutral-200/80 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                            >
                              <div className="aspect-square bg-neutral-100 overflow-hidden relative">
                                <img
                                  src={relatedItem.image || '/images/product/placeholder.jpg'}
                                  alt={relatedItem.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/images/product/placeholder.jpg';
                                  }}
                                />
                              </div>
                              <div className="p-4">
                                <h4 className="font-bold text-sm text-neutral-900 group-hover:text-black line-clamp-1 mb-1">
                                  {relatedItem.name}
                                </h4>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-extrabold text-neutral-950">
                                    ₹{lowestPrice.toFixed(0)}
                                  </span>
                                  <span className="text-xs font-bold text-neutral-400 group-hover:text-black transition-colors">
                                    View →
                                  </span>
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </QueryBoundary>
                </div>

                {/* Direct 1-Click Fast Checkout Modal */}
                <QuickCheckoutModal
                  isOpen={quickCheckoutOpen}
                  onClose={() => setQuickCheckoutOpen(false)}
                  cartItems={[
                    {
                      menuItemId: item._id,
                      name: item.name,
                      price: orchestrator.selection.variant.price || item.price || 120,
                      quantity: orchestrator.selection.quantity.value || 1,
                      selectedVariant: selectedVariantName,
                      image: item.image,
                    },
                  ]}
                />
              </>
            );
          }}
        </QueryBoundary>
      </div>
    </div>
  );
}

