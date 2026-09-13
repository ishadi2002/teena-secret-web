import React from 'react';
import { ShoppingBag, User, LogOut, LayoutDashboard } from 'lucide-react';
import { useCart } from '../context/CartContext';

const Navbar = ({ user, onOpenCart, onOpenAuth, onOpenDashboard, onLogout }) => {
  const cartContext = useCart ? useCart() : null;
  const cart = cartContext?.cart || [];
  const cartCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  return (
    <>
      <div className="bg-[#f59e0b] text-black font-extrabold text-[10px] md:text-xs tracking-[0.2em] py-2 text-center uppercase shadow-inner">
        AWARD-WINNING COSMETIC BRAND • ISLANDWIDE CASH ON DELIVERY • 100% AUTHENTIC ORGANIC
      </div>

      <header className="bg-[#080808] border-b border-neutral-900 px-6 md:px-12 py-5 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center relative">
          <div className="flex-1" />
          
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-serif tracking-[0.25em] text-[#eab308] font-bold uppercase">
              TEENA'S SECRET
            </h1>
            <p className="text-[10px] uppercase tracking-[0.35em] text-neutral-400 font-medium mt-1">
              Glow up with confidence
            </p>
          </div>

          <div className="flex-1 flex justify-end items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                {user.role === 'admin' && (
                  <button
                    onClick={onOpenDashboard}
                    className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/40 text-amber-400 hover:bg-amber-500 hover:text-black px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>ADMIN PANEL</span>
                  </button>
                )}
                <span className="text-xs text-neutral-300 font-medium">{user.name}</span>
                <button
                  onClick={onLogout}
                  title="Sign Out"
                  className="text-neutral-400 hover:text-white p-1 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 text-xs text-amber-400 border border-amber-500/40 px-3 py-1.5 rounded-full hover:bg-amber-500 hover:text-black transition font-bold"
              >
                <User className="w-3.5 h-3.5" />
                <span>SIGN IN</span>
              </button>
            )}

            <button
              onClick={onOpenCart}
              className="w-10 h-10 rounded-full border border-amber-500/50 flex items-center justify-center text-amber-400 hover:border-amber-400 transition relative"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-black text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>
    </>
  );
};

export default Navbar;
