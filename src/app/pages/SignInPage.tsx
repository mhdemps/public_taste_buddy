import { useState } from "react";
import { Navigate, useLocation } from "react-router";
import { motion } from "motion/react";
import { useAuth } from "../context/AuthContext";
import GrayTasteHeader from "../components/GrayTasteHeader";
import { InfoBoxFrame } from "../components/InfoBoxFrame";
import { ChalkPillFrame } from "../components/ChalkPillFrame";
import { PAGE_SHELL_SCROLL } from "../brand";

export default function SignInPage() {
  const { session, loading, configured, signInWithPassword, signUpWithPassword } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (loading) {
    return (
      <div className={PAGE_SHELL_SCROLL}>
        <GrayTasteHeader showSignOut={false} />
        <p className="share-tech-regular tb-text-coral" style={{ textAlign: "center", marginTop: "2rem" }}>
          Loading…
        </p>
      </div>
    );
  }

  if (session) {
    return <Navigate to={from === "/sign-in" ? "/" : from} replace />;
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setBusy(true);
    try {
      if (mode === "sign-in") {
        const { error } = await signInWithPassword(email, password);
        if (error) {
          setMessage(error.message);
          return;
        }
      } else {
        const { error } = await signUpWithPassword(email, password);
        if (error) {
          setMessage(error.message);
          return;
        }
        setMessage("Check your email to confirm your account, then sign in.");
        setMode("sign-in");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={PAGE_SHELL_SCROLL} data-name="Sign in">
      <GrayTasteHeader showSignOut={false} />

      <motion.div
        className="tb-main-column"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45 }}
      >
        <motion.h1
          className="tb-page-title share-tech-bold tb-text-coral"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          {mode === "sign-in" ? "Sign in" : "Create account"}
        </motion.h1>
        <motion.p
          className="tb-intro-blurb share-tech-regular"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          Your recipes, community, and taste profiles stay tied to this account when you use Supabase.
        </motion.p>

        {!configured ? (
          <InfoBoxFrame variant={0}>
            <p className="share-tech-regular" style={{ fontSize: "20pt", lineHeight: 1.4, color: "#2d2d2d" }}>
              Add <code className="share-tech-regular">VITE_SUPABASE_URL</code> and{" "}
              <code className="share-tech-regular">VITE_SUPABASE_ANON_KEY</code> to a{" "}
              <code className="share-tech-regular">.env</code> file in the project root, then restart the dev server.
            </p>
          </InfoBoxFrame>
        ) : null}

        <motion.form
          className="tb-form-narrow"
          onSubmit={onSubmit}
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.45, delay: 0.12 }}
        >
          <InfoBoxFrame variant={1}>
            <label htmlFor="auth-email" className="tb-field-label share-tech-regular">
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="tb-input-plain share-tech-regular"
              required
            />
          </InfoBoxFrame>

          <InfoBoxFrame variant={2}>
            <label htmlFor="auth-password" className="tb-field-label share-tech-regular">
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="tb-input-plain share-tech-regular"
              minLength={6}
              required
            />
          </InfoBoxFrame>

          {message ? (
            <p className="share-tech-regular" style={{ fontSize: "20pt", color: "#2d2d2d", textAlign: "center" }}>
              {message}
            </p>
          ) : null}

          <motion.button
            type="submit"
            className="tb-submit-wrap"
            disabled={busy || !configured}
            whileTap={{ scale: busy ? 1 : 0.97 }}
          >
            <ChalkPillFrame variant={2} fillClassName="tb-pill-fill-coral" innerClassName="tb-pill-inner tb-pill-inner--lg">
              <span className="tb-pill-text-white share-tech-regular">
                {busy ? "Please wait…" : mode === "sign-in" ? "Sign in" : "Sign up"}
              </span>
            </ChalkPillFrame>
          </motion.button>

          <motion.button
            type="button"
            className="tb-link-cancel share-tech-bold tb-text-coral"
            onClick={() => {
              setMode((m) => (m === "sign-in" ? "sign-up" : "sign-in"));
              setMessage(null);
            }}
            whileHover={{ opacity: 0.75 }}
            whileTap={{ scale: 0.98 }}
          >
            {mode === "sign-in" ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </motion.button>
        </motion.form>
      </motion.div>
    </div>
  );
}
