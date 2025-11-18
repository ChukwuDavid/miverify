"use client";

import React from "react";
import { useAuth } from "@/lib/auth-context";
import AuthScreen from "./AuthScreen";
import "./ProtectedLayout.css";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  console.log("[ProtectedLayout] loading, user:", { loading, user });

  if (loading) {
    return (
      <div className="protected-loading">
        <div className="protected-loading-content">
          <div className="protected-loading-spinner">⟳</div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return <>{children}</>;
}
