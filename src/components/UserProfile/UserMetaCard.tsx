import { useEffect, useState } from "react";
import { useCurrentAdminUserQuery } from "../../hooks/useAppDataQueries";
import { getSettings, Settings } from "../../services/settings.service";

export default function UserMetaCard() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Settings | null>(null);
  const { data: currentUser } = useCurrentAdminUserQuery();

  const getDisplayName = (name: unknown) => {
    if (typeof name === 'string') {
      return name;
    }
    if (name && typeof name === 'object') {
      const typedName = name as { first?: string; last?: string };
      return [typedName.first, typedName.last].filter(Boolean).join(' ');
    }
    return '';
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
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
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
          <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
            <img src="/images/logo/logo-icon.png" alt="user" className="rounded-full" />
          </div>
          <div>
            <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
              {getDisplayName(currentUser?.name) || 'N/A'}
            </h4>
            <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {settings?.businessAddress || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
