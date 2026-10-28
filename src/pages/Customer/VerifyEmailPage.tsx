import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiRequest } from '../../config/api';

export default function VerifyEmailPage() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function verify() {
      if (!token) {
        setStatus('error');
        setMessage('No verification token provided in URL.');
        return;
      }

      try {
        const response = await apiRequest(`/auth/customer/verify-email/${token}`, {
          method: 'GET',
        });
        const data = await response.json();

        if (isMounted) {
          if (response.ok && data.status === 'success') {
            setStatus('success');
            setMessage(data.message || 'Email verified successfully!');
          } else {
            setStatus('error');
            setMessage(data.message || 'Invalid or expired verification token.');
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setStatus('error');
          setMessage(err.message || 'Verification failed. The link might be expired.');
        }
      }
    }

    verify();
    return () => {
      isMounted = false;
    };
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow-sm rounded-xl sm:px-10 border border-gray-200 dark:border-gray-700 text-center">
          {status === 'verifying' && (
            <div>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Verifying your email...</h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Please wait while we confirm your account.</p>
            </div>
          )}

          {status === 'success' && (
            <div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Email Verified!</h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                {message} You can now unlock exclusive promotional discounts and promo codes.
              </p>
              <div className="mt-6">
                <Link
                  to="/customer/menu"
                  className="inline-flex justify-center items-center px-6 py-2.5 rounded-lg bg-brand-500 text-white font-medium text-sm hover:bg-brand-600 transition-colors shadow-sm"
                >
                  Go to Menu
                </Link>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Verification Failed</h2>
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {message}
              </p>
              <div className="mt-6 flex flex-col gap-2">
                <Link
                  to="/customer/menu"
                  className="inline-flex justify-center items-center px-6 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Continue to Menu
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
