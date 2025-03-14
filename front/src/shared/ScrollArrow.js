import React from 'react';

export function ScrollArrow({ direction, onClick, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`absolute top-0 bottom-0 flex items-center justify-center 
        bg-transparent hover:bg-gray-700 text-white rounded-full p-2 transition 
        duration-300 ${className} 
        ${direction === 'left' ? 'left-0' : 'right-0'}`}
    >
      <span className="text-2xl">{direction === 'left' ? '<' : '>'}</span>
    </button>
  );
}
