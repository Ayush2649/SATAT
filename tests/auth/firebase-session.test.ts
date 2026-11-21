import { describe, expect, it, vi } from "vitest";
import { createFirebaseSessionSync } from "@/lib/auth/firebase-session";
const deferred = <T>() => { let resolve!: (value: T) => void; let reject!: (reason: Error) => void; const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const flush = async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); };
function fixture() {
  let user: { uid: string } | null = null;
  const publish = vi.fn();
  const fetchToken = vi.fn(async (_signal: AbortSignal): Promise<string | null> => "B");
  const signIn = vi.fn(async (token: string) => (user = { uid: token }));
  const signOut = vi.fn(async () => { user = null; });
  const sync = createFirebaseSessionSync({ currentUser: () => user, signOut, fetchToken, signIn, publish });
  return { ...sync, fetchToken, signIn, signOut, publish, currentUser: () => user };
}
describe("Latest NextAuth identity wins pending Firebase operations", () => {
  it("ignores a stale token and authenticates the new account", async () => {
    const f = fixture(), token = deferred<string>();
    f.fetchToken.mockImplementationOnce(() => token.promise);
    const a = f.sync("A"); await flush();
    const b = f.sync("B"); token.resolve("A"); await Promise.all([a, b]);
    expect(f.signIn.mock.calls.map(call => call[0])).toEqual(["B"]);
    expect(f.currentUser()?.uid).toBe("B");
    expect(f.publish).not.toHaveBeenCalledWith("authenticated", { uid: "A" });
  });
  it("signs out an unabortable old sign-in before processing logout", async () => {
    const f = fixture(), signedIn = deferred<{ uid: string }>();
    f.fetchToken.mockResolvedValueOnce("A"); f.signIn.mockImplementationOnce(() => signedIn.promise);
    const a = f.sync("A"); await flush(); await flush();
    const logout = f.sync(null); signedIn.resolve({ uid: "A" }); await Promise.all([a, logout]);
    expect(f.signOut).toHaveBeenCalled();
    expect(f.publish).not.toHaveBeenCalledWith("authenticated", { uid: "A" });
    expect(f.publish).toHaveBeenLastCalledWith("unauthenticated", null);
  });
  it("does not publish a stale failure over a newer account", async () => {
    const f = fixture(), token = deferred<string>(); f.fetchToken.mockImplementationOnce(() => token.promise);
    const a = f.sync("A"); await flush(); const b = f.sync("B"); token.reject(new Error("old request")); await Promise.all([a, b]);
    expect(f.publish).not.toHaveBeenCalledWith("error", null, "old request");
    expect(f.publish).toHaveBeenLastCalledWith("authenticated", { uid: "B" });
  });
  it("clears an SDK identity mismatch and reports the error", async () => {
    const f = fixture(); f.fetchToken.mockResolvedValueOnce("wrong"); await f.sync("A");
    expect(f.currentUser()).toBeNull(); expect(f.signOut).toHaveBeenCalled();
    expect(f.publish).toHaveBeenLastCalledWith("error", null, "Security error: Authenticated identity mismatch");
  });
  it("clears authentication when the server rejects the session", async () => {
    const f = fixture(); f.fetchToken.mockResolvedValueOnce(null); await f.sync("A");
    expect(f.signIn).not.toHaveBeenCalled(); expect(f.publish).toHaveBeenLastCalledWith("unauthenticated", null);
  });
});
