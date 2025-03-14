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
      <header className="bg-black text-white relative z-50">
        <div className="flex justify-between items-center p-3">
          
          <div className="flex items-center">
            <Link to="/">
              <img src="/favicon.ico" alt="Logo" className="h-10 w-auto cursor-pointer" />
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
                className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-500"
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
