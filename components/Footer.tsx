import React from 'react';

const Footer = () => {
  return (
    <footer className="relative w-full h-[160px] bg-[#0a0a0a] flex flex-col justify-end overflow-hidden">
      {[...Array(7)].map((_, i) => (
        <div
          key={i}
          className="w-full bg-gradient-to-r from-[#333] via-white to-[#333] bg-[length:200%_100%] animate-neonGlow shadow-[0_0_20px_rgba(255,255,255,0.6)] mb-0.5"
          style={{
            height: `${8 + i * 4}px`,
            animationDelay: `${i * 0.2}s`
          }}
        />
      ))}
    </footer>
  );
};

export default Footer; 