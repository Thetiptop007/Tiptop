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
    <div className="min-h-screen bg-[#F6F5F2] text-neutral-900 font-sans pb-24">
      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => navigate('/customer/profile')}
              className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-neutral-500 hover:text-black mb-2 transition-colors group"
            >
              <svg className="w-4 h-4 mr-1.5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
              Profile
            </button>
            <h1 className="text-3xl font-extrabold text-neutral-950 tracking-tight">Edit Profile</h1>
          </div>
        </div>

        <div className="space-y-6">
          {/* Personal Details Card */}
          <form onSubmit={handleProfileSubmit} className="bg-white border border-neutral-200/80 p-8 rounded-3xl shadow-xs space-y-5">
            <h2 className="text-lg font-extrabold text-neutral-950">Personal Details</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
                  First Name
                </label>
                <input
                  className="w-full bg-[#F6F5F2] border border-neutral-200 p-3.5 rounded-2xl text-sm font-semibold text-neutral-900 outline-none focus:border-black transition-colors"
                  value={orchestrator.profile.firstName.value}
                  onChange={e => orchestrator.profile.firstName.set(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
                  Last Name
                </label>
                <input
                  className="w-full bg-[#F6F5F2] border border-neutral-200 p-3.5 rounded-2xl text-sm font-semibold text-neutral-900 outline-none focus:border-black transition-colors"
                  value={orchestrator.profile.lastName.value}
                  onChange={e => orchestrator.profile.lastName.set(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
                Email Address (Verified)
              </label>
              <input
                className="w-full bg-neutral-100 border border-neutral-200 p-3.5 rounded-2xl text-sm font-medium text-neutral-500 cursor-not-allowed"
                value={orchestrator.profile.email}
                disabled
              />
            </div>

            <button
              disabled={orchestrator.status.saving}
              className="w-full py-4 rounded-full bg-black text-white text-sm font-extrabold hover:bg-neutral-800 transition-all shadow-sm disabled:opacity-50"
            >
              {orchestrator.status.saving ? 'Saving changes...' : 'Save Changes'}
            </button>
          </form>

          {/* Security & Password Card */}
          <div className="bg-white border border-neutral-200/80 p-8 rounded-3xl shadow-xs">
            <button
              type="button"
              onClick={() => setShowPasswordSection(!showPasswordSection)}
              className="w-full flex justify-between items-center text-left"
            >
              <div>
                <h3 className="text-base font-extrabold text-neutral-950">Security & Password</h3>
                <p className="text-xs text-neutral-500 mt-0.5">Change your TipTop account password</p>
              </div>
              <svg className={`w-5 h-5 text-neutral-500 transition-transform ${showPasswordSection ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showPasswordSection && (
              <form onSubmit={handlePasswordSubmit} className="mt-6 pt-6 border-t border-neutral-100 space-y-4">
                <input
                  type="password"
                  placeholder="Current Password"
                  className="w-full bg-[#F6F5F2] border border-neutral-200 p-3.5 rounded-2xl text-sm font-semibold outline-none focus:border-black transition-colors"
                  value={passwords.current}
                  onChange={e => setPasswords({...passwords, current: e.target.value})}
                />
                <input
                  type="password"
                  placeholder="New Password"
                  className="w-full bg-[#F6F5F2] border border-neutral-200 p-3.5 rounded-2xl text-sm font-semibold outline-none focus:border-black transition-colors"
                  value={passwords.next}
                  onChange={e => setPasswords({...passwords, next: e.target.value})}
                />
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  className="w-full bg-[#F6F5F2] border border-neutral-200 p-3.5 rounded-2xl text-sm font-semibold outline-none focus:border-black transition-colors"
                  value={passwords.confirm}
                  onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                />
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-full bg-neutral-900 text-white text-xs font-extrabold hover:bg-black transition-all"
                >
                  Update Password
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;

