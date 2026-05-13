import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { getActiveOffers, getTeaserOffers, type Offer } from '../../services/offerService';

export default function OfferBanner() {
  const navigate = useNavigate();
  const location = useLocation();
  const [, setSearchParams] = useSearchParams();
  
  const [activeOffers, setActiveOffers] = useState<Offer[]>([]);
  const [teaserOffers, setTeaserOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  const handleOfferClick = () => {
    const isCustomerMenu = location.pathname === '/customer/menu';
    const isGuestOrder = location.pathname === '/guest-order';
    
    if (isCustomerMenu || isGuestOrder) {
      setSearchParams({ category: 'Offer' });
    } else {
      navigate('/customer/menu?category=Offer');
    }
  };

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        setLoading(true);
        const [active, teasers] = await Promise.all([
          getActiveOffers(),
          getTeaserOffers(),
        ]);
        setActiveOffers(active);
        setTeaserOffers(teasers);
      } catch (error) {
        console.error('Error fetching offers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, []);

  if (loading || (activeOffers.length === 0 && teaserOffers.length === 0)) {
    return null;
  }

  const allOffers = [...activeOffers, ...teaserOffers];

  return (
    <div className="space-y-3">
      {allOffers.map((offer) => {
        const isTeaser = teaserOffers.some(t => t._id === offer._id);
        return (
          <div
            key={offer._id}
            onClick={handleOfferClick}
            className={`p-4 rounded border flex items-center justify-between cursor-pointer transition-all ${
              isTeaser ? 'bg-purple-50 border-purple-200' : 'bg-red-50 border-red-100'
            }`}
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-red-600">
                  {isTeaser ? 'Coming Soon' : 'Special Offer'}
                </span>
              </div>
              <h3 className="font-bold text-sm text-gray-900">{offer.name}</h3>
              <p className="text-xs text-gray-500 mt-1">{offer.description}</p>
            </div>
            {!isTeaser && offer.discountValue > 0 && (
              <div className="text-right">
                <p className="text-lg font-bold text-red-600">
                  {offer.discountType === 'fixed' ? `₹${offer.discountValue}` : `${offer.discountValue}%`} OFF
                </p>
                <p className="text-[10px] text-gray-400 font-bold">LIMITED TIME</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
