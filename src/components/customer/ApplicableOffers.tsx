import { useState, useEffect } from 'react';
import { checkApplicableOffers, type Offer } from '../../services/offerService';

interface ApplicableOffersProps {
  cartItems: Array<{
    menuItemId: string;
    quantity: number;
    price: number;
  }>;
  orderAmount: number;
}

export default function ApplicableOffers({ cartItems, orderAmount }: ApplicableOffersProps) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<string | null>(null);

  useEffect(() => {
    const fetchApplicableOffers = async () => {
      if (cartItems.length === 0) {
        setOffers([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const applicableOffers = await checkApplicableOffers({
          items: cartItems.map(item => ({
            itemId: item.menuItemId,
            quantity: item.quantity,
            price: item.price
          })),
          totalAmount: orderAmount
        });
        setOffers(applicableOffers);
        
        // Auto-select the first offer if available
        if (applicableOffers.length > 0 && !selectedOffer) {
          setSelectedOffer(applicableOffers[0]._id);
        }
      } catch (error) {
        console.error('Error fetching applicable offers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplicableOffers();
  }, [cartItems, orderAmount]);

  if (loading || offers.length === 0) {
    return null;
  }

  const calculateDiscount = (offer: Offer): number => {
    if (offer.discountValue === 0) return 0;
    
    if (offer.discountType === 'fixed') {
      return Math.min(offer.discountValue, offer.maxDiscountCap || offer.discountValue);
    } else {
      const discountAmount = (orderAmount * offer.discountValue) / 100;
      return Math.min(discountAmount, offer.maxDiscountCap || discountAmount);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <svg
          className="w-5 h-5 text-green-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
          {offers.length === 1 ? 'Available Offer' : `${offers.length} Offers Available`}
        </h3>
      </div>

      <div className="space-y-2">
        {offers.map((offer) => {
          const discount = calculateDiscount(offer);
          const isSelected = selectedOffer === offer._id;
          const isNewLaunch = offer.discountValue === 0;

          return (
            <button
              key={offer._id}
              onClick={() => setSelectedOffer(isSelected ? null : offer._id)}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                isSelected
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700'
              }`}
            >
              <div className="flex items-start gap-2">
                <div className={`flex-shrink-0 mt-0.5 w-4 h-4 rounded border ${
                  isSelected
                    ? 'border-green-500 bg-green-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`}>
                  {isSelected && (
                    <svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">
                      {isNewLaunch ? '🎉' : '🔥'}
                    </span>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {offer.name}
                    </h4>
                  </div>

                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {offer.description}
                  </p>

                  {isNewLaunch ? (
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium text-green-600 dark:text-green-400">
                        ✨ You're getting special new items!
                      </span>
                    </div>
                  ) : discount > 0 ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-green-600 dark:text-green-400">
                        You Save: ₹{discount.toFixed(0)}
                      </span>
                      {offer.maxDiscountCap && discount >= offer.maxDiscountCap && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          (Max discount reached)
                        </span>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selectedOffer && offers.find(o => o._id === selectedOffer)?.discountValue !== 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-green-600 dark:text-green-400 font-medium">
              🎊 Offer Applied
            </span>
            <span className="text-green-600 dark:text-green-400 font-bold">
              -₹{calculateDiscount(offers.find(o => o._id === selectedOffer)!).toFixed(0)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
