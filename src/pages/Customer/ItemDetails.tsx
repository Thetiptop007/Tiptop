import { useNavigate, useParams, Link } from 'react-router-dom';
import { useItemDetailsOrchestrator } from '../../hooks/useItemDetailsOrchestrator';
import { useShopStatus } from '../../context/ShopStatusContext';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { QueryBoundary } from '../../components/common/QueryBoundary';

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

  const handleUpdateQuantity = (newQuantity: number) => {
    orchestrator.actions.updateCartQuantity(newQuantity);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-outfit">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-6 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Menu
        </button>

        <QueryBoundary query={orchestrator.queries.item}>
          {(item) => (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Image Section */}
              <div className="relative bg-gray-100 dark:bg-gray-900 rounded-xl overflow-hidden">
                <img
                  src={item.image || '/images/product/placeholder.jpg'}
                  alt={item.name}
                  className="w-full h-96 lg:h-[500px] object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/product/placeholder.jpg';
                  }}
                />
                {!item.isAvailable && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                    <div className="text-center">
                      <svg className="w-12 h-12 text-white mb-2 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span className="text-white font-bold text-base">Currently Unavailable</span>
                    </div>
                  </div>
                )}

                {/* Floating Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {item.categories && item.categories.length > 0 && (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-xs font-semibold text-indigo-600 dark:text-indigo-400 shadow-sm">
                      {item.categories[0]}
                    </span>
                  )}
                  {item.isAvailable && (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-green-500/90 backdrop-blur-sm text-xs font-semibold text-white shadow-sm">
                      <svg className="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Available
                    </span>
                  )}
                </div>
              </div>

              {/* Details Section */}
              <div className="sm:p-8 lg:p-10">
                <div className="mb-5">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1.5">{item.name}</h1>
                  <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 mb-2">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="font-semibold text-gray-900 dark:text-white">{item.rating?.toFixed(1) || '0.0'}</span>
                    </div>
                    <span className="text-gray-400">•</span>
                    <span>{item.reviews || 0} {item.reviews === 1 ? 'review' : 'reviews'}</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{item.description}</p>
                </div>

                {/* Price Variants / Size Selection */}
                {item.priceVariants && item.priceVariants.length > 0 && (
                  <div className="mb-3">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">
                      Select Size
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {item.priceVariants.map((variant) => (
                        <button
                          key={variant.quantity}
                          onClick={() => orchestrator.selection.variant.set(variant.quantity, variant.price)}
                          className={`p-3 border-2 rounded-lg text-left transition-all duration-200 ${orchestrator.selection.variant.value === variant.quantity
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-400'
                            : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600'
                            } ${!item.isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                          disabled={!item.isAvailable}
                        >
                          <div className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wide mb-0.5">{variant.quantity}</div>
                          <div className="text-base font-bold text-indigo-600 dark:text-indigo-400">₹{variant.price.toFixed(0)}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Total and Add to Cart */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Total Price</span>
                    <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                      ₹{((orchestrator.selection.variant.price || 0) * (orchestrator.selection.cartQuantity > 0 ? orchestrator.selection.cartQuantity : orchestrator.selection.quantity.value)).toFixed(0)}
                    </span>
                  </div>

                  {!isShopOpen && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 dark:border-yellow-400 text-yellow-800 dark:text-yellow-200 p-3 mb-4 rounded-r-lg">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        <p className="font-medium text-xs">We're currently closed. Please try again later.</p>
                      </div>
                    </div>
                  )}

                  {!customer && (
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200 p-3 mb-4 rounded-lg">
                      <div className="flex items-start">
                        <svg className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <p className="text-xs">
                          <Link to="/customer/login" className="underline font-semibold hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors">Login</Link> for a better experience - track orders, save addresses & more!
                        </p>
                      </div>
                    </div>
                  )}

                  {orchestrator.selection.cartQuantity > 0 ? (
                    // Show quantity controls if item is already in cart
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleUpdateQuantity(orchestrator.selection.cartQuantity - 1)}
                        className="w-10 h-10 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 flex items-center justify-center hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all text-gray-700 dark:text-gray-300"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                        </svg>
                      </button>
                      <div className="flex-1 text-center py-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <span className="text-base font-bold text-gray-900 dark:text-white">{orchestrator.selection.cartQuantity}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-1.5">in cart</span>
                      </div>
                      <button
                        onClick={() => handleUpdateQuantity(orchestrator.selection.cartQuantity + 1)}
                        disabled={!item.isAvailable || !isShopOpen}
                        className="w-10 h-10 rounded-lg border-2 border-indigo-600 dark:border-indigo-500 bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center hover:bg-indigo-700 dark:hover:bg-indigo-600 hover:border-indigo-700 dark:hover:bg-indigo-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:border-gray-400 dark:disabled:border-gray-600 disabled:cursor-not-allowed transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    // Show add to cart button if item is not in cart
                    <button
                      onClick={orchestrator.actions.addToCart}
                      disabled={!item.isAvailable || !isShopOpen}
                      className="w-full bg-indigo-600 dark:bg-indigo-500 text-white py-3 rounded-lg font-semibold text-sm hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>Add to Cart</span>
                    </button>
                  )}
                </div>

                {/* You Might Also Like */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">You Might Also Like</h3>
                  <QueryBoundary query={orchestrator.queries.related}>
                    {(related) => (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {related.data.menuItems.filter((i: any) => i._id !== id).slice(0, 6).map((relatedItem: any) => {
                          const lowestPrice = relatedItem.priceVariants && relatedItem.priceVariants.length > 0
                            ? Math.min(...relatedItem.priceVariants.map((v: any) => v.price))
                            : 0;

                          return (
                            <Link
                              key={relatedItem._id}
                              to={`/customer/menu/${relatedItem._id}`}
                              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all duration-200 group"
                            >
                              <div className="relative aspect-square bg-gray-100 dark:bg-gray-700">
                                <img
                                  src={relatedItem.image || '/images/product/placeholder.jpg'}
                                  alt={relatedItem.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/images/product/placeholder.jpg';
                                  }}
                                />
                              </div>
                              <div className="p-3">
                                <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-1 line-clamp-1">
                                  {relatedItem.name}
                                </h4>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <span className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                                      ₹{lowestPrice.toFixed(0)}
                                    </span>
                                    {relatedItem.priceVariants && relatedItem.priceVariants.length > 1 && (
                                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">onwards</span>
                                    )}
                                  </div>
                                  {relatedItem.rating && (
                                    <div className="flex items-center gap-1">
                                      <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                      </svg>
                                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{relatedItem.rating}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </QueryBoundary>
                </div>
              </div>
            </div>
          )}
        </QueryBoundary>
      </div>
    </div>
  );
}
