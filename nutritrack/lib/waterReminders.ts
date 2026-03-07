import * as Notifications from 'expo-notifications';

const WATER_REMINDER_IDS = [
  'water-reminder-morning',
  'water-reminder-midday',
  'water-reminder-evening',
];

/** Daily times: 9:00, 13:00, 18:00 (24h) */
const REMINDER_HOURS = [9, 13, 18];

export async function requestWaterReminderPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleWaterReminders(): Promise<void> {
  const granted = await requestWaterReminderPermissions();
  if (!granted) return;

  await Notifications.cancelScheduledNotificationsAsync();

  for (let i = 0; i < REMINDER_HOURS.length; i++) {
    const hour = REMINDER_HOURS[i];
    const id = WATER_REMINDER_IDS[i];
    await Notifications.scheduleNotificationAsync({
      identifier: id,
      content: {
        title: 'Stay hydrated',
        body: 'Time to log a glass of water in NUTRIFIT.',
        sound: true,
      },
      trigger: {
        hour,
        minute: 0,
        repeats: true,
      },
    });
  }
}

export async function cancelWaterReminders(): Promise<void> {
  await Notifications.cancelScheduledNotificationsAsync();
}
