"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
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

  // Check session expiry on mount and periodically
  useEffect(() => {
    // Only set up the interval; auth state is handled by onAuthStateChanged
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
        if (isSessionExpired()) {
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
      setError(null);
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      saveSession(userCredential.user.uid);
      setUser(userCredential.user);
      console.log("[auth] signup succeeded", { uid: userCredential.user.uid });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Signup failed";
      setError(message);
      throw err;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      saveSession(userCredential.user.uid);
      setUser(userCredential.user);
      console.log("[auth] login succeeded", { uid: userCredential.user.uid });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      throw err;
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
