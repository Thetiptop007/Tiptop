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
      // Update URL parameter to select Offer category
      setSearchParams({ category: 'Offer' });
      // Scroll to menu items
      setTimeout(() => {
        const menuSection = document.querySelector('[data-menu-section]');
        if (menuSection) {
          menuSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      // Navigate to customer menu with Offer category pre-selected
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata'
    });
  };

  if (loading) {
    return null; // Don't show skeleton to avoid layout shift
  }

  // Combine active and teaser offers
  const allOffers = [...activeOffers, ...teaserOffers];

  if (allOffers.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 space-y-4">
      {allOffers.map((offer) => {
        const isTeaser = teaserOffers.some(t => t._id === offer._id);
        const isNewLaunch = offer.discountValue === 0;

        return (
          <div
            key={offer._id}
            className={`relative rounded-2xl overflow-hidden shadow-lg transform transition-all duration-300 hover:scale-[1.02] ${
              isTeaser
                ? 'bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500'
                : isNewLaunch
                ? 'bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500'
                : 'bg-gradient-to-r from-orange-600 via-red-500 to-pink-500'
            }`}
          >
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.5),transparent)]" />
              <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20" />
            </div>

            <div className="relative p-5 md:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {/* Offer Badge with Animation */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="text-3xl animate-bounce">
                      {isTeaser ? '🎯' : isNewLaunch ? '🎉' : '🔥'}
                    </span>
                    <span className="text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-full bg-white/30 backdrop-blur-sm text-white shadow-lg border border-white/40">
                      {isTeaser ? '✨ Coming Soon' : isNewLaunch ? '🌟 New Launch' : '⚡ Limited Time'}
                    </span>
                  </div>

                  {/* Offer Title */}
                  <h3 className="text-xl md:text-2xl font-black text-white mb-2 drop-shadow-lg leading-tight">
                    {offer.name}
                  </h3>

                  {/* Offer Description */}
                  <p className="text-sm md:text-base text-white/95 mb-3 leading-relaxed font-medium drop-shadow">
                    {isTeaser && offer.teaserMessage
                      ? offer.teaserMessage
                      : offer.description}
                  </p>

                  {/* CTA / Instructions */}
                  {(isTeaser || isNewLaunch) && (
                    <button
                      onClick={handleOfferClick}
                      className="inline-flex items-center gap-2 bg-white/30 backdrop-blur-md rounded-xl px-4 py-2.5 mb-3 border border-white/40 hover:bg-white/40 transition-all duration-200 cursor-pointer group"
                    >
                      <svg
                        className="w-5 h-5 text-white group-hover:scale-110 transition-transform"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-sm font-bold text-white">
                        {isTeaser 
                          ? "📍 Browse 'Offer' category when live - Click here!" 
                          : "👉 Click to view all items in 'Offer' category"}
                      </span>
                      <svg
                        className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  )}

                  {/* Discount Info - Enhanced */}
                  {!isTeaser && !isNewLaunch && (
                    <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-md rounded-xl px-4 py-2.5 mb-3 border border-white/30">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl md:text-3xl font-black text-white drop-shadow-lg">
                          {offer.discountType === 'fixed'
                            ? `₹${offer.discountValue}`
                            : `${offer.discountValue}%`}
                        </span>
                        <span className="text-sm font-bold text-white/90">OFF</span>
                      </div>
                      {offer.minOrderAmount > 0 && (
                        <span className="text-xs text-white/80 font-medium">
                          on orders ₹{offer.minOrderAmount}+
                        </span>
                      )}
                    </div>
                  )}

                  {/* Date Info - Enhanced */}
                  <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-lg px-3 py-1.5 border border-white/30">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-xs md:text-sm font-bold text-white">
                      {isTeaser
                        ? `Starts ${formatDate(offer.startDate)}`
                        : `Valid till ${formatDate(offer.endDate)}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-shimmer" style={{ animationDuration: '3s' }} />
          </div>
        );
      })}
      
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(200%) skewX(-12deg); }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
      `}</style>
    </div>
  );
}
