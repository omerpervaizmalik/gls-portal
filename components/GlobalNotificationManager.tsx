"use client";

import React, { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { isNative } from '@/lib/platform';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export default function GlobalNotificationManager() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchAndNotify = async () => {
    if (!userId) return;

    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) return;
      const data: NotificationItem[] = await res.json();

      // Get already notified IDs from localStorage
      const storageKey = `gls_notified_ids_${userId}`;
      let notifiedIds: string[] = [];
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          notifiedIds = JSON.parse(stored);
        }
      } catch (e) {
        console.error("Failed to parse notified IDs:", e);
      }

      // Filter unread notifications that haven't been notified yet
      const newUnread = data.filter(item => !item.isRead && !notifiedIds.includes(item.id));

      if (newUnread.length > 0) {
        // Trigger system notification for the most recent one(s)
        for (const item of newUnread) {
          await triggerSystemNotification(item.title, item.message);
          notifiedIds.push(item.id);
        }

        // Save updated list to localStorage (cap at 200 items to avoid bloating)
        if (notifiedIds.length > 200) {
          notifiedIds = notifiedIds.slice(-200);
        }
        localStorage.setItem(storageKey, JSON.stringify(notifiedIds));
      }
    } catch (err) {
      console.error("GlobalNotificationManager poll error:", err);
    }
  };

  const triggerSystemNotification = async (title: string, body: string) => {
    const isCap = isNative();

    if (isCap) {
      try {
        const canSend = await LocalNotifications.checkPermissions();
        if (canSend.display === 'granted') {
          await LocalNotifications.schedule({
            notifications: [
              {
                title,
                body,
                id: Math.floor(Math.random() * 1000000),
                schedule: { at: new Date(Date.now() + 500) },
                sound: 'default',
                actionTypeId: '',
                extra: null
              }
            ]
          });
        } else {
          // Attempt to request permission
          const reqResult = await LocalNotifications.requestPermissions();
          if (reqResult.display === 'granted') {
            await LocalNotifications.schedule({
              notifications: [
                {
                  title,
                  body,
                  id: Math.floor(Math.random() * 1000000),
                  schedule: { at: new Date(Date.now() + 500) }
                }
              ]
            });
          }
        }
      } catch (err) {
        console.error("Capacitor notification schedule failed:", err);
      }
      return;
    }

    // Fallback: standard browser notification if permitted
    if (typeof window !== 'undefined' && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification(title, { body });
      }
    }
  };

  useEffect(() => {
    if (!userId) return;

    // Initial check when component mounts or user logs in
    fetchAndNotify();

    // Check every 10 seconds for new notifications
    pollIntervalRef.current = setInterval(fetchAndNotify, 10000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [userId]);

  return null; // Invisible global manager
}
