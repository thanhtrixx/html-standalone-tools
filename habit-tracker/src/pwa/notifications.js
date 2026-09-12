/**
 * Atomic Habit Tracker - Local Web Notifications & Reminder Scheduler
 */

(function (global) {
  "use strict";

  const notifications = {
    /**
     * Checks if Notifications are supported by the current environment
     */
    isSupported() {
      return (
        typeof window !== "undefined" &&
        "Notification" in window &&
        typeof Notification.requestPermission === "function"
      );
    },

    /**
     * Returns current permission status ('granted', 'denied', 'default')
     */
    getPermission() {
      if (!this.isSupported()) return "denied";
      return Notification.permission;
    },

    /**
     * Requests user permission for notifications
     */
    async requestPermission() {
      if (!this.isSupported()) return "denied";
      try {
        const permission = await Notification.requestPermission();
        return permission;
      } catch (err) {
        console.warn("[Notifications] Request permission failed:", err);
        return "denied";
      }
    },

    /**
     * Shows immediate notification if permitted
     */
    async showNotification(title, options = {}) {
      if (!this.isSupported()) return null;
      if (Notification.permission !== "granted") return null;

      const defaultOptions = {
        icon: "./icon.svg",
        badge: "./icon.svg",
        tag: "habit-reminder",
        renotify: true,
        ...options,
      };

      try {
        if ("serviceWorker" in navigator && navigator.serviceWorker.ready) {
          const reg = await navigator.serviceWorker.ready;
          if (reg && reg.showNotification) {
            return await reg.showNotification(title, defaultOptions);
          }
        }
        return new Notification(title, defaultOptions);
      } catch (err) {
        console.warn("[Notifications] Show notification failed:", err);
        return null;
      }
    },

    /**
     * Calculates delay in milliseconds until reminder time "HH:mm"
     */
    calculateDelayToTime(reminderTimeStr) {
      if (!reminderTimeStr || typeof reminderTimeStr !== "string") return -1;
      const parts = reminderTimeStr.split(":");
      if (parts.length !== 2) return -1;

      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      if (isNaN(hours) || isNaN(minutes)) return -1;

      const now = new Date();
      const target = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        hours,
        minutes,
        0,
        0
      );

      // If already past today, schedule for tomorrow
      if (target.getTime() <= now.getTime()) {
        target.setDate(target.getDate() + 1);
      }

      return target.getTime() - now.getTime();
    },

    /**
     * Schedules reminders for all active habits with reminderTime configured
     */
    scheduleHabitReminders(habits = [], lang = "vi") {
      if (!this.isSupported() || Notification.permission !== "granted") return;

      habits.forEach((habit) => {
        if (!habit || habit.archived || !habit.reminderTime) return;
        const delay = this.calculateDelayToTime(habit.reminderTime);
        if (delay > 0 && delay < 24 * 60 * 60 * 1000) {
          setTimeout(() => {
            const title =
              lang === "vi"
                ? `Nhắc nhở thói quen: ${habit.name}`
                : `Habit Reminder: ${habit.name}`;
            const body =
              lang === "vi"
                ? `Đã đến giờ hoàn thành mục tiêu ${habit.icon || "🎯"} ${habit.name}!`
                : `Time to complete your habit ${habit.icon || "🎯"} ${habit.name}!`;

            this.showNotification(title, { body, tag: `habit-${habit.id}` });
          }, delay);
        }
      });
    },
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = notifications;
  } else {
    global.HabitNotifications = notifications;
  }
})(typeof window !== "undefined" ? window : globalThis);
