import React from 'react';

const GlobalLoader = ({ message = "Loading luxury collection..." }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0a]/80 backdrop-blur-md transition-all duration-300">
      {/* Top Gold Progress Stream */}
      <div className="fixed top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-amber-400 to-amber-600 shadow-[0_0_12px_rgba(245,158,11,0.8)] animate-pulse" />

      {/* Center Ambient Glow & Rings */}
      <div className="relative flex items-center justify-center">
        {/* Pulsing Backlight */}
        <div className="absolute w-28 h-28 rounded-full bg-amber-500/10 blur-xl animate-pulse" />

        {/* Outer Ring */}
        <div className="w-16 h-16 rounded-full border-2 border-amber-500/20 border-t-amber-400 animate-spin" />

        {/* Inner Counter-Spinning Ring */}
        <div className="absolute w-10 h-10 rounded-full border-2 border-transparent border-b-amber-300/80 animate-[spin_1s_linear_infinite_reverse]" />

        {/* Center Dot */}
        <div className="absolute w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
      </div>

      {/* Dynamic Brand Text */}
      <div className="mt-6 text-center">
        <h3 className="text-xs uppercase tracking-[0.35em] text-amber-400 font-medium">
          Teena's Secret
        </h3>
        <p className="mt-1 text-xs text-neutral-400 tracking-wider">
          {message}
        </p>
      </div>
    </div>
  );
};

export default GlobalLoader;