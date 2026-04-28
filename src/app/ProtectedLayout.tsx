import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { motion } from "motion/react";
import { useAuth } from "./context/AuthContext";
import { BuddiesProvider } from "./context/BuddiesContext";
import GrayTasteHeader from "./components/GrayTasteHeader";
import { AppOnboardingModal } from "./components/AppOnboardingModal";
import { PAGE_SHELL } from "./brand";
import { completeAppOnboarding, shouldShowAppOnboarding } from "./appOnboardingStorage";

export default function ProtectedLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setOnboardingOpen(false);
      return;
    }
    setOnboardingOpen(shouldShowAppOnboarding(user.id));
  }, [user?.id]);

  if (loading) {
    return (
      <div className={PAGE_SHELL}>
        <GrayTasteHeader showSignOut={false} />
        <motion.p
          className="share-tech-regular tb-text-coral"
          style={{ textAlign: "center", marginTop: "2rem" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Loading…
        </motion.p>
      </div>
    );
  }

  if (!user?.id) {
    return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />;
  }

  const dismissOnboarding = () => {
    completeAppOnboarding(user.id);
    setOnboardingOpen(false);
  };

  return (
    <BuddiesProvider userId={user.id}>
      <Outlet />
      <AppOnboardingModal open={onboardingOpen} onDismiss={dismissOnboarding} />
    </BuddiesProvider>
  );
}
