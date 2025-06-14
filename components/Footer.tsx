import React from 'react';

const Footer = () => {
  // Array of solid colors for the bars
  const barColors = [
    '#333', '#444', '#555', '#666', '#777', '#888', '#999'
  ];
  return (
    <footer className="relative w-full h-[160px] bg-[#0a0a0a] flex flex-col justify-end overflow-hidden">
      {barColors.map((color, i) => (
        <div
          key={i}
          className="w-full mb-0.5"
          style={{
            height: `${8 + i * 4}px`,
            background: color
          }}
        />
      ))}
    </footer>
  );
};

export default Footer; 