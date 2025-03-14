// File: src/components/ProtectedRoute.js

import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, user }) => {
  if (
    !user ||
    (!user.role.includes('admin') && !user.role.includes('creator'))
  ) {
    return <Navigate to="/" replace />;
  }

  // If user is authorized, render the child component (the protected page)
  return children;
};

export default ProtectedRoute;
