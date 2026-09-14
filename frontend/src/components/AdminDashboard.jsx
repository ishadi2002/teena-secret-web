import React, { useState, useEffect } from 'react';
import { Package, ShoppingCart, CheckCircle, Mail, DollarSign, Clock, RefreshCw, Store, Plus, Edit2, Trash2, Upload, LogOut } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function AdminDashboard({ onLogout, onProductUpdated }) {
  const [activeTab, setActiveTab] = useState('orders');
  const [statusFilter, setStatusFilter] = useState('All');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [emailNotice, setEmailNotice] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Form State for Products
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('SKIN CARE');
  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      // Products fetch
      const pRes = await fetch(`${API_BASE_URL}/api/products`);
      const pData = await pRes.json();
      if (pData.success && Array.isArray(pData.products)) {
        setProducts(pData.products);
      } else if (Array.isArray(pData)) {
        setProducts(pData);
      }

      // Orders fetch
      const oRes = await fetch(`${API_BASE_URL}/api/orders`);
      const oData = await oRes.json();
      console.log('[Admin Orders API Response]:', oData);

      if (oData.success && Array.isArray(oData.orders)) {
        setOrders(oData.orders);
      } else if (Array.isArray(oData)) {
        setOrders(oData);
      } else {
        setOrders([]);
      }
    } catch (e) {
      console.error('Failed to fetch dashboard data:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      name,
      category,
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : undefined,
      description,
      image: image || 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=600&q=80'
    };

    const url = editingId ? `${API_BASE_URL}/api/products/${editingId}` : `${API_BASE_URL}/api/products`;
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        resetForm();
        fetchData();
        if (onProductUpdated) onProductUpdated();
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (p) => {
    setActiveTab('products');
    setEditingId(p._id);
    setName(p.name);
    setCategory(p.category);
    setPrice(p.price);
    setDiscountPrice(p.discountPrice || '');
    setDescription(p.description || '');
    setImage(p.image || '');
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await fetch(`${API_BASE_URL}/api/products/${id}`, { method: 'DELETE' });
      fetchData();
      if (onProductUpdated) onProductUpdated();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleStatusChange = async (orderId, newStatus, customerEmail) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
        setEmailNotice(`Order marked as '${newStatus}'! Confirmation email dispatched to ${customerEmail}`);
        setTimeout(() => setEmailNotice(''), 5000);
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setCategory('SKIN CARE');
    setPrice('');
    setDiscountPrice('');
    setDescription('');
    setImage('');
  };

  // Metrics Calculations (case-insensitive checks)
  const totalRevenue = orders
    .filter(o => {
      const st = (o.status || '').toLowerCase();
      return st === 'completed' || st === 'processing';
    })
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  
  const pendingCount = orders.filter(o => {
    const st = (o.status || '').toLowerCase();
    return !st || st === 'pending';
  }).length;

  const confirmedCount = orders.filter(o => {
    const st = (o.status || '').toLowerCase();
    return st === 'completed' || st === 'processing';
  }).length;

  const filteredOrders = orders.filter(o => {
    const st = (o.status || 'pending').toLowerCase();
    if (statusFilter === 'All') return true;
    if (statusFilter === 'Pending') return st === 'pending';
    if (statusFilter === 'Confirmed') return st === 'completed' || st === 'processing';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#070707] text-white flex flex-col font-sans">
      
      {/* Top Announcement Bar */}
      <div className="bg-[#f59e0b] text-black font-extrabold text-[10px] md:text-xs tracking-[0.15em] py-2 px-6 text-center uppercase shadow-inner">
        AWARD-WINNING COSMETIC BRAND ❖ CREDIT/DEBIT CARDS, COD & DIRECT WHATSAPP ORDERS AVAILABLE
      </div>

      {/* Header */}
      <header className="bg-[#0b0b0b] border-b border-neutral-900 px-6 md:px-12 py-5 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-serif tracking-[0.2em] text-[#eab308] font-bold uppercase">
              TEENA'S SECRET
            </h1>
            <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-400 font-medium mt-0.5">
              GLOW UP WITH CONFIDENCE
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                localStorage.removeItem('ts_user');
                localStorage.removeItem('ts_token');
                window.location.reload();
              }}
              className="flex items-center gap-2 bg-[#161616] border border-amber-500/40 text-amber-400 hover:bg-amber-500 hover:text-black px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition shadow"
            >
              <Store className="w-4 h-4" />
              <span>CUSTOMER STORE VIEW</span>
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 bg-red-950/40 border border-red-900/50 text-red-400 hover:bg-red-900 hover:text-white px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span>LOGOUT</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Container */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full space-y-8">

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-[#121212] border border-neutral-800/80 rounded-2xl p-5 flex flex-col justify-between shadow-lg">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">TOTAL REVENUE</span>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-[10px] tracking-widest">
                LKR
              </span>
            </div>
            <div className="mt-4">
              <div className="text-2xl md:text-3xl font-mono font-extrabold text-white">
                Rs. {totalRevenue.toLocaleString()}
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">Across all store checkouts</p>
            </div>
          </div>

          <div className="bg-[#121212] border border-neutral-800/80 rounded-2xl p-5 flex flex-col justify-between shadow-lg">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">PENDING ORDERS</span>
              <span className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Clock className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-4">
              <div className="text-2xl md:text-3xl font-mono font-extrabold text-amber-400">
                {pendingCount} Orders
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">Needs confirmation & dispatch</p>
            </div>
          </div>

          <div className="bg-[#121212] border border-neutral-800/80 rounded-2xl p-5 flex flex-col justify-between shadow-lg">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">CONFIRMED ORDERS</span>
              <span className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-4">
              <div className="text-2xl md:text-3xl font-mono font-extrabold text-emerald-400">
                {confirmedCount} Orders
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">Notification mail sent</p>
            </div>
          </div>

          <div className="bg-[#121212] border border-neutral-800/80 rounded-2xl p-5 flex flex-col justify-between shadow-lg">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">CATALOG ITEMS</span>
              <span className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Package className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-4">
              <div className="text-2xl md:text-3xl font-mono font-extrabold text-white">
                {products.length} Products
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">Live in store</p>
            </div>
          </div>
        </div>

        {/* Email Notification Banner */}
        {emailNotice && (
          <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 px-6 py-3.5 rounded-2xl text-xs flex items-center gap-3 shadow-lg">
            <Mail className="w-5 h-5 shrink-0 text-emerald-400" />
            <span className="font-semibold">{emailNotice}</span>
          </div>
        )}

        {/* Action & Filter Bar */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-[#121212] border border-neutral-800/80 p-3 rounded-2xl">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 ${
                activeTab === 'orders' ? 'bg-[#f59e0b] text-black shadow-md' : 'bg-[#181818] text-neutral-400 hover:text-white'
              }`}
            >
              <ShoppingCart className="w-4 h-4" /> CUSTOMER ORDERS ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 ${
                activeTab === 'products' ? 'bg-[#f59e0b] text-black shadow-md' : 'bg-[#181818] text-neutral-400 hover:text-white'
              }`}
            >
              <Package className="w-4 h-4" /> MANAGE PRODUCTS ({products.length})
            </button>
          </div>

          {activeTab === 'orders' && (
            <div className="flex items-center gap-2 bg-[#181818] px-3 py-1.5 rounded-xl border border-neutral-800">
              <span className="text-[11px] text-neutral-400 font-bold uppercase px-2">FILTER:</span>
              {['All', 'Pending', 'Confirmed'].map(f => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition ${
                    statusFilter === f ? 'bg-amber-500 text-black' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
              <button
                onClick={fetchData}
                disabled={isRefreshing}
                className="p-1.5 text-neutral-400 hover:text-amber-400 transition ml-2 border-l border-neutral-800 pl-2"
                title="Refresh Data"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
              </button>
            </div>
          )}
        </div>

        {/* Main Content View */}
        {activeTab === 'orders' ? (
          <div className="bg-[#121212] border border-neutral-800/80 rounded-2xl p-6 shadow-xl overflow-x-auto min-h-[350px]">
            {filteredOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-neutral-500 space-y-3">
                <Package className="w-12 h-12 stroke-1 text-neutral-600" />
                <p className="text-sm font-medium">
                  {orders.length > 0 
                    ? `No orders matching filter "${statusFilter}". (Total store orders: ${orders.length})` 
                    : 'No orders recorded in database yet.'}
                </p>
                {orders.length > 0 && statusFilter !== 'All' && (
                  <button 
                    onClick={() => setStatusFilter('All')} 
                    className="text-xs text-amber-400 hover:underline uppercase font-bold tracking-wider"
                  >
                    View All {orders.length} Orders
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-400 uppercase text-xs tracking-wider">
                    <th className="pb-4">CUSTOMER INFO</th>
                    <th className="pb-4">CONTACT & ADDRESS</th>
                    <th className="pb-4">ORDERED ITEMS</th>
                    <th className="pb-4">TOTAL AMOUNT</th>
                    <th className="pb-4">CONFIRM / STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/80">
                  {filteredOrders.map(o => (
                    <tr key={o._id} className="hover:bg-neutral-900/50 transition">
                      <td className="py-4 font-bold text-white">
                        <div className="text-base">{o.customerName || 'Guest Customer'}</div>
                        <div className="text-xs text-amber-400 font-normal font-mono">{o.customerEmail}</div>
                      </td>
                      <td className="py-4 text-neutral-300">
                        <div className="font-semibold">{o.customerPhone || 'N/A'}</div>
                        <div className="text-xs text-neutral-400 mt-0.5">{o.customerAddress || 'No address provided'}</div>
                      </td>
                      <td className="py-4 text-neutral-300">
                        {o.items && o.items.map((item, idx) => (
                          <div key={idx} className="text-xs py-0.5">
                            • <strong className="text-white">{item.name}</strong> <span className="text-amber-400">x{item.quantity || 1}</span>
                          </div>
                        ))}
                      </td>
                      <td className="py-4 font-mono font-extrabold text-amber-400 text-base">
                        Rs. {(o.totalAmount || 0).toLocaleString()}
                      </td>
                      <td className="py-4">
                        <div className="flex flex-col gap-1.5">
                          <select
                            value={o.status || 'Pending'}
                            onChange={(e) => handleStatusChange(o._id, e.target.value, o.customerEmail)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#1c1c1c] border ${
                              (o.status || '').toLowerCase() === 'completed' || (o.status || '').toLowerCase() === 'processing'
                                ? 'text-emerald-400 border-emerald-500/50'
                                : 'text-amber-400 border-amber-500/50'
                            }`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Processing">Processing</option>
                            <option value="Completed">Completed (Confirm)</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                          <span className="text-[10px] text-neutral-500 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-amber-400" /> Auto-mails on status update
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Add / Edit Product Form with File Upload */}
            <div className="bg-[#121212] border border-neutral-800/80 rounded-2xl p-6 shadow-xl h-fit">
              <h3 className="text-base font-bold text-amber-400 uppercase tracking-wider mb-5 flex items-center gap-2 border-b border-neutral-800 pb-3">
                <Plus className="w-5 h-5" /> {editingId ? "Edit Product Details" : "Add New Signature Product"}
              </h3>
              <form onSubmit={handleSaveProduct} className="space-y-4 text-sm">
                <div>
                  <label className="block text-neutral-300 mb-1.5 uppercase font-bold text-xs tracking-wider">Product Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Saffron Glow Face Cream"
                    className="w-full bg-[#1c1c1c] border border-neutral-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-neutral-300 mb-1.5 uppercase font-bold text-xs tracking-wider">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-[#1c1c1c] border border-neutral-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value="SKIN CARE">SKIN CARE</option>
                    <option value="HAIR CARE">HAIR CARE</option>
                    <option value="BODY CARE">BODY CARE</option>
                    <option value="FACIAL SETS">FACIAL SETS</option>
                    <option value="SERUMS">SERUMS</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-300 mb-1.5 uppercase font-bold text-xs tracking-wider">Price (LKR)</label>
                    <input
                      type="number"
                      required
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                      placeholder="1500"
                      className="w-full bg-[#1c1c1c] border border-neutral-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-300 mb-1.5 uppercase font-bold text-xs tracking-wider">Discount Price</label>
                    <input
                      type="number"
                      value={discountPrice}
                      onChange={e => setDiscountPrice(e.target.value)}
                      placeholder="1800"
                      className="w-full bg-[#1c1c1c] border border-neutral-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-neutral-300 mb-1.5 uppercase font-bold text-xs tracking-wider">Upload Product Image</label>
                  <div className="flex items-center gap-3">
                    <label className="flex-1 flex items-center justify-center gap-2 bg-[#1c1c1c] hover:bg-neutral-800 border border-dashed border-neutral-700 rounded-xl px-4 py-3 cursor-pointer text-xs text-neutral-300 transition">
                      <Upload className="w-4 h-4 text-amber-400" />
                      <span>{image ? "Change Image File" : "Choose Image from PC"}</span>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  </div>
                  {image && (
                    <div className="mt-3 flex items-center gap-3 bg-[#1c1c1c] p-2 rounded-xl border border-neutral-800">
                      <img src={image} alt="Preview" className="w-12 h-12 object-cover rounded-lg" />
                      <span className="text-[11px] text-emerald-400 font-medium">Image loaded successfully!</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-neutral-300 mb-1.5 uppercase font-bold text-xs tracking-wider">Description</label>
                  <textarea
                    rows="3"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Write product benefits..."
                    className="w-full bg-[#1c1c1c] border border-neutral-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-extrabold py-3.5 rounded-xl transition uppercase text-xs tracking-widest shadow-lg shadow-amber-500/20"
                  >
                    {editingId ? "Update Product" : "Publish Product"}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-5 py-3.5 rounded-xl text-xs font-bold uppercase"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Products Table */}
            <div className="xl:col-span-2 bg-[#121212] border border-neutral-800/80 rounded-2xl p-6 shadow-xl overflow-x-auto">
              <h3 className="text-base font-bold text-amber-400 uppercase tracking-wider mb-4">
                Active Products Inventory
              </h3>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-400 uppercase text-xs tracking-wider">
                    <th className="pb-4">ITEM DETAILS</th>
                    <th className="pb-4">CATEGORY</th>
                    <th className="pb-4">PRICE</th>
                    <th className="pb-4 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/80">
                  {products.map(p => (
                    <tr key={p._id} className="hover:bg-neutral-900/50 transition">
                      <td className="py-4 flex items-center gap-4">
                        <img src={p.image} alt={p.name} className="w-14 h-14 object-cover rounded-xl bg-neutral-800 shadow" />
                        <div>
                          <div className="font-bold text-white text-base">{p.name}</div>
                          <div className="text-xs text-neutral-400 truncate max-w-xs">{p.description}</div>
                        </div>
                      </td>
                      <td className="py-4 text-amber-400 font-bold text-xs uppercase tracking-wider">{p.category}</td>
                      <td className="py-4 font-mono font-bold text-base">Rs. {p.price.toLocaleString()}</td>
                      <td className="py-4 text-right">
                        <button
                          onClick={() => handleEdit(p)}
                          className="p-2.5 bg-[#1c1c1c] hover:bg-amber-500 hover:text-black rounded-xl text-neutral-300 transition mr-2"
                          title="Edit Product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p._id)}
                          className="p-2.5 bg-[#1c1c1c] hover:bg-red-500 hover:text-white rounded-xl text-neutral-300 transition"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-[#0b0b0b] border-t border-neutral-900 py-5 text-center text-xs text-neutral-500 uppercase tracking-widest font-semibold mt-auto">
        TEENA'S SECRET BEAUTY STORE • ADMIN CONTROL CENTER 2026
      </footer>

    </div>
  );
}