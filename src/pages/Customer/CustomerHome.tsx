import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPopularItems, MenuItem } from '../../services/customer-web.service';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { useShopStatus } from '../../context/ShopStatusContext';

export default function CustomerHome() {
  const { customer } = useCustomerAuth();
  const { shopStatus } = useShopStatus();
  
  const [favoriteItems, setFavoriteItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch popular/frequently ordered items
        const items = await getPopularItems(10);
        setFavoriteItems(items);
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Header with Background */}
      <div className="relative h-72 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
          alt="Restaurant"
          className="absolute w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="relative h-full flex items-center">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Welcome to TipTop Restaurant
              </h1>
              <p className="text-lg text-white/90">
                {customer ? `Hello, ${customer.name || customer.email.address}! ` : ''}
                Delicious food delivered to your doorstep
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Shop Status Banner */}
        {shopStatus && !shopStatus.isOpen && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-900/10">
            <p className="text-sm font-medium text-red-700 dark:text-red-400">
              ⏰ We're currently closed
            </p>
            {shopStatus.message && (
              <p className="text-xs text-red-600 dark:text-red-300 mt-1">{shopStatus.message}</p>
            )}
          </div>
        )}

        {/* Section Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Your Favorites
            </h2>
            {favoriteItems.length > 0 && (
              <Link
                to="/customer/menu"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                See All Menu
              </Link>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
                <div className="flex">
                  <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                  <div className="flex-1 p-4 space-y-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : favoriteItems.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-12 text-center">
            <div className="text-gray-500 dark:text-gray-400">
              <svg
                className="mx-auto h-16 w-16 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <p className="text-lg font-medium mb-2">No order history yet</p>
              <p className="text-sm mb-6">
                Start exploring our delicious menu and place your first order!
              </p>
              <Link
                to="/customer/menu"
                className="inline-block bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                Explore Menu
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {favoriteItems.map((item) => {
              const minPrice = item.priceVariants && item.priceVariants.length > 0
                ? Math.min(...item.priceVariants.map(v => v.price))
                : 0;
              
              // Check availability - default to true if not specified
              const isAvailable = item.isAvailable !== false;

              return (
                <Link
                  key={item._id}
                  to={`/customer/menu/${item._id}`}
                  className="group rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden hover:border-indigo-500 hover:shadow-md transition-all"
                >
                  <div className="flex">
                    {/* Image Section */}
                    <div className="relative w-32 h-32 flex-shrink-0 bg-gray-100 dark:bg-gray-800">
                      <img
                        src={item.image || '/images/product/placeholder.jpg'}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/product/placeholder.jpg';
                        }}
                      />
                      {!isAvailable && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white font-bold text-xs">Unavailable</span>
                        </div>
                      )}
                      {/* Price Badge */}
                      {isAvailable && minPrice > 0 && (
                        <div className="absolute bottom-2 right-2 bg-indigo-600 text-white px-2 py-1 rounded text-xs font-bold">
                          ₹{minPrice.toFixed(0)}
                          {item.priceVariants && item.priceVariants.length > 1 && '+'}
                        </div>
                      )}
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1">
                          {item.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                          {item.description || 'Delicious dish made with fresh ingredients'}
                        </p>
                      </div>
                      {item.rating && item.rating > 0 ? (
                        <div className="flex items-center gap-1 text-xs">
                          <svg
                            className="w-3.5 h-3.5 text-yellow-400 fill-current"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-gray-700 dark:text-gray-300 font-medium">
                            {item.rating.toFixed(1)}
                          </span>
                          {item.reviews && item.reviews > 0 && (
                            <span className="text-gray-500 dark:text-gray-400">
                              ({item.reviews})
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          New item
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
