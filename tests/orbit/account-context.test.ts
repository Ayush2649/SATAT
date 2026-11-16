import { afterEach, describe, expect, it } from "vitest";
import { setOrbitContextOwner, setDietContext, getDietContext, setTaskContext, getTaskContext } from "@/lib/orbitContext";
const data = { date: "2026-11-15", meals: [], totals: { calories: 400, proteinG: 20, carbsG: 50, fatG: 10 }, goals: null };
afterEach(() => setOrbitContextOwner(null));
describe("Orbit context ownership", () => {
  it("clears previous context and rejects a late old-account publication", () => {
    setOrbitContextOwner("A"); setDietContext(data, "A"); expect(getDietContext()).toEqual(data);
    setOrbitContextOwner("B"); expect(getDietContext()).toBeNull();
    setDietContext(data, "A"); expect(getDietContext()).toBeNull();
    setDietContext(data, "B"); expect(getDietContext()).toEqual(data);
  });
  it("clears context on logout and does not restore it from a pending page request", () => {
    setOrbitContextOwner("A"); setTaskContext({ todayDate: "2026-11-15", pendingToday: [], completedToday: [], overdue: [], totalPending: 1 }, "A");
    setOrbitContextOwner(null); expect(getTaskContext()).toBeNull();
    setDietContext(data, "A"); expect(getDietContext()).toBeNull();
  });
});
