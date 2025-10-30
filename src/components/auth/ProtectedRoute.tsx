import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactElement;
  requireRole?: 'provider' | 'customer';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireRole }) => {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  // Enforce strict role matching
  if (requireRole) {
    // If role is not resolved yet, keep showing a loader instead of redirecting
    if (!role || role === 'unknown') {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
        </div>
      );
    }

    // If role is resolved but doesn't match, redirect to the correct dashboard
    if (role !== requireRole) {
      const target = role === 'provider' ? '/provider-dashboard' : '/customer-dashboard';
      return <Navigate to={target} replace />;
    }
  }

  return children;
};
