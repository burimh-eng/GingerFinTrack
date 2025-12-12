import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Key, Eye, EyeOff, UserCog } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface User {
  username: string;
  fullName: string;
  role: string;
}

interface PasswordManagerProps {
  currentUsername: string;
}

const PasswordManager: React.FC<PasswordManagerProps> = ({ currentUsername }) => {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Admin reset section
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetMessage, setResetMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isBurim = currentUsername === 'Burim';

  useEffect(() => {
    if (isBurim) {
      fetchUsers();
    }
  }, [isBurim]);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/users`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.filter((u: User) => u.username !== currentUsername));
      }
    } catch (error) {
      console.error('Failed to fetch users', error);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: t('passwordsDoNotMatch') });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: t('passwordTooShort') });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: currentUsername,
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: t('passwordChangedSuccess') });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMessage({ type: 'error', text: data.error || t('passwordChangeFailed') });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('passwordChangeFailed') });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMessage(null);

    if (!selectedUser) {
      setResetMessage({ type: 'error', text: t('selectUserToReset') });
      return;
    }

    if (resetPassword.length < 6) {
      setResetMessage({ type: 'error', text: t('passwordTooShort') });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUsername: currentUsername,
          targetUsername: selectedUser,
          newPassword: resetPassword,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setResetMessage({ type: 'success', text: data.message || t('passwordResetSuccess') });
        setSelectedUser('');
        setResetPassword('');
      } else {
        setResetMessage({ type: 'error', text: data.error || t('passwordResetFailed') });
      }
    } catch (error) {
      setResetMessage({ type: 'error', text: t('passwordResetFailed') });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Change Own Password Section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <Key className="w-6 h-6 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-800">{t('changeYourPassword')}</h3>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('currentPassword')}
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('newPassword')}
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('confirmNewPassword')}
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
              minLength={6}
            />
          </div>

          {message && (
            <div className={`p-3 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? t('saving') : t('changePassword')}
          </button>
        </form>
      </div>

      {/* Admin Reset Password Section - Only for Burim */}
      {isBurim && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-6">
            <UserCog className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">{t('resetUserPassword')}</h3>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('selectUser')}
              </label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">{t('selectUserPlaceholder')}</option>
                {users.map((user) => (
                  <option key={user.username} value={user.username}>
                    {user.fullName} ({user.username})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('newPasswordForUser')}
              </label>
              <input
                type="password"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                minLength={6}
              />
            </div>

            {resetMessage && (
              <div className={`p-3 rounded-lg ${resetMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {resetMessage.text}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? t('saving') : t('resetPassword')}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default PasswordManager;
