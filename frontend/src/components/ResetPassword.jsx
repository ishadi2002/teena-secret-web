import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`http://localhost:5000/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        throw new Error(`Server Error (${res.status}): Please check backend terminal.`);
      }

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to reset password');
      }

      setMessage('Password updated successfully! Redirecting to home...');
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 min-h-screen">
      <div className="bg-[#121212] border border-neutral-800 rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
        <h2 className="text-amber-400 font-bold text-lg uppercase tracking-wider mb-2">Set New Password</h2>
        <p className="text-neutral-400 text-xs mb-6">Please enter your new password below.</p>

        {error && (
          <div className="bg-red-950/40 border border-red-900/60 text-red-300 p-3 rounded-xl text-xs flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="bg-emerald-950/40 border border-emerald-900/60 text-emerald-300 p-3 rounded-xl text-xs flex items-center gap-2 mb-4">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-1">
              New Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#1c1c1c] border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-[#1c1c1c] border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#f59e0b] hover:bg-[#d97706] text-black font-bold py-2.5 rounded-lg text-xs uppercase tracking-wider transition disabled:opacity-50 mt-2"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}