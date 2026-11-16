import React, { createContext, useContext, useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { connectFirestoreEmulator, getFirestore, type Firestore } from "firebase/firestore";
import { setOrbitContextOwner } from "@/lib/orbitContext";
export const AccountContext = createContext("audit-browser-a");
const stores = new Map<string, Firestore>();
const identities: Record<string, { uid: string }> = { "audit-browser-a": { uid: "audit-browser-a" }, "audit-browser-b": { uid: "audit-browser-b" } };
export let db: Firestore;
export function selectAccount(uid: string) {
  if (!/^audit-browser-[ab]$/.test(uid)) throw new Error("Only isolated demo accounts are allowed");
  if (!stores.has(uid)) {
    const app = initializeApp({ projectId: "demo-satat-audit", apiKey: "isolated-demo", appId: uid }, uid);
    const store = getFirestore(app);
    connectFirestoreEmulator(store, "127.0.0.1", 8088, { mockUserToken: { sub: uid, user_id: uid } });
    stores.set(uid, store);
  }
  db = stores.get(uid)!; setOrbitContextOwner(uid);
}
selectAccount("audit-browser-a");
export function useSession() { const uid = useContext(AccountContext); return { data: { user: { id: uid, name: `Isolated ${uid.endsWith("a") ? "A" : "B"}`, email: `${uid}@example.invalid` } }, status: "authenticated" }; }
export function useFirebaseAuth() { const uid = useContext(AccountContext); return { firebaseUser: identities[uid], userId: uid, isReady: true, status: "authenticated", error: null, syncToken: async () => {} }; }
export function useSearchParams() {
  const [search, setSearch] = useState(window.location.search);
  useEffect(() => { const onPop = () => setSearch(window.location.search); window.addEventListener("popstate", onPop); return () => window.removeEventListener("popstate", onPop); }, []);
  return new URLSearchParams(search);
}
const navigate = (url: string, replace = false) => { window.history[replace ? "replaceState" : "pushState"]({}, "", url); window.dispatchEvent(new PopStateEvent("popstate")); };
export function useRouter() { return { push: (url: string) => navigate(url), replace: (url: string) => navigate(url, true), refresh: () => window.location.reload(), back: () => window.history.back() }; }
export function usePathname() { return window.location.pathname; }
export function TestImage({ fill, unoptimized, priority, ...props }: any) { return <img {...props} style={{ ...(fill ? { position: "absolute", inset: 0, width: "100%", height: "100%" } : {}), ...props.style }} />; }
export function TestLink({ href, children, ...props }: any) { return <a href={href} {...props}>{children}</a>; }
