import React from 'react';
import { FaMountain, FaFish, FaCarSide } from 'react-icons/fa';

const categories = [
  { id: '60ace37f-e8dd-4872-b5f8-02e448b4a8c4', name: 'Adventure', icon: <FaMountain size={24} /> },
  { id: 'c6bb600f-c394-464d-b38e-3331b3947755', name: 'Outdoor', icon: <FaFish size={24} /> },
  { id: 'ff4c38ad-7f39-43ce-947f-6e740aa62672', name: 'Motorsports', icon: <FaCarSide size={24} /> },
];

const CategoryList = ({ selectedParentCategory, onCategorySelect }) => {
  return (
    <div className="text-white w-full flex flex-row items-center justify-center py-1 space-x-10">
      {categories.map((category) => (
        <button
          key={category.id}
          className={`hover:bg-gray-700 p-2 rounded transition-colors ${
            selectedParentCategory === category.id ? 'bg-gray-700' : ''
          }`}
          onClick={() => onCategorySelect(category.id)}
        >
          {category.icon}
        </button>
      ))}
    </div>
  );
};

export default CategoryList;
