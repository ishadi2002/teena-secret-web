import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Navbar from './components/Navbar';
import ProductCard from './components/ProductCard';
import ProductDetail from './components/ProductDetail';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import CartModal from './components/CartModal';
import ProfileModal from './components/ProfileModal';
import AdminDashboard from './components/AdminDashboard';
import ResetPassword from './components/ResetPassword';
import { CartProvider } from './context/CartContext';
import { Award, Search, X, SlidersHorizontal, ArrowUpDown, Tag, RotateCcw } from 'lucide-react';

const CATEGORIES = ["ALL", "FACIAL SETS", "SERUMS", "SKIN CARE", "BODY CARE"];
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

function StoreContent({ products, user, onOpenCart, onOpenAuth, onOpenProfile, onLogout }) {
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [maxPrice, setMaxPrice] = useState(15000);
  const [onlySpecialOffers, setOnlySpecialOffers] = useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  const resetAllFilters = () => {
    setSelectedCategory("ALL");
    setSearchQuery("");
    setSortBy("featured");
    setMaxPrice(15000);
    setOnlySpecialOffers(false);
  };

  const filteredProducts = useMemo(() => {
    let result = products.filter(p => {
      const matchesCategory = selectedCategory === "ALL" || 
        p.category?.toUpperCase() === selectedCategory.toUpperCase();
      
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch = query === "" || 
        p.name?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query);

      const price = Number(p.price) || 0;
      const matchesPrice = price <= maxPrice;

      const matchesOffer = !onlySpecialOffers || p.isSpecialOffer;

      return matchesCategory && matchesSearch && matchesPrice && matchesOffer;
    });

    switch (sortBy) {
      case 'price-low':
        return result.sort((a, b) => (a.price || 0) - (b.price || 0));
      case 'price-high':
        return result.sort((a, b) => (b.price || 0) - (a.price || 0));
      case 'rating':
        return result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      default:
        return result;
    }
  }, [products, selectedCategory, searchQuery, sortBy, maxPrice, onlySpecialOffers]);

  return (
    <div className="min-h-screen bg-[#070707] text-white flex flex-col font-sans">
      <Navbar 
        user={user}
        onOpenCart={onOpenCart} 
        onOpenAuth={onOpenAuth}
        onOpenProfile={onOpenProfile}
        onLogout={onLogout}
      />

      {/* Category Pills */}
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

      {/* Hero Section */}
      <section className="text-center py-14 px-6 max-w-4xl mx-auto">
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
        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="font-serif text-lg tracking-wider text-amber-400 font-bold uppercase">
              SIGNATURE COLLECTION
            </h3>
            <span className="text-[11px] text-neutral-500 font-medium tracking-wide">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'ITEM' : 'ITEMS'} AVAILABLE
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full bg-[#111111] border border-neutral-800 rounded-full pl-9 pr-9 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Sort Dropdown */}
            <div className="relative flex items-center">
              <ArrowUpDown className="absolute left-3 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-[#111111] border border-neutral-800 rounded-full pl-8 pr-8 py-2 text-xs text-neutral-300 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>

            {/* Filter Toggle Button */}
            <button
              onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-wide border transition ${
                isFilterPanelOpen || onlySpecialOffers || maxPrice < 15000
                  ? 'bg-amber-500 text-black border-amber-500'
                  : 'bg-[#111111] text-neutral-300 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters {(onlySpecialOffers || maxPrice < 15000) && '•'}
            </button>
          </div>
        </div>

        {/* Collapsible Advanced Filters Tray */}
        {isFilterPanelOpen && (
          <div className="mb-8 p-5 bg-[#0f0f0f] border border-neutral-800 rounded-2xl flex flex-wrap items-center justify-between gap-6">
            <div className="flex-1 min-w-[220px]">
              <div className="flex justify-between text-xs text-neutral-400 mb-2">
                <span>Max Price</span>
                <span className="text-amber-400 font-mono font-bold">Rs. {maxPrice.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="500"
                max="15000"
                step="250"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-amber-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
              />
            </div>

            <label className="flex items-center gap-2.5 text-xs text-neutral-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlySpecialOffers}
                onChange={(e) => setOnlySpecialOffers(e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
              <Tag className="w-3.5 h-3.5 text-amber-400" />
              Special Offers Only
            </label>

            <button
              onClick={resetAllFilters}
              className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-amber-400 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset All
            </button>
          </div>
        )}

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-neutral-900 rounded-2xl bg-[#0c0c0c]/50">
            <Search className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
            <p className="text-neutral-300 font-serif text-base tracking-wide">
              No products match your criteria
            </p>
            <p className="text-neutral-500 text-xs mt-1">
              Try adjusting your price range, clearing your search, or selecting another category.
            </p>
            <button
              onClick={resetAllFilters}
              className="mt-5 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500 hover:text-black transition"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function App() {
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
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <CartProvider>
        <Router>
          <Routes>
            <Route 
              path="/" 
              element={
                <StoreContent 
                  products={products}
                  user={user}
                  onOpenCart={() => setIsCartOpen(true)}
                  onOpenAuth={() => setIsAuthOpen(true)}
                  onOpenProfile={() => setIsProfileOpen(true)}
                  onLogout={handleLogout}
                />
              } 
            />
            <Route 
              path="/product/:id" 
              element={
                <div className="min-h-screen bg-[#070707] text-white flex flex-col font-sans">
                  <Navbar 
                    user={user}
                    onOpenCart={() => setIsCartOpen(true)} 
                    onOpenAuth={() => setIsAuthOpen(true)}
                    onOpenProfile={() => setIsProfileOpen(true)}
                    onLogout={handleLogout}
                  />
                  <ProductDetail 
                    user={user} 
                    onOpenAuth={() => setIsAuthOpen(true)} 
                  />
                  <Footer />
                </div>
              } 
            />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
          </Routes>

          {/* Global App Modals */}
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
        </Router>
      </CartProvider>
    </GoogleOAuthProvider>
  );
}