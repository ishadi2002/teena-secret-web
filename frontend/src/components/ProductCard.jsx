import React from 'react';
import { Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const handleOpenDetail = () => {
    navigate(`/product/${product._id}`);
  };

  const handleWhatsApp = (e) => {
    e.stopPropagation(); // Prevents navigating when WhatsApp is clicked
    const phone = "94766532276";
    const msg = `Hi Teena's Secret, I would like to order: ${product.name} (Rs. ${product.price?.toLocaleString()})`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleAddToCart = (e) => {
    e.stopPropagation(); // Prevents navigating when + ADD is clicked
    addToCart(product);
  };

  return (
    <div className="bg-[#121212] border border-neutral-800 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-neutral-700 transition group">
      {/* Clickable Area: Image, Title, Description & Pricing */}
      <div onClick={handleOpenDetail} className="cursor-pointer">
        <div className="relative aspect-square w-full bg-[#181818] overflow-hidden flex items-center justify-center">
          {product.isSpecialOffer && (
            <span className="absolute top-3 left-3 bg-[#f59e0b] text-black font-extrabold text-[9px] px-2.5 py-1 rounded-full uppercase tracking-wider z-10">
              SPECIAL OFFER
            </span>
          )}
          <img
            src={product.image || 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=600&q=80'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>

        <div className="p-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] uppercase tracking-wider text-amber-500/80 font-bold">
              {product.category}
            </span>
            <div className="flex text-amber-400">
              {[...Array(product.rating || 5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-amber-400" />
              ))}
            </div>
          </div>

          <h3 className="text-white text-sm font-semibold truncate mt-1 group-hover:text-amber-400 transition">
            {product.name}
          </h3>
          <p className="text-neutral-400 text-xs mt-1 line-clamp-2 leading-relaxed">
            {product.description}
          </p>

          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-amber-400 font-bold text-sm">
              Rs. {product.price?.toLocaleString()}
            </span>
            {product.discountPrice && (
              <span className="text-neutral-500 text-xs line-through">
                Rs. {product.discountPrice.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons: Clicks do not trigger navigation */}
      <div className="p-4 pt-0 grid grid-cols-2 gap-2 mt-2">
        <button
          onClick={handleAddToCart}
          className="bg-[#f59e0b] hover:bg-[#d97706] text-black font-bold text-xs py-2 rounded-lg transition"
        >
          + ADD
        </button>
        <button
          onClick={handleWhatsApp}
          className="bg-[#14532d] hover:bg-[#166534] text-white font-bold text-xs py-2 rounded-lg transition"
        >
          WHATSAPP
        </button>
      </div>
    </div>
  );
};

export default ProductCard;