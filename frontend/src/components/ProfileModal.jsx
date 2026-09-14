import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Package, Save, RefreshCw } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function ProfileModal({ isOpen, onClose, user, onUserUpdated }) {
  const [tab, setTab] = useState('profile'); // 'profile' | 'orders'
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  // Resolve current active user from prop or storage
  const getActiveUser = () => {
    if (user && user.email) return user;
    try {
      const stored = localStorage.getItem('ts_user');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return null;
  };

  const activeUser = getActiveUser();

  const fetchUserOrders = async (targetEmail) => {
    const cleanEmail = (targetEmail || activeUser?.email || '').trim().toLowerCase();
    if (!cleanEmail) return;

    setLoadingOrders(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/user/${encodeURIComponent(cleanEmail)}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
      }
    } catch (e) {
      console.error('Failed to load user orders:', e);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeUser) {
      setName(activeUser.name || '');
      setPhone(activeUser.phone || '');
      setAddress(activeUser.address || '');
      setCity(activeUser.city || '');
      setPostalCode(activeUser.postalCode || '');
      fetchUserOrders(activeUser.email);
    }
  }, [isOpen]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setNotice('');

    const targetEmail = (activeUser?.email || '').trim().toLowerCase();

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          name,
          phone,
          address,
          city,
          postalCode
        })
      });

      const data = await res.json();
      if (data.success) {
        localStorage.setItem('ts_user', JSON.stringify(data.user));
        if (onUserUpdated) onUserUpdated(data.user);
        setNotice('Profile details saved successfully!');
        setTimeout(() => setNotice(''), 4000);
      } else {
        setNotice(data.message || 'Failed to update profile');
      }
    } catch (err) {
      setNotice(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !activeUser) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="bg-[#121212] border border-neutral-800 rounded-2xl w-full max-w-2xl p-6 relative text-white shadow-2xl max-h-[90vh] flex flex-col">
        <button onClick={onClose} className="absolute top-4 right-4 text-neutral-400 hover:text-white z-10">
          <X className="w-5 h-5" />
        </button>

        {/* User Card Header */}
        <div className="flex items-center gap-4 pb-4 border-b border-neutral-800">
          {activeUser.avatar ? (
            <img src={activeUser.avatar} alt="avatar" className="w-14 h-14 rounded-full border border-amber-500/50 object-cover" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-amber-400 font-bold text-xl">
              {activeUser.name?.charAt(0) || 'U'}
            </div>
          )}
          <div>
            <h2 className="text-lg font-serif font-bold text-white uppercase tracking-wider">{activeUser.name}</h2>
            <p className="text-xs text-neutral-400 font-mono">{activeUser.email}</p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex justify-between items-center border-b border-neutral-800 my-4">
          <div className="flex">
            <button
              onClick={() => setTab('profile')}
              className={`pb-2 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
                tab === 'profile' ? 'text-amber-400 border-amber-400' : 'text-neutral-500 border-transparent hover:text-neutral-300'
              }`}
            >
              Edit Profile Details
            </button>
            <button
              onClick={() => {
                setTab('orders');
                fetchUserOrders(activeUser.email);
              }}
              className={`pb-2 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
                tab === 'orders' ? 'text-amber-400 border-amber-400' : 'text-neutral-500 border-transparent hover:text-neutral-300'
              }`}
            >
              My Orders ({orders.length})
            </button>
          </div>

          {tab === 'orders' && (
            <button
              onClick={() => fetchUserOrders(activeUser.email)}
              title="Refresh Orders"
              className="p-1.5 text-neutral-400 hover:text-amber-400 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          )}
        </div>

        {notice && (
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 p-2.5 rounded-xl text-xs mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {/* Edit Profile Form */}
        {tab === 'profile' && (
          <form onSubmit={handleProfileSave} className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
            <div>
              <label className="block text-[10px] font-bold uppercase text-neutral-400 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-[#1c1c1c] border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-neutral-400 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="0771234567"
                  className="w-full bg-[#1c1c1c] border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-neutral-400 mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="Colombo"
                  className="w-full bg-[#1c1c1c] border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-neutral-400 mb-1">Street Address</label>
              <textarea
                rows="2"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="No 12, Flower Road"
                className="w-full bg-[#1c1c1c] border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-neutral-400 mb-1">Postal Code</label>
              <input
                type="text"
                value={postalCode}
                onChange={e => setPostalCode(e.target.value)}
                placeholder="10100"
                className="w-full bg-[#1c1c1c] border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-4 w-full bg-[#f59e0b] hover:bg-[#d97706] text-black font-extrabold py-2.5 rounded-xl uppercase tracking-wider transition flex items-center justify-center gap-2 shadow"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        )}

        {/* Order History Tab */}
        {tab === 'orders' && (
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {loadingOrders ? (
              <div className="flex flex-col items-center justify-center py-12 text-neutral-500 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
                <p className="text-xs">Fetching your order history...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 text-neutral-500 text-xs">
                <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                No orders found for this account yet.
              </div>
            ) : (
              orders.map((o) => (
                <div key={o._id} className="bg-[#1a1a1a] border border-neutral-800 rounded-xl p-3 text-xs space-y-2">
                  <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
                    <span className="font-mono text-[11px] text-neutral-400">ID: {o._id}</span>
                    <span className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] ${
                      o.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {o.status || 'Pending'}
                    </span>
                  </div>
                  <div>
                    {o.items?.map((it, idx) => (
                      <div key={idx} className="flex justify-between text-neutral-300 py-0.5">
                        <span>{it.name} (x{it.quantity || 1})</span>
                        <span className="font-mono text-amber-400">Rs. {(it.price * (it.quantity || 1)).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-neutral-800 font-bold">
                    <span className="text-neutral-400 uppercase text-[10px]">Method: {o.paymentMethod || 'COD'}</span>
                    <span className="text-amber-400 font-mono text-sm">Total: Rs. {o.totalAmount?.toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}