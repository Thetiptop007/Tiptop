import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { useCustomerAuthActions } from '../../hooks/useCustomerAuthActions';
import GridShape from '../../components/common/GridShape';
import ThemeTogglerTwo from '../../components/common/ThemeTogglerTwo';
import { usePublicBootstrap } from '../../hooks/useAppDataQueries';
import GoogleAuthButton from '../../components/auth/GoogleAuthButton';
import ForgotPasswordModal from '../../components/auth/ForgotPasswordModal';
import CompleteProfileModal from '../../components/auth/CompleteProfileModal';

export default function CustomerLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, googleLogin, isLoading: authLoading } = useCustomerAuthActions();
  const { settings } = usePublicBootstrap();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [showCompleteProfileModal, setShowCompleteProfileModal] = useState(false);
  const [pendingUser, setPendingUser] = useState<any>(null);

  // Get redirect path from location state (for redirecting after login)
  const from = (location.state as any)?.from?.pathname || '/customer/menu';

  const validateEmail = (val: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(val.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: { [key: string]: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
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
      const result = await login(email.trim().toLowerCase(), password);

      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setErrors({ submit: result.message || 'Login failed. Please check your credentials.' });
      }
    } catch (err: any) {
      console.error('Login error:', err);
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

  const handleGoogleSuccess = async (credential: string) => {
    setLoading(true);
    setErrors({});
    try {
      const result = await googleLogin(credential);
      if (result.success && result.user) {
        const hasPhone = Boolean(
          typeof result.user.phone === 'string'
            ? result.user.phone
            : result.user.phone?.number
        );

        if (!hasPhone || (result.user as any).isProfileComplete === false) {
          setPendingUser(result.user);
          setShowCompleteProfileModal(true);
        } else {
          navigate(from, { replace: true });
        }
      } else {
        setErrors({ submit: result.message || 'Google login failed. Please try again.' });
      }
    } catch (err: any) {
      console.error('Google login error:', err);
      setErrors({ submit: err?.message || 'Google authentication encountered an error.' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = (errorMessage: string) => {
    setErrors({ submit: errorMessage });
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
                  Login with your email to order your favorite food
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
                    {/* Email Address */}
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setErrors(prev => ({ ...prev, email: '' }));
                        }}
                        placeholder="yourname@gmail.com"
                        disabled={loading}
                        className={`w-full px-4 py-2.5 text-sm transition-colors bg-transparent border rounded-lg outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-brand-500 dark:focus:border-brand-500 disabled:cursor-not-allowed disabled:opacity-50 dark:text-white ${
                          errors.email ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                        }`}
                      />
                      {errors.email && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.email}</p>}
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

                    {/* Forgot Password */}
                    <div className="flex items-center justify-end">
                      <div className="text-sm">
                        <button
                          type="button"
                          onClick={() => setShowForgotPasswordModal(true)}
                          className="font-medium text-burgundy hover:text-burgundy-600 transition-colors"
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
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white transition-colors bg-burgundy border border-transparent rounded-lg shadow-sm w-full hover:bg-burgundy-600 focus:outline-none focus:ring-2 focus:ring-burgundy focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:focus:ring-offset-gray-900"
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
                          'Sign In'
                        )}
                      </button>
                    </div>
                  </div>
                </form>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 text-gray-500 bg-white dark:bg-gray-900 dark:text-gray-400">
                      Or continue with
                    </span>
                  </div>
                </div>

                {/* Google Sign In - Full width matching Sign In button */}
                <div className="w-full">
                  <GoogleAuthButton
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    text="signin_with"
                    disabled={loading || authLoading}
                  />
                </div>

                {/* Sign Up Link */}
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Don't have an account?{' '}
                    <Link
                      to="/customer/signup"
                      className="font-medium text-burgundy hover:text-burgundy-600 transition-colors"
                    >
                      Sign up
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Branding/Image */}
        <div className="relative items-center justify-center flex-1 hidden p-8 z-1 bg-brand-950 dark:bg-white/5 lg:flex">
          <div className="flex flex-col items-center max-w-xs">
            <Link to="/" className="block mb-4">
              <img
                src="/logo-full.png"
                alt={settings?.siteName || 'TipTop'}
                className="w-auto h-12"
              />
            </Link>
            <p className="text-center text-gray-400 dark:text-white/60">
              {settings?.siteDescription || 'Fresh, delicious food delivered hot to your doorstep near LPU.'}
            </p>
          </div>
        </div>

        {/* Theme Toggler */}
        <div className="fixed bottom-6 right-6 z-50">
          <ThemeTogglerTwo />
        </div>
      </div>

      {/* Real Working Forgot Password Modal via Resend */}
      <ForgotPasswordModal
        isOpen={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
        defaultEmail={email}
      />
    </div>
  );
}
