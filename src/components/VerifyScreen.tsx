"use client";

import React, { useRef, useState, useEffect } from "react";

import { useAuth } from "@/lib/auth-context";
import styles from "./VerifyScreen.module.css";

/* -------------------------------------------------------------------------- */
/* TYPES & INTERFACES                                                         */
/* -------------------------------------------------------------------------- */

interface BarcodeDetectorStub {
  detect(
    imageSource: CanvasImageSource
  ): Promise<Array<{ rawValue: string; displayValue: string }>>;
}

interface BarcodeDetectorConstructor {
  new (options?: { formats: string[] }): BarcodeDetectorStub;
}

interface Html5QrcodeScanner {
  start: (
    cameraIdOrConfig: string | { facingMode: string },
    configuration: { fps: number; qrbox: { width: number; height: number } },
    qrCodeSuccessCallback: (
      decodedText: string,
      decodedResult: unknown
    ) => void,
    qrCodeErrorCallback: (errorMessage: string) => void
  ) => Promise<void>;
  stop: () => Promise<void>;
  clear: () => Promise<void>;
}

interface Html5QrcodeConstructor {
  new (elementId: string): Html5QrcodeScanner;
}

type ScanState =
  | "idle"
  | "requesting"
  | "scanning"
  | "success"
  | "error"
  | "permission-denied";

/* -------------------------------------------------------------------------- */
/* COMPONENT                                                                  */
/* -------------------------------------------------------------------------- */

export default function VerifyScreen({
  onVerified,
}: {
  onVerified?: (code?: string, guestName?: string) => void;
}) {
  /* -------------------------------------------------------------------------- */
  /* STATE & HOOKS                                                              */
  /* -------------------------------------------------------------------------- */

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const html5ScannerRef = useRef<Html5QrcodeScanner | null>(null);
  const { logout } = useAuth();

  const [state, setState] = useState<ScanState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [guestName, setGuestName] = useState<string | null>(null);
  const [useLibrary, setUseLibrary] = useState(false); // Track if we are using the library

  /* -------------------------------------------------------------------------- */
  /* LIFECYCLE & CLEANUP                                                        */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    return () => {
      stopStream();
      cleanupHtml5Scanner();
    };
  }, []);

  const stopStream = () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    } catch (err) {
      console.error("Stream cleanup error", err);
    }
  };

  const cleanupHtml5Scanner = async () => {
    try {
      if (html5ScannerRef.current) {
        await html5ScannerRef.current.stop();
        await html5ScannerRef.current.clear();
        html5ScannerRef.current = null;
      }
    } catch (err) {
      console.error("Scanner cleanup error", err);
    }
  };

  const handleLogout = async () => {
    try {
      stopStream();
      await cleanupHtml5Scanner();
      await logout();
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  /* -------------------------------------------------------------------------- */
  /* PERMISSION FLOW                                                            */
  /* -------------------------------------------------------------------------- */

  const startPermissionFlow = async () => {
    setState("requesting");
    setError(null);

    try {
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      // Temporarily attach to video ref to show immediate feedback
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setState("scanning");
      startScanning();
    } catch {
      setState("permission-denied");
      setError("Camera permission denied. Please check your browser settings.");
    }
  };

  /* -------------------------------------------------------------------------- */
  /* SCANNING STRATEGIES                                                        */
  /* -------------------------------------------------------------------------- */

  const startScanning = async () => {
    cleanupHtml5Scanner();

    const BarcodeDetectorClass = (
      window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor }
    ).BarcodeDetector;

    // Strategy 1: Native Barcode API (Chrome/Android)
    // This works WITH the stream we just opened.
    if (BarcodeDetectorClass) {
      try {
        const detector = new BarcodeDetectorClass({ formats: ["qr_code"] });
        // Check if it actually works (some browsers implement the class but fail on detect)
        const testCanvas = document.createElement("canvas");
        await detector.detect(testCanvas);

        scanWithBarcodeDetector(detector);
        return;
      } catch {
        // Fallthrough to strategy 2
      }
    }

    // Strategy 2: HTML5-QRCode Library Fallback
    // FIX: Stop the manual stream so the library can start its own.
    stopStream();
    setUseLibrary(true); // Switch UI to show the library container

    try {
      const html5QrcodeModule = await import("html5-qrcode");
      const Html5Qrcode =
        html5QrcodeModule.Html5Qrcode as unknown as Html5QrcodeConstructor;
      scanWithHtml5Qrcode(Html5Qrcode);
    } catch (err) {
      console.warn("Scanner library missing", err);
      if (!BarcodeDetectorClass) {
        setState("error");
        setError("Scanner library not available.");
      }
    }
  };

  const scanWithBarcodeDetector = async (detector: BarcodeDetectorStub) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const loop = async () => {
      if (!videoRef.current || state !== "scanning") return;

      if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        ctx?.drawImage(videoRef.current, 0, 0);

        try {
          const result = await detector.detect(canvas);
          if (result.length > 0) {
            const code = result[0].rawValue || result[0].displayValue || "";
            handleDetectedCode(code);
            return;
          }
        } catch {
          // Silent fail
        }
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  };

  const scanWithHtml5Qrcode = async (
    Html5QrcodeClass: Html5QrcodeConstructor
  ) => {
    // FIX: Target the visible "reader" div
    const scanner = new Html5QrcodeClass("reader");
    html5ScannerRef.current = scanner;

    await scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decoded: string) => handleDetectedCode(decoded),
      () => {}
    );
  };

  /* -------------------------------------------------------------------------- */
  /* VERIFICATION LOGIC                                                         */
  /* -------------------------------------------------------------------------- */

  const handleDetectedCode = async (rawValue: string) => {
    const code = rawValue.trim();
    if (!code) return;

    stopStream();
    await cleanupHtml5Scanner(); // Make sure we await cleanup
    setScannedCode(code);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const success = Math.random() > 0.2;

      if (success) {
        const mockGuest = "Guest #" + Math.floor(Math.random() * 1000);
        setGuestName(mockGuest);
        setState("success");
        if (onVerified) onVerified(code, mockGuest);
      } else {
        setState("error");
        setError("Invalid Ticket Code");
      }
    } catch {
      setState("error");
      setError("Server connection failed");
    }
  };

  const resetScanner = () => {
    stopStream();
    cleanupHtml5Scanner();
    setGuestName(null);
    setScannedCode(null);
    setUseLibrary(false);
    setState("idle");
  };

  /* -------------------------------------------------------------------------- */
  /* RENDER UI                                                                  */
  /* -------------------------------------------------------------------------- */

  return (
    <div className={styles.verifyContainer}>
      <button className={styles.logoutFloating} onClick={handleLogout}>
        Logout
      </button>

      <div className={styles.verifyCard}>
        <div className={styles.cardContent}>
          {state === "idle" && (
            <div className={styles.idleState}>
              <h2 className={styles.cardTitle}>Guest Verification</h2>
              <p className={styles.cardSubtitle}>
                Scan a ticket to verify entry
              </p>
              <button
                className={styles.verifyButton}
                onClick={startPermissionFlow}
              >
                Start Camera
              </button>
            </div>
          )}

          {state === "requesting" && (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>Requesting camera access...</p>
            </div>
          )}

          {state === "permission-denied" && (
            <div className={styles.errorState}>
              <div className={`${styles.errorIcon} ${styles.neutralIcon}`}>
                ?
              </div>
              <h3 className={styles.errorTitle}>Camera Blocked</h3>
              <p className={styles.errorMessage}>{error}</p>
              <button
                className={styles.verifyButton}
                onClick={startPermissionFlow}
              >
                Try Again
              </button>
            </div>
          )}

          {state === "scanning" && (
            <div className={styles.scanningState}>
              <div className={styles.cameraWrapper}>
                {/* FIX: Show video for Native API, div for Library */}
                {!useLibrary ? (
                  <video
                    ref={videoRef}
                    className={styles.cameraVideo}
                    muted
                    playsInline
                  />
                ) : (
                  <div id="reader" className={styles.reader}></div>
                )}

                <div className={styles.scanOverlay}>
                  <div className={styles.scanWindow}></div>
                </div>
              </div>
              <p className={styles.scanHint}>Align QR code within frame</p>
              <button className={styles.cancelButton} onClick={resetScanner}>
                Cancel
              </button>
            </div>
          )}

          {state === "success" && (
            <div className={styles.successState}>
              <div className={styles.successIcon}>✓</div>
              <h3 className={styles.successTitle}>Access Granted</h3>
              <p className={styles.guestName}>{guestName}</p>
              <p className={styles.ticketCode}>{scannedCode}</p>
              <button className={styles.verifyButton} onClick={resetScanner}>
                Scan Next
              </button>
            </div>
          )}

          {state === "error" && (
            <div className={styles.errorState}>
              <div className={styles.errorIcon}>!</div>
              <h3 className={styles.errorTitle}>Verification Failed</h3>
              <p className={styles.errorMessage}>{error}</p>
              <button
                className={styles.retryButton}
                onClick={startPermissionFlow}
              >
                Retry Scan
              </button>
              <button className={styles.textButton} onClick={resetScanner}>
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
