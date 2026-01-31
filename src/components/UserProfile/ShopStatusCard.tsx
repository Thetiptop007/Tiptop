import { useState, useEffect } from 'react';
import { toggleShopStatus, getShopStatus, ShopStatus } from '../../services/settings.service';

export default function ShopStatusCard() {
  const [shopStatus, setShopStatus] = useState<ShopStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    fetchShopStatus();
  }, []);

  const fetchShopStatus = async () => {
    try {
      setLoading(true);
      const status = await getShopStatus();
      setShopStatus(status);
    } catch (error) {
      console.error('Error fetching shop status:', error);
      // Set default if fetch fails
      setShopStatus({
        isOpen: true,
        lastUpdatedBy: '',
        lastUpdatedAt: '',
        closureReason: ''
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleShop = async (isOpen: boolean) => {
    if (!isOpen) {
      // Show confirmation dialog for closing
      const reason = prompt('Reason for closing shop (optional):');
      if (reason === null) return; // User cancelled
      
      try {
        setToggling(true);
        const updatedStatus = await toggleShopStatus(false, reason);
        setShopStatus(updatedStatus);
        alert('Shop is now CLOSED');
      } catch (error) {
        console.error('Error closing shop:', error);
        alert('Failed to close shop');
      } finally {
        setToggling(false);
      }
    } else {
      // Open shop directly
      try {
        setToggling(true);
        const updatedStatus = await toggleShopStatus(true, '');
        setShopStatus(updatedStatus);
        alert('Shop is now OPEN');
      } catch (error) {
        console.error('Error opening shop:', error);
        alert('Failed to open shop');
      } finally {
        setToggling(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90 mb-1">
            Shop Status
          </h4>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${shopStatus?.isOpen ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {shopStatus?.isOpen ? 'Accepting orders' : 'Currently closed'}
            </p>
          </div>
          {shopStatus && !shopStatus.isOpen && shopStatus.closureReason && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              {shopStatus.closureReason}
            </p>
          )}
        </div>

        {/* Compact Toggle Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleToggleShop(true)}
            disabled={toggling || shopStatus?.isOpen}
            className={`px-4 py-2 rounded-lg font-medium text-xs transition-all ${
              shopStatus?.isOpen
                ? 'bg-green-600 text-white shadow-sm'
                : 'bg-white text-green-600 hover:bg-green-50 dark:bg-gray-800 dark:text-green-400 dark:hover:bg-gray-700 border border-green-600 dark:border-green-500'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {shopStatus?.isOpen ? '✓ OPEN' : 'OPEN'}
          </button>

          <button
            onClick={() => handleToggleShop(false)}
            disabled={toggling || !shopStatus?.isOpen}
            className={`px-4 py-2 rounded-lg font-medium text-xs transition-all ${
              !shopStatus?.isOpen
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-white text-red-600 hover:bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-gray-700 border border-red-600 dark:border-red-500'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {!shopStatus?.isOpen ? '✓ CLOSED' : 'CLOSE'}
          </button>
        </div>
      </div>
    </div>
  );
}
