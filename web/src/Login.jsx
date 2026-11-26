
import { useState } from "react";
import "./Login.css";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await onLogin({ email: email.trim(), password, remember });
    } catch (err) {
      setError(
        err?.message || "Unable to sign in. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="medusa-login">
      <div className="login-orb orb-one" />
      <div className="login-orb orb-two" />
      <div className="login-orb orb-three" />

      <div className="login-container">

        {/* LEFT SHOWCASE */}
        <section className="login-showcase">
          <div className="brand">
            <div className="brand-icon">✚</div>
            <span>MEDUSA<span className="brand-x">-X</span></span>
          </div>

          <div className="showcase-content">
            <span className="eyebrow">
              INTELLIGENCE. INTEGRITY. CARE.
            </span>

            <h1>
              Connected records.
              <br />
              <span>Clearer clinical</span>
              <br />
              insights.
            </h1>

            <p>
              A unified clinical intelligence workspace designed
              to connect healthcare records, support collaboration
              and make clinical information more accessible.
            </p>

            <div className="feature-list">
              <div className="feature">
                <span>✓</span>
                Unified clinical records
              </div>

              <div className="feature">
                <span>✓</span>
                Intelligent healthcare insights
              </div>

              <div className="feature">
                <span>✓</span>
                Secure workspace access
              </div>
            </div>
          </div>

          <div className="showcase-footer">
            <span className="pulse-dot" />
            MEDUSA-X · CLINICAL INTELLIGENCE
          </div>
        </section>

        {/* RIGHT LOGIN PANEL */}
        <section className="login-panel">
          <div className="login-card">

            <div className="mobile-brand">
              <div className="brand-icon">✚</div>
              <span>MEDUSA<span className="brand-x">-X</span></span>
            </div>

            <div className="welcome-tag">
              WELCOME BACK
            </div>

            <h2>Sign in to your workspace</h2>

            <p className="login-subtitle">
              Access your clinical workspace securely.
            </p>

            <form onSubmit={handleSubmit}>

              <label htmlFor="medusa-email">
                Email address
              </label>

              <div className="input-wrapper">
                <span className="input-icon">✉</span>
                <input
                  id="medusa-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>

              <div className="password-heading">
                <label htmlFor="medusa-password">
                  Password
                </label>
              </div>

              <div className="input-wrapper">
                <span className="input-icon">♙</span>

                <input
                  id="medusa-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="show-password"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <div className="login-options">
                <label className="remember">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  Remember me
                </label>

                <button
                  type="button"
                  className="forgot-password"
                  onClick={() =>
                    setError("Please contact your administrator to reset your password.")
                  }
                >
                  Forgot password?
                </button>
              </div>

              {error && (
                <div className="login-error" role="alert">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="login-button"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
                {!loading && <span>→</span>}
              </button>
            </form>

            <div className="security-note">
              <span>◇</span>
              Clinical workspace access
            </div>

            <div className="login-bottom">
              MEDUSA-X © 2026 · CLINICAL INTELLIGENCE PLATFORM
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
