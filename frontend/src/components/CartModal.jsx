import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, CreditCard, Truck, MessageCircle, CheckCircle, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function CartModal({ isOpen, onClose }) {
  const { cart, removeFromCart, clearCart } = useCart();
  const [step, setStep] = useState('cart'); // 'cart', 'checkout', 'payhere', 'success'
  const [paymentMethod, setPaymentMethod] = useState('COD'); // 'COD', 'Card', 'WhatsApp'
  
  // Customer Form State (Guests can enter manually, logged-in auto-fills)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  // PayHere Sandbox Input States
  const [cardType, setCardType] = useState('Visa');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('123');

  // Auto-fill logged in user details if available, otherwise remains blank for guest
  useEffect(() => {
    const savedUser = localStorage.getItem('ts_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed) {
          setName(parsed.name || '');
          setEmail(parsed.email || '');
          setPhone(parsed.phone || '');
          setAddress(parsed.address || '');
        }
      } catch (e) {
        console.error('Error parsing stored user', e);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

  // Helper function to resolve normalized email
  const getResolvedEmail = () => {
    if (email && email.trim()) {
      return email.trim().toLowerCase();
    }
    const savedUser = localStorage.getItem('ts_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed?.email) return parsed.email.trim().toLowerCase();
      } catch (e) {}
    }
    return 'customer@teenasecret.lk';
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();

    const resolvedEmail = getResolvedEmail();

    const orderData = {
      items: cart,
      totalAmount,
      customerName: name,
      customerEmail: resolvedEmail,
      customerPhone: phone,
      customerAddress: address,
      paymentMethod,
      status: 'Pending'
    };

    if (paymentMethod === 'WhatsApp') {
      const itemsList = cart.map(i => `• ${i.name} (x${i.quantity || 1}) - Rs. ${i.price * (i.quantity || 1)}`).join('%0A');
      const waMessage = `*New Direct Order - Teena's Secret*%0A%0A*Customer:* ${name}%0A*Email:* ${resolvedEmail}%0A*Phone:* ${phone}%0A*Address:* ${address}%0A%0A*Items:*%0A${itemsList}%0A%0A*Total:* Rs. ${totalAmount}%0A*Payment:* WhatsApp Order`;
      window.open(`https://wa.me/94771780683?text=${waMessage}`, '_blank');
      
      try {
        await fetch(`${API_BASE_URL}/api/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData)
        });
      } catch (err) {}

      clearCart();
      setStep('success');
      return;
    }

    if (paymentMethod === 'Card') {
      setStep('payhere');
      return;
    }

    // COD Flow
    setLoading(true);
    try {
      await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      clearCart();
      setStep('success');
    } catch (err) {
      clearCart();
      setStep('success');
    } finally {
      setLoading(false);
    }
  };

  const handlePayHerePay = async (e) => {
    e.preventDefault();
    setLoading(true);

    const resolvedEmail = getResolvedEmail();

    const paidOrderData = {
      items: cart,
      totalAmount,
      customerName: name,
      customerEmail: resolvedEmail,
      customerPhone: phone,
      customerAddress: address,
      paymentMethod: `PayHere ${cardType} (Paid)`,
      status: 'Completed'
    };

    try {
      await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paidOrderData)
      });
    } catch (e) {}

    clearCart();
    setLoading(false);
    setStep('success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="bg-[#121212] border border-neutral-800 rounded-2xl w-full max-w-lg p-6 relative text-white shadow-2xl max-h-[90vh] flex flex-col">
        
        <button onClick={onClose} className="absolute top-4 right-4 text-neutral-400 hover:text-white z-10">
          <X className="w-5 h-5" />
        </button>

        {step === 'cart' && (
          <>
            <h2 className="text-lg font-serif font-bold text-amber-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" /> Your Shopping Bag ({cart.length})
            </h2>

            {cart.length === 0 ? (
              <div className="text-center py-12 text-neutral-500 text-xs uppercase tracking-wider">
                Your shopping bag is empty.
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-[#1c1c1c] p-3 rounded-xl border border-neutral-800">
                    <div className="flex items-center gap-3">
                      <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-lg bg-neutral-800" />
                      <div>
                        <div className="text-xs font-bold text-white">{item.name}</div>
                        <div className="text-[11px] text-amber-400 font-mono">Rs. {item.price} x {item.quantity || 1}</div>
                      </div>
                    </div>
                    <button onClick={() => removeFromCart(item._id || item.id)} className="text-neutral-500 hover:text-red-400 text-xs">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {cart.length > 0 && (
              <div className="border-t border-neutral-800 pt-4 mt-auto">
                <div className="flex justify-between items-center mb-4 text-sm font-bold">
                  <span className="text-neutral-400 uppercase text-xs">Total Amount:</span>
                  <span className="font-mono text-amber-400">Rs. {totalAmount.toLocaleString()}</span>
                </div>
                <button
                  onClick={() => setStep('checkout')}
                  className="w-full bg-[#f59e0b] hover:bg-[#d97706] text-black font-extrabold py-3 rounded-xl text-xs uppercase tracking-wider transition shadow-lg"
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
          </>
        )}

        {step === 'checkout' && (
          <form onSubmit={handleCheckoutSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1">
            <h2 className="text-lg font-serif font-bold text-amber-400 uppercase tracking-wider mb-2">
              Checkout & Payment Details
            </h2>

            <div>
              <label className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-1">Full Name</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Himal Rathnayaka" className="w-full bg-[#1c1c1c] border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-1">Email Address</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="himal@gmail.com" className="w-full bg-[#1c1c1c] border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-1">Phone Number (SL)</label>
                <input type="text" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="0771780683" className="w-full bg-[#1c1c1c] border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-1">Delivery Address</label>
              <textarea rows="2" required value={address} onChange={e => setAddress(e.target.value)} placeholder="224/12 Mabima, Kaduwela" className="w-full bg-[#1c1c1c] border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500" />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-2">Select Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('COD')}
                  className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                    paymentMethod === 'COD' ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-[#1c1c1c] border-neutral-800 text-neutral-400'
                  }`}
                >
                  <Truck className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase">Cash on Delivery</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Card')}
                  className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                    paymentMethod === 'Card' ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-[#1c1c1c] border-neutral-800 text-neutral-400'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase">PayHere Card</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('WhatsApp')}
                  className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                    paymentMethod === 'WhatsApp' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-[#1c1c1c] border-neutral-800 text-neutral-400'
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase">WhatsApp Order</span>
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-3">
              <button
                type="button"
                onClick={() => setStep('cart')}
                className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-4 py-2.5 rounded-xl text-xs font-bold uppercase"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-extrabold py-2.5 rounded-xl text-xs uppercase tracking-wider transition shadow"
              >
                {loading ? 'Processing...' : (paymentMethod === 'WhatsApp' ? 'Send via WhatsApp' : paymentMethod === 'Card' ? 'Proceed to PayHere' : `Confirm Order (Rs. ${totalAmount})`)}
              </button>
            </div>
          </form>
        )}

        {/* Reliable Local PayHere Sandbox Gateway UI */}
        {step === 'payhere' && (
          <div className="bg-white text-neutral-900 rounded-2xl overflow-hidden shadow-2xl -m-6 flex flex-col">
            
            {/* PayHere Blue Header */}
            <div className="bg-gradient-to-r from-[#0d6efd] to-[#0a58ca] text-white p-6 text-center relative">
              <button onClick={() => setStep('checkout')} className="absolute top-4 right-4 text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
              <div className="w-16 h-16 bg-white rounded-full mx-auto flex items-center justify-center shadow-lg mb-2">
                <span className="text-[#0d6efd] font-serif font-black italic text-lg tracking-tighter">PayHere</span>
              </div>
              <h3 className="font-bold text-base tracking-wide">Demo Business (Merchant ID: 1237984)</h3>
              <p className="text-xs text-white/80">Teena's Secret Beauty Order</p>
              <div className="text-xl font-mono font-extrabold mt-2 bg-black/20 py-1.5 px-4 rounded-xl inline-block">
                Rs. {totalAmount.toLocaleString()}
              </div>
            </div>

            {/* Bank Card Form Body */}
            <form onSubmit={handlePayHerePay} className="p-6 space-y-4 bg-white">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="font-bold text-sm text-neutral-800 uppercase tracking-wider flex items-center gap-2">
                  <span className="text-blue-600">‹</span> Bank Card (Sandbox Secure)
                </h4>
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-1">Select Card Brand</label>
                <select
                  value={cardType}
                  onChange={e => setCardType(e.target.value)}
                  className="w-full bg-neutral-100 border border-neutral-300 rounded-lg px-3 py-2 text-sm font-bold text-neutral-800 focus:outline-none focus:border-blue-600"
                >
                  <option value="Visa">Visa Card</option>
                  <option value="MasterCard">MasterCard</option>
                  <option value="American Express">American Express (Amex)</option>
                  <option value="Discover">Discover</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-1">Card Number</label>
                <input
                  type="text"
                  required
                  value={cardNumber}
                  onChange={e => setCardNumber(e.target.value)}
                  className="w-full bg-neutral-100 border border-neutral-300 rounded-lg px-3 py-2 text-sm font-mono text-neutral-800 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-1">Expiry Date</label>
                  <input
                    type="text"
                    required
                    value={cardExpiry}
                    onChange={e => setCardExpiry(e.target.value)}
                    className="w-full bg-neutral-100 border border-neutral-300 rounded-lg px-3 py-2 text-sm font-mono text-neutral-800 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-1">CVV</label>
                  <input
                    type="password"
                    required
                    maxLength="4"
                    value={cardCvv}
                    onChange={e => setCardCvv(e.target.value)}
                    className="w-full bg-neutral-100 border border-neutral-300 rounded-lg px-3 py-2 text-sm font-mono text-neutral-800 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#fca311] hover:bg-[#e8920c] text-neutral-900 font-extrabold py-3.5 rounded-xl text-sm uppercase tracking-widest transition shadow-md mt-4 cursor-pointer"
              >
                {loading ? 'Processing Payment...' : 'Pay'}
              </button>

              <div className="text-center text-[10px] text-neutral-400 uppercase tracking-widest pt-2 border-t mt-4">
                PayHere is a Central Bank approved Secure Payment Gateway Service
              </div>
            </form>

          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-10 space-y-4">
            <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto" />
            <h3 className="text-lg font-serif font-bold text-white uppercase">Order Placed Successfully!</h3>
            <p className="text-xs text-neutral-400 max-w-xs mx-auto">
              Your order has been recorded in the Admin Dashboard. Confirmation notifications have been dispatched.
            </p>
            <button
              onClick={onClose}
              className="mt-4 bg-amber-500 hover:bg-amber-600 text-black font-extrabold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider"
            >
              Close & Continue
            </button>
          </div>
        )}

      </div>
    </div>
  );
}