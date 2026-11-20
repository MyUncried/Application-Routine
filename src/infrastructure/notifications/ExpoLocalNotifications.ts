import * as Notifications from "expo-notifications";

import type { LocalNotifications, NotificationPermission, ScheduledReminder } from "@/features/planning/ReminderScheduler";

/**
 * Adaptateur `expo-notifications` des rappels de Routine (chapitre 12 « Notifications »). Seuls les rappels marqués
 * `kind: "routine-reminder"` sont annulés puis reprogrammés : aucune autre notification n'est touchée. Le toucher d'un
 * rappel (action par défaut) est signalé avec sa Séance (RM-054b).
 */
const KIND = "routine-reminder";

let handlerInstalled = false;

/** Rappels déjà ouverts : la réponse de lancement et l'écouteur peuvent signaler le même toucher. */
const openedReminders = new Set<string>();

function installForegroundHandler() {
  if (handlerInstalled) return;
  handlerInstalled = true;
  // Application au premier plan : le rappel s'affiche quand même (bannière et liste).
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
}

function toPermission(status: Notifications.PermissionStatus): NotificationPermission {
  if (status === Notifications.PermissionStatus.GRANTED) return "granted";
  if (status === Notifications.PermissionStatus.DENIED) return "denied";
  return "undetermined";
}

export const expoLocalNotifications: LocalNotifications = {
  async permission() {
    installForegroundHandler();
    return toPermission((await Notifications.getPermissionsAsync()).status);
  },
  async requestPermission() {
    installForegroundHandler();
    return toPermission((await Notifications.requestPermissionsAsync()).status);
  },
  async replaceReminders(reminders: readonly ScheduledReminder[]) {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const request of scheduled) {
      if (request.content.data?.kind === KIND) await Notifications.cancelScheduledNotificationAsync(request.identifier);
    }
    for (const reminder of reminders) {
      await Notifications.scheduleNotificationAsync({
        content: { title: reminder.title, body: reminder.body, data: { kind: KIND, id: reminder.id, sessionId: reminder.sessionId } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: reminder.fireAt },
      });
    }
  },
  onReminderOpened(listener: (sessionId: string) => void) {
    const open = (response: Notifications.NotificationResponse | null | undefined) => {
      if (!response || response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
      const identifier = response.notification.request.identifier;
      const data = response.notification.request.content.data;
      if (data?.kind !== KIND || typeof data.sessionId !== "string" || openedReminders.has(identifier)) return;
      openedReminders.add(identifier);
      listener(data.sessionId);
    };
    // Rappel touché alors que l'application était fermée : réponse conservée par le système, consommée une fois.
    let active = true;
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (!active) return;
        open(response);
        return Notifications.clearLastNotificationResponseAsync();
      })
      .catch(() => undefined);
    const subscription = Notifications.addNotificationResponseReceivedListener(open);
    return () => {
      active = false;
      subscription.remove();
    };
  },
};
