"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import VerifyScreen from "@/components/VerifyScreen";
import HomeScreen from "@/components/HomeScreen";
import { isUserVerified, markUserVerified } from "@/lib/verification";

export default function Page() {
  const { user, logout, sessionRemainingTime } = useAuth();

  // Local session flag (resets when browser refreshes)
  const [verifiedManual, setVerifiedManual] = useState(false);

  // Persisted verification stored per user
  const checkedVerified = user?.uid ? isUserVerified(user.uid) : false;

  // Final verification state
  const verified = checkedVerified || verifiedManual;

  // When user is verified (QR scan success)
  const handleVerified = (code?: string) => {
    console.log("Verified with code:", code);
    if (user?.uid) {
      markUserVerified(user.uid);
      setVerifiedManual(true);
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // Format session timer
  const formatTimeRemaining = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  // 🔥 SHOW VERIFICATION SCREEN FIRST
  if (!verified) {
    return <VerifyScreen onVerified={handleVerified} />;
  }

  // 🔥 ONCE VERIFIED → SHOW HOME SCREEN
  return <HomeScreen />;

  // ❗️ NOTE:
  // If you want the GLASS UI below,
  // remove "return <HomeScreen />"
  // and replace it with the layout code.
}
