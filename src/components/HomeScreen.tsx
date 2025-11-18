"use client";

import React from "react";
import { useAuth } from "@/lib/auth-context";
import GlassCard from "@/components/GlassCard";
import styles from "@/app/page.module.css";

export default function HomeScreen() {
  const { user, logout, sessionRemainingTime } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const formatTimeRemaining = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <main className={styles["page-main"]}>
      <div className={styles["page-container"]}>
        {/* Header with logout */}
        <div className={styles["page-header"]}>
          <h1>Welcome to Your App</h1>
          <button className={styles["logout-button"]} onClick={handleLogout}>
            Logout
          </button>
        </div>

        {/* User info and session */}
        <GlassCard title="User Information">
          <div className={styles["user-info-grid"]}>
            <div className={styles["info-item"]}>
              <p>Email</p>
              <p>{user?.email || "N/A"}</p>
            </div>
            <div className={`${styles["info-item"]} ${styles["info-item-id"]}`}>
              <p>User ID</p>
              <p>{user?.uid || "N/A"}</p>
            </div>
            <div
              className={`${styles["info-item"]} ${styles["info-item-expiry"]}`}
            >
              <p>Session Expires In</p>
              <p>{formatTimeRemaining(sessionRemainingTime)}</p>
            </div>
          </div>
        </GlassCard>

        {/* Example content cards */}
        <div className={styles["content-grid"]}>
          <GlassCard title="Feature One">
            <p>
              This is a demo content card using the glassmorphism design system.
              Replace this with your actual app content.
            </p>
          </GlassCard>

          <GlassCard title="Feature Two">
            <p>
              The auth system is now in place. All routes are protected behind
              the login screen, and sessions expire after 24 hours.
            </p>
          </GlassCard>

          <GlassCard title="Feature Three">
            <p>
              Your app is modular and ready to scale. Add new routes and
              components as needed.
            </p>
          </GlassCard>
        </div>

        {/* Security note */}
        <div className={`glass glass-card ${styles["security-card"]}`}>
          <div className="glass-content">
            <h3>🔒 Security Features</h3>
            <ul>
              <li>24-hour session expiry with automatic logout</li>
              <li>Firebase Authentication for secure login/signup</li>
              <li>Session stored in localStorage with expiry tracking</li>
              <li>
                Protected routes that redirect to login if session expires
              </li>
              <li>All authentication state managed via React Context</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
