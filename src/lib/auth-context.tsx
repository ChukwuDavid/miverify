"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { auth } from "./firebase-client";
import {
  saveSession,
  clearSession,
  isSessionExpired,
  getSessionRemainingTime,
} from "./session-storage";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  error: string | null;
  signup: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  sessionRemainingTime: number; // in milliseconds
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionRemainingTime, setSessionRemainingTime] = useState(0);

  // Ref to track if a login/signup action is in progress
  // This prevents onAuthStateChanged from logging the user out before the session is saved
  const isLoggingInRef = useRef(false);

  // Check session expiry on mount and periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = getSessionRemainingTime();
      setSessionRemainingTime(remaining);
      if (remaining <= 0 && user) {
        // Auto-logout on expiry
        signOut(auth).catch(() => {});
        clearSession();
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [user]);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("[auth] onAuthStateChanged fired", { currentUser });

      if (currentUser) {
        // FIX: Skip expiry check if we are currently in the process of logging in
        if (!isLoggingInRef.current && isSessionExpired()) {
          console.log("[auth] Session expired or missing, signing out...");
          // Session expired, log out
          signOut(auth)
            .then(() => {
              clearSession();
              setUser(null);
              setLoading(false);
            })
            .catch(() => {
              setUser(null);
              setLoading(false);
            });
        } else {
          setUser(currentUser);
          const remaining = getSessionRemainingTime();
          setSessionRemainingTime(remaining);
          console.log("[auth] setting user from onAuthStateChanged", {
            uid: currentUser.uid,
          });
          setLoading(false);
        }
      } else {
        setUser(null);
        console.log("[auth] no currentUser, cleared user");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signup = async (email: string, password: string) => {
    try {
      isLoggingInRef.current = true; // Start login flow
      setError(null);
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      // Save session BEFORE clearing the flag
      saveSession(userCredential.user.uid);
      setUser(userCredential.user);
      console.log("[auth] signup succeeded", { uid: userCredential.user.uid });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Signup failed";
      setError(message);
      throw err;
    } finally {
      // Small delay to ensure state updates propagate before enabling the listener check again
      setTimeout(() => {
        isLoggingInRef.current = false;
      }, 500);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      isLoggingInRef.current = true; // Start login flow
      setError(null);
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      // Save session BEFORE clearing the flag
      saveSession(userCredential.user.uid);
      setUser(userCredential.user);
      console.log("[auth] login succeeded", { uid: userCredential.user.uid });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      throw err;
    } finally {
      // Small delay to ensure state updates propagate before enabling the listener check again
      setTimeout(() => {
        isLoggingInRef.current = false;
      }, 500);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
      clearSession();
      setUser(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Logout failed";
      setError(message);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        signup,
        login,
        logout,
        sessionRemainingTime,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
