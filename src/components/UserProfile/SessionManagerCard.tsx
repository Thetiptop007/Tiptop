import React, { useEffect, useState } from 'react';
import { AuthSession, getActiveSessions, revokeSession, revokeAllOtherSessions, requestRevocationOtp } from '../../services/session.service';

interface SessionManagerCardProps {
  role: 'admin' | 'customer';
}

const SessionManagerCard: React.FC<SessionManagerCardProps> = ({ role }) => {
  const [sessions, setSessions] = useState<AuthSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOtpInput, setShowOtpInput] = useState<string | null>(null);
  const [otpValue, setOtpValue] = useState('');
  const [otpMessage, setOtpMessage] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchSessions = async () => {
    setLoading(true);
    const data = await getActiveSessions(role);
    setSessions(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSessions();
  }, [role]);

  const initiateRevoke = async (id: string) => {
    setActionLoading(id);
    const result = await requestRevocationOtp(role);
    if (result.success) {
      setShowOtpInput(id);
      setOtpMessage(result.message || 'OTP sent to security email');
    } else {
      alert(result.message || 'Failed to send OTP');
    }
    setActionLoading(null);
  };

  const confirmRevoke = async () => {
    if (!otpValue || otpValue.length < 6) {
      alert('Please enter a valid 6-digit OTP');
      return;
    }
    
    setActionLoading('confirming');
    let success = false;
    
    if (showOtpInput === 'other') {
      success = await revokeAllOtherSessions(role, otpValue);
    } else if (showOtpInput) {
      success = await revokeSession(role, showOtpInput, otpValue);
    }
    
    if (success) {
      if (showOtpInput === 'other') {
        setSessions(prev => prev.filter(s => s.isCurrent));
      } else {
        setSessions(prev => prev.filter(s => s.sessionId !== showOtpInput));
      }
      setShowOtpInput(null);
      setOtpValue('');
      setOtpMessage('');
    } else {
      alert('Invalid or expired OTP. Please try again.');
    }
    setActionLoading(null);
  };

  const parseUA = (ua: string) => {
    const browser = ua.includes('Firefox') ? 'Firefox' : 
                    ua.includes('Edg') ? 'Edge' :
                    ua.includes('Chrome') ? 'Chrome' : 
                    ua.includes('Safari') ? 'Safari' : 'Browser';
    
    const os = ua.includes('Windows') ? 'Windows' : 
               ua.includes('Mac OS') ? 'macOS' : 
               ua.includes('Android') ? 'Android' : 
               ua.includes('iPhone') || ua.includes('iPad') ? 'iOS' : 
               ua.includes('Linux') ? 'Linux' : 'OS';
    
    const device = /mobile|android|iphone|ipad/i.test(ua) ? 'Mobile' : 'Desktop';
    
    return { browser, os, device };
  };

  if (loading) {
    return (
      <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark sm:p-7">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-slate-200 rounded"></div>
              <div className="h-4 bg-slate-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="border-b border-stroke py-4 px-7 dark:border-strokedark">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-black dark:text-white">
            Active Sessions
          </h3>
          {sessions.length > 1 && (
            <button
              onClick={() => initiateRevoke('other')}
              disabled={actionLoading !== null}
              className="text-sm font-medium text-danger hover:underline disabled:opacity-50"
            >
              {actionLoading === 'other' ? 'Sending OTP...' : 'Log out all other devices'}
            </button>
          )}
        </div>
      </div>
      <div className="p-7">
        {showOtpInput && (
          <div className="mb-6 rounded-lg bg-primary/5 p-5 border border-primary/20">
            <h4 className="mb-2 font-medium text-black dark:text-white">Verify Revocation</h4>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              {otpMessage}
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="6-digit OTP"
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="flex-1 rounded-md border-[1.5px] border-stroke bg-gray-50 py-2.5 px-4 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white text-center tracking-[0.2em] text-lg font-bold min-w-0"
                autoFocus
              />
              <button
                onClick={confirmRevoke}
                disabled={actionLoading === 'confirming'}
                className="justify-center rounded-md py-2.5 px-4 font-semibold text-white shadow-sm transition-all hover:bg-opacity-90 disabled:opacity-50 whitespace-nowrap text-sm"
                style={{ backgroundColor: '#3C50E0' }}
              >
                {actionLoading === 'confirming' ? '...' : 'Confirm'}
              </button>
              <button
                onClick={() => { setShowOtpInput(null); setOtpValue(''); setOtpMessage(''); }}
                className="justify-center rounded-md border border-stroke py-2.5 px-4 font-semibold text-black hover:bg-gray-100 dark:border-strokedark dark:text-white dark:hover:bg-meta-4 transition-all text-sm whitespace-nowrap"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-5">
          {sessions.length === 0 ? (
            <p className="text-center text-sm text-gray-500">No active sessions found.</p>
          ) : (
            sessions.map((session) => {
              const { browser, os, device } = parseUA(session.userAgent || '');
              return (
                <div
                  key={session.sessionId}
                  className="flex items-center justify-between border-b border-stroke pb-5 last:border-0 last:pb-0 dark:border-strokedark"
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className={`flex h-12 w-12 items-center justify-center rounded-full shadow-inner ${
                        session.isCurrent ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    >
                      <svg 
                        className={`h-6 w-6 ${session.isCurrent ? 'text-white' : 'text-primary'}`} 
                        viewBox="0 0 20 20" 
                        fill="currentColor" 
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        {device === 'Mobile' ? (
                          <path d="M15.8333 1.66663H4.16667C3.24619 1.66663 2.5 2.41282 2.5 3.33329V16.6666C2.5 17.5871 3.24619 18.3333 4.16667 18.3333H15.8333C16.7538 18.3333 17.5 17.5871 17.5 16.6666V3.33329C17.5 2.41282 16.7538 1.66663 15.8333 1.66663ZM10 16.6666C9.54167 16.6666 9.16667 16.2916 9.16667 15.8333C9.16667 15.375 9.54167 15 10 15C10.4583 15 10.8333 15.375 10.8333 15.8333C10.8333 16.2916 10.4583 16.6666 10 16.6666ZM15.8333 13.3333H4.16667V3.33329H15.8333V13.3333Z" />
                        ) : (
                          <path d="M18.3333 14.1666H1.66667V3.33329C1.66667 2.41282 2.41286 1.66663 3.33333 1.66663H16.6667C17.5871 1.66663 18.3333 2.41282 18.3333 3.33329V14.1666ZM3.33333 3.33329V12.5H16.6667V3.33329H3.33333ZM18.3333 15.8333V17.5C18.3333 17.9602 17.9602 18.3333 17.5 18.3333H2.5C2.03976 18.3333 1.66667 17.9602 1.66667 17.5V15.8333H18.3333Z" />
                        )}
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-black dark:text-white flex items-center gap-2">
                        {browser} on {os}
                        {session.isCurrent && (
                          <span className="text-xs font-semibold text-success uppercase">
                            (This Device)
                          </span>
                        )}
                      </h4>
                      <p className="text-sm">
                        {session.ipAddress || 'Unknown IP'} • {new Date(session.lastUsedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {!session.isCurrent && (
                    <button
                      onClick={() => initiateRevoke(session.sessionId)}
                      disabled={actionLoading !== null}
                      className="rounded border border-stroke py-1 px-3 text-sm font-medium hover:bg-gray-100 dark:border-strokedark dark:hover:bg-meta-4 disabled:opacity-50"
                    >
                      {actionLoading === session.sessionId ? 'Sending OTP...' : 'Revoke'}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionManagerCard;
