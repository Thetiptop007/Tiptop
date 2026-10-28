import React, { useState } from 'react';
import { apiRequest } from '../../config/api';

interface CompleteProfileModalProps {
  isOpen: boolean;
  onSuccess: (updatedPhone: string) => void;
  onClose?: () => void;
  userEmail?: string;
  userName?: string;
}

export const CompleteProfileModal: React.FC<CompleteProfileModalProps> = ({
  isOpen,
  onSuccess,
  onClose,
  userName = 'Customer',
}) => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const validatePhone = (val: string) => {
    const clean = val.replace(/[^\d]/g, '');
    return /^[6-9]\d{9}$/.test(clean);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const clean = phone.replace(/[^\d]/g, '');
    if (!clean) {
      setError('Phone number is required.');
      return;
    }

    if (!validatePhone(clean)) {
      setError('Please enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9).');
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest('/auth/customer/me', {
        method: 'PATCH',
        body: JSON.stringify({ phone: clean }),
      });

      const data = await response.json();
      if (response.ok && data.status === 'success') {
        onSuccess(clean);
      } else {
        setError(data.message || 'Failed to save phone number. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Connection error while updating profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700 p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 mb-4 mx-auto sm:mx-0">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        </div>

        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center sm:text-left">
          Almost There, {userName}!
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center sm:text-left">
          To ensure our delivery partner can reach you and deliver your food hot, please provide your contact number.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
              Mobile Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-gray-500 dark:text-gray-400 font-medium">
                +91
              </span>
              <input
                type="tel"
                maxLength={10}
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ''))}
                placeholder="9876543210"
                disabled={loading}
                className="w-full pl-12 pr-4 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 px-4 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Saving Number...' : 'Save & Continue'}
            </button>
            {onClose && (
              <button
                type="button"
                disabled={loading}
                onClick={onClose}
                className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg transition-colors"
              >
                Skip for Now
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfileModal;
