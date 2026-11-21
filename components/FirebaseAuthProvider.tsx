"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { onAuthStateChanged, signInWithCustomToken, signOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { createFirebaseSessionSync } from "@/lib/auth/firebase-session";
import { setOrbitContextOwner } from "@/lib/orbitContext";
import { getUserKey } from "@/lib/auth/userKey";
import { Loader2 } from "lucide-react";

export type FirebaseAuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated" | "error";

export interface FirebaseAuthContextType {
  firebaseUser: User | null;
  userId: string | null;
  status: FirebaseAuthStatus;
  isReady: boolean;
  error: string | null;
  syncToken: () => Promise<void>;
}

const defaultContext: FirebaseAuthContextType = {
  firebaseUser: null,
  userId: null,
  status: "idle",
  isReady: false,
  error: null,
  syncToken: async () => {},
};

const FirebaseAuthContext = createContext<FirebaseAuthContextType>(defaultContext);

export function useFirebaseAuth(): FirebaseAuthContextType {
  return useContext(FirebaseAuthContext) ?? defaultContext;
}

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status: sessionStatus } = useSession();
  const [firebaseUser, setFirebaseUser] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    return auth.currentUser;
  });
  const [status, setStatus] = useState<FirebaseAuthStatus>("loading");
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expectedUid = sessionStatus === "authenticated" && session ? getUserKey(session) : null;
  const syncRef = useRef<ReturnType<typeof createFirebaseSessionSync<User>> | null>(null);
  if (!syncRef.current) syncRef.current = createFirebaseSessionSync<User>({
    currentUser: () => auth.currentUser,
    signOut: () => signOut(auth),
    signIn: async token => (await signInWithCustomToken(auth, token)).user,
    fetchToken: async signal => {
      const response = await fetch("/api/auth/firebase-token", { method: "POST", headers: { "Content-Type": "application/json" }, signal });
      if (response.status === 401) return null;
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Server responded with status ${response.status}`);
      }
      const { token } = await response.json();
      if (!token || typeof token !== "string") throw new Error("Server returned an invalid or empty token");
      return token;
    },
    publish: (nextStatus, user, message) => {
      setFirebaseUser(user); setStatus(nextStatus); setIsReady(nextStatus !== "loading"); setError(message || null);
    },
  });

  useEffect(() => onAuthStateChanged(auth, user => setFirebaseUser(user)), []);
  useEffect(() => {
    setOrbitContextOwner(expectedUid);
    if (sessionStatus === "loading") {
      syncRef.current!.cancel(); setIsReady(false); setStatus("loading");
      return;
    }
    if (sessionStatus === "authenticated" && !expectedUid) {
      syncRef.current!.cancel(); setFirebaseUser(null); setStatus("error"); setError("No user identity found in session"); setIsReady(true);
      return;
    }
    void syncRef.current!.sync(expectedUid);
    return () => syncRef.current!.cancel();
  }, [expectedUid, sessionStatus]);

  const syncToken = useCallback(async () => {
    if (expectedUid) await syncRef.current!.sync(expectedUid);
  }, [expectedUid]);
  // Never expose a previous SDK identity while the NextAuth account changes.
  const visibleUser = expectedUid && firebaseUser?.uid === expectedUid ? firebaseUser : null;

  return (
    <FirebaseAuthContext.Provider
      value={{
        firebaseUser: visibleUser,
        userId: visibleUser?.uid ?? null,
        status,
        isReady,
        error,
        syncToken,
      }}
    >
      {children}
    </FirebaseAuthContext.Provider>
  );
}

/**
 * Gate that delays rendering children until Firebase Authentication is confirmed ready.
 * Prevents premature Firestore calls before request.auth is established.
 */
export function FirebaseAuthGate({
  children,
  fallback,
}: {
  children?: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { isReady, firebaseUser, status, error, syncToken } = useFirebaseAuth();

  if (error) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <div className="rounded-full bg-red-100 dark:bg-red-950/50 p-3 text-red-600 dark:text-red-400">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100">Connection Error</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mt-1">
            {error.includes("configuration-not-found")
              ? "Firebase Authentication is not yet enabled in your Firebase Console. In the Firebase Console, go to Build > Authentication and click 'Get started'."
              : "Unable to connect to the database securely."}
          </p>
        </div>
        <button
          onClick={() => syncToken()}
          className="px-4 py-2 bg-[#3E7563] hover:bg-[#336152] text-white rounded-lg text-xs font-medium transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (!isReady || !firebaseUser || status !== "authenticated") {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-7 h-7 text-[#3E7563] animate-spin" />
        <p className="text-xs text-gray-400 font-medium">
          Connecting securely...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
