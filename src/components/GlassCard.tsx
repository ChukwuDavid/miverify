"use client";
import React from "react";
import styles from "./GlassCard.module.css";

type GlassCardProps = {
  title?: string;
  children?: React.ReactNode;
  className?: string;
};

export default function GlassCard({
  title,
  children,
  className = "",
}: GlassCardProps) {
  return (
    <div className={`glass glass-card ${className}`}>
      <div className="glass-blob b1" aria-hidden />
      <div className="glass-blob b2" aria-hidden />
      <div className="glass-content">
        {title && <h3 className={styles["glass-card-title"]}>{title}</h3>}
        <div>{children}</div>
      </div>
    </div>
  );
}
