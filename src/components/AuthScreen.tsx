"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import styles from "./AuthScreen.module.css";

type AuthMode = "login" | "signup";

export default function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const { login, signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    try {
      if (mode === "login") {
        await login(email, password);
        console.log("[AuthScreen] login called");
      } else {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters");
        }
        await signup(email, password);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === "login" ? "signup" : "login");
    setErrorMsg("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <div className={styles["auth-container"]}>
      {/* Animated background blobs */}
      <div
        className={`${styles["auth-blob"]} ${styles["blob-1"]}`}
        aria-hidden
      />
      <div
        className={`${styles["auth-blob"]} ${styles["blob-2"]}`}
        aria-hidden
      />

      {/* Main glass card */}
      <div className={`glass glass-card ${styles["auth-card"]}`}>
        <div className="glass-content">
          {/* Header */}
          <div className={styles["auth-header"]}>
            <h1>{mode === "login" ? "Welcome to MI-verify" : "Join Us"}</h1>
            <p>
              {mode === "login"
                ? "Sign in to your account to continue"
                : "Create a new account to get started"}
            </p>
          </div>

          {/* Error message */}
          {errorMsg && <div className={styles["auth-error"]}>{errorMsg}</div>}

          {/* Form */}
          <form onSubmit={handleSubmit} className={styles["auth-form"]}>
            {/* Email input */}
            <div className={styles["form-group"]}>
              <label id="email-label" className={styles["form-label"]}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-labelledby="email-label"
                className={styles["form-input"]}
              />
            </div>

            {/* Password input */}
            <div className={styles["form-group"]}>
              <label id="password-label" className={styles["form-label"]}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                aria-labelledby="password-label"
                className={styles["form-input"]}
              />
            </div>

            {/* Confirm password (signup only) */}
            {mode === "signup" && (
              <div className={styles["form-group"]}>
                <label
                  id="confirm-password-label"
                  className={styles["form-label"]}
                >
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  aria-labelledby="confirm-password-label"
                  className={styles["form-input"]}
                />
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`${styles["submit-button"]} ${
                mode === "login" ? styles["login"] : styles["signup"]
              }`}
            >
              {isLoading
                ? "Loading..."
                : mode === "login"
                ? "Sign In"
                : "Sign Up"}
            </button>
          </form>

          {/* Toggle mode */}
          <div className={styles["auth-footer"]}>
            <p>
              {mode === "login"
                ? "Don't have an account? "
                : "Already have an account? "}
            </p>
            <button onClick={toggleMode} className={styles["toggle-button"]}>
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </div>

          {/* Session info */}
          <div className={styles["session-info"]}>
            Your session will expire after 24 hours of inactivity.
          </div>
        </div>
      </div>
    </div>
  );
}
