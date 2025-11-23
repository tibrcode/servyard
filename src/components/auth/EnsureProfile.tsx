import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

// Redirect any signed-in user with incomplete profile to /complete-profile
export const EnsureProfile: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (loading) return;
    if (!user) return;
    // Don't loop on the completion page itself
    if (location.pathname.startsWith('/complete-profile')) return;

    const missingRequired = !profile?.full_name || !profile?.city || !profile?.country || !profile?.user_type;
    if (missingRequired) {
      // If user_type is missing, don't default to customer. Let CompleteProfile handle the choice.
      const roleParam = profile?.user_type ? `?role=${profile.user_type}` : '';
      navigate(`/complete-profile${roleParam}`, { replace: true });
    }
  }, [loading, user, profile, location.pathname, navigate]);

  return null;
};

export default EnsureProfile;
