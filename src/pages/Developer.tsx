import { useState, useEffect } from 'react';
import { getAccessToken } from '../services/auth-session.store';

const Developer = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('health');
  const [health, setHealth] = useState<any>(null);
  const [performance, setPerformance] = useState<any>(null);
  const [errors, setErrors] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [dbStats, setDbStats] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);

  const token = getAccessToken('admin');
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  // MongoDB Atlas Free Tier Limit (512MB)
  const MONGODB_LIMIT_BYTES = 512 * 1024 * 1024; // 536870912 bytes

  // Helper function to get color based on percentage
  const getColorByPercentage = (percentage: number) => {
    if (percentage < 60) return { bg: 'bg-green-100 dark:bg-green-900/20', text: 'text-green-800 dark:text-green-200', border: 'border-green-200 dark:border-green-800' };
    if (percentage < 70) return { bg: 'bg-yellow-100 dark:bg-yellow-900/20', text: 'text-yellow-800 dark:text-yellow-200', border: 'border-yellow-200 dark:border-yellow-800' };
    if (percentage < 85) return { bg: 'bg-orange-100 dark:bg-orange-900/20', text: 'text-orange-800 dark:text-orange-200', border: 'border-orange-200 dark:border-orange-800' };
    return { bg: 'bg-red-100 dark:bg-red-900/20', text: 'text-red-800 dark:text-red-200', border: 'border-red-200 dark:border-red-800' };
  };

  // Helper function to parse size string to bytes
  const parseSizeToBytes = (sizeStr: string): number => {
    const match = sizeStr.match(/^([\d.]+)\s*(B|KB|MB|GB)$/i);
    if (!match) return 0;
    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    const multipliers: any = { B: 1, KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024 };
    return value * (multipliers[unit] || 1);
  };

  // Helper function to get database usage percentage and warning
  const getDatabaseUsageInfo = () => {
    if (!dbStats?.dataSize) return { percentage: 0, warning: null, color: getColorByPercentage(0) };
    
    const usedBytes = parseSizeToBytes(dbStats.dataSize);
    const percentage = (usedBytes / MONGODB_LIMIT_BYTES) * 100;
    const color = getColorByPercentage(percentage);
    
    let warning = null;
    if (percentage >= 90) warning = '🚨 CRITICAL: Database at 90%+ capacity!';
    else if (percentage >= 85) warning = '⚠️ WARNING: Database at 85%+ capacity!';
    else if (percentage >= 75) warning = '⚠️ Database usage at 75%+';
    else if (percentage >= 70) warning = '⚠️ Database usage approaching 70%';
    
    return { percentage: percentage.toFixed(1), warning, color, used: dbStats.dataSize, total: '512 MB' };
  };

  // Fetch health data
  const fetchHealth = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/developer/health`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.status === 'success') {
        setHealth(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch health:', error);
    }
  };

  // Fetch performance metrics
  const fetchPerformance = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/developer/performance`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.status === 'success') {
        setPerformance(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch performance:', error);
    }
  };

  // Fetch error logs
  const fetchErrors = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/developer/errors?limit=20`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.status === 'success') {
        setErrors(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch errors:', error);
    }
  };

  // Fetch logs
  const fetchLogs = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/developer/logs?limit=50`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.status === 'success') {
        setLogs(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  };

  // Fetch database stats
  const fetchDatabaseStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/developer/database-stats`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.status === 'success') {
        setDbStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch database stats:', error);
    }
  };

  // Fetch config
  const fetchConfig = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/developer/config`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.status === 'success') {
        setConfig(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch config:', error);
    }
  };

  // Test error email
  const testErrorEmail = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/developer/test-error-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (data.status === 'success') {
        alert('Test error email sent successfully! Check your inbox.');
      } else {
        alert('Failed to send test email.');
      }
    } catch (error) {
      console.error('Failed to send test email:', error);
      alert('Failed to send test email.');
    }
  };

  // Clear logs
  const clearLogs = async (type = 'all') => {
    if (!confirm(`Are you sure you want to clear ${type} logs?`)) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/developer/logs?type=${type}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.status === 'success') {
        alert(data.message);
        fetchLogs();
        fetchErrors();
      }
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  };

  // Initial load
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([
        fetchHealth(),
        fetchPerformance(),
        fetchErrors(),
        fetchLogs(),
        fetchDatabaseStats(),
        fetchConfig(),
      ]);
      setLoading(false);
    };
    loadAll();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchHealth();
      fetchPerformance();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Developer Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">System monitoring and development tools</p>
        </div>
        <button
          onClick={testErrorEmail}
          className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
        >
          🧪 Test Error Email
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {['health', 'performance', 'errors', 'logs', 'database', 'config'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* Health Tab */}
        {activeTab === 'health' && health && (
          <div className="space-y-4">
            {/* System Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">System Uptime</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {Math.floor(health.process.uptime / 3600)}h {Math.floor((health.process.uptime % 3600) / 60)}m
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Memory Usage</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{health.system.memoryUsagePercent}%</p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    getColorByPercentage(parseFloat(health.system.memoryUsagePercent)).bg
                  }`}>
                    <svg className={`w-6 h-6 ${getColorByPercentage(parseFloat(health.system.memoryUsagePercent)).text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">CPU Cores</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{health.system.cpus}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Environment</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white capitalize">{health.process.env}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Services Status */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Services Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(health.services).map(([service, info]: [string, any]) => (
                  <div key={service} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white capitalize">{service}</p>
                      {info.type && <p className="text-sm text-gray-600 dark:text-gray-400">{info.type}</p>}
                      {info.provider && <p className="text-sm text-gray-600 dark:text-gray-400">{info.provider}</p>}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      info.status === 'connected' || info.status === 'configured'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {info.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Other tabs implementation similar to The-Tip-Top version but with TypeScript and dark mode support */}
        {/* For brevity, showing abbreviated versions - full implementation would be similar to jsx version */}
        
        {activeTab === 'performance' && performance && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Memory Usage</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`p-4 rounded-lg border-2 ${performance.memory.heapUsedPercent ? getColorByPercentage(parseFloat(performance.memory.heapUsedPercent)).bg + ' ' + getColorByPercentage(parseFloat(performance.memory.heapUsedPercent)).border : 'bg-gray-50 dark:bg-gray-700'}`}>
                  <p className={`text-sm ${performance.memory.heapUsedPercent ? getColorByPercentage(parseFloat(performance.memory.heapUsedPercent)).text : 'text-gray-600 dark:text-gray-400'}`}>Heap Used</p>
                  <p className={`text-xl font-bold ${performance.memory.heapUsedPercent ? getColorByPercentage(parseFloat(performance.memory.heapUsedPercent)).text : 'text-gray-900 dark:text-white'}`}>{performance.memory.heapUsed}</p>
                  {performance.memory.heapUsedPercent && <p className={`text-xs mt-1 ${getColorByPercentage(parseFloat(performance.memory.heapUsedPercent)).text}`}>{performance.memory.heapUsedPercent}%</p>}
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border-2 border-gray-200 dark:border-gray-600">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Heap Total</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{performance.memory.heapTotal}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border-2 border-gray-200 dark:border-gray-600">
                  <p className="text-sm text-gray-600 dark:text-gray-400">External</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{performance.memory.external}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border-2 border-gray-200 dark:border-gray-600">
                  <p className="text-sm text-gray-600 dark:text-gray-400">RSS</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{performance.memory.rss}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">CPU Usage</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border-2 border-gray-200 dark:border-gray-600">
                  <p className="text-sm text-gray-600 dark:text-gray-400">User</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{performance.cpu.user}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border-2 border-gray-200 dark:border-gray-600">
                  <p className="text-sm text-gray-600 dark:text-gray-400">System</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{performance.cpu.system}</p>
                </div>
                <div className={`p-4 rounded-lg border-2 ${performance.cpu.loadAveragePercent ? getColorByPercentage(parseFloat(performance.cpu.loadAveragePercent)).bg + ' ' + getColorByPercentage(parseFloat(performance.cpu.loadAveragePercent)).border : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'}`}>
                  <p className={`text-sm ${performance.cpu.loadAveragePercent ? getColorByPercentage(parseFloat(performance.cpu.loadAveragePercent)).text : 'text-gray-600 dark:text-gray-400'}`}>Load Average</p>
                  <p className={`text-xl font-bold ${performance.cpu.loadAveragePercent ? getColorByPercentage(parseFloat(performance.cpu.loadAveragePercent)).text : 'text-gray-900 dark:text-white'}`}>{performance.cpu.loadAverage.join(', ')}</p>
                  {performance.cpu.loadAveragePercent && <p className={`text-xs mt-1 ${getColorByPercentage(parseFloat(performance.cpu.loadAveragePercent)).text}`}>{performance.cpu.loadAveragePercent}% load</p>}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Uptime</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Process Uptime</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{performance.uptime.process}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">System Uptime</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{performance.uptime.system}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'errors' && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Error Logs ({errors.length})</h2>
              <button
                onClick={() => clearLogs('error')}
                className="px-4 py-2 text-sm bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
              >
                Clear Error Logs
              </button>
            </div>
            {errors.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">No errors found 🎉</p>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {errors.map((error, i) => (
                  <div key={i} className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-red-900 dark:text-red-200">{error.message || 'Unknown error'}</p>
                        {error.timestamp && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {new Date(error.timestamp).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <span className="px-2 py-1 bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 text-xs font-medium rounded">
                        {error.level || 'error'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Application Logs ({logs.length})</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchLogs()}
                    className="px-4 py-2 text-sm bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                  >
                    Refresh
                  </button>
                  <button
                    onClick={() => clearLogs('combined')}
                    className="px-4 py-2 text-sm bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                  >
                    Clear Logs
                  </button>
                </div>
              </div>
              <div className="space-y-1 max-h-[500px] overflow-y-auto font-mono text-sm bg-gray-900 text-gray-100 p-4 rounded-lg">
                {logs.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No logs found</p>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className="py-1">
                      <span className={`${
                        log.level === 'error' ? 'text-red-400' :
                        log.level === 'warn' ? 'text-yellow-400' :
                        log.level === 'info' ? 'text-green-400' :
                        'text-gray-400'
                      }`}>
                        [{log.level?.toUpperCase() || 'LOG'}]
                      </span>
                      {' '}
                      {log.timestamp && (
                        <span className="text-gray-500">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      )}
                      {' '}
                      <span className="text-gray-200">{log.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'database' && dbStats && (
          <div className="space-y-4">
            {/* MongoDB Atlas Free Tier Warning */}
            {(() => {
              const dbInfo = getDatabaseUsageInfo();
              return dbInfo.warning && (
                <div className={`p-4 rounded-lg border-2 ${dbInfo.color.bg} ${dbInfo.color.border}`}>
                  <div className="flex items-center justify-between">
                    <p className={`font-semibold ${dbInfo.color.text}`}>{dbInfo.warning}</p>
                    <p className={`text-sm ${dbInfo.color.text}`}>
                      {dbInfo.used} / {dbInfo.total} ({dbInfo.percentage}%)
                    </p>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        parseFloat(dbInfo.percentage) >= 85 ? 'bg-red-600' :
                        parseFloat(dbInfo.percentage) >= 70 ? 'bg-orange-500' :
                        parseFloat(dbInfo.percentage) >= 60 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${dbInfo.percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })()}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(() => {
                const dbInfo = getDatabaseUsageInfo();
                return (
                  <div className={`p-6 rounded-lg shadow border-2 ${dbInfo.color.bg} ${dbInfo.color.border}`}>
                    <p className={`text-sm ${dbInfo.color.text}`}>Data Size (512 MB Free Tier)</p>
                    <p className={`text-3xl font-bold ${dbInfo.color.text}`}>{dbStats.dataSize}</p>
                    <p className={`text-xs mt-1 ${dbInfo.color.text}`}>{dbInfo.percentage}% used</p>
                  </div>
                );
              })()}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border-2 border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">Index Size</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{dbStats.indexSize}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border-2 border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">Collections</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{dbStats.collections}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Collections</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Documents</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Size</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Indexes</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Avg Doc Size</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {dbStats.collectionDetails?.map((col: any) => (
                      <tr key={col.name}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{col.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{col.count.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{col.size}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{col.indexes}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{col.avgObjSize} bytes</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'config' && config && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Configuration</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Environment</p>
                  <p className="text-lg font-medium capitalize text-gray-900 dark:text-white">{config.nodeEnv}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Port</p>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">{config.port}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Services Configuration</h2>
              <div className="space-y-2">
                {Object.entries(config.services).map(([service, status]) => (
                  <div key={service} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="font-medium capitalize text-gray-900 dark:text-white">{service}</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      status === 'configured'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {status as string}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Features</h2>
              <div className="space-y-2">
                {Object.entries(config.features).map(([feature, status]) => (
                  <div key={feature} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="font-medium capitalize text-gray-900 dark:text-white">{feature.replace(/([A-Z])/g, ' $1').trim()}</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      status === 'enabled'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {status as string}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Developer;
