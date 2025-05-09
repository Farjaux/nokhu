import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import { BarChart3 } from 'lucide-react'; // Lucide icon for a simple bar chart

const AnalyticsButton = () => {
  const { user } = useAuth();
  const [isHovered, setIsHovered] = useState(false);

  // Only show button for users with 'admin' or 'creator' roles
  if (!user || (!user.role.includes('admin') && !user.role.includes('creator'))) {
    return null;
  }

  return (
    <Link
      to="/analytics"
      className="relative flex items-center justify-center w-10 h-10 bg-[#00d89d] hover:bg-[#00FFB9] text-white rounded-full transition duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Bar Chart Icon */}
      <BarChart3 size={24} className="text-white" />

      {/* Hover Tooltip */}
      {isHovered && (
        <span className="absolute bottom-[-2.5rem] px-3 py-1 text-sm bg-gray-800 text-white rounded-md shadow-md">
          Analytics
        </span>
      )}
    </Link>
  );
};

export default AnalyticsButton;
