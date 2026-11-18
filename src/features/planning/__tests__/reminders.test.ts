import { describe, expect, it, jest } from "@jest/globals";

import { EVERY_TIME, validateRoutineDraft, type Routine } from "@/domain/planning/Routine";
import { upcomingReminders } from "@/domain/planning/reminders";
import { ReminderScheduler, type LocalNotifications, type NotificationPermission, type ScheduledReminder } from "@/features/planning/ReminderScheduler";
import { reminderLabel } from "@/features/planning/planningDraft";

const base: Routine = {
  id: "r1",
  name: "Matin",
  startDate: "2030-08-05", // lundi
  time: "08:00",
  repetition: { unit: "WEEK", every: 1, weekdays: [1, 4], end: { kind: "UNTIL", date: "2030-12-31" } },
  entries: [{ id: "e1", sessionId: "s1", frequency: EVERY_TIME }],
  exclusions: ["2030-08-08T08:00"],
  reminderMinutes: 15,
  createdAt: "t",
  updatedAt: "t",
};

describe("fenêtre glissante des rappels (chapitre 12)", () => {
  it("rappel 15 min avant chaque occurrence future ; retraits et passé exclus ; ordre chronologique", () => {
    const now = new Date(2030, 7, 5, 7, 50); // lundi 7 h 50 : le rappel de 7 h 45 est passé
    const reminders = upcomingReminders([base], now, () => true, { horizonDays: 14 });
    expect(reminders.map((r) => r.occurrenceKey)).toEqual(["2030-08-12T08:00", "2030-08-15T08:00", "2030-08-19T08:00"]);
    expect(reminders[0]!.fireAt).toEqual(new Date(2030, 7, 12, 7, 45));
  });

  it("sans rappel, Séance indisponible ou au-delà de la limite : rien de plus", () => {
    const now = new Date(2030, 7, 1);
    expect(upcomingReminders([{ ...base, reminderMinutes: null }], now, () => true)).toEqual([]);
    expect(upcomingReminders([base], now, () => false)).toEqual([]);
    expect(upcomingReminders([base], now, () => true, { limit: 2 })).toHaveLength(2);
  });

  it("délai : 1 min à 24 h (D-243)", () => {
    const draft = { name: "Matin", startDate: "2030-08-05", time: "08:00", repetition: null, entries: base.entries };
    expect(validateRoutineDraft({ ...draft, reminderMinutes: 1440 })).toEqual([]);
    expect(validateRoutineDraft({ ...draft, reminderMinutes: 1441 })).toEqual(["INVALID_REMINDER"]);
    expect(validateRoutineDraft({ ...draft, reminderMinutes: 0 })).toEqual(["INVALID_REMINDER"]);
  });

  it("libellés des délais : 5', 1h, 1h20", () => {
    expect([5, 60, 80, 1440].map(reminderLabel)).toEqual(["5’", "1h", "1h20", "24h"]);
  });
});

function fakeNotifications(initial: NotificationPermission, answer: NotificationPermission) {
  let permission = initial;
  const scheduled: ScheduledReminder[][] = [];
  const port: LocalNotifications = {
    permission: async () => permission,
    requestPermission: jest.fn(async () => {
      permission = answer;
      return answer;
    }),
    replaceReminders: async (reminders) => {
      scheduled.push([...reminders]);
    },
    onReminderOpened: () => () => undefined,
  };
  return { port, scheduled };
}

describe("ReminderScheduler (RM-051 à RM-053)", () => {
  const deps = (port: LocalNotifications) => ({
    notifications: port,
    listRoutines: async () => [base],
    activeSessionNames: async () => new Map([["s1", "Gainage"]]),
    now: () => new Date(2030, 7, 5, 6, 0),
  });

  it("autorisation demandée une seule fois, à la première activation ; acceptée → vrai", async () => {
    const { port } = fakeNotifications("undetermined", "granted");
    const scheduler = new ReminderScheduler(deps(port));
    expect(await scheduler.ensurePermission()).toBe(true);
    expect(await scheduler.ensurePermission()).toBe(true);
    expect(port.requestPermission).toHaveBeenCalledTimes(1);
  });

  it("refus : faux, aucune nouvelle demande, rien programmé", async () => {
    const { port, scheduled } = fakeNotifications("denied", "denied");
    const scheduler = new ReminderScheduler(deps(port));
    expect(await scheduler.ensurePermission()).toBe(false);
    await scheduler.refresh();
    expect(port.requestPermission).not.toHaveBeenCalled();
    expect(scheduled).toEqual([]);
  });

  it("autorisé : la fenêtre est reprogrammée avec le nom de la séance et l'heure", async () => {
    const { port, scheduled } = fakeNotifications("granted", "granted");
    await new ReminderScheduler(deps(port)).refresh();
    expect(scheduled).toHaveLength(1);
    expect(scheduled[0]![0]).toEqual({
      id: "r1|2030-08-05T08:00",
      fireAt: new Date(2030, 7, 5, 7, 45),
      title: "Gainage",
      body: "Séance prévue à 8 h.",
      sessionId: "s1",
    });
  });

  it("RM-054b : le rappel emporte la première Séance retenue pour son occurrence, motifs x fois sur n compris", async () => {
    const { port, scheduled } = fakeNotifications("granted", "granted");
    const twoContents: Routine = {
      ...base,
      exclusions: [],
      entries: [
        { id: "e1", sessionId: "s2", frequency: { x: 1, n: 2, positions: [1] } },
        { id: "e2", sessionId: "s1", frequency: EVERY_TIME },
      ],
    };
    await new ReminderScheduler({
      ...deps(port),
      listRoutines: async () => [twoContents],
      activeSessionNames: async () => new Map([["s1", "Gainage"], ["s2", "Mobilité"]]),
    }).refresh();
    expect(scheduled[0]!.slice(0, 3).map((reminder) => [reminder.id, reminder.sessionId])).toEqual([
      ["r1|2030-08-05T08:00", "s2"],
      ["r1|2030-08-08T08:00", "s1"],
      ["r1|2030-08-12T08:00", "s2"],
    ]);
  });
});
