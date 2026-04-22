import { Navigate, Outlet, useLocation } from "react-router";
import { motion } from "motion/react";
import { useAuth } from "./context/AuthContext";
import { BuddiesProvider } from "./context/BuddiesContext";
import GrayTasteHeader from "./components/GrayTasteHeader";
import { PAGE_SHELL } from "./brand";

export default function ProtectedLayout() {
  const { session, loading } = useAuth();
  const location = useLocation();

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

  if (!session?.user?.id) {
    return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />;
  }

  return (
    <BuddiesProvider userId={session.user.id}>
      <Outlet />
    </BuddiesProvider>
  );
}
