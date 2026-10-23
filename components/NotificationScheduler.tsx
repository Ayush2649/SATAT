"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { onSnapshot, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useFirebaseAuth } from "@/components/FirebaseAuthProvider";
import { useNotifications } from "@/hooks/useNotifications";
import { getWorkoutSessions, getAllTasks } from "@/lib/firestore";
import { DEFAULT_NOTIFICATION_PREFS } from "@/types";
import type { NotificationPrefs } from "@/types";
import { todayString } from "@/lib/utils";

export default function NotificationScheduler() {
  const { data: session } = useSession();
  const { isReady, firebaseUser } = useFirebaseAuth();

  const userId =
    firebaseUser?.uid ??
    (session?.user as { id?: string } | undefined)?.id ??
    session?.user?.email ??
    "";

  const [prefs, setPrefs] =
    useState<NotificationPrefs>(DEFAULT_NOTIFICATION_PREFS);
  const [lastWorkoutAt, setLastWorkout] = useState<number | null>(null);
  const [pendingTasks, setPendingTasks] = useState(0);

  // Live-sync notification preferences from Firestore.
  useEffect(() => {
    if (!userId || !isReady || !firebaseUser) return;

    const prefsRef = doc(db, "notificationPrefs", userId);

    const unsub = onSnapshot(
      prefsRef,
      (snap) => {
        if (snap.exists()) {
          setPrefs(snap.data() as NotificationPrefs);
        } else {
          setPrefs(DEFAULT_NOTIFICATION_PREFS);
        }
      },
      (error) => {
        console.error("[NotificationScheduler] Preferences listener failed:", {
          code: error.code,
          message: error.message,
        });
      }
    );

    return unsub;
  }, [userId, isReady, firebaseUser]);

  // Load workout and task data once authentication is ready.
  useEffect(() => {
    if (!userId || !isReady || !firebaseUser) return;

    let cancelled = false;

    async function loadData() {
      try {
        const today = todayString();

        const [sessions, tasks] = await Promise.all([
          getWorkoutSessions(userId),
          getAllTasks(userId),
        ]);

        if (cancelled) return;

        const latest = sessions[0];
        if (latest) setLastWorkout(latest.createdAt);

        const pending = tasks.filter(
          (task) =>
            task.status === "pending" &&
            (!task.dueDate || task.dueDate <= today)
        );

        setPendingTasks(pending.length);
      } catch (error) {
        if (cancelled) return;

        console.error(
          "[NotificationScheduler] Failed to load workout/task data:",
          error
        );
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [userId, isReady, firebaseUser]);

  useNotifications({
    userId,
    prefs,
    lastWorkoutAt,
    pendingTasksCount: pendingTasks,
  });

  return null;
}
