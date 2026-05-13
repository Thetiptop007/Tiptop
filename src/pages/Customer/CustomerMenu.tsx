import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCustomerMenuQuery, usePublicBootstrap } from '../../hooks/useAppDataQueries';
import { useShopStatus } from '../../context/ShopStatusContext';
import { QueryBoundary } from '../../components/common/QueryBoundary';
import OfferBanner from '../../components/customer/OfferBanner';

export default function CustomerMenu() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { shopStatus } = useShopStatus();
  const isShopOpen = shopStatus?.isOpen ?? true;
  
  const selectedCategory = searchParams.get('category') || 'All';
  const searchTerm = searchParams.get('search') || '';
  const [page, setPage] = useState(1);

  const { categories = ["All"], isLoading: isBootstrapLoading } = usePublicBootstrap();
  const menuQuery = useCustomerMenuQuery({
    page,
    limit: 12,
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

  return (
    <div className="min-h-screen pb-20 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header Section */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Menu
          </h1>
        
          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            {/* Search Bar */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search for dishes..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pl-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white dark:placeholder:text-gray-500 dark:focus:border-brand-500"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500"
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
            </div>

            {/* Category Dropdown for mobile */}
            <div className="sm:hidden">
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Categories Chips for desktop */}
          <div className="hidden sm:flex flex-wrap gap-2">
            {isBootstrapLoading ? (
              [1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-8 w-20 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" />
              ))
            ) : (
              categories.map((category) => {
                const isOfferCategory = category === 'Offer';
                return (
                  <button
                    key={category}
                    onClick={() => handleCategoryChange(category)}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                      selectedCategory === category
                        ? isOfferCategory
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg scale-105'
                          : 'bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400'
                        : isOfferCategory
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-2 border-green-300 hover:from-green-100 hover:to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 dark:text-green-400 dark:border-green-700'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 dark:border-gray-700 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    {isOfferCategory && '🎁 '}{category}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Offer Banners */}
        <OfferBanner />

        {/* Shop Status Banner */}
        {!isShopOpen && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-900/10">
            <p className="text-sm text-red-700 dark:text-red-400">
              ⏰ We're currently closed. You can browse the menu but orders are not accepted.
            </p>
            {shopStatus?.closureReason && <p className="text-xs mt-1 text-red-600 dark:text-red-300">{shopStatus.closureReason}</p>}
          </div>
        )}

        {/* Results Info */}
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          {menuQuery.isLoading ? (
            'Loading...'
          ) : (
            <>
              Showing {menuQuery.data?.data?.menuItems?.length || 0} items
              {selectedCategory !== 'All' && ` in ${selectedCategory}`}
              {searchTerm && ` matching "${searchTerm}"`}
            </>
          )}
        </div>

        <QueryBoundary 
          query={menuQuery}
          loadingComponent={
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-gray-200 bg-white overflow-hidden dark:border-gray-800 dark:bg-white/[0.03]">
                  <div className="aspect-square bg-gray-200 dark:bg-gray-700 animate-pulse" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse" />
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          }
        >
          {(data) => {
            const menuItems = data.data.menuItems;
            const pagination = data.pagination;

            return (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {menuItems.map((item: any) => {
                    const lowestPrice = item.priceVariants && item.priceVariants.length > 0
                      ? Math.min(...item.priceVariants.map((v: any) => v.price))
                      : item.price;
                    const hasMultipleVariants = item.priceVariants && item.priceVariants.length > 1;

                    return (
                      <Link
                        key={item._id}
                        to={`/customer/menu/${item._id}`}
                        className="group relative rounded-xl border border-gray-200 bg-white overflow-hidden hover:border-brand-500 hover:shadow-md transition-all dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-brand-500"
                      >
                        {/* Image Section */}
                        <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
                          <img
                            src={item.image || '/images/product/placeholder.jpg'}
                            alt={item.name}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/images/product/placeholder.jpg';
                            }}
                          />
                          {!item.isAvailable && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <span className="text-white font-bold text-xs">Out of Stock</span>
                            </div>
                          )}
                        </div>

                        {/* Content Section */}
                        <div className="p-3">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white/90 mb-1 line-clamp-2">
                            {item.name}
                          </h3>
                          
                          {item.priceVariants && item.priceVariants.length > 0 && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-1">
                              {item.priceVariants.map((variant: any, index: number) => (
                                <span key={variant.quantity}>
                                  {variant.quantity}
                                  {index < item.priceVariants.length - 1 ? ', ' : ''}
                                </span>
                              ))}
                            </p>
                          )}

                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-baseline">
                              <span className="text-sm font-bold text-brand-500">
                                ₹{lowestPrice.toFixed(0)}
                              </span>
                              {hasMultipleVariants && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">+</span>
                              )}
                            </div>
                            {item.rating && (
                              <div className="flex items-center gap-0.5">
                                <svg
                                  className="w-3.5 h-3.5 text-yellow-400 fill-current"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <span className="text-xs text-gray-700 dark:text-gray-300">{item.rating.toFixed(1)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="mt-8 flex flex-col items-center justify-between gap-4 sm:flex-row border-t border-gray-100 dark:border-gray-800 pt-6">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={pagination.currentPage === 1}
                        className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          pagination.currentPage === 1
                            ? "cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600"
                            : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        }`}
                      >
                        Previous
                      </button>

                      <div className="flex gap-1">
                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => {
                          const showPage =
                            p === 1 ||
                            p === pagination.totalPages ||
                            (p >= pagination.currentPage - 1 && p <= pagination.currentPage + 1);

                          const showEllipsis =
                            (p === pagination.currentPage - 2 && pagination.currentPage > 3) ||
                            (p === pagination.currentPage + 2 && pagination.currentPage < pagination.totalPages - 2);

                          if (showEllipsis) {
                            return (
                              <span key={p} className="px-3 py-2 text-sm text-gray-400 dark:text-gray-600">
                                ...
                              </span>
                            );
                          }

                          if (!showPage) return null;

                          return (
                            <button
                              key={p}
                              onClick={() => setPage(p)}
                              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                pagination.currentPage === p
                                  ? "bg-brand-500 text-white"
                                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                              }`}
                            >
                              {p}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                        disabled={pagination.currentPage === pagination.totalPages}
                        className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          pagination.currentPage === pagination.totalPages
                            ? "cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600"
                            : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        }`}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            );
          }}
        </QueryBoundary>
      </div>
    </div>
  );
}
