import React from 'react';
import { useAuth } from '../../context/AuthContext';

const RoleGuard = ({ allowedRoles = [], children, fallback = null }) => {
  const { role } = useAuth();
  if (!role || !allowedRoles.includes(role)) return fallback;
  return children;
};

export default RoleGuard;
