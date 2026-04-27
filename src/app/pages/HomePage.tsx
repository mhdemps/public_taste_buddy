import { Navigate } from "react-router";

/** Legacy route `/home` — the main hub is the Buddy Board at `/`. */
export default function HomePage() {
  return <Navigate to="/" replace />;
}
