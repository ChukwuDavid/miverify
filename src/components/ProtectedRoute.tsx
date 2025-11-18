"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import AuthScreen from "./AuthScreen";
import VerifyScreen from "./VerifyScreen";
import { isUserVerified, markUserVerified } from "@/lib/verification";
import "./ProtectedLayout.css";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const [verifiedManual, setVerifiedManual] = useState(false);

  // Loading state
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

  // Not signed in -> show auth screen
  if (!user) {
    return <AuthScreen />;
  }

  // Check verification state (client-side localStorage)
  const checkedVerified = user?.uid ? isUserVerified(user.uid) : false;
  const verified = checkedVerified || verifiedManual;

  // Fix: Removed the 'code' argument since it was not being used in the function body
  const handleVerified = () => {
    if (!user?.uid) return;
    markUserVerified(user.uid);
    setVerifiedManual(true);
  };

  if (!verified) {
    return <VerifyScreen onVerified={handleVerified} />;
  }

  return <>{children}</>;
}
