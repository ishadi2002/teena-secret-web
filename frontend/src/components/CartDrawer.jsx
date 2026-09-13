import React from 'react';
import { X, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function CartDrawer({ onProceedToCheckout }) {
  const { cart, updateQty, totalAmount, totalCount, isCartOpen, setIsCartOpen } = useCart();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#111] border-l border-amber-500/20 text-neutral-100 shadow-2xl flex flex-col">
          <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-400" />
              <h3 className="font-serif text-lg">Your Bag ({totalCount})</h3>
            </div>
            <button onClick={() => setIsCartOpen(false)} className="text-neutral-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cart.length === 0 ? (
              <p className="text-center text-neutral-500 py-10">Your bag is empty.</p>
            ) : (
              cart.map((item) => (
                <div key={item._id} className="flex gap-4 border-b border-neutral-800 pb-4">
                  <div className="flex-1">
                    <h5 className="font-serif text-xs font-semibold">{item.name}</h5>
                    <p className="text-xs text-amber-400 font-bold mt-1">Rs. {(item.discountPrice || item.price).toLocaleString()}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <button onClick={() => updateQty(item._id, -1)} className="p-1 rounded bg-neutral-800 cursor-pointer"><Minus className="w-3 h-3" /></button>
                      <span className="text-xs font-medium">{item.qty}</span>
                      <button onClick={() => updateQty(item._id, 1)} className="p-1 rounded bg-neutral-800 cursor-pointer"><Plus className="w-3 h-3" /></button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div className="p-5 border-t border-neutral-800 bg-black/60">
              <div className="flex justify-between text-sm mb-4">
                <span className="text-neutral-400">Total</span>
                <span className="font-bold text-amber-400">Rs. {totalAmount.toLocaleString()}</span>
              </div>
              <button
                onClick={onProceedToCheckout}
                className="w-full bg-amber-400 text-black font-bold py-3.5 rounded-xl uppercase tracking-wider text-xs cursor-pointer shadow-lg hover:bg-amber-300 transition"
              >
                Proceed to Checkout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
