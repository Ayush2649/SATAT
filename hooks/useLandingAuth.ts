"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

/**
 * Unified authentication and CTA handler for the SATAT landing page.
 * Prevents black-screen redirect loops by never routing unauthenticated
 * visitors to protected /onboarding or /dashboard routes directly.
 * Instead, directly triggers Google OAuth, routing to targetPath once authenticated.
 */
export function useLandingAuth() {
  const { data: session, status } = useSession();
  
  let router: ReturnType<typeof useRouter> | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    router = useRouter();
  } catch {
    router = null;
  }

  const handleStartOrSignIn = useCallback(
    async (targetPath: string = "/dashboard") => {
      if (session?.user) {
        if (router) {
          router.push(targetPath);
        } else if (typeof window !== "undefined") {
          window.location.href = targetPath;
        }
      } else {
        await signIn("google", { callbackUrl: targetPath });
      }
    },
    [session, router]
  );

  return {
    session,
    isAuthenticated: Boolean(session?.user),
    isLoading: status === "loading",
    handleStartOrSignIn,
  };
}
