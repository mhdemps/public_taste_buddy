import { Navigate } from "react-router";

/** Legacy route `/home` — the main hub is the taste wall at `/`. */
export default function HomePage() {
  return <Navigate to="/" replace />;
}
