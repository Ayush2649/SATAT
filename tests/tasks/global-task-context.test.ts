import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  setTaskContext,
  getTaskContext,
  computeTaskContext,
  type TaskContextData,
} from "@/lib/orbitContext";

interface MockTask {
  id: string;
  title: string;
  status: "pending" | "completed";
  projectId: string;
  dueDate?: string;
  completedAt?: number;
  priority?: "high" | "medium" | "low";
  userId: string;
  createdAt: number;
}

interface MockProject {
  id: string;
  name: string;
  color: string;
}

describe("BUG-03: Global Task Context Across Projects for Orbit", () => {
  const TODAY = "2026-10-26";
  const YESTERDAY = "2026-10-25";
  const TOMORROW = "2026-10-27";
  const TODAY_TS = new Date(TODAY + "T10:00:00").getTime();

  const mockProjects: MockProject[] = [
    { id: "proj-work", name: "Work", color: "#3E7563" },
    { id: "proj-personal", name: "Personal", color: "#6366F1" },
    { id: "proj-health", name: "Health", color: "#EC4899" },
  ];

  beforeEach(() => {
    // Reset store before each test
    setTaskContext({
      todayDate: TODAY,
      pendingToday: [],
      completedToday: [],
      overdue: [],
      totalPending: 0,
    });
  });

  it("1. Aggregates pending tasks across multiple projects into global Orbit context", () => {
    const allTasks: MockTask[] = [
      {
        id: "t1",
        title: "Work task 1",
        status: "pending",
        projectId: "proj-work",
        dueDate: TODAY,
        priority: "high",
        userId: "u1",
        createdAt: 1000,
      },
      {
        id: "t2",
        title: "Work task 2",
        status: "pending",
        projectId: "proj-work",
        dueDate: TODAY,
        priority: "medium",
        userId: "u1",
        createdAt: 1001,
      },
      {
        id: "t3",
        title: "Personal task 1",
        status: "pending",
        projectId: "proj-personal",
        dueDate: TODAY,
        priority: "low",
        userId: "u1",
        createdAt: 1002,
      },
      {
        id: "t4",
        title: "Health task 1",
        status: "pending",
        projectId: "proj-health",
        dueDate: TOMORROW, // not due today, but pending
        userId: "u1",
        createdAt: 1003,
      },
    ];

    const context = computeTaskContext(allTasks, mockProjects, TODAY);
    setTaskContext(context);

    const orbitContext = getTaskContext();
    expect(orbitContext).not.toBeNull();
    // 4 total pending tasks across all projects
    expect(orbitContext?.totalPending).toBe(4);
    // 3 pending today (t1, t2, t3)
    expect(orbitContext?.pendingToday).toHaveLength(3);
    expect(orbitContext?.pendingToday.map((p) => p.projectName)).toEqual([
      "Work",
      "Work",
      "Personal",
    ]);
  });

  it("2. Excludes completed tasks from pending count and assigns to completedToday", () => {
    const allTasks: MockTask[] = [
      {
        id: "t1",
        title: "Active task",
        status: "pending",
        projectId: "proj-work",
        dueDate: TODAY,
        userId: "u1",
        createdAt: 1000,
      },
      {
        id: "t2",
        title: "Completed today task",
        status: "completed",
        projectId: "proj-work",
        completedAt: TODAY_TS,
        userId: "u1",
        createdAt: 990,
      },
      {
        id: "t3",
        title: "Completed yesterday task",
        status: "completed",
        projectId: "proj-personal",
        completedAt: new Date(YESTERDAY + "T10:00:00").getTime(),
        userId: "u1",
        createdAt: 800,
      },
    ];

    const context = computeTaskContext(allTasks, mockProjects, TODAY);
    setTaskContext(context);

    const orbitContext = getTaskContext();
    expect(orbitContext?.totalPending).toBe(1);
    expect(orbitContext?.pendingToday).toHaveLength(1);
    expect(orbitContext?.pendingToday[0].title).toBe("Active task");
    // Only t2 was completed today; t3 was yesterday
    expect(orbitContext?.completedToday).toHaveLength(1);
    expect(orbitContext?.completedToday[0].title).toBe("Completed today task");
  });

  it("3. Identifies overdue tasks across projects", () => {
    const allTasks: MockTask[] = [
      {
        id: "t1",
        title: "Overdue work task",
        status: "pending",
        projectId: "proj-work",
        dueDate: YESTERDAY,
        priority: "high",
        userId: "u1",
        createdAt: 900,
      },
      {
        id: "t2",
        title: "Today's personal task",
        status: "pending",
        projectId: "proj-personal",
        dueDate: TODAY,
        userId: "u1",
        createdAt: 1000,
      },
    ];

    const context = computeTaskContext(allTasks, mockProjects, TODAY);
    setTaskContext(context);

    const orbitContext = getTaskContext();
    expect(orbitContext?.overdue).toHaveLength(1);
    expect(orbitContext?.overdue[0].title).toBe("Overdue work task");
    expect(orbitContext?.overdue[0].priority).toBe("high");
    expect(orbitContext?.totalPending).toBe(2);
  });

  it("4. Changing selected project keeps global Orbit count unchanged while UI filters locally", () => {
    const allTasks: MockTask[] = [
      {
        id: "t1",
        title: "Work task 1",
        status: "pending",
        projectId: "proj-work",
        userId: "u1",
        createdAt: 1000,
      },
      {
        id: "t2",
        title: "Work task 2",
        status: "pending",
        projectId: "proj-work",
        userId: "u1",
        createdAt: 1001,
      },
      {
        id: "t3",
        title: "Personal task 1",
        status: "pending",
        projectId: "proj-personal",
        userId: "u1",
        createdAt: 1002,
      },
    ];

    // Simulate viewing Project "proj-work"
    const uiTasksProjWork = allTasks.filter((t) => t.projectId === "proj-work");
    expect(uiTasksProjWork).toHaveLength(2);

    // Orbit context receives allTasks
    const context1 = computeTaskContext(allTasks, mockProjects, TODAY);
    setTaskContext(context1);
    expect(getTaskContext()?.totalPending).toBe(3);

    // Now user switches to Project "proj-personal"
    const uiTasksProjPersonal = allTasks.filter((t) => t.projectId === "proj-personal");
    expect(uiTasksProjPersonal).toHaveLength(1);

    // Global Orbit context remains 3
    const context2 = computeTaskContext(allTasks, mockProjects, TODAY);
    setTaskContext(context2);
    expect(getTaskContext()?.totalPending).toBe(3);
  });

  it("5. Handles empty tasks and empty project lists safely", () => {
    // Empty tasks and empty projects
    const contextEmpty = computeTaskContext([], [], TODAY);
    setTaskContext(contextEmpty);

    const orbitContext = getTaskContext();
    expect(orbitContext?.totalPending).toBe(0);
    expect(orbitContext?.pendingToday).toEqual([]);
    expect(orbitContext?.completedToday).toEqual([]);
    expect(orbitContext?.overdue).toEqual([]);
    expect(orbitContext?.todayDate).toBe(TODAY);

    // Task with missing project mapping in projects list
    const unmappedTask: MockTask[] = [
      {
        id: "t-orphan",
        title: "Orphaned project task",
        status: "pending",
        projectId: "unknown-proj-id",
        userId: "u1",
        createdAt: 1000,
      },
    ];
    const contextOrphan = computeTaskContext(unmappedTask, [], TODAY);
    expect(contextOrphan.totalPending).toBe(1);
    expect(contextOrphan.pendingToday[0].projectName).toBeUndefined();
  });

  it("6. Asynchronous loading and stale-update scenario prevention", async () => {
    // Simulate user rapidly switching between projects: Project A -> Project B
    let currentActiveContext: TaskContextData | null = null;
    let activeRequestId = 0;

    const simulateProjectLoad = async (
      projectId: string,
      tasks: MockTask[],
      delayMs: number
    ) => {
      const thisRequestId = ++activeRequestId;
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          // Cancellation check: only apply if this is still the active request
          if (thisRequestId === activeRequestId) {
            currentActiveContext = computeTaskContext(tasks, mockProjects, TODAY);
            setTaskContext(currentActiveContext);
          }
          resolve();
        }, delayMs);
      });
    };

    const projectATasks: MockTask[] = [
      { id: "a1", title: "A1", status: "pending", projectId: "proj-work", userId: "u1", createdAt: 1 },
    ];
    const projectBTasks: MockTask[] = [
      { id: "b1", title: "B1", status: "pending", projectId: "proj-personal", userId: "u1", createdAt: 2 },
      { id: "b2", title: "B2", status: "pending", projectId: "proj-personal", userId: "u1", createdAt: 3 },
    ];

    // Project A starts loading (slow response: 50ms)
    const reqA = simulateProjectLoad("proj-work", projectATasks, 50);

    // User switches to Project B immediately (fast response: 10ms)
    const reqB = simulateProjectLoad("proj-personal", projectBTasks, 10);

    await Promise.all([reqA, reqB]);

    // The stale Project A response (which finished later at 50ms) must NOT overwrite Project B
    // Because Project B was the latest request (activeRequestId = 2)
    // Wait, since B was triggered second, activeRequestId was 2. When B finished at 10ms, activeRequestId was 2.
    // When A finished at 50ms, thisRequestId was 1 != 2, so A was discarded!
    expect(getTaskContext()?.totalPending).toBe(2);
  });
});
