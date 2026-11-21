/** Serializes SDK mutations and ignores responses for an obsolete NextAuth session. */
export interface SessionUser { uid: string }
type SyncState = "loading" | "authenticated" | "unauthenticated" | "error";
export function createFirebaseSessionSync<User extends SessionUser>(operations: {
  currentUser: () => User | null;
  signOut: () => Promise<unknown>;
  fetchToken: (signal: AbortSignal) => Promise<string | null>;
  signIn: (token: string) => Promise<User>;
  publish: (state: SyncState, user: User | null, error?: string) => void;
}) {
  let revision = 0;
  let controller: AbortController | null = null;
  let queue: Promise<void> = Promise.resolve();
  const cancel = () => { revision++; controller?.abort(); };
  const sync = (expectedUid: string | null) => {
    cancel();
    const requestRevision = revision;
    controller = new AbortController();
    const signal = controller.signal;
    const current = () => revision === requestRevision && !signal.aborted;
    operations.publish("loading", null);
    queue = queue.catch(() => {}).then(async () => {
      if (!current()) return;
      try {
        if (!expectedUid) {
          if (operations.currentUser()) await operations.signOut();
          if (current()) operations.publish("unauthenticated", null);
          return;
        }
        if (operations.currentUser()?.uid !== expectedUid && operations.currentUser()) await operations.signOut();
        if (!current()) return;
        if (operations.currentUser()?.uid === expectedUid) {
          operations.publish("authenticated", operations.currentUser());
          return;
        }
        const token = await operations.fetchToken(signal);
        if (!current()) return;
        if (!token) {
          if (operations.currentUser()) await operations.signOut();
          if (current()) operations.publish("unauthenticated", null);
          return;
        }
        const user = await operations.signIn(token);
        // SDK sign-in itself is not abortable. Clear an obsolete result before
        // the next serialized sign-in/sign-out operation can start.
        if (!current()) { await operations.signOut(); return; }
        if (user.uid !== expectedUid) {
          await operations.signOut();
          throw new Error("Security error: Authenticated identity mismatch");
        }
        operations.publish("authenticated", user);
      } catch (error) {
        if (current()) operations.publish("error", null, error instanceof Error ? error.message : "Firebase authentication failed");
      }
    });
    return queue;
  };
  return { sync, cancel };
}
