import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useProfileOrchestrator } from '../../hooks/useProfileOrchestrator';

const EditProfile: React.FC = () => {
  const navigate = useNavigate();
  const orchestrator = useProfileOrchestrator();
  
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    orchestrator.actions.updateProfile();
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.next !== passwords.confirm) return alert('Passwords do not match');
    orchestrator.actions.changePassword({
      currentPassword: passwords.current,
      newPassword: passwords.next,
      confirmPassword: passwords.confirm
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <div className="bg-white dark:bg-gray-800 border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="font-bold">Edit Profile</h1>
        <div className="w-9" />
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <form onSubmit={handleProfileSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm space-y-4">
          <h2 className="font-bold mb-2">Personal Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">First Name</label>
              <input
                className="w-full bg-gray-50 dark:bg-gray-700 p-3 rounded-xl border-none outline-none focus:ring-2 focus:ring-[#e36057]"
                value={orchestrator.profile.firstName.value}
                onChange={e => orchestrator.profile.firstName.set(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Last Name</label>
              <input
                className="w-full bg-gray-50 dark:bg-gray-700 p-3 rounded-xl border-none outline-none focus:ring-2 focus:ring-[#e36057]"
                value={orchestrator.profile.lastName.value}
                onChange={e => orchestrator.profile.lastName.set(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Email (Read Only)</label>
            <input className="w-full bg-gray-100 dark:bg-gray-900/50 p-3 rounded-xl text-gray-500 cursor-not-allowed" value={orchestrator.profile.email} disabled />
          </div>
          <button
            disabled={orchestrator.status.saving}
            className="w-full bg-[#e36057] text-white py-3 rounded-xl font-bold disabled:opacity-50"
          >
            {orchestrator.status.saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm">
            <button
                onClick={() => setShowPasswordSection(!showPasswordSection)}
                className="w-full flex justify-between items-center font-bold"
            >
                <span>Security & Password</span>
                <svg className={`w-5 h-5 transition-transform ${showPasswordSection ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {showPasswordSection && (
                <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-4">
                    <input
                        type="password"
                        placeholder="Current Password"
                        className="w-full bg-gray-50 dark:bg-gray-700 p-3 rounded-xl outline-none"
                        value={passwords.current}
                        onChange={e => setPasswords({...passwords, current: e.target.value})}
                    />
                    <input
                        type="password"
                        placeholder="New Password"
                        className="w-full bg-gray-50 dark:bg-gray-700 p-3 rounded-xl outline-none"
                        value={passwords.next}
                        onChange={e => setPasswords({...passwords, next: e.target.value})}
                    />
                    <input
                        type="password"
                        placeholder="Confirm New Password"
                        className="w-full bg-gray-50 dark:bg-gray-700 p-3 rounded-xl outline-none"
                        value={passwords.confirm}
                        onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                    />
                    <button className="w-full bg-gray-900 dark:bg-black text-white py-3 rounded-xl font-bold">Update Password</button>
                </form>
            )}
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
