import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getMenuItems, getCategories, MenuItem } from '../../services/customer-web.service';
import { useDebounceSearch } from '../../hooks/useDebounceSearch';
import { useShopStatus } from '../../context/ShopStatusContext';

export default function CustomerMenu() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { shopStatus } = useShopStatus();
  const isShopOpen = shopStatus?.isOpen ?? true;
  
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const selectedCategory = searchParams.get('category') || 'All';
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const { debouncedValue: debouncedSearchTerm } = useDebounceSearch(searchTerm, {
    delay: 300, // Faster response (was 500ms by default)
    minLength: 0, // Allow searching even with 1 character (was 2 by default)
  });

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      const cats = await getCategories();
      setCategories(['All', ...cats]);
    };
    fetchCategories();
  }, []);

  // Fetch menu items when filters change
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        setLoading(true);
        console.log('🔍 Fetching menu with search:', debouncedSearchTerm);
        const response = await getMenuItems({
          page: currentPage,
          limit: 12,
          category: selectedCategory !== 'All' ? selectedCategory : undefined,
          search: debouncedSearchTerm || undefined,
          sort: '-rating',
          isAvailable: true,
        });
        
        console.log('📦 Menu items response:', response);
        setMenuItems(response.data.menuItems);
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages);
        }
      } catch (error) {
        console.error('Error fetching menu items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, [currentPage, selectedCategory, debouncedSearchTerm]);

  const handleCategoryChange = (category: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (category === 'All') {
      newParams.delete('category');
    } else {
      newParams.set('category', category);
    }
    setSearchParams(newParams);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set('search', value);
    } else {
      newParams.delete('search');
    }
    setSearchParams(newParams);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen pb-20">
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
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pl-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white dark:placeholder:text-gray-500 dark:focus:border-indigo-500"
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
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white"
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
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryChange(category)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 dark:border-gray-700 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Shop Status Banner */}
      {!isShopOpen && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-900/10">
          <p className="text-sm text-red-700 dark:text-red-400">
            ⏰ We're currently closed. You can browse the menu but orders are not accepted.
          </p>
          {shopStatus?.message && <p className="text-xs mt-1 text-red-600 dark:text-red-300">{shopStatus.message}</p>}
        </div>
      )}

      {/* Results Info */}
      <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        {loading ? (
          'Loading...'
        ) : (
          <>
            Showing {menuItems.length} items
            {selectedCategory !== 'All' && ` in ${selectedCategory}`}
            {debouncedSearchTerm && ` matching "${debouncedSearchTerm}"`}
          </>
        )}
      </div>

      {/* Menu Items Grid */}
      {loading ? (
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
      ) : menuItems.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-12 text-center">
          <div className="text-gray-500 dark:text-gray-400">
            <svg
              className="mx-auto h-12 w-12 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-lg font-medium">No menu items found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {menuItems.map((item) => {
            const lowestPrice = item.priceVariants && item.priceVariants.length > 0
              ? Math.min(...item.priceVariants.map(v => v.price))
              : 0;
            const hasMultipleVariants = item.priceVariants.length > 1;

            return (
              <Link
                key={item._id}
                to={`/customer/menu/${item._id}`}
                className="group relative rounded-xl border border-gray-200 bg-white overflow-hidden hover:border-indigo-500 hover:shadow-md transition-all dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-indigo-500"
              >
                {/* Image Section */}
                <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <img
                    src={item.image || '/images/product/placeholder.jpg'}
                    alt={item.name}
                    className="h-full w-full object-cover"
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
                  {/* Name */}
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white/90 mb-1 line-clamp-2">
                    {item.name}
                  </h3>
                  
                  {/* Variants Info */}
                  {item.priceVariants && item.priceVariants.length > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-1">
                      {item.priceVariants.map((variant, index) => (
                        <span key={variant.quantity}>
                          {variant.quantity}
                          {index < item.priceVariants.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </p>
                  )}

                  {/* Price and Rating */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-baseline">
                      <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
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
      )}

      {/* Pagination */}
      {!loading && menuItems.length > 0 && totalPages > 1 && (
        <div className="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
          {/* Page Info */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Page {currentPage} of {totalPages}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center gap-2">
            {/* Previous Button */}
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                currentPage === 1
                  ? "cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              Previous
            </button>

            {/* Page Numbers */}
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                const showPage =
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1);

                const showEllipsis =
                  (page === currentPage - 2 && currentPage > 3) ||
                  (page === currentPage + 2 && currentPage < totalPages - 2);

                if (showEllipsis) {
                  return (
                    <span
                      key={page}
                      className="px-3 py-2 text-sm text-gray-400 dark:text-gray-600"
                    >
                      ...
                    </span>
                  );
                }

                if (!showPage) return null;

                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      currentPage === page
                        ? "bg-indigo-600 text-white dark:bg-indigo-500"
                        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            {/* Next Button */}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                currentPage === totalPages
                  ? "cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
