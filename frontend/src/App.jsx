import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Navbar from './components/Navbar';
import ProductCard from './components/ProductCard';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import CartModal from './components/CartModal';
import ProfileModal from './components/ProfileModal';
import AdminDashboard from './components/AdminDashboard';
import ResetPassword from './components/ResetPassword';
import { CartProvider } from './context/CartContext';
import { Award, Sparkles, Truck } from 'lucide-react';

const CATEGORIES = ["ALL", "FACIAL SETS", "SERUMS", "SKIN CARE", "BODY CARE"];
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

function StoreContent() {
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [products, setProducts] = useState([]);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('ts_user');
    return saved ? JSON.parse(saved) : null;
  });

  const loadProducts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products`);
      const data = await res.json();
      if (data.success) setProducts(data.products);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('ts_user');
    localStorage.removeItem('ts_token');
    setUser(null);
    setIsProfileOpen(false);
  };

  const filteredProducts = selectedCategory === "ALL"
    ? products
    : products.filter(p => p.category?.toUpperCase() === selectedCategory.toUpperCase());

  if (user?.role === 'admin') {
    return (
      <div className="min-h-screen bg-[#070707] text-white flex flex-col font-sans">
        <AdminDashboard
          onLogout={handleLogout}
          onProductUpdated={loadProducts}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070707] text-white flex flex-col font-sans">
      <Navbar 
        user={user}
        onOpenCart={() => setIsCartOpen(true)} 
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onLogout={handleLogout}
      />

      <div className="max-w-7xl mx-auto px-6 pt-6 flex flex-wrap gap-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition ${
              selectedCategory === cat
                ? 'bg-[#f59e0b] text-black shadow-md'
                : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <section className="text-center py-16 px-6 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 border border-amber-500/40 px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-6 bg-amber-500/5">
          <Award className="w-3.5 h-3.5" />
          PINNACLE AWARD WINNER 2025 • BEST BRAND COSMETICS
        </div>

        <h2 className="text-4xl md:text-5xl font-serif font-normal tracking-wide text-white leading-tight">
          Luxury Herbal Formulas for <br />
          <span className="text-[#f59e0b] italic font-serif font-light">Flawless Radiance</span>
        </h2>

        <p className="text-neutral-400 text-xs md:text-sm mt-5 max-w-xl mx-auto leading-relaxed">
          Indulge in authentic saffron, raw organic avocado, pure spearmint scrubs, and advanced herbal serums created to transform your skin tone with lasting radiance.
        </p>
      </section>

      <main className="max-w-7xl mx-auto px-6 pb-20 flex-1 w-full">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-serif text-lg tracking-wider text-amber-400 font-bold uppercase">
            SIGNATURE COLLECTION
          </h3>
          <span className="text-[11px] text-neutral-500 font-medium">
            {filteredProducts.length} ITEMS AVAILABLE
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </main>

      <Footer />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(userData) => {
          setUser(userData);
          loadProducts();
        }}
      />

      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        onUserUpdated={(updatedUser) => setUser(updatedUser)}
      />
    </div>
  );
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <CartProvider>
        <Router>
          <Routes>
            <Route path="/" element={<StoreContent />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
          </Routes>
        </Router>
      </CartProvider>
    </GoogleOAuthProvider>
  );
}