import React, { useRef, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthProvider';

const LoginPopup = ({ show, onClose }) => {
  const modalRef = useRef(null);
  const { login, register, loginWithOAuth } = useAuth();

  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        resetForm();
        onClose();
      }
    };

    if (show) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [show, onClose]);

  // ✅ Function to reset form fields
  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setUsername('');
    setFirstName('');
    setLastName('');
  };

  // ✅ Handle Enter Key Press
  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      isRegistering ? handleRegister() : handleLogin();
    }
  };

  const handleGoogleLogin = () => {
    loginWithOAuth("google");
  };

  const handleFacebookLogin = () => {
    loginWithOAuth("facebook");
  };

  const handleLogin = async () => {
    const success = await login(email, password);
    if (success) {
      resetForm();
      onClose();
    } else {
      alert('Login failed. Please check your credentials.');
    }
  };

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    const success = await register(firstName, lastName, username, email, password);
    if (success) {
      resetForm();
      onClose();
    } else {
      alert('Registration failed. Try again.');
    }
  };

  const handleGuestLogin = () => {
    resetForm();
    onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
      <div ref={modalRef} className="bg-gray-900 text-white p-6 rounded-lg w-96">
        <h2 className="text-xl font-bold mb-4">{isRegistering ? 'Create Account' : 'Login'}</h2>

        <form onKeyDown={handleKeyPress}>
          {isRegistering && (
            <>
              <input
                type="text"
                placeholder="First Name"
                className="w-full p-2 bg-gray-700 rounded-md mb-2"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <input
                type="text"
                placeholder="Last Name"
                className="w-full p-2 bg-gray-700 rounded-md mb-2"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
              <input
                type="text"
                placeholder="Username"
                className="w-full p-2 bg-gray-700 rounded-md mb-2"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </>
          )}

          <input
            type="email"
            placeholder="Email"
            className="w-full p-2 bg-gray-700 rounded-md mb-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-2 bg-gray-700 rounded-md mb-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {isRegistering && (
            <input
              type="password"
              placeholder="Confirm Password"
              className="w-full p-2 bg-gray-700 rounded-md mb-2"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          )}

          <button
            type="button"
            onClick={isRegistering ? handleRegister : handleLogin}
            className="w-full px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-500"
          >
            {isRegistering ? 'Create Account' : 'Login'}
          </button>
        </form>

        <button
          onClick={() => setIsRegistering(!isRegistering)}
          className="text-sm text-gray-400 hover:text-white mt-2"
        >
          {isRegistering ? 'Already have an account? Login' : 'Create an account'}
        </button>

        {/* Social Logins */}
        <div className="mt-4 space-y-2">
          <button
            onClick={handleGoogleLogin}
            className="w-full px-4 py-2 bg-red-600 rounded-md hover:bg-red-500"
          >
            Login with Google
          </button>
          <button
            onClick={handleFacebookLogin}
            className="w-full px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-500"
          >
            Login with Facebook
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center my-4">
          <div className="flex-grow border-t border-gray-600"></div>
          <span className="px-2 text-gray-400 text-sm">or</span>
          <div className="flex-grow border-t border-gray-600"></div>
        </div>

        {/* Continue as Guest */}
        <div>
          <button
            onClick={handleGuestLogin}
            className="w-full px-4 py-2 bg-gray-700 rounded-md hover:bg-gray-600"
          >
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPopup;
