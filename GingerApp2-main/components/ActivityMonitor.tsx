import React, { useState, useEffect } from 'react';
import { Activity, Clock, User, LogIn, LogOut, Plus, Edit, Trash2, Upload, Eye, Filter, Calendar, Download, RefreshCw } from 'lucide-react';

interface AuditLog {
  id: string;
  username: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  details: any;
  ipAddress: string | null;
  timestamp: string;
}

interface UserActivity {
  username: string;
  period: string;
  statistics: {
    totalActions: number;
    logins: number;
    logouts: number;
    creates: number;
    updates: number;
    deletes: number;
    imports: number;
  };
  lastLogin: string | null;
  lastLogout: string | null;
  recentActivity: AuditLog[];
}

interface Session {
  username: string;
  action: string;
  timestamp: string;
  ipAddress: string | null;
  userAgent: string | null;
}

const ActivityMonitor: React.FC = () => {
  const [activeView, setActiveView] = useState<'logs' | 'users' | 'sessions'>('logs');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [burimiActivity, setBurimiActivity] = useState<UserActivity | null>(null);
  const [skenderiActivity, setSkenderiActivity] = useState<UserActivity | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Filters
  const [filterUsername, setFilterUsername] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterDays, setFilterDays] = useState('7');

  useEffect(() => {
    loadData();
  }, [activeView, filterUsername, filterAction, filterDays]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadData();
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [activeView, filterUsername, filterAction, filterDays]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeView === 'logs') {
        await loadAuditLogs();
      } else if (activeView === 'users') {
        await loadUserActivities();
      } else if (activeView === 'sessions') {
        await loadSessions();
      }
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    const params = new URLSearchParams();
    if (filterUsername) params.append('username', filterUsername);
    if (filterAction) params.append('action', filterAction);
    params.append('limit', '100');

    const response = await fetch(`/api/audit?${params}`);
    const data = await response.json();
    if (data.success) {
      setAuditLogs(data.logs);
    }
  };

  const loadUserActivities = async () => {
    // Try both "Burimi" and "Burim" to handle username variations
    const [burimiRes, skenderiRes] = await Promise.all([
      fetch(`/api/audit/user/Burim?days=${filterDays}`),
      fetch(`/api/audit/user/Skender?days=${filterDays}`)
    ]);

    const burimiData = await burimiRes.json();
    const skenderiData = await skenderiRes.json();

    if (burimiData.success) setBurimiActivity(burimiData.activity);
    if (skenderiData.success) setSkenderiActivity(skenderiData.activity);
  };

  const loadSessions = async () => {
    const params = new URLSearchParams();
    if (filterUsername) params.append('username', filterUsername);

    const response = await fetch(`/api/audit/sessions?${params}`);
    const data = await response.json();
    if (data.success) {
      setSessions(data.sessions);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'LOGIN': return <LogIn className="w-4 h-4" />;
      case 'LOGOUT': return <LogOut className="w-4 h-4" />;
      case 'CREATE': return <Plus className="w-4 h-4" />;
      case 'UPDATE': return <Edit className="w-4 h-4" />;
      case 'DELETE': return <Trash2 className="w-4 h-4" />;
      case 'IMPORT': return <Upload className="w-4 h-4" />;
      case 'VIEW': return <Eye className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'LOGIN': return 'bg-green-100 text-green-800 border-green-300';
      case 'LOGOUT': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'CREATE': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'UPDATE': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'DELETE': return 'bg-red-100 text-red-800 border-red-300';
      case 'IMPORT': return 'bg-purple-100 text-purple-800 border-purple-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const exportToCSV = () => {
    let csvContent = '';
    let filename = '';

    if (activeView === 'logs') {
      csvContent = [
        ['Timestamp', 'Username', 'Action', 'Entity Type', 'Entity ID', 'IP Address'].join(','),
        ...auditLogs.map(log => [
          formatTimestamp(log.timestamp),
          log.username,
          log.action,
          log.entityType || '',
          log.entityId || '',
          log.ipAddress || ''
        ].map(cell => `"${cell}"`).join(','))
      ].join('\n');
      filename = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    } else if (activeView === 'sessions') {
      csvContent = [
        ['Timestamp', 'Username', 'Action', 'IP Address'].join(','),
        ...sessions.map(session => [
          formatTimestamp(session.timestamp),
          session.username,
          session.action,
          session.ipAddress || ''
        ].map(cell => `"${cell}"`).join(','))
      ].join('\n');
      filename = `sessions_${new Date().toISOString().split('T')[0]}.csv`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Activity className="w-8 h-8 mr-3" />
              Activity Monitor
            </h1>
            <p className="text-indigo-100 mt-2">Track user actions, logins, and system activity</p>
            {lastUpdated && (
              <p className="text-indigo-200 text-xs mt-1">
                Last updated: {lastUpdated.toLocaleTimeString()} • Auto-refreshes every 10s
              </p>
            )}
          </div>
          <div className="text-right space-y-2">
            <button
              onClick={loadData}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors disabled:opacity-50 text-sm font-semibold"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Now
            </button>
            <div>
              <p className="text-sm text-indigo-100">Admin Access Only</p>
              <p className="text-2xl font-bold">{auditLogs.length + sessions.length} Events</p>
            </div>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 bg-white p-2 rounded-lg shadow-md">
        <button
          onClick={() => setActiveView('logs')}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
            activeView === 'logs'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Activity className="w-5 h-5" />
          Audit Logs
        </button>
        <button
          onClick={() => setActiveView('users')}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
            activeView === 'users'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <User className="w-5 h-5" />
          User Activity
        </button>
        <button
          onClick={() => setActiveView('sessions')}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
            activeView === 'sessions'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Clock className="w-5 h-5" />
          Login Sessions
        </button>
      </div>

      {/* Filters */}
      {(activeView === 'logs' || activeView === 'sessions') && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Username</label>
                <select
                  value={filterUsername}
                  onChange={(e) => setFilterUsername(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Users</option>
                  <option value="Burimi">Burimi</option>
                  <option value="Skenderi">Skenderi</option>
                </select>
              </div>
              {activeView === 'logs' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Action</label>
                  <select
                    value={filterAction}
                    onChange={(e) => setFilterAction(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">All Actions</option>
                    <option value="LOGIN">Login</option>
                    <option value="LOGOUT">Logout</option>
                    <option value="CREATE">Create</option>
                    <option value="UPDATE">Update</option>
                    <option value="DELETE">Delete</option>
                    <option value="IMPORT">Import</option>
                  </select>
                </div>
              )}
              <div className="flex items-end">
                <button
                  onClick={exportToCSV}
                  disabled={activeView === 'users'}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeView === 'users' && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-gray-600" />
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Time Period</label>
              <select
                value={filterDays}
                onChange={(e) => setFilterDays(e.target.value)}
                className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading activity data...</p>
        </div>
      ) : (
        <>
          {/* Audit Logs View */}
          {activeView === 'logs' && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">
                  Recent Activity ({auditLogs.length} events)
                </h3>
              </div>
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Timestamp</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">User</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Action</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Entity</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">IP Address</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          No activity logs found
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                            {formatTimestamp(log.timestamp)}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{log.username}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getActionColor(log.action)}`}>
                              {getActionIcon(log.action)}
                              {log.action}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {log.entityType ? (
                              <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                {log.entityType}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                            {log.ipAddress || <span className="text-gray-400">-</span>}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {log.details ? (
                              <details className="cursor-pointer">
                                <summary className="text-indigo-600 hover:text-indigo-800 font-medium">
                                  {log.action === 'UPDATE' && log.details.changes ? 
                                    `${log.details.changesCount || log.details.changes.length} change(s)` : 
                                    'View Details'}
                                </summary>
                                <div className="mt-2 text-xs bg-gray-50 p-3 rounded border border-gray-200 max-w-md">
                                  {/* Special formatting for UPDATE actions with changes */}
                                  {log.action === 'UPDATE' && log.details.changes && log.details.changes.length > 0 ? (
                                    <div className="space-y-2">
                                      <p className="font-semibold text-gray-700 mb-2">Fields Changed:</p>
                                      {log.details.changes.map((change: { field: string; from: any; to: any }, idx: number) => (
                                        <div key={idx} className="bg-white p-2 rounded border border-gray-200">
                                          <span className="font-semibold text-gray-800 capitalize">{change.field}:</span>
                                          <div className="flex items-center gap-2 mt-1">
                                            <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded line-through">
                                              {change.from || '(empty)'}
                                            </span>
                                            <span className="text-gray-400">→</span>
                                            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                              {change.to || '(empty)'}
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : log.action === 'UPDATE' && log.details.changes && log.details.changes.length === 0 ? (
                                    <p className="text-gray-500 italic">No fields were changed</p>
                                  ) : log.action === 'DELETE' ? (
                                    <div className="space-y-1">
                                      <p className="font-semibold text-red-700 mb-2">Deleted Record:</p>
                                      {log.details.amount && <p><span className="font-medium">Amount:</span> €{log.details.amount}</p>}
                                      {log.details.category && <p><span className="font-medium">Category:</span> {log.details.category}</p>}
                                      {log.details.subCategory && <p><span className="font-medium">Sub-Category:</span> {log.details.subCategory}</p>}
                                      {log.details.date && <p><span className="font-medium">Date:</span> {log.details.date.split('T')[0]}</p>}
                                    </div>
                                  ) : log.action === 'CREATE' ? (
                                    <div className="space-y-1">
                                      <p className="font-semibold text-blue-700 mb-2">Created Record:</p>
                                      {log.details.amount && <p><span className="font-medium">Amount:</span> €{log.details.amount}</p>}
                                      {log.details.category && <p><span className="font-medium">Category:</span> {log.details.category}</p>}
                                      {log.details.subCategory && <p><span className="font-medium">Sub-Category:</span> {log.details.subCategory}</p>}
                                      {log.details.date && <p><span className="font-medium">Date:</span> {log.details.date}</p>}
                                    </div>
                                  ) : log.action === 'IMPORT' ? (
                                    <div className="space-y-1">
                                      <p className="font-semibold text-purple-700 mb-2">Import Summary:</p>
                                      {log.details.totalRecords && <p><span className="font-medium">Total Records:</span> {log.details.totalRecords}</p>}
                                      {log.details.successful !== undefined && <p><span className="font-medium text-green-600">Successful:</span> {log.details.successful}</p>}
                                      {log.details.failed !== undefined && <p><span className="font-medium text-red-600">Failed:</span> {log.details.failed}</p>}
                                    </div>
                                  ) : (
                                    <pre className="overflow-auto whitespace-pre-wrap">
                                      {JSON.stringify(log.details, null, 2)}
                                    </pre>
                                  )}
                                </div>
                              </details>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* User Activity View */}
          {activeView === 'users' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Burimi's Activity */}
              {burimiActivity && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg border-2 border-blue-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4">
                    <h3 className="text-xl font-bold text-white flex items-center">
                      <User className="w-6 h-6 mr-2" />
                      Burimi's Activity
                    </h3>
                    <p className="text-blue-100 text-sm mt-1">{burimiActivity.period}</p>
                  </div>
                  <div className="p-6 space-y-4">
                    {/* Statistics Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-lg p-3 shadow-sm border border-blue-200">
                        <p className="text-xs text-gray-600">Total Actions</p>
                        <p className="text-2xl font-bold text-gray-900">{burimiActivity.statistics.totalActions}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm border border-green-200">
                        <p className="text-xs text-gray-600">Logins</p>
                        <p className="text-2xl font-bold text-green-600">{burimiActivity.statistics.logins}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm border border-blue-200">
                        <p className="text-xs text-gray-600">Creates</p>
                        <p className="text-2xl font-bold text-blue-600">{burimiActivity.statistics.creates}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm border border-yellow-200">
                        <p className="text-xs text-gray-600">Updates</p>
                        <p className="text-2xl font-bold text-yellow-600">{burimiActivity.statistics.updates}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm border border-red-200">
                        <p className="text-xs text-gray-600">Deletes</p>
                        <p className="text-2xl font-bold text-red-600">{burimiActivity.statistics.deletes}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm border border-purple-200">
                        <p className="text-xs text-gray-600">Imports</p>
                        <p className="text-2xl font-bold text-purple-600">{burimiActivity.statistics.imports}</p>
                      </div>
                    </div>

                    {/* Last Login/Logout */}
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-200">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 flex items-center">
                            <LogIn className="w-4 h-4 mr-2 text-green-600" />
                            Last Login
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            {burimiActivity.lastLogin ? formatTimestamp(burimiActivity.lastLogin) : 'Never'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 flex items-center">
                            <LogOut className="w-4 h-4 mr-2 text-gray-600" />
                            Last Logout
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            {burimiActivity.lastLogout ? formatTimestamp(burimiActivity.lastLogout) : 'Never'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Skenderi's Activity */}
              {skenderiActivity && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-lg border-2 border-purple-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4">
                    <h3 className="text-xl font-bold text-white flex items-center">
                      <User className="w-6 h-6 mr-2" />
                      Skenderi's Activity
                    </h3>
                    <p className="text-purple-100 text-sm mt-1">{skenderiActivity.period}</p>
                  </div>
                  <div className="p-6 space-y-4">
                    {/* Statistics Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-lg p-3 shadow-sm border border-purple-200">
                        <p className="text-xs text-gray-600">Total Actions</p>
                        <p className="text-2xl font-bold text-gray-900">{skenderiActivity.statistics.totalActions}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm border border-green-200">
                        <p className="text-xs text-gray-600">Logins</p>
                        <p className="text-2xl font-bold text-green-600">{skenderiActivity.statistics.logins}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm border border-blue-200">
                        <p className="text-xs text-gray-600">Creates</p>
                        <p className="text-2xl font-bold text-blue-600">{skenderiActivity.statistics.creates}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm border border-yellow-200">
                        <p className="text-xs text-gray-600">Updates</p>
                        <p className="text-2xl font-bold text-yellow-600">{skenderiActivity.statistics.updates}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm border border-red-200">
                        <p className="text-xs text-gray-600">Deletes</p>
                        <p className="text-2xl font-bold text-red-600">{skenderiActivity.statistics.deletes}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm border border-purple-200">
                        <p className="text-xs text-gray-600">Imports</p>
                        <p className="text-2xl font-bold text-purple-600">{skenderiActivity.statistics.imports}</p>
                      </div>
                    </div>

                    {/* Last Login/Logout */}
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-200">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 flex items-center">
                            <LogIn className="w-4 h-4 mr-2 text-green-600" />
                            Last Login
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            {skenderiActivity.lastLogin ? formatTimestamp(skenderiActivity.lastLogin) : 'Never'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 flex items-center">
                            <LogOut className="w-4 h-4 mr-2 text-gray-600" />
                            Last Logout
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            {skenderiActivity.lastLogout ? formatTimestamp(skenderiActivity.lastLogout) : 'Never'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sessions View */}
          {activeView === 'sessions' && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">
                  Login/Logout Sessions ({sessions.length} events)
                </h3>
              </div>
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Timestamp</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">User</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Action</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">IP Address</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">User Agent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sessions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                          No session data found
                        </td>
                      </tr>
                    ) : (
                      sessions.map((session, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                            {formatTimestamp(session.timestamp)}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{session.username}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getActionColor(session.action)}`}>
                              {getActionIcon(session.action)}
                              {session.action}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                            {session.ipAddress || <span className="text-gray-400">-</span>}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                            {session.userAgent || <span className="text-gray-400">-</span>}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ActivityMonitor;
