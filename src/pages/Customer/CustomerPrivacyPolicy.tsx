import React from 'react';
import { useNavigate } from 'react-router';

const CustomerPrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <div className="max-w-3xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/customer/profile')}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Profile
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Privacy Policy</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Last updated: February 15, 2026
          </p>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 md:p-8">
          <div className="prose dark:prose-invert max-w-none">
            {/* Introduction */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                1. Introduction
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Welcome to TipTop Restaurant. We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and website.
              </p>
            </section>

            {/* Information We Collect */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                2. Information We Collect
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-medium text-gray-900 dark:text-white mb-2">
                    Personal Information
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    We collect personal information that you provide to us, including:
                  </p>
                  <ul className="mt-2 ml-6 list-disc text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>Name and contact information (email address, phone number)</li>
                    <li>Delivery addresses</li>
                    <li>Order history and preferences</li>
                    <li>Payment information (processed securely through our payment partners)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-base font-medium text-gray-900 dark:text-white mb-2">
                    Automatic Information
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    We automatically collect certain information when you use our services:
                  </p>
                  <ul className="mt-2 ml-6 list-disc text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>Device information (IP address, browser type, operating system)</li>
                    <li>Usage data (pages visited, time spent on pages)</li>
                    <li>Location data (with your permission)</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* How We Use Your Information */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                3. How We Use Your Information
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                We use your information for the following purposes:
              </p>
              <ul className="ml-6 list-disc text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <li>To process and fulfill your orders</li>
                <li>To communicate with you about your orders and account</li>
                <li>To provide customer support</li>
                <li>To send you promotional offers and updates (with your consent)</li>
                <li>To improve our services and user experience</li>
                <li>To detect and prevent fraud and ensure security</li>
              </ul>
            </section>

            {/* Information Sharing */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                4. Information Sharing and Disclosure
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                We may share your information in the following situations:
              </p>
              <ul className="ml-6 list-disc text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <li>With delivery partners to fulfill your orders</li>
                <li>With payment processors to complete transactions</li>
                <li>With service providers who assist in our operations</li>
                <li>When required by law or to protect our legal rights</li>
                <li>With your consent for any other purpose</li>
              </ul>
            </section>

            {/* Data Security */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                5. Data Security
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                We implement appropriate technical and organizational security measures to protect your personal information. However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee its absolute security.
              </p>
            </section>

            {/* Your Rights */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                6. Your Rights and Choices
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                You have the following rights regarding your personal information:
              </p>
              <ul className="ml-6 list-disc text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <li>Access and review your personal information</li>
                <li>Update or correct your information</li>
                <li>Delete your account and associated data</li>
                <li>Opt-out of marketing communications</li>
                <li>Withdraw consent for data processing (where applicable)</li>
              </ul>
            </section>

            {/* Cookies */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                7. Cookies and Tracking Technologies
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                We use cookies and similar tracking technologies to track activity on our service and store certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our service.
              </p>
            </section>

            {/* Children's Privacy */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                8. Children's Privacy
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Our service is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you become aware that a child has provided us with personal information, please contact us.
              </p>
            </section>

            {/* Changes to Policy */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                9. Changes to This Privacy Policy
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
              </p>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                10. Contact Us
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                If you have any questions about this Privacy Policy, please contact us:
              </p>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
                <p className="text-sm text-gray-900 dark:text-white">
                  <strong>Email:</strong> privacy@tiptop.com
                </p>
                <p className="text-sm text-gray-900 dark:text-white">
                  <strong>Phone:</strong> +91 90605 57296
                </p>
                <p className="text-sm text-gray-900 dark:text-white">
                  <strong>Address:</strong> TipTop Restaurant, Main Street, City Center
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerPrivacyPolicy;
