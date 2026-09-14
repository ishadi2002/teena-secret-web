import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function AuthModal({ isOpen, onClose, onSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Google authentication failed');
      }

      if (data.token) localStorage.setItem('ts_token', data.token);
      if (data.user) {
        localStorage.setItem('ts_user', JSON.stringify(data.user));
        if (onSuccess) onSuccess(data.user);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    try {
      let endpoint = '';
      let payload = {};

      if (isForgotPassword) {
        endpoint = '/api/auth/forgot-password';
        payload = { email: cleanEmail };
      } else {
        endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
        payload = isLogin 
          ? { email: cleanEmail, password: cleanPassword }
          : { name, email: cleanEmail, password: cleanPassword, phone: phone || '0700000000' };
      }

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        throw new Error(`Server Error (${res.status}): Please check backend terminal logs.`);
      }

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Action failed. Please check details.');
      }

      if (isForgotPassword) {
        setMessage('Password reset link sent to your email successfully!');
      } else {
        if (data.token) localStorage.setItem('ts_token', data.token);
        if (data.user) {
          localStorage.setItem('ts_user', JSON.stringify(data.user));
          if (onSuccess) onSuccess(data.user);
        }
        onClose();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#121212] border border-neutral-800 rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {!isForgotPassword && (
          <div className="flex border-b border-neutral-800 pb-3 mb-6">
            <button
              type="button"
              onClick={() => { setIsLogin(true); setIsForgotPassword(false); setError(''); setMessage(''); }}
              className={`flex-1 text-center font-bold text-xs uppercase tracking-wider pb-2 border-b-2 transition ${
                isLogin ? 'text-amber-400 border-amber-400' : 'text-neutral-500 border-transparent hover:text-neutral-300'
              }`}
            >
              SIGN IN
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setIsForgotPassword(false); setError(''); setMessage(''); }}
              className={`flex-1 text-center font-bold text-xs uppercase tracking-wider pb-2 border-b-2 transition ${
                !isLogin ? 'text-amber-400 border-amber-400' : 'text-neutral-500 border-transparent hover:text-neutral-300'
              }`}
            >
              REGISTER ACCOUNT
            </button>
          </div>
        )}

        {isForgotPassword && (
          <div className="mb-6 border-b border-neutral-800 pb-3">
            <h3 className="text-amber-400 font-bold text-sm uppercase tracking-wider">Reset Password</h3>
            <p className="text-neutral-400 text-xs mt-1">Enter your email to receive a password reset link.</p>
          </div>
        )}

        {error && (
          <div className="bg-red-950/40 border border-red-900/60 text-red-300 p-3 rounded-xl text-xs flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="bg-emerald-950/40 border border-emerald-900/60 text-emerald-300 p-3 rounded-xl text-xs mb-4">
            <span>{message}</span>
          </div>
        )}

        {/* Google Authentication Button */}
        {!isForgotPassword && (
          <div className="mb-4">
            <div className="flex justify-center w-full">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google Sign-In was unsuccessful. Try again.')}
                theme="filled_black"
                shape="pill"
                size="large"
                width="100%"
              />
            </div>
            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-neutral-800 w-full"></div>
              <span className="bg-[#121212] px-3 text-[10px] text-neutral-500 uppercase tracking-widest absolute">
                or with email
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && !isForgotPassword && (
            <>
              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#1c1c1c] border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#1c1c1c] border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#1c1c1c] border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {!isForgotPassword && (
            <div>
              <label className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#1c1c1c] border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
              {isLogin && (
                <div className="text-right mt-1.5">
                  <button
                    type="button"
                    onClick={() => { setIsForgotPassword(true); setError(''); setMessage(''); }}
                    className="text-xs text-amber-400 hover:underline focus:outline-none"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#f59e0b] hover:bg-[#d97706] text-black font-bold py-2.5 rounded-lg text-xs uppercase tracking-wider transition disabled:opacity-50 mt-2"
          >
            {loading ? 'Processing...' : (isForgotPassword ? 'Send Reset Link' : (isLogin ? 'Sign In' : 'Create Account'))}
          </button>

          {isForgotPassword && (
            <div className="text-center mt-3">
              <button
                type="button"
                onClick={() => { setIsForgotPassword(false); setError(''); setMessage(''); }}
                className="text-xs text-neutral-400 hover:text-white"
              >
                Back to Sign In
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}