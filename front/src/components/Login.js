import React, { useRef, useEffect } from 'react';

const LoginPopup = ({ show, onClose }) => {
  const modalRef = useRef(null);

  // Close the modal when clicking outside
  useEffect(() => {
    const handleClickOutside = event => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose(); // Close the modal
      }
    };

    if (show) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [show, onClose]);

  if (!show) return null; // Don't render if not shown

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
      <div
        ref={modalRef}
        className="bg-gray-900 text-white p-6 rounded-lg w-96"
      >
        <h2 className="text-xl font-bold mb-4">Login</h2>
        <div className="space-y-4">
          {/* Email/Password Login */}
          <div>
            <input
              type="email"
              placeholder="Email"
              className="w-full p-2 bg-gray-700 rounded-md mb-2"
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full p-2 bg-gray-700 rounded-md"
            />
          </div>
          <div className="flex justify-between items-center mt-2">
            <button className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-500">
              Login
            </button>
            <button
              onClick={onClose}
              className="text-sm text-gray-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
        {/* Create User */}
        <div className="mt-4">
          <button className="w-full px-4 py-2 bg-green-600 rounded-md hover:bg-green-500">
            Create User
          </button>
        </div>
        {/* Social Login */}
        <div className="mt-4 space-y-2">
          <button className="w-full px-4 py-2 bg-red-600 rounded-md hover:bg-red-500">
            Login with Google
          </button>
          <button className="w-full px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-500">
            Login with Facebook
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPopup;
