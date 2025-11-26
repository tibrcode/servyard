import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

// Redirect any signed-in user with incomplete profile to /complete-profile
// or to /select-role if they haven't chosen their role yet
export const EnsureProfile: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (loading) return;
    if (!user) return;
    // Don't loop on the completion or selection pages
    if (location.pathname.startsWith('/complete-profile')) return;
    if (location.pathname.startsWith('/select-role')) return;

    // Check if user has no role or unknown role
    const hasValidRole = profile?.user_type && profile.user_type !== 'unknown';
    
    if (!hasValidRole) {
      // Redirect to role selection page
      navigate('/select-role', { replace: true });
      return;
    }

    // If has role but missing required info, send to complete profile
    const missingRequired = !profile?.full_name || !profile?.city || !profile?.country;
    if (missingRequired) {
      const roleParam = profile?.user_type ? `?role=${profile.user_type}` : '';
      navigate(`/complete-profile${roleParam}`, { replace: true });
    }
  }, [loading, user, profile, location.pathname, navigate]);

  return null;
};

export default EnsureProfile;
