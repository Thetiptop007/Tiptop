import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSettings, Settings } from '../services/settings.service';

export default function PrivacyPolicy() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] lg:p-8">
      <div className="mx-auto max-w-4xl">
          <h1 className="mb-6 text-3xl font-bold text-gray-800 dark:text-white/90">
            Privacy Policy
          </h1>
          
          <div className="mb-8 text-sm text-gray-500 dark:text-gray-400">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>

          <div className="space-y-8 text-gray-700 dark:text-gray-300">
            {/* Introduction */}
            <section>
              <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white/90">
                1. Introduction
              </h2>
              <p className="leading-relaxed">
                Welcome to {settings?.siteName || 'ThéTipTop'}. We respect your privacy and are committed to protecting your personal data. 
                This privacy policy will inform you about how we look after your personal data when you use our services and tell you 
                about your privacy rights and how the law protects you.
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white/90">
                2. Information We Collect
              </h2>
              <p className="mb-3 leading-relaxed">
                We collect information you provide directly to us, including:
              </p>
              <ul className="ml-6 space-y-2 list-disc">
                <li>Personal information (name, email, phone number)</li>
                <li>Delivery addresses and location data</li>
                <li>Payment information (processed securely through third-party providers)</li>
                <li>Order history and preferences</li>
                <li>Device information and usage data</li>
                <li>Communications with customer support</li>
              </ul>
            </section>

            {/* How We Use Your Information */}
            <section>
              <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white/90">
                3. How We Use Your Information
              </h2>
              <p className="mb-3 leading-relaxed">
                We use the information we collect to:
              </p>
              <ul className="ml-6 space-y-2 list-disc">
                <li>Process and deliver your food orders</li>
                <li>Communicate with you about orders, services, and promotions</li>
                <li>Improve our services and user experience</li>
                <li>Personalize your experience and provide recommendations</li>
                <li>Process payments and prevent fraud</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            {/* Information Sharing */}
            <section>
              <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white/90">
                4. Information Sharing and Disclosure
              </h2>
              <p className="mb-3 leading-relaxed">
                We may share your information with:
              </p>
              <ul className="ml-6 space-y-2 list-disc">
                <li><strong>Delivery Partners:</strong> To fulfill and deliver your orders</li>
                <li><strong>Payment Processors:</strong> To process secure transactions</li>
                <li><strong>Service Providers:</strong> Who assist in our operations (hosting, analytics, customer support)</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              </ul>
              <p className="mt-3 leading-relaxed">
                We do not sell your personal information to third parties.
              </p>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white/90">
                5. Data Security
              </h2>
              <p className="leading-relaxed">
                We implement appropriate security measures to protect your personal information, including:
              </p>
              <ul className="ml-6 mt-3 space-y-2 list-disc">
                <li>Encrypted data transmission (SSL/TLS)</li>
                <li>Secure password storage with encryption</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication</li>
                <li>Secure server infrastructure</li>
              </ul>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white/90">
                6. Your Privacy Rights
              </h2>
              <p className="mb-3 leading-relaxed">
                You have the right to:
              </p>
              <ul className="ml-6 space-y-2 list-disc">
                <li>Access your personal data</li>
                <li>Correct inaccurate or incomplete data</li>
                <li>Request deletion of your data</li>
                <li>Object to processing of your data</li>
                <li>Request data portability</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white/90">
                7. Data Retention
              </h2>
              <p className="leading-relaxed">
                We retain your personal information for as long as necessary to provide our services and fulfill the purposes 
                outlined in this privacy policy. We will also retain and use your information to comply with legal obligations, 
                resolve disputes, and enforce our agreements.
              </p>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white/90">
                8. Cookies and Tracking Technologies
              </h2>
              <p className="leading-relaxed">
                We use cookies and similar tracking technologies to track activity on our service and hold certain information. 
                Cookies help us improve your experience by remembering your preferences and understanding how you use our services.
              </p>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white/90">
                9. Children's Privacy
              </h2>
              <p className="leading-relaxed">
                Our services are not directed to individuals under the age of 18. We do not knowingly collect personal information 
                from children. If you become aware that a child has provided us with personal information, please contact us.
              </p>
            </section>

            {/* Changes to Privacy Policy */}
            <section>
              <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white/90">
                10. Changes to This Privacy Policy
              </h2>
              <p className="leading-relaxed">
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy 
                on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
              </p>
            </section>

            {/* Contact Information */}
            <section className="rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800/50">
              <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white/90">
                11. Contact Us
              </h2>
              {loading ? (
                <p className="text-gray-600 dark:text-gray-400">Loading contact information...</p>
              ) : (
                <div className="space-y-3">
                  <p className="leading-relaxed">
                    If you have any questions about this Privacy Policy or our data practices, please contact us:
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="font-medium">Email:</span>
                      <a href={`mailto:${settings?.contactEmail}`} className="text-orange-500 hover:text-orange-600">
                        {settings?.contactEmail || 'contact@restaurant.com'}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="font-medium">Phone:</span>
                      <span>{settings?.contactPhone || '+91 1234567890'}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <svg className="mt-0.5 h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="font-medium">Address:</span>
                      <span>{settings?.businessAddress || 'Restaurant Address'}</span>
                    </div>
                    {settings?.website && (
                      <div className="flex items-center gap-2">
                        <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                        <span className="font-medium">Website:</span>
                        <a 
                          href={`http://${settings.website.replace(/^https?:\/\//, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-orange-500 hover:text-orange-600"
                        >
                          {settings.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Back to Home */}
          <div className="mt-8 flex justify-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-orange-600"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
  );
}
