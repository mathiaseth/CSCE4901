import * as Notifications from 'expo-notifications';

export async function scheduleWaterReminders(hour: number = 20, minute: number = 0) {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return false;

  await Notifications.cancelAllScheduledNotificationsAsync();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Time to drink water',
      body: 'Stay hydrated and log your water intake.',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  return true;
}

export async function enableWaterReminders(hour: number = 20, minute: number = 0) {
  return scheduleWaterReminders(hour, minute);
}

export async function disableWaterReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function resetWaterReminders(hour: number = 20, minute: number = 0) {
  return scheduleWaterReminders(hour, minute);
}
