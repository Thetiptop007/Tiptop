import { useState, useEffect } from 'react';
import { getSettings, updateSettings, Settings as SettingsType, ShopStatus } from '../services/settings.service';
import { useToggleShopStatusMutation } from '../hooks/useAppDataQueries';

export default function Settings() {
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [notificationEmail, setNotificationEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [shopStatus, setShopStatus] = useState<ShopStatus | null>(null);
  const [togglingShop, setTogglingShop] = useState(false);
  const [closureReason, setClosureReason] = useState('');
  const [showReasonInput, setShowReasonInput] = useState(false);
  const toggleShopStatusMutation = useToggleShopStatusMutation();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await getSettings();
      setSettings(data);
      setShopStatus(data.shopStatus || null);
    } catch (error) {
      console.error('Error fetching settings:', error);
      alert('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleShop = async (isOpen: boolean) => {
    if (!isOpen && !showReasonInput) {
      setShowReasonInput(true);
      return;
    }

    try {
      setTogglingShop(true);
      const updatedStatus = await toggleShopStatusMutation.mutateAsync({
        isOpen,
        closureReason: isOpen ? '' : closureReason,
      });
      setShopStatus(updatedStatus);
      setShowReasonInput(false);
      setClosureReason('');
      alert(`Shop is now ${isOpen ? 'OPEN' : 'CLOSED'}`);
    } catch (error) {
      console.error('Error toggling shop status:', error);
      alert('Failed to update shop status');
    } finally {
      setTogglingShop(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings(prev => prev ? {
      ...prev,
      [name]: value,
    } : null);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => prev ? {
      ...prev,
      [name]: parseFloat(value) || 0,
    } : null);
  };

  const handleAddEmail = () => {
    if (!settings) return;
    
    if (notificationEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notificationEmail)) {
      if (!settings.notificationEmails.includes(notificationEmail)) {
        setSettings({
          ...settings,
          notificationEmails: [...settings.notificationEmails, notificationEmail],
        });
        setNotificationEmail('');
      }
    } else {
      alert('Please enter a valid email address');
    }
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      notificationEmails: settings.notificationEmails.filter(email => email !== emailToRemove),
    });
  };

  const handleSave = async () => {
    if (!settings) return;
    
    try {
      setSaving(true);
      await updateSettings(settings);
      alert('Settings updated successfully!');
      fetchSettings();
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Failed to load settings</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Configure your restaurant and app settings</p>
      </div>

      <div className="space-y-6">
        {/* Shop Status - Open/Closed */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">Shop Status</h2>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {shopStatus?.isOpen ? 'Your shop is currently accepting orders' : 'Your shop is currently closed'}
              </p>
              {shopStatus && !shopStatus.isOpen && shopStatus.closureReason && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  Reason: {shopStatus.closureReason}
                </p>
              )}
              {shopStatus && shopStatus.lastUpdatedAt && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Last updated by {shopStatus.lastUpdatedBy} at {new Date(shopStatus.lastUpdatedAt).toLocaleString()}
                </p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleToggleShop(true)}
                disabled={togglingShop || shopStatus?.isOpen}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  shopStatus?.isOpen
                    ? 'bg-green-500 text-white cursor-default'
                    : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50'
                } disabled:opacity-50`}
              >
                {shopStatus?.isOpen && (
                  <span className="inline-flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    OPEN
                  </span>
                )}
                {!shopStatus?.isOpen && 'OPEN'}
              </button>
              <button
                onClick={() => handleToggleShop(false)}
                disabled={togglingShop || !shopStatus?.isOpen}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  !shopStatus?.isOpen
                    ? 'bg-red-500 text-white cursor-default'
                    : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50'
                } disabled:opacity-50`}
              >
                {!shopStatus?.isOpen && (
                  <span className="inline-flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    CLOSED
                  </span>
                )}
                {shopStatus?.isOpen && 'CLOSE'}
              </button>
            </div>
          </div>
          {showReasonInput && (
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                value={closureReason}
                onChange={(e) => setClosureReason(e.target.value)}
                placeholder="Reason for closure (optional)"
                className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <button
                onClick={() => handleToggleShop(false)}
                disabled={togglingShop}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
              >
                {togglingShop ? 'Closing...' : 'Confirm Close'}
              </button>
              <button
                onClick={() => {
                  setShowReasonInput(false);
                  setClosureReason('');
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* General Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">General Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
                Restaurant Name
              </label>
              <input
                type="text"
                name="siteName"
                value={settings.siteName}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="ThéTipTop"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
                Contact Email
              </label>
              <input
                type="email"
                name="contactEmail"
                value={settings.contactEmail}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="contact@restaurant.com"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                name="contactPhone"
                value={settings.contactPhone}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="+1 234 567 8900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
                Website
              </label>
              <input
                type="text"
                name="website"
                value={settings.website}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="www.restaurant.com"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
                Business Address
              </label>
              <input
                type="text"
                name="businessAddress"
                value={settings.businessAddress}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="123 Restaurant Street, City, Country"
              />
            </div>
          </div>
        </div>

        {/* Admin Profile */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">Admin Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
                First Name
              </label>
              <input
                type="text"
                value={settings.adminProfile.firstName}
                onChange={(e) => setSettings({
                  ...settings,
                  adminProfile: { ...settings.adminProfile, firstName: e.target.value }
                })}
                className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="First Name"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={settings.adminProfile.lastName}
                onChange={(e) => setSettings({
                  ...settings,
                  adminProfile: { ...settings.adminProfile, lastName: e.target.value }
                })}
                className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Last Name"
              />
            </div>

          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">Notification Emails</h2>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
            Add email addresses that will receive order notifications
          </p>
          
          <div className="flex gap-2 mb-3">
            <input
              type="email"
              value={notificationEmail}
              onChange={(e) => setNotificationEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddEmail()}
              className="flex-1 px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="admin@restaurant.com"
            />
            <button
              onClick={handleAddEmail}
              className="px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:shadow-md transition-all text-xs font-medium shadow-sm"
            >
              Add
            </button>
          </div>

          <div className="space-y-2">
            {settings.notificationEmails.map((email, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 px-3 py-2 rounded-lg">
                <span className="text-xs text-gray-700 dark:text-gray-300">{email}</span>
                <button
                  onClick={() => handleRemoveEmail(email)}
                  className="text-red-500 hover:text-red-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            {settings.notificationEmails.length === 0 && (
              <p className="text-gray-400 text-xs italic">No notification emails added</p>
            )}
          </div>
        </div>

        {/* Order & Pricing Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">Order & Pricing Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
                Minimum Order Amount (₹)
              </label>
              <input
                type="number"
                name="minimumOrderAmount"
                value={settings.minimumOrderAmount}
                onChange={handleNumberChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="0.00"
              />
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">Minimum amount required to place an order</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
                Tax Rate (%)
              </label>
              <input
                type="number"
                name="taxRate"
                value={settings.taxRate}
                onChange={handleNumberChange}
                min="0"
                max="100"
                step="0.01"
                className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="0.00"
              />
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">Applied to all orders</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
                Delivery Charge (₹)
              </label>
              <input
                type="number"
                name="deliveryCharge"
                value={settings.deliveryCharge}
                onChange={handleNumberChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="0.00"
              />
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">Standard delivery fee</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
                Discount Amount (₹)
              </label>
              <input
                type="number"
                name="discountAmount"
                value={settings.discountAmount}
                onChange={handleNumberChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="0.00"
              />
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">Discount amount in rupees - only applied in mobile app</p>
            </div>
          </div>
        </div>

        {/* Payment Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">Payment Configuration</h2>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
              UPI ID (for online payments)
            </label>
            <input
              type="text"
              name="upiId"
              value={settings.upiId}
              onChange={handleChange}
              className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="restaurant@upi"
            />
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">UPI ID for collecting online payments</p>
          </div>
        </div>

        {/* App Download Links */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">App Download Links</h2>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
            Configure download links for your mobile app
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
                APK Download URL
              </label>
              <input
                type="url"
                name="apkDownloadUrl"
                value={settings.apkDownloadUrl}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="https://drive.google.com/file/d/your-file-id/view"
              />
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">Google Drive or direct APK download link</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
                Indus AppStore URL
              </label>
              <input
                type="url"
                name="indusAppStoreUrl"
                value={settings.indusAppStoreUrl}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="https://indusappstore.com/app/your-app-id"
              />
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">Link to your app on Indus AppStore</p>
            </div>
          </div>
        </div>

        {/* App Update Notification */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <div className="bg-gradient-to-r from-blue-50 to-white dark:from-blue-900/20 dark:to-transparent px-4 py-3 -mx-4 -mt-4 mb-4 rounded-t-lg border-b border-blue-100 dark:border-blue-800">
            <h2 className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-1.5">
              📱 App Update Notification
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Control app update notifications for mobile users</p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div>
                <h3 className="text-xs font-semibold text-gray-800 dark:text-white">Show Update Banner</h3>
                <p className="text-[10px] text-gray-600 dark:text-gray-400">Display update notification on user's home screen</p>
              </div>
              <button
                type="button"
                onClick={() => setSettings({
                  ...settings,
                  appUpdateAvailable: !settings.appUpdateAvailable
                })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  settings.appUpdateAvailable ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.appUpdateAvailable ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
                Update Message
              </label>
              <textarea
                name="appUpdateMessage"
                value={settings.appUpdateMessage}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter the message to show users..."
              />
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">This message will appear in the update banner</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
                Update URL (App Store/Play Store Link)
              </label>
              <input
                type="url"
                name="appUpdateUrl"
                value={settings.appUpdateUrl}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="https://play.google.com/store/apps/details?id=com.tiptop"
              />
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">Link users will be directed to when they click "Update"</p>
            </div>

            {settings.appUpdateAvailable && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <div className="text-lg">ℹ️</div>
                  <div>
                    <h4 className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-0.5">Preview</h4>
                    <p className="text-[10px] text-blue-800 dark:text-blue-400">
                      {settings.appUpdateMessage || 'Your update message will appear here'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-medium rounded-lg hover:shadow-md transition-all shadow-sm cursor-pointer ${
              saving ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
