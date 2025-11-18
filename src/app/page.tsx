"use client";

import { useState } from "react";
// Fix: Removed unused useAuth import
import VerifyScreen from "@/components/VerifyScreen";
import HomeScreen from "@/components/HomeScreen";

export default function Page() {
  /* -------------------------------------------------------------------------- */
  /* STATE & HOOKS                                                              */
  /* -------------------------------------------------------------------------- */

  // Fix: Removed unused user variable
  const [scannedGuest, setScannedGuest] = useState<string | null>(null);

  /* -------------------------------------------------------------------------- */
  /* HANDLERS                                                                   */
  /* -------------------------------------------------------------------------- */

  // Called when VerifyScreen successfully validates a code
  const handleVerified = (code?: string, guestName?: string) => {
    console.log("Verified code:", code);
    if (guestName) {
      setScannedGuest(guestName);
    }
  };

  // Called when user clicks "Scan Next Guest"
  const handleScanNext = () => {
    setScannedGuest(null);
  };

  /* -------------------------------------------------------------------------- */
  /* RENDER                                                                     */
  /* -------------------------------------------------------------------------- */

  // If we have a scanned guest, show the success card (HomeScreen)
  if (scannedGuest) {
    return <HomeScreen guestName={scannedGuest} onScanNext={handleScanNext} />;
  }

  // Otherwise, show the scanner
  return <VerifyScreen onVerified={handleVerified} />;
}
