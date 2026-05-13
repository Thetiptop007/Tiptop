import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { useCustomerAuthActions } from '../../hooks/useCustomerAuthActions';
import GridShape from '../../components/common/GridShape';
import ThemeTogglerTwo from '../../components/common/ThemeTogglerTwo';
import { usePublicBootstrap } from '../../hooks/useAppDataQueries';

export default function CustomerLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading: authLoading } = useCustomerAuthActions();
  const { settings } = usePublicBootstrap();
  
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  // Get redirect path from location state (for redirecting after login)
  const from = (location.state as any)?.from?.pathname || '/customer/menu';

  const validatePhone = (phone: string): boolean => {
    // Indian phone number format - starts with 6-9 and has 10 digits
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/[^\d]/g, ''));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: { [key: string]: string } = {};

    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(phone)) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      // Send only 10-digit phone number (backend handles normalization)
      const cleanPhone = phone.replace(/[^\d]/g, '');
      const result = await login(cleanPhone, password);

      if (result.success) {
        // Redirect to the page they were trying to visit or to menu
        navigate(from, { replace: true });
      } else {
        setErrors({ submit: result.message || 'Login failed. Please check your credentials.' });
      }
    } catch (err: any) {
      console.error('Login error:', err);
      // Extract user-friendly error message
      let errorMessage = 'An error occurred. Please try again.';
      
      if (err?.message) {
        errorMessage = err.message;
      } else if (err?.error) {
        errorMessage = typeof err.error === 'string' ? err.error : 'Login failed. Please check your credentials.';
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <div className="relative flex flex-col justify-center w-full h-screen lg:flex-row dark:bg-gray-900 sm:p-0">
        {/* Left Side - Form */}
        <div className="flex flex-col flex-1">
          <div className="w-full max-w-md pt-10 mx-auto">
            <Link
              to="/"
              className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <svg className="size-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to home
            </Link>
          </div>
          <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
            <div>
              <div className="mb-5 sm:mb-8">
                <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                  Sign In to Your Account
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Login to order your favorite food
                </p>
              </div>

              {/* Error Message */}
              {errors.submit && (
                <div className="mb-6 rounded-lg bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-red-800 dark:text-red-200">{errors.submit}</p>
                  </div>
                </div>
              )}

              <div>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-6">
                    {/* Phone Number */}
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        autoComplete="tel"
                        required
                        value={phone}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^\d]/g, '');
                          setPhone(value);
                          setErrors(prev => ({ ...prev, phone: '' }));
                        }}
                        placeholder="10-digit phone number"
                        maxLength={10}
                        disabled={loading}
                        className={`w-full px-4 py-2.5 text-sm transition-colors bg-transparent border rounded-lg outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-brand-500 dark:focus:border-brand-500 disabled:cursor-not-allowed disabled:opacity-50 dark:text-white ${
                          errors.phone ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                        }`}
                      />
                      {errors.phone && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.phone}</p>}
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          required
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            setErrors(prev => ({ ...prev, password: '' }));
                          }}
                          placeholder="Enter your password"
                          disabled={loading}
                          className={`w-full px-4 py-2.5 pr-10 text-sm transition-colors bg-transparent border rounded-lg outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-brand-500 dark:focus:border-brand-500 disabled:cursor-not-allowed disabled:opacity-50 dark:text-white ${
                            errors.password ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                        >
                          {showPassword ? (
                            <svg className="size-5 fill-gray-500 dark:fill-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="size-5 fill-gray-500 dark:fill-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                              <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      {errors.password && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.password}</p>}
                    </div>

                    {/* Remember Me & Forgot Password */}
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <button
                          type="button"
                          onClick={() => setShowForgotPasswordModal(true)}
                          className="font-medium text-[#e36057] hover:text-[#c54e45] transition-colors"
                        >
                          Forgot password?
                        </button>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div>
                      <button
                        type="submit"
                        disabled={loading || authLoading}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white transition-colors bg-brand-500 border border-transparent rounded-lg shadow-sm w-full hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:focus:ring-offset-gray-900"
                      >
                        {loading ? (
                          <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Signing in...
                          </>
                        ) : (
                          'Sign in'
                        )}
                      </button>
                    </div>

                    {/* Divider */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="bg-white dark:bg-gray-900 px-2 text-gray-500 dark:text-gray-400">
                          Or
                        </span>
                      </div>
                    </div>

                    {/* Continue as Guest */}
                    <div>
                      <Link
                        to="/order"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm w-full hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                      >
                        Continue as Guest
                      </Link>
                    </div>
                  </div>
                </form>

                {/* Sign Up Link */}
                <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                  Don't have an account?{' '}
                  <Link
                    to="/customer/signup"
                    className="font-medium text-brand-500 hover:text-brand-600 transition-colors"
                  >
                    Sign up now
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Branding */}
        <div className="items-center hidden w-full h-full lg:w-1/2 bg-brand-950 dark:bg-white/5 lg:grid">
          <div className="relative flex items-center justify-center z-1">
            <GridShape />
            <div className="flex flex-col items-center max-w-xs">
              <Link to="/" className="block mb-4">
                <img
                  width={231}
                  height={48}
                  src="/logo-full.png"
                  alt="Logo"
                />
              </Link>
              <p className="text-center text-gray-400 dark:text-white/60">
                Order delicious food from The Tip Top Restaurant
              </p>
            </div>
          </div>
        </div>

        {/* Theme Toggler */}
        <div className="fixed z-50 hidden bottom-6 right-6 sm:block">
          <ThemeTogglerTwo />
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Forgot Password?
              </h3>
              <button
                onClick={() => setShowForgotPasswordModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-brand-100 dark:bg-brand-900/30">
                <svg className="size-8 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>

              <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
                Password reset is not available at the moment. Please contact our support team for assistance.
              </p>

              {/* Contact Information */}
              {settings?.contactPhone && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 text-center">
                    Contact Support
                  </p>
                  <a
                    href={`tel:${settings.contactPhone}`}
                    className="flex items-center justify-center gap-2 text-lg font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
                  >
                    <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {settings.contactPhone}
                  </a>
                </div>
              )}

              {/* Alternative Options */}
              <div className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-3">
                  Or continue with:
                </p>
                
                <Link
                  to="/order"
                  onClick={() => setShowForgotPasswordModal(false)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white transition-colors bg-brand-500 border border-transparent rounded-lg shadow-sm w-full hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  Order as Guest
                </Link>

                <Link
                  to="/customer/signup"
                  onClick={() => setShowForgotPasswordModal(false)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm w-full hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Create New Account
                </Link>
              </div>
            </div>

            <button
              onClick={() => setShowForgotPasswordModal(false)}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
