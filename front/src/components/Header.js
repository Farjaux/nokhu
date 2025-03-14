import React, { useState, useRef, useEffect } from 'react';
import LoginPopup from './Login';

const Header = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [username, setUsername] = useState('User123');

  // Refs for the dropdown and user profile image
  const dropdownRef = useRef(null);
  const profileRef = useRef(null);

  // Toggle dropdown visibility
  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  // Handle sign out
  const handleSignOut = () => {
    setIsLoggedIn(false);
    setShowDropdown(false);
  };

  // Close dropdown if clicked outside of it
  useEffect(() => {
    const handleClickOutside = event => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !profileRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Open the login popup
  const openLoginPopup = () => {
    setShowLoginPopup(true);
  };

  // Close the login popup
  const closeLoginPopup = () => {
    setShowLoginPopup(false);
  };

  return (
    <>
      <header className="bg-black text-white">
        <div className="flex justify-between items-center p-3">
          {/* Logo */}
          <div className="flex items-center">
            <img src="/favicon.ico" alt="Logo" className="h-10 w-auto" />
          </div>

          {/* Search Bar */}
          <div className="flex justify-center flex-1">
            <input
              type="text"
              placeholder="Search"
              className="w-full p-2 rounded-full bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-600"
              style={{ textIndent: '10px', maxWidth: '65%' }}
            />
          </div>

          {/* User Profile */}
          <div className="relative" ref={profileRef}>
            <img
              src="/favicon.ico"
              alt="User"
              className="h-10 w-10 rounded-full cursor-pointer"
              onClick={toggleDropdown}
            />
            {showDropdown && (
              <div
                ref={dropdownRef}
                className="absolute right-0 mt-2 w-48 bg-gray-800 text-white rounded-md shadow-lg"
              >
                {isLoggedIn ? (
                  <div className="p-3">
                    <div className="font-bold">{username}</div>
                    <div className="mt-2">
                      <button className="w-full text-left px-4 py-2 hover:bg-gray-700">
                        Settings
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 hover:bg-gray-700"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3">
                    <button
                      onClick={openLoginPopup} // Open the login popup
                      className="w-full text-left px-4 py-2 hover:bg-gray-700"
                    >
                      Login
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Genre List */}
        <div className="pt-1 p-3 bg-black">
          <div className="flex justify-center space-x-4">
            {['All', 'Snow', 'Ice', 'Trail', 'Surf'].map(genre => (
              <button
                key={genre}
                className="px-3 py-1 rounded-md bg-gray-800 text-sm text-white hover:bg-gray-700"
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Login Popup */}
      <LoginPopup show={showLoginPopup} onClose={closeLoginPopup} />
    </>
  );
};

export default Header;
