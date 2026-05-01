import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useCustomerAuth } from '../../context/CustomerAuthContext.tsx';
import Footer from '../../components/common/Footer';

export default function CustomerSignUp() {
  const navigate = useNavigate();
  const { signUp } = useCustomerAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
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

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    // At least 6 characters
    return password.length >= 6;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear error for this field when user types
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Email is optional
    if (formData.email.trim() && !validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
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
      
      // Use phone as email if email is not provided (backend requires email field)
      const emailOrPhone = formData.email.trim() || `${cleanPhone}@tiptop.app`;
      
      const signupData = {
        name: formData.name.trim(), // Send as single name field (backend will split)
        phone: cleanPhone,
        email: emailOrPhone,
        password: formData.password,
        role: 'customer' as const,
      };

      console.log('📝 Sending signup data:', { ...signupData, password: '***' });
      
      const result = await signUp(signupData);

      console.log('📥 Signup result:', result);

      if (result.success) {
        if (result.autoLogin && result.user) {
          console.log('✅ User auto-logged in:', result.user.name);
          
          // Show success message briefly before redirect
          setErrors({});
          
          // Short delay to show success state, then redirect
          setTimeout(() => {
            navigate('/customer/menu', { 
              replace: true,
              state: { 
                message: `Welcome ${result.user?.name?.first}! Your account has been created successfully.` 
              }
            });
          }, 500);
        }
      } else {
        console.error('❌ Signup failed with message:', result.message);
        
        // Map specific error messages to field errors for better UX
        const errorMessage = result.message || 'Registration failed. Please try again.';
        
        if (errorMessage.toLowerCase().includes('phone') && errorMessage.toLowerCase().includes('already')) {
          setErrors({ 
            phone: errorMessage,
            submit: errorMessage 
          });
        } else if (errorMessage.toLowerCase().includes('email') && errorMessage.toLowerCase().includes('already')) {
          setErrors({ 
            email: errorMessage,
            submit: errorMessage 
          });
        } else {
          setErrors({ submit: errorMessage });
        }
      }
    } catch (err: any) {
      console.error('❌ Signup error caught:', err);
      const errorMessage = err.message || 'An error occurred. Please try again.';
      
      // Map specific error messages to field errors
      if (errorMessage.toLowerCase().includes('phone') && errorMessage.toLowerCase().includes('already')) {
        setErrors({ 
          phone: errorMessage,
          submit: errorMessage 
        });
      } else if (errorMessage.toLowerCase().includes('email') && errorMessage.toLowerCase().includes('already')) {
        setErrors({ 
          email: errorMessage,
          submit: errorMessage 
        });
      } else {
        setErrors({ submit: errorMessage });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col font-outfit">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 md:px-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">T</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">TipTop</span>
            </Link>
            <Link 
              to="/customer/login"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-lg space-y-6">
          {/* Logo and Title */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl mb-4">
              <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Create Your Account
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Join us and start ordering delicious food
            </p>
          </div>

          {/* Signup Form */}
          <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700 sm:px-10">
            <form className="space-y-5" onSubmit={handleSubmit}>
              {errors.submit && (
                <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-red-800 dark:text-red-200">{errors.submit}</p>
                  </div>
                </div>
              )}

              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent dark:bg-gray-700 dark:text-white placeholder-gray-400 transition-colors ${
                      errors.name ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="John Doe"
                  />
                </div>
                {errors.name && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.name}</p>}
              </div>

              {/* Email Field (Optional) */}
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                  Email Address <span className="text-gray-400 text-xs normal-case">(Optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent dark:bg-gray-700 dark:text-white placeholder-gray-400 transition-colors ${
                      errors.email ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="you@example.com"
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.email}</p>}
              </div>

              {/* Phone Number */}
              <div>
                <label htmlFor="phone" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d]/g, '');
                      setFormData(prev => ({ ...prev, phone: value }));
                      setErrors(prev => ({ ...prev, phone: '' }));
                    }}
                    className={`block w-full pl-10 pr-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent dark:bg-gray-700 dark:text-white placeholder-gray-400 transition-colors ${
                      errors.phone ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="10-digit phone number"
                    maxLength={10}
                  />
                </div>
                {errors.phone && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.phone}</p>}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-10 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent dark:bg-gray-700 dark:text-white placeholder-gray-400 transition-colors ${
                      errors.password ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="At least 6 characters"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-10 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent dark:bg-gray-700 dark:text-white placeholder-gray-400 transition-colors ${
                      errors.confirmPassword ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Re-enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
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
                  disabled={loading}
                  className="flex w-full justify-center items-center rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating account...
                    </div>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      Create Account
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Terms */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-center text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                By creating an account, you agree to our{' '}
                <Link to="/privacy-policy" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy-policy" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>

          {/* Login Link */}
          <div className="text-center bg-gray-50 dark:bg-gray-800/50 rounded-lg px-6 py-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link
                to="/customer/login"
                className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors inline-flex items-center"
              >
                Sign in
                <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
