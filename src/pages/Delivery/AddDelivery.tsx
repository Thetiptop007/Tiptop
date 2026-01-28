import { useState } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { apiRequest, parseApiResponse } from "../../config/api";

interface DeliveryFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  vehicleType: string;
  vehicleNumber: string;
}

export default function AddDelivery() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [formData, setFormData] = useState<DeliveryFormData>({
    name: "",
    email: "",
    phone: "",
    password: "",
    vehicleType: "",
    vehicleNumber: "",
  });

  const vehicleTypes = ["Bike", "Scooter", "Car"];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password
    if (!formData.password || formData.password.length < 6) {
      showNotification('Password must be at least 6 characters long', 'error');
      return;
    }
    
    try {
      setLoading(true);
      
      // Prepare data for backend
      const requestData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        vehicleType: formData.vehicleType.toLowerCase(), // Backend expects lowercase
      };
      
      const response = await apiRequest('delivery/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      const data = await parseApiResponse(response);
      
      if (data.status === 'success') {
        showNotification('Delivery partner registered successfully!', 'success');
        // Wait a moment to show success message, then navigate
        setTimeout(() => {
          navigate('/admin/delivery');
        }, 1500);
      } else {
        showNotification(data.message || 'Failed to register delivery partner', 'error');
      }
    } catch (error: any) {
      console.error('Error registering delivery partner:', error);
      showNotification(error.message || 'Failed to register delivery partner', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/admin/delivery");
  };

  return (
    <>
      <PageMeta
        title="Add Delivery Agent | Admin Dashboard"
        description="Add a new delivery agent"
      />
      <PageBreadcrumb pageTitle="Add Delivery Agent" />
      
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-[100000] rounded-lg px-4 py-3 shadow-lg ${
          notification.type === 'success'
            ? 'bg-green-500 text-white'
            : 'bg-red-500 text-white'
        }`}>
          {notification.message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Form Section - Left Side (2/3 width) */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit}>
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              {/* Personal Information */}
              <div className="border-b border-gray-200 p-6 dark:border-gray-800">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
                  Personal Information
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Enter the basic details of the delivery agent
                </p>
              </div>

              <div className="p-6 space-y-6">
                {/* Full Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                    placeholder="e.g., John Doe"
                  />
                </div>

                {/* Email and Phone */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                      placeholder="+1 234-567-8900"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                    placeholder="Minimum 6 characters"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    This will be the delivery partner's login password
                  </p>
                </div>

                {/* Vehicle Information */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                    Vehicle Information
                  </h3>
                  {/* Vehicle Type and Number */}
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="vehicleType"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Vehicle Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="vehicleType"
                        name="vehicleType"
                        required
                        value={formData.vehicleType}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                      >
                        <option value="">Select vehicle type</option>
                        {vehicleTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="vehicleNumber"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Vehicle Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="vehicleNumber"
                        name="vehicleNumber"
                        required
                        value={formData.vehicleNumber}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                        placeholder="e.g., BK-1234"
                      />
                    </div>
                  </div>
                </div>
              </div>
                
              {/* Form Actions */}
              <div className="border-t border-gray-200 p-6 dark:border-gray-800">
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Registering...</span>
                      </>
                    ) : (
                      'Add Delivery Agent'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Preview Section - Right Side (1/3 width) */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="border-b border-gray-200 p-4 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Preview
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Agent card preview
              </p>
            </div>

            <div className="p-4">
              {/* Preview Card */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
                {/* Profile */}
                <div className="mb-4">
                  <div className="h-16 w-16 mb-3 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-2xl font-semibold">
                    {formData.name ? formData.name.charAt(0).toUpperCase() : '?'}
                  </div>
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                    {formData.name || "Agent Name"}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formData.email || "email@example.com"}
                  </p>
                </div>

                {/* Contact Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>{formData.phone || "Phone number"}</span>
                  </div>
                  
                  {formData.vehicleType && (
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                      <span>{formData.vehicleType}{formData.vehicleNumber && ` - ${formData.vehicleNumber}`}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
