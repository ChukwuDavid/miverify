"use client";

import React, {
  useRef,
  useState,
  useEffect,
  createContext,
  useContext,
} from "react";

import styles from "./VerifyScreen.module.css";

/* -------------------------------------------------------------------------- */
/* MOCK AUTH CONTEXT (Replace with actual import in production)               */
/* -------------------------------------------------------------------------- */
// import { useAuth } from "@/lib/auth-context";

const AuthContext = createContext<{ logout: () => void }>({
  logout: () => console.log("Logout clicked"),
});

const useAuth = () => useContext(AuthContext);

/* -------------------------------------------------------------------------- */
/* TYPES & INTERFACES                                                         */
/* -------------------------------------------------------------------------- */

interface BarcodeDetectorStub {
  detect(
    imageSource: CanvasImageSource
  ): Promise<Array<{ rawValue: string; displayValue: string }>>;
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
  const html5ScannerRef = useRef<any>(null);

  const { logout } = useAuth();

  const [state, setState] = useState<ScanState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [guestName, setGuestName] = useState<string | null>(null);

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
      const elem = document.getElementById("html5qrcode-container");
      if (elem) elem.remove();
    } catch (err) {
      console.error("Scanner cleanup error", err);
    }
  };

  /* -------------------------------------------------------------------------- */
  /* PERMISSION FLOW                                                            */
  /* -------------------------------------------------------------------------- */

  const startPermissionFlow = async () => {
    setState("requesting");
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setState("scanning");
      startScanning();
    } catch (err) {
      setState("permission-denied");
      setError("Camera permission denied. Please check your browser settings.");
    }
  };

  /* -------------------------------------------------------------------------- */
  /* SCANNING STRATEGIES                                                        */
  /* -------------------------------------------------------------------------- */

  const startScanning = async () => {
    cleanupHtml5Scanner();

    const BarcodeDetectorClass = (window as any).BarcodeDetector;

    // Strategy 1: Native Barcode API (Chrome/Android)
    if (BarcodeDetectorClass) {
      try {
        const detector = new BarcodeDetectorClass({ formats: ["qr_code"] });
        scanWithBarcodeDetector(detector);
        return;
      } catch (err) {
        // Fallthrough to strategy 2 if initialization fails
      }
    }

    // Strategy 2: HTML5-QRCode Library Fallback
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
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
        } catch (err) {
          // Silent fail for empty frames
        }
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  };

  const scanWithHtml5Qrcode = async (Html5QrcodeClass: any) => {
    const id = "html5qrcode-container";
    let container = document.getElementById(id);

    if (!container) {
      container = document.createElement("div");
      container.id = id;
      container.style.display = "none";
      document.body.appendChild(container);
    }

    const scanner = new Html5QrcodeClass(id);
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
    cleanupHtml5Scanner();
    setScannedCode(code);

    try {
      // Simulate API Network Request
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
    } catch (err) {
      setState("error");
      setError("Server connection failed");
    }
  };

  const resetScanner = () => {
    stopStream();
    cleanupHtml5Scanner();
    setGuestName(null);
    setScannedCode(null);
    setState("idle");
  };

  /* -------------------------------------------------------------------------- */
  /* RENDER UI                                                                  */
  /* -------------------------------------------------------------------------- */

  return (
    <div className={styles.verifyContainer}>
      <button className={styles.logoutFloating} onClick={logout}>
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
              <div
                className={styles.errorIcon}
                style={{ background: "#6b7280" }}
              >
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
                <video
                  ref={videoRef}
                  className={styles.cameraVideo}
                  muted
                  playsInline
                />
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
