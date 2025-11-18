"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import VerifyScreen from "@/components/VerifyScreen";
import HomeScreen from "@/components/HomeScreen";
import { isUserVerified, markUserVerified } from "@/lib/verification";

export default function Page() {
  /* -------------------------------------------------------------------------- */
  /* STATE & HOOKS                                                              */
  /* -------------------------------------------------------------------------- */

  const { user } = useAuth();
  const [verifiedManual, setVerifiedManual] = useState(false);

  /* -------------------------------------------------------------------------- */
  /* VERIFICATION LOGIC                                                         */
  /* -------------------------------------------------------------------------- */

  const checkedVerified = user?.uid ? isUserVerified(user.uid) : false;
  const verified = checkedVerified || verifiedManual;

  const handleVerified = (code?: string) => {
    console.log("Verified with code:", code);
    if (user?.uid) {
      markUserVerified(user.uid);
      setVerifiedManual(true);
    }
  };

  /* -------------------------------------------------------------------------- */
  /* RENDER                                                                     */
  /* -------------------------------------------------------------------------- */

  if (!verified) {
    return <VerifyScreen onVerified={handleVerified} />;
  }

  return <HomeScreen />;
}
