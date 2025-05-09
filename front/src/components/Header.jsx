import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider'; 
import LoginPopup from './Login';
import UserProfileDropdown from './UserProfileDropdown';
import SearchBar from './SearchBar';
import CreateButton from './CreateButton';
import AnalyticsButton from './AnalyticsButton';

const Header = () => {
  const { isAuthenticated } = useAuth(); 
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  const openLoginPopup = () => {
    if (!isAuthenticated) {
      setShowLoginPopup(true);
      setShowDropdown(false);
    }
  };

  const closeLoginPopup = () => {
    setShowLoginPopup(false);
  };

  const toggleDropdown = (value) => {
    setShowDropdown(typeof value === 'function' ? value(showDropdown) : value);
  };

  return (
    <>
      <header className="text-white relative z-50">
        <div className="flex justify-between items-center p-3">    
          <div className="flex items-center">
            <Link to="/">
              {/* Mobile: Show logo2.png */}
              <img
                src="/logo2.png"
                alt="Logo"
                className="block md:hidden h-10 w-auto cursor-pointer"
              />
              {/* Tablet & Desktop: Show logo.png */}
              <img
                src="/logo.png"
                alt="Logo"
                className="hidden md:block h-10 md:h-8 lg:h-10 w-auto cursor-pointer"
              />
            </Link>
          </div>

          
          <SearchBar />

  
          <div className="flex items-center space-x-3"> 
          <AnalyticsButton />
            <CreateButton /> 
            
            {/* User Profile Dropdown OR Login Button */}
            {isAuthenticated ? (
              <UserProfileDropdown
                showDropdown={showDropdown}
                toggleDropdown={toggleDropdown}
              />
            ) : (
              <button
                onClick={openLoginPopup}
                className="px-4 py-2 bg-[#0056d8] rounded-md hover:bg-[#0066FF]"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Login Popup */}
      <LoginPopup show={showLoginPopup} onClose={closeLoginPopup} />
    </>
  );
};

export default Header;
