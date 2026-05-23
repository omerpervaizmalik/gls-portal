"use client";

import React, { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { isNative } from '@/lib/platform';

export default function PushManager() {
  useEffect(() => {
    if (!isNative()) return;

    // Request permissions for push notifications
    PushNotifications.requestPermissions().then(result => {
      if (result.receive === 'granted') {
        // Register with Apple / Google to receive push via APNS/FCM
        PushNotifications.register();
      }
    });

    // On success, we should be able to receive notifications
    PushNotifications.addListener('registration', (token) => {
      console.log('Push registration success, token: ' + token.value);
      // In a production environment, send this token to your backend
    });

    // Some issue with our setup and push will not work
    PushNotifications.addListener('registrationError', (error) => {
      console.error('Error on registration: ' + JSON.stringify(error));
    });

    // Show us the notification payload if the app is open on our device
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received: ' + JSON.stringify(notification));
    });

    // Method called when tapping on a notification
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push action performed: ' + JSON.stringify(notification));
    });

    return () => {
      PushNotifications.removeAllListeners();
    };
  }, []);

  return null; // This component doesn't render anything
}
