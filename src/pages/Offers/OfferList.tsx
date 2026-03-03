import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";

// Types
interface Offer {
  _id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  discountType: 'fixed' | 'percentage';
  discountValue: number;
  minOrderAmount: number;
  status: 'draft' | 'scheduled' | 'active' | 'ended' | 'deactivated';
  teaserEnabled: boolean;
  teaserStartDate?: string;
  totalOrders: number;
  totalDiscountGiven: number;
  totalRevenue: number;
  bannerImage?: string;
}

const OfferList: React.FC = () => {
  const navigate = useNavigate();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'scheduled' | 'ended'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOffers();
  }, [filter]);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const query = filter !== 'all' ? `?status=${filter}` : '';
      const response = await fetch(`${import.meta.env.VITE_API_URL}/offers/admin${query}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch offers');

      const data = await response.json();
      setOffers(data.data || []);
    } catch (error) {
      console.error('Error fetching offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this offer?')) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/offers/admin/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });

      if (response.ok) {
        fetchOffers();
      }
    } catch (error) {
      console.error('Error deleting offer:', error);
      alert('Failed to delete offer');
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/offers/admin/${id}/deactivate`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });

      if (response.ok) {
        fetchOffers();
      }
    } catch (error) {
      console.error('Error deactivating offer:', error);
      alert('Failed to deactivate offer');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/offers/admin/${id}/duplicate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        navigate(`/admin/offers/edit/${data.data._id}`);
      }
    } catch (error) {
      console.error('Error duplicating offer:', error);
      alert('Failed to duplicate offer');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ended': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'deactivated': return 'bg-red-100 text-red-800 border-red-200';
      case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const filteredOffers = offers.filter(offer =>
    offer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    offer.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <PageMeta title="Offers & Promotions - The Tip Top" description="Manage promotional offers and special menu items" />
      
      <PageBreadcrumb pageTitle="Offers & Promotions" />
      
      <div className="flex items-center justify-end mb-4">
        <Link
          to="/admin/offers/create"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Offer
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow">
        {/* Filters */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Offers
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'active'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilter('scheduled')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'scheduled'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Scheduled
              </button>
              <button
                onClick={() => setFilter('ended')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'ended'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Ended
              </button>
            </div>
            
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search offers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Offers List */}
        <div className="p-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading offers...</p>
            </div>
          ) : filteredOffers.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No offers found</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new offer.</p>
              <div className="mt-6">
                <Link
                  to="/admin/offers/create"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Offer
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOffers.map((offer) => (
                <div
                  key={offer._id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {offer.name}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(offer.status)}`}>
                          {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                        </span>
                        {offer.teaserEnabled && offer.status === 'scheduled' && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                            Teaser Active
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-600 mb-3">{offer.description}</p>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{formatDate(offer.startDate)} - {formatDate(offer.endDate)}</span>
                        </div>
                        
                        <div className="flex items-center gap-1 font-medium text-green-600">
                          {offer.discountValue === 0 
                            ? '🎉 New Launch'
                            : (offer.discountType === 'fixed' 
                              ? `₹${offer.discountValue} OFF` 
                              : `${offer.discountValue}% OFF`)
                          }
                        </div>
                        
                        {offer.totalOrders > 0 && (
                          <div className="flex items-center gap-1">
                            <span>{offer.totalOrders} orders</span>
                            <span>•</span>
                            <span>₹{offer.totalDiscountGiven.toFixed(0)} saved</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex gap-2 ml-4">
                      <Link
                        to={`/admin/offers/edit/${offer._id}`}
                        className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                      >
                        Edit
                      </Link>
                      
                      {(offer.status === 'active' || offer.status === 'scheduled') && (
                        <button
                          onClick={() => handleDeactivate(offer._id)}
                          className="px-3 py-1 text-sm bg-orange-50 text-orange-600 rounded hover:bg-orange-100 transition-colors"
                        >
                          Deactivate
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDuplicate(offer._id)}
                        className="px-3 py-1 text-sm bg-gray-50 text-gray-600 rounded hover:bg-gray-100 transition-colors"
                      >
                        Duplicate
                      </button>
                      
                      <button
                        onClick={() => handleDelete(offer._id)}
                        className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default OfferList;
