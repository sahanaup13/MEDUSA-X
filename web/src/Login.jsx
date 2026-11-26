
import { useState } from "react";
import "./Login.css";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    setError("");
    onLogin({ email, password });
  }

  return (
    <div className="login-page">
      <div className="login-visual">
        <div className="login-brand">
          MEDUSA<span>-X</span>
        </div>

        <div className="login-orbit">✚</div>

        <div className="login-visual-content">
          <p>INTELLIGENCE. INTEGRITY. CARE.</p>
          <h1>
            Connected records.
            <br />
            Clearer clinical insights.
          </h1>
          <span>
            A unified clinical intelligence workspace
            for healthcare professionals.
          </span>
        </div>

        <div className="login-footer">
          MEDUSA-X · CLINICAL INTELLIGENCE
        </div>
      </div>

      <div className="login-form-side">
        <form className="login-card" onSubmit={handleSubmit}>
          <div className="login-icon">✚</div>

          <p className="login-eyebrow">WELCOME BACK</p>

          <h2>Sign in to MEDUSA-X</h2>

          <p className="login-description">
            Access your clinical workspace securely.
          </p>

          <label>Email address</label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <p className="login-error">{error}</p>
          )}

          <button type="submit" className="login-submit">
            Sign In <span>→</span>
          </button>

          <div className="login-security">
            <span>◇</span> Clinical workspace access
          </div>

          <p className="login-note">
            Prototype login screen — connect to backend
            authentication before using real accounts.
          </p>
        </form>
      </div>
    </div>
  );
}
