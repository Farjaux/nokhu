import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import { Plus } from 'lucide-react'; // Using Lucide Icons for a modern look

const CreateButton = () => {
  const { user } = useAuth();
  const [isHovered, setIsHovered] = useState(false);

  // Only show button for users with 'admin' or 'creator' roles
  if (!user || (!user.role.includes('admin') && !user.role.includes('creator'))) {
    return null;
  }

  return (
    <Link
      to="/upload-video"
      className="relative flex items-center justify-center w-10 h-10 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* + Icon */}
      <Plus size={24} className="text-white" />

      {/* Hover Tooltip */}
      {isHovered && (
        <span className="absolute bottom-[-2.5rem] px-3 py-1 text-sm bg-gray-800 text-white rounded-md shadow-md">
          Upload
        </span>
      )}
    </Link>
  );
};

export default CreateButton;
