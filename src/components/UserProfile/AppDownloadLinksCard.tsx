import { useState, useEffect } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { getSettings, updateSettings, Settings } from "../../services/settings.service";

export default function AppDownloadLinksCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [formData, setFormData] = useState({
    apkDownloadUrl: '',
    indusAppStoreUrl: '',
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
        apkDownloadUrl: data.apkDownloadUrl || '',
        indusAppStoreUrl: data.indusAppStoreUrl || '',
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
      await updateSettings(formData);
      await fetchSettings();
      closeModal();
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save download links. Please try again.');
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
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-6">
              App Download Links
            </h4>

            <div className="grid grid-cols-1 gap-4 lg:gap-6">
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  APK Download URL
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90 break-all">
                  {settings?.apkDownloadUrl || 'Not configured'}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Indus AppStore URL
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90 break-all">
                  {settings?.indusAppStoreUrl || 'Not configured'}
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
                fillRule="evenodd"
                clipRule="evenodd"
                d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
                fill=""
              />
            </svg>
            Edit
          </button>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit App Download Links
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Configure download links for your mobile application. These links will be displayed on the landing page.
            </p>
          </div>
          <form className="flex flex-col">
            <div className="flex flex-col gap-6 px-2 lg:gap-7">
              <div>
                <Label htmlFor="apkDownloadUrl" className="mb-3 block">
                  APK Download URL
                </Label>
                <Input
                  id="apkDownloadUrl"
                  name="apkDownloadUrl"
                  type="url"
                  value={formData.apkDownloadUrl}
                  onChange={handleChange}
                  placeholder="https://drive.google.com/file/d/your-file-id/view"
                  className="dark:border-gray-700"
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Provide a Google Drive link or direct APK download URL
                </p>
              </div>

              <div>
                <Label htmlFor="indusAppStoreUrl" className="mb-3 block">
                  Indus AppStore URL
                </Label>
                <Input
                  id="indusAppStoreUrl"
                  name="indusAppStoreUrl"
                  type="url"
                  value={formData.indusAppStoreUrl}
                  onChange={handleChange}
                  placeholder="https://indusappstore.com/app/your-app-id"
                  className="dark:border-gray-700"
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Link to your app on Indus AppStore
                </p>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-end gap-3 px-2 lg:mt-10">
              <Button
                onClick={closeModal}
                variant="outline"
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>

          <button
            type="button"
            onClick={closeModal}
            className="absolute right-4 top-4 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 lg:right-11 lg:top-11"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </Modal>
    </>
  );
}
