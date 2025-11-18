import Link from "next/link";
import React from "react";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <div className={styles.container}>
      <div className={styles.glassCard}>
        <div className={styles.content}>
          <h1 className={styles.title}>404</h1>
          <h2 className={styles.subtitle}>Page Not Found</h2>
          <p className={styles.description}>
            Oops! The page you are looking for does not exist.
          </p>
          <Link href="/" className={styles.homeButton}>
            Go to Homepage
          </Link>
        </div>
        {/* Decorative blobs for glassmorphism effect */}
        <div className={`${styles.blob} ${styles.blob1}`} />
        <div className={`${styles.blob} ${styles.blob2}`} />
        <div className={`${styles.blob} ${styles.blob3}`} />
      </div>
      {/* Background animation elements */}
      <div className={`${styles.bgShape} ${styles.bgShape1}`} />
      <div className={`${styles.bgShape} ${styles.bgShape2}`} />
    </div>
  );
}
