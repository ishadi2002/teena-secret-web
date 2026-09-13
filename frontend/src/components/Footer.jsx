import React from 'react';
import { Phone, Mail, Truck } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[#050505] border-t border-neutral-900 py-10 px-6 text-center text-xs text-neutral-400">
      <div className="max-w-4xl mx-auto space-y-4">
        <h4 className="text-amber-400 font-bold tracking-[0.2em] uppercase text-sm">
          TEENA'S SECRET BEAUTY STORE
        </h4>
        <div className="flex flex-wrap items-center justify-center gap-6 text-neutral-300 text-xs">
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-pink-500" />
            <span>Hotline / WhatsApp: <strong className="text-white">076-653 2276</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-neutral-400" />
            <span>Email: <strong className="text-white">teenajanadari@gmail.com</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Truck className="w-3.5 h-3.5 text-amber-500" />
            <span>Islandwide Delivery (COD)</span>
          </div>
        </div>
        <p className="text-[10px] text-neutral-600 mt-4">
          © 2026 Teena's Secret Cosmetics. All Rights Reserved. Pinnacle Award Winner Best Brand 2025.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
