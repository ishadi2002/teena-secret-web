import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Star, ArrowLeft, ShoppingBag, ShieldCheck, Sparkles, Send, CheckCircle2 } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function ProductDetail({ user, onOpenAuth }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState([
    {
      id: 'rev_1',
      name: 'Nadeesha Fernando',
      rating: 5,
      date: '2 days ago',
      comment: 'Absolutely love the natural glow this leaves on my skin. Visible results within a week!'
    },
    {
      id: 'rev_2',
      name: 'Kavindi Perera',
      rating: 5,
      date: '1 week ago',
      comment: 'Authentic herbal scent and very lightweight. Perfect for everyday wear.'
    }
  ]);

  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/products`);
        const data = await res.json();
        if (data.success) {
          const found = data.products.find(p => String(p._id) === String(id));
          setProduct(found || null);
        }
      } catch (err) {
        console.error('Failed to fetch product details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
    window.scrollTo(0, 0);
  }, [id]);

  const handleAddReview = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    if (!user) {
      onOpenAuth();
      return;
    }

    const reviewObj = {
      id: `rev_${Date.now()}`,
      name: user.name || 'Verified Buyer',
      rating: Number(newRating),
      date: 'Just now',
      comment: newComment.trim()
    };

    setReviews([reviewObj, ...reviews]);
    setNewComment('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070707] text-white flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#070707] text-white flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-serif text-amber-400 mb-2">Product Not Found</h2>
        <p className="text-neutral-500 text-xs mb-6">The requested luxury formula does not exist or has been retired.</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500 text-black hover:bg-amber-400 transition"
        >
          Return to Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070707] text-white flex flex-col font-sans">
      <main className="max-w-6xl mx-auto px-6 py-10 flex-1 w-full">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-neutral-400 hover:text-amber-400 transition text-xs font-semibold uppercase tracking-wider mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Collection
        </button>

        {/* Product Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          {/* Image Display */}
          <div className="relative rounded-3xl overflow-hidden border border-neutral-800 bg-[#111] group">
            <img
              src={product.image}
              alt={product.name}
              className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-700"
            />
            {product.isSpecialOffer && (
              <span className="absolute top-4 left-4 bg-amber-500 text-black font-extrabold text-[10px] tracking-widest px-3 py-1 rounded-full uppercase">
                Special Offer
              </span>
            )}
          </div>

          {/* Details & Purchase */}
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-amber-500 tracking-[0.25em] uppercase mb-2">
              {product.category}
            </span>
            <h1 className="text-3xl md:text-4xl font-serif text-white tracking-wide mb-4">
              {product.name}
            </h1>

            {/* Ratings Summary */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < Math.floor(product.rating || 5) ? 'fill-amber-400' : 'text-neutral-700'}`}
                  />
                ))}
              </div>
              <span className="text-xs text-neutral-400">
                ({reviews.length} Customer Reviews)
              </span>
            </div>

            {/* Pricing */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-2xl md:text-3xl font-mono font-bold text-[#f59e0b]">
                Rs. {Number(product.price).toLocaleString()}
              </span>
              {product.discountPrice && (
                <span className="text-sm font-mono text-neutral-600 line-through">
                  Rs. {Number(product.discountPrice).toLocaleString()}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-neutral-300 text-sm leading-relaxed mb-8 border-t border-b border-neutral-800/80 py-5">
              {product.description || "An exquisite formulation blended with organic botanicals to rejuvenate and nourish the skin with long-lasting vitality."}
            </p>

            {/* Quantity and Add to Cart */}
            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center border border-neutral-800 rounded-full bg-[#111] px-3 py-1.5">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="px-2 text-neutral-400 hover:text-white transition"
                >
                  -
                </button>
                <span className="px-3 font-mono text-sm">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => q + 1)}
                  className="px-2 text-neutral-400 hover:text-white transition"
                >
                  +
                </button>
              </div>

              <button
                onClick={() => {
                  addToCart({ ...product, quantity });
                }}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500 text-black hover:bg-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)] transition"
              >
                <ShoppingBag className="w-4 h-4" /> Add to Cart
              </button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-3 text-neutral-400 text-xs pt-4 border-t border-neutral-900">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <span>100% Authentic Organic Herbal</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Dermatologist Approved</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <section className="mt-20 border-t border-neutral-800/80 pt-12">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-serif text-xl tracking-wider text-amber-400 uppercase font-bold">
              Customer Reviews
            </h3>
            <span className="text-xs text-neutral-500">
              Verified Purchases
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Add Review Box */}
            <div className="bg-[#111111] border border-neutral-800 p-6 rounded-2xl h-fit">
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                Share Your Experience
              </h4>
              <form onSubmit={handleAddReview} className="space-y-4">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Your Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setNewRating(star)}
                        className="text-amber-400"
                      >
                        <Star
                          className={`w-5 h-5 ${star <= newRating ? 'fill-amber-400' : 'text-neutral-700'}`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Your Review</label>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Tell other shoppers how this worked for you..."
                    rows={3}
                    className="w-full bg-[#181818] border border-neutral-700 rounded-xl p-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-neutral-800 text-amber-400 border border-amber-500/30 hover:bg-amber-500 hover:text-black transition"
                >
                  <Send className="w-3.5 h-3.5" /> Submit Review
                </button>
              </form>
            </div>

            {/* Reviews Feed */}
            <div className="lg:col-span-2 space-y-4">
              {reviews.map((rev) => (
                <div key={rev.id} className="p-5 bg-[#0e0e0e] border border-neutral-900 rounded-2xl">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white tracking-wide">{rev.name}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <span className="text-[11px] text-neutral-600">{rev.date}</span>
                  </div>

                  <div className="flex text-amber-400 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-amber-400' : 'text-neutral-700'}`}
                      />
                    ))}
                  </div>

                  <p className="text-xs text-neutral-300 leading-relaxed">{rev.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}