"use client";

import React from "react";
import GlassCard from "@/components/GlassCard";
import styles from "@/app/page.module.css";

type HomeScreenProps = {
  guestName: string;
  onScanNext: () => void;
};

export default function HomeScreen({ guestName, onScanNext }: HomeScreenProps) {
  return (
    <main className={styles["page-main"]}>
      <div className={styles["page-container"]}>
        <div className={styles["checking-verification"]}>
          {/* Replaced inline style with cardWrapper class */}
          <div className={styles.cardWrapper}>
            <GlassCard className="text-center py-8">
              {/* Replaced inline style with successIcon class */}
              <div className={styles.successIcon}>✓</div>

              <h2 className="text-2xl font-bold text-white mb-4">
                Access Granted!
              </h2>

              <p className="text-white/80 mb-2">Please admit</p>

              {/* Replaced inline style with guestNameTitle class */}
              <h1 className={styles.guestNameTitle}>{guestName}</h1>

              <p className="text-white/80 mb-8">Enjoy Our party.</p>

              {/* Replaced inline style with scanNextButton class */}
              <button onClick={onScanNext} className={styles.scanNextButton}>
                Scan Next Guest
              </button>
            </GlassCard>
          </div>
        </div>
      </div>
    </main>
  );
}
