import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useCustomerAuthActions } from '../../hooks/useCustomerAuthActions';
import GridShape from '../../components/common/GridShape';
import ThemeTogglerTwo from '../../components/common/ThemeTogglerTwo';

export default function CustomerSignUp() {
  const navigate = useNavigate();
  const { signUp, isLoading: authLoading } = useCustomerAuthActions();
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/[^\d]/g, ''));
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const cleanPhone = formData.phone.replace(/[^\d]/g, '');
      const emailOrPhone = `${cleanPhone}@tiptop.app`;
      
      const signupData = {
        name: formData.name.trim(),
        phone: cleanPhone,
        email: emailOrPhone, // Use fallback email since field is removed
        password: formData.password,
      };
      
      const result = await signUp(signupData);
      const { success, user, message } = result;

      if (success && user) {
          setErrors({});
          setTimeout(() => {
            navigate('/customer/menu', { 
              replace: true,
              state: { 
                message: `Welcome ${user.name.first}! Your account has been created successfully.` 
              }
            });
          }, 500);
      } else {
        const errorMessage = message || 'Registration failed. Please try again.';
        if (errorMessage.toLowerCase().includes('phone') && errorMessage.toLowerCase().includes('already')) {
          setErrors({ phone: errorMessage, submit: errorMessage });
        } else {
          setErrors({ submit: errorMessage });
        }
      }
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred. Please try again.';
      if (errorMessage.toLowerCase().includes('phone') && errorMessage.toLowerCase().includes('already')) {
        setErrors({ phone: errorMessage, submit: errorMessage });
      } else {
        setErrors({ submit: errorMessage });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative bg-white z-1 dark:bg-gray-900 overflow-hidden">
      <div className="relative flex flex-col w-full h-screen lg:flex-row dark:bg-gray-900">
        {/* Left Side - Form */}
        <div className="flex flex-col flex-1 overflow-y-auto">
          <div className="w-full max-w-md pt-10 mx-auto px-6 lg:px-0">
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
          <div className="flex flex-col justify-center flex-1 w-full max-w-md py-12 mx-auto px-6 lg:px-0">
            <div>
              <div className="mb-5 sm:mb-8">
                <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                  Create Your Account
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Join us to order delicious food and track your history
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
                  <div className="space-y-5">
                    {/* Full Name */}
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        name="name"
                        placeholder="John Doe"
                        disabled={loading}
                        className={`w-full px-4 py-2.5 text-sm transition-colors bg-transparent border rounded-lg outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-brand-500 dark:focus:border-brand-500 disabled:cursor-not-allowed disabled:opacity-50 dark:text-white ${
                          errors.name ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                        }`}
                      />
                      {errors.name && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.name}</p>}
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^\d]/g, '');
                          setFormData(prev => ({ ...prev, phone: value }));
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
                          required
                          value={formData.password}
                          onChange={handleChange}
                          name="password"
                          placeholder="At least 6 characters"
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

                    {/* Confirm Password */}
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Confirm Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          name="confirmPassword"
                          placeholder="Re-enter your password"
                          disabled={loading}
                          className={`w-full px-4 py-2.5 pr-10 text-sm transition-colors bg-transparent border rounded-lg outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-brand-500 dark:focus:border-brand-500 disabled:cursor-not-allowed disabled:opacity-50 dark:text-white ${
                            errors.confirmPassword ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                        >
                          {showConfirmPassword ? (
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
                      {errors.confirmPassword && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.confirmPassword}</p>}
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
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
                            Creating account...
                          </>
                        ) : (
                          'Create Account'
                        )}
                      </button>
                    </div>

                    {/* Sign In Link */}
                    <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                      Already have an account?{' '}
                      <Link
                        to="/customer/login"
                        className="font-medium text-brand-500 hover:text-brand-600 transition-colors"
                      >
                        Sign in now
                      </Link>
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Branding */}
        <div className="items-center hidden w-full h-full lg:w-1/2 bg-brand-950 dark:bg-white/5 lg:grid relative overflow-hidden">
          <div className="relative flex items-center justify-center z-1 w-full h-full">
            <GridShape />
            <div className="flex flex-col items-center max-w-xs px-6">
              <Link to="/" className="block mb-6">
                <img
                  width={231}
                  height={48}
                  src="/logo-full.png"
                  alt="Logo"
                  className="mx-auto"
                />
              </Link>
              <p className="text-center text-gray-400 dark:text-white/60 text-lg leading-relaxed">
                Join our community and order delicious food from The Tip Top Restaurant
              </p>
            </div>
          </div>
        </div>

        {/* Theme Toggler */}
        <div className="fixed z-50 hidden bottom-6 right-6 sm:block">
          <ThemeTogglerTwo />
        </div>
      </div>
    </div>
  );
}
