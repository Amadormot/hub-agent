import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

class NotificationService {
    static async requestPermissions() {
        if (Capacitor.getPlatform() === 'web') return false;

        try {
            // Local notifications only - no Firebase needed
            const localResult = await LocalNotifications.requestPermissions();
            return localResult.display === 'granted';
        } catch (err) {
            console.error('Error requesting permissions:', err);
            return false;
        }
    }

    static async initPush(userId, onRegistration) {
        // Feature disabled to prevent native crash without google-services.json
        console.log('Push notifications disabled');
    }

    static async scheduleEventReminder(event) {
        if (Capacitor.getPlatform() === 'web' || !event?.startDate) return;

        try {
            const startDate = new Date(event.startDate + 'T09:00:00'); // Assume 9am if no time
            const reminderDate = new Date(startDate.getTime() - (24 * 60 * 60 * 1000)); // 24h before

            if (reminderDate > new Date()) {
                await LocalNotifications.schedule({
                    notifications: [
                        {
                            title: 'Lembrete de Evento: ' + event.title,
                            body: 'O evento começa amanhã! Prepare sua moto. 🏍️💨',
                            id: Math.floor(Math.random() * 100000),
                            schedule: { at: reminderDate },
                            sound: null,
                            attachments: null,
                            actionTypeId: "",
                            extra: { eventId: event.id }
                        }
                    ]
                });
                console.log(`Reminder scheduled for ${event.title} at ${reminderDate}`);
            }
        } catch (err) {
            console.error('Error scheduling reminder:', err);
        }
    }

    static async cancelAllLocal() {
        if (Capacitor.getPlatform() === 'web') return;
        await LocalNotifications.removeAllPendingNotificationRequests();
    }
}

export default NotificationService;
