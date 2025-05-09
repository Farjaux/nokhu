import React, { useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthProvider';
import { ProfileAvatar } from './ProfileAvatar';

const UserProfileDropdown = ({ showDropdown, toggleDropdown, openLoginPopup }) => {
  const dropdownRef = useRef(null);
  const profileRef = useRef(null);

  const { isAuthenticated, user, logout } = useAuth(); // ✅ Updated hook

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !profileRef.current.contains(event.target)
      ) {
        toggleDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [toggleDropdown]);

  const variant = Number(user?.profile_picture) || 1;;

  return (
    <div className="relative" ref={profileRef}>
      <ProfileAvatar
        variant={variant}
        className="h-12 w-12 rounded-full object-cover cursor-pointer"
        onClick={() => toggleDropdown((prev) => !prev)}
      />

      {showDropdown && (
        <div ref={dropdownRef} className="absolute right-0 mt-2 w-48 bg-gray-800 text-white rounded-md shadow-lg z-50">
          {isAuthenticated ? ( 
            <div className="p-3">
              <div className="font-bold">{user.username || 'NoUser'}</div>
              <button className="w-full text-left px-4 py-2 hover:bg-gray-700">
                Settings
              </button>
              <button onClick={logout} className="w-full text-left px-4 py-2 hover:bg-gray-700">
                Sign out
              </button>
            </div>
          ) : (
            <div className="p-3">
              <button onClick={openLoginPopup} className="w-full text-left px-4 py-2 hover:bg-gray-700">
                Login
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserProfileDropdown;
