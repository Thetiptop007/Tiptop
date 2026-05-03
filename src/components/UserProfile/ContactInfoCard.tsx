import { useState, useEffect } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { getSettings, updateSettings, Settings } from "../../services/settings.service";

export default function ContactInfoCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [formData, setFormData] = useState({
    contactEmail: '',
    contactPhone: '',
    businessAddress: '',
    website: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await getSettings();
      setSettings(data);
      setFormData({
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        businessAddress: data.businessAddress,
        website: data.website,
      });
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateSettings({
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        businessAddress: formData.businessAddress,
        website: formData.website,
      });
      await fetchSettings();
      closeModal();
    } catch (error) {
      console.error('Failed to save contact information:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex items-center justify-center h-48">
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
              Business Information
            </h4>
            <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
              Business contact details that customers will see
            </p>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Contact Email
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {settings?.contactEmail || 'N/A'}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Contact Phone
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {settings?.contactPhone || 'N/A'}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Business Address
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {settings?.businessAddress || 'N/A'}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Website
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {settings?.website || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={openModal}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
          >
            <svg
              className="fill-current"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M13.5775 1.6875C13.8656 1.39687 14.2481 1.23312 14.6475 1.23312C14.8452 1.23312 15.0407 1.272 15.2222 1.34763C15.4038 1.42327 15.5679 1.53423 15.705 1.67437C15.842 1.81451 15.9492 1.98096 16.0212 2.16432C16.0932 2.34768 16.1287 2.54429 16.1256 2.74219C16.1225 2.94009 16.0809 3.13538 16.0031 3.31625L6.99375 17.0306C6.88124 17.2237 6.71749 17.3806 6.52124 17.4856C6.32499 17.5906 6.10312 17.64 5.88062 17.6287L1.84687 17.4562C1.75062 17.4506 1.65749 17.4206 1.57749 17.3687C1.49749 17.3169 1.43312 17.245 1.39062 17.16C1.34812 17.075 1.32874 16.9806 1.33437 16.8856C1.33999 16.7906 1.37062 16.6987 1.42312 16.6194L8.79 3.04875C8.89343 2.85562 9.05437 2.69875 9.24999 2.59781C9.44562 2.49687 9.66687 2.45625 9.88687 2.48187C10.1069 2.50749 10.3137 2.59812 10.4831 2.74125C10.6525 2.88437 10.7769 3.07375 10.8412 3.28594L11.37 5.07375L13.5775 1.6875ZM9.53437 6.05625L9.21937 4.96312L3.50624 15.8719L5.98687 16.0087L14.8237 4.06031L13.1569 2.93625L11.4956 5.4825L11.6925 6.225C11.75 6.44625 11.7419 6.67875 11.6694 6.89625C11.5969 7.11375 11.4631 7.30625 11.2837 7.45125C11.1044 7.59625 10.8869 7.68781 10.6562 7.71625C10.4256 7.74469 10.1906 7.70875 9.97937 7.6125C9.76812 7.51625 9.58874 7.36375 9.46249 7.17187C9.33624 6.98 9.26874 6.75687 9.26874 6.52875V6.37875L9.53437 6.05625Z"
                fill=""
              />
            </svg>
            Edit
          </button>
        </div>
      </div>
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="relative w-full p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit Business Information
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Update business contact information that customers will see in the app.
            </p>
          </div>
          <form className="flex flex-col">
            <div className="px-2 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div className="col-span-2 lg:col-span-1">
                  <Label>Contact Email</Label>
                  <Input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    placeholder="contact@restaurant.com"
                  />
                </div>

                <div className="col-span-2 lg:col-span-1">
                  <Label>Contact Phone</Label>
                  <Input
                    type="text"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    placeholder="1234567890"
                  />
                </div>

                <div className="col-span-2">
                  <Label>Business Address</Label>
                  <Input
                    type="text"
                    name="businessAddress"
                    value={formData.businessAddress}
                    onChange={handleChange}
                    placeholder="123 Restaurant Street, City, Country"
                  />
                </div>

                <div className="col-span-2">
                  <Label>Website</Label>
                  <Input
                    type="text"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="www.restaurant.com"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal} disabled={saving}>
                Close
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
