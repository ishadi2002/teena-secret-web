import React, { useState } from 'react';
import axios from 'axios';
import { X, CheckCircle, CreditCard, Truck, MessageCircle, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import CitySelect from './CitySelect';

export default function CheckoutModal({ isOpen, onClose, formData, setFormData }) {
  const { cart, totalAmount, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState('payhere');
  const [orderPlaced, setOrderPlaced] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const validateOrderForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setErrorMsg('??????? ????? ????? ???????? ??? ?????.');
      return false;
    }

    const cleanPhone = formData.phone.replace(/[\s-]/g, '');
    if (!/^(?:0|(?:\+?94))7[0-9]{8}$/.test(cleanPhone)) {
      setErrorMsg('??????? ????? ????? ?????? ?????? ?????? ?????? ????? (???: 076-653 2276).');
      return false;
    }

    if (!formData.city) {
      setErrorMsg('??????? ???? ???? (City) ??????.');
      return false;
    }

    if (formData.postalCode && !/^[0-9]{5}$/.test(formData.postalCode.trim())) {
      setErrorMsg('?????? ???? (Postal Code) ??????? 5 ?? ??? ?????.');
      return false;
    }

    setErrorMsg('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateOrderForm()) return;

    const orderNumber = 'TS-' + Math.floor(100000 + Math.random() * 900000);

    // WhatsApp Flow
    if (paymentMethod === 'whatsapp') {
      const items = cart.map(i => `� ${i.name} (Qty: ${i.qty}) - Rs. ${(i.discountPrice || i.price) * i.qty}`).join('%0A');
      const waMsg = `*NEW ORDER: ${orderNumber}*%0A%0A*Customer:* ${formData.name}%0A*Phone:* ${formData.phone}%0A*City:* ${formData.city} (${formData.postalCode || ''})%0A*Address:* ${formData.address}%0A%0A*Items:*%0A${items}%0A%0A*Total:* Rs. ${totalAmount.toLocaleString()}`;

      try {
        await axios.post('http://localhost:5000/api/orders', {
          orderNumber, customer: formData,
          orderItems: cart.map(i => ({ product: i._id, name: i.name, price: i.discountPrice || i.price, quantity: i.qty })),
          totalAmount, paymentMethod: 'WhatsApp Order'
        });
      } catch (err) {}

      window.open(`https://wa.me/94766532276?text=${waMsg}`, '_blank');
      setOrderPlaced({ orderNumber, method: 'WhatsApp Order' });
      clearCart();
      return;
    }

    // COD Flow
    if (paymentMethod === 'cod') {
      try {
        await axios.post('http://localhost:5000/api/orders', {
          orderNumber, customer: formData,
          orderItems: cart.map(i => ({ product: i._id, name: i.name, price: i.discountPrice || i.price, quantity: i.qty })),
          totalAmount, paymentMethod: 'Cash on Delivery'
        });
      } catch (err) {}
      setOrderPlaced({ orderNumber, method: 'Cash on Delivery (COD)' });
      clearCart();
      return;
    }

    // PayHere Card Flow
    if (paymentMethod === 'payhere') {
      try {
        const hashRes = await axios.post('http://localhost:5000/api/orders/payhere-hash', {
          orderId: orderNumber, amount: totalAmount, currency: 'LKR'
        });
        const { hash, merchantId } = hashRes.data;

        const payment = {
          sandbox: true,
          merchant_id: merchantId,
          return_url: 'http://localhost:5173',
          cancel_url: 'http://localhost:5173',
          notify_url: 'http://localhost:5000/api/orders/payhere-notify',
          order_id: orderNumber,
          items: "Teena's Secret Beauty Order",
          amount: totalAmount.toFixed(2),
          currency: 'LKR',
          hash: hash,
          first_name: formData.name.split(' ')[0] || 'Customer',
          last_name: formData.name.split(' ')[1] || 'Teena',
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          country: 'Sri Lanka'
        };

        window.payhere.startPayment(payment);

        window.payhere.onCompleted = async function (completedOrderId) {
          try {
            await axios.post('http://localhost:5000/api/orders', {
              orderNumber: completedOrderId, customer: formData,
              orderItems: cart.map(i => ({ product: i._id, name: i.name, price: i.discountPrice || i.price, quantity: i.qty })),
              totalAmount, paymentMethod: 'PayHere Card', paymentStatus: 'Paid'
            });
          } catch (e) {}
          setOrderPlaced({ orderNumber: completedOrderId, method: 'PayHere Online Card' });
          clearCart();
        };
      } catch (err) {
        alert('Payment setup failed: ' + err.message);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#121212] border border-amber-500/30 rounded-2xl max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-neutral-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
        
        {orderPlaced ? (
          <div className="text-center py-6">
            <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto mb-4" />
            <h4 className="font-serif text-2xl font-bold mb-2">Order Confirmed!</h4>
            <p className="text-xs text-neutral-400 mb-2">Order ID: <span className="font-bold text-amber-400">{orderPlaced.orderNumber}</span></p>
            <div className="bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs py-2 px-3 rounded-lg my-4">
              Placed via: <strong>{orderPlaced.method}</strong>
            </div>
            <p className="text-sm text-neutral-300 mb-6">Our team will verify and dispatch shortly. Confirmation details will be sent to your email!</p>
            <button onClick={onClose} className="bg-amber-400 text-black px-6 py-2 rounded-lg text-xs font-bold uppercase cursor-pointer">Done</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <h4 className="font-serif text-xl font-bold text-amber-300 mb-1">Express Luxury Checkout</h4>
            <p className="text-xs text-neutral-400 mb-3">Choose how you wish to purchase</p>

            {errorMsg && (
              <div className="bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs p-3 rounded-xl flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 mb-3">
              <div onClick={() => setPaymentMethod('payhere')} className={`p-2.5 rounded-xl border cursor-pointer text-center transition ${paymentMethod === 'payhere' ? 'border-amber-400 bg-amber-400/15' : 'border-neutral-800 bg-neutral-900'}`}>
                <CreditCard className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                <span className="text-[11px] font-bold block text-white leading-tight">Card Payment</span>
                <span className="text-[9px] text-neutral-400">Visa / Master</span>
              </div>
              <div onClick={() => setPaymentMethod('cod')} className={`p-2.5 rounded-xl border cursor-pointer text-center transition ${paymentMethod === 'cod' ? 'border-amber-400 bg-amber-400/15' : 'border-neutral-800 bg-neutral-900'}`}>
                <Truck className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                <span className="text-[11px] font-bold block text-white leading-tight">Cash on Delivery</span>
                <span className="text-[9px] text-neutral-400">Pay on Hand</span>
              </div>
              <div onClick={() => setPaymentMethod('whatsapp')} className={`p-2.5 rounded-xl border cursor-pointer text-center transition ${paymentMethod === 'whatsapp' ? 'border-emerald-400 bg-emerald-500/15' : 'border-neutral-800 bg-neutral-900'}`}>
                <MessageCircle className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                <span className="text-[11px] font-bold block text-emerald-300 leading-tight">WhatsApp</span>
                <span className="text-[9px] text-neutral-400">Direct Chat</span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase text-neutral-400 mb-1">Full Name</label>
              <input required type="text" placeholder="Nimasha Rathnayaka" className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-amber-400" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] uppercase text-neutral-400 mb-1">Phone Number (07X...)</label>
                <input required type="tel" placeholder="076-653 2276" className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-amber-400" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-neutral-400 mb-1">Email Address</label>
                <input required type="email" placeholder="customer@mail.com" className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-amber-400" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
            </div>

            {/* Searchable City Select in Checkout */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] uppercase text-neutral-400 mb-1">City (Search & Select)</label>
                <CitySelect 
                  selectedCity={formData.city} 
                  onCityChange={(c) => setFormData(prev => ({ ...prev, city: c }))}
                  onPostalCodeChange={(code) => setFormData(prev => ({ ...prev, postalCode: code }))}
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-neutral-400 mb-1">Postal Code</label>
                <input required type="text" maxLength={5} placeholder="10100" className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-amber-300 font-mono outline-none focus:border-amber-400" value={formData.postalCode || ''} onChange={(e) => setFormData({ ...formData, postalCode: e.target.value.replace(/[^0-9]/g, '') })} />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase text-neutral-400 mb-1">Delivery Address</label>
              <input required type="text" placeholder="Street, House No" className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-amber-400" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
            </div>

            <div className="flex justify-between py-2 font-bold text-sm border-t border-neutral-800">
              <span>Payable Total:</span>
              <span className="text-amber-400 text-base font-mono">Rs. {totalAmount.toLocaleString()}</span>
            </div>

            <button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-black font-bold py-3 rounded-xl uppercase tracking-wider text-xs cursor-pointer shadow-lg">
              {paymentMethod === 'payhere' && 'Pay via Card (PayHere)'}
              {paymentMethod === 'cod' && 'Confirm Cash on Delivery'}
              {paymentMethod === 'whatsapp' && 'Send Order to WhatsApp'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
