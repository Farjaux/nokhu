// SearchBar.jsx
import React from 'react';

const SearchBar = () => {
  return (
    <div className="flex justify-center flex-1">
      <input
        type="text"
        placeholder="Search"
        className="w-full p-2 rounded-full bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-600"
        style={{ textIndent: '10px', maxWidth: '65%' }}
      />
    </div>
  );
};

export default SearchBar;
