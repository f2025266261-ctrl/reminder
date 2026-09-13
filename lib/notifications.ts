/**
 * Web Notifications & Service Worker Push Helper for StudyPulse
 */

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (e) {
    console.error('Error requesting notification permission:', e);
    return 'denied';
  }
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

export function sendBrowserNotification(title: string, body: string, icon: string = '/icon') {
  if (!isNotificationSupported()) return;

  if (Notification.permission === 'granted') {
    // Check service worker registration first for PWA mobile compatibility
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, {
          body,
          icon,
          badge: icon,
          vibrate: [200, 100, 200],
          tag: 'studypulse-reminder',
        } as NotificationOptions & { vibrate?: number[] });
      }).catch(() => {
        new Notification(title, { body, icon });
      });
    } else {
      new Notification(title, { body, icon });
    }
  }
}

export function triggerTestNotification() {
  if (getNotificationPermission() !== 'granted') {
    requestNotificationPermission().then(permission => {
      if (permission === 'granted') {
        sendBrowserNotification('🔔 StudyPulse Notifications Active!', 'You will receive reminders for upcoming deadlines and Sunday night study plans.');
      } else {
        alert('Notification permission was blocked. Please allow notifications in your browser settings.');
      }
    });
  } else {
    sendBrowserNotification('🔔 StudyPulse Notifications Active!', 'You will receive reminders for upcoming deadlines and Sunday night study plans.');
  }
}
