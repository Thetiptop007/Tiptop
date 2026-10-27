import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { getSettings, type Settings } from '../../services/settings.service';

const CustomerPrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getSettings();
        setSettings(data);
      } catch (error) {
        console.error('Failed to fetch settings for Privacy Policy:', error);
      }
    };

    fetchSettings();
  }, []);

  const contactEmail = settings?.contactEmail || 'privacy@tiptop.com';

  return (
    <div className="min-h-screen bg-[#F6F5F2] text-neutral-900 font-sans pb-24">
      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/customer/profile')}
            className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-neutral-500 hover:text-black mb-2 transition-colors group"
          >
            <svg className="w-4 h-4 mr-1.5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            Profile
          </button>
          <h1 className="text-3xl font-extrabold text-neutral-950 tracking-tight">Privacy Policy</h1>
          <p className="text-xs text-neutral-500 mt-1">Last updated: February 2026</p>
        </div>

        {/* Content Box */}
        <div className="bg-white rounded-3xl border border-neutral-200/80 p-8 sm:p-10 shadow-xs space-y-6 text-sm text-neutral-600 leading-relaxed">
          <section>
            <h2 className="text-base font-extrabold text-neutral-950 mb-2">1. Introduction</h2>
            <p>
              Welcome to TipTop Restaurant. We respect your privacy and are committed to safeguarding your personal data, order histories, and delivery preferences.
            </p>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-neutral-950 mb-2">2. Information We Collect</h2>
            <p>
              We collect information provided directly by you when signing in with Google or email, creating an account, saving delivery addresses, and completing orders.
            </p>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-neutral-950 mb-2">3. How We Use Your Information</h2>
            <p>
              Your data is exclusively used to prepare delicious food, dispatch timely deliveries, maintain your order status in real time, and personalize your ordering experience.
            </p>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-neutral-950 mb-2">4. Contact & Rights</h2>
            <p>
              If you have any questions about this Privacy Policy or wish to request data updates, please contact us at{' '}
              <a href={`mailto:${contactEmail}`} className="font-bold text-neutral-900 underline">
                {contactEmail}
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CustomerPrivacyPolicy;
