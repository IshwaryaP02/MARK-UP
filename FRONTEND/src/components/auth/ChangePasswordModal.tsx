import React, { useState } from 'react';
import { X, Lock, Eye, EyeOff, CheckCircle, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const { changePassword } = useApp();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword === oldPassword) {
      setError('New password must be different from the old password.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await changePassword(oldPassword, newPassword);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-[#161B33] border border-zinc-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-white/5">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">Change Password</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Update your account password</p>
          </div>
          <button onClick={handleClose} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {success ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-green-500" />
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-2">Password Changed!</h3>
              <p className="text-sm text-zinc-500 mb-6">Your new password is now active.</p>
              <button
                onClick={handleClose}
                className="w-full py-3 bg-[#313866] hover:bg-[#8A92D0] text-white text-sm font-bold rounded-xl transition-all"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Old Password */}
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2 uppercase tracking-wide">
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showOld ? 'text' : 'password'}
                    required
                    value={oldPassword}
                    onChange={(e) => { setOldPassword(e.target.value); setError(''); }}
                    placeholder="Enter current password"
                    className="w-full pl-10 pr-10 py-3 text-sm bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#313866]/40 dark:focus:ring-[#8A92D0]/40 transition-all"
                  />
                  <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                    {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2 uppercase tracking-wide">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showNew ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                    placeholder="Min. 6 characters"
                    className="w-full pl-10 pr-10 py-3 text-sm bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#313866]/40 dark:focus:ring-[#8A92D0]/40 transition-all"
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2 uppercase tracking-wide">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                    placeholder="Re-enter new password"
                    className="w-full pl-10 pr-10 py-3 text-sm bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#313866]/40 dark:focus:ring-[#8A92D0]/40 transition-all"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-500 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-3 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 text-sm font-semibold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-3 bg-[#313866] hover:bg-[#8A92D0] disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
