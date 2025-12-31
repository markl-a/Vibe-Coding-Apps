/**
 * Push Notifications for React Native
 *
 * Comprehensive examples of push notification handling using Firebase Cloud Messaging (FCM)
 * and React Native Push Notification. Includes local notifications, remote notifications,
 * deep linking, and notification scheduling.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, Alert, Platform, Switch } from 'react-native';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import PushNotification, { Importance } from 'react-native-push-notification';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import { useNavigation } from '@react-navigation/native';

// ===========================================
// EXAMPLE 1: Push Notification Setup & Configuration
// ===========================================

class PushNotificationService {
  private static isConfigured = false;

  // Initialize push notifications
  static async initialize(): Promise<void> {
    if (this.isConfigured) return;

    try {
      // Configure local notifications
      PushNotification.configure({
        // Called when a notification is received (foreground/background)
        onNotification: (notification: any) => {
          console.log('Notification received:', notification);

          // Handle notification tap
          if (notification.userInteraction) {
            this.handleNotificationTap(notification);
          }

          // iOS: Required for local notifications
          if (Platform.OS === 'ios') {
            notification.finish(PushNotificationIOS.FetchResult.NoData);
          }
        },

        // Called when user registers for notifications
        onRegister: (token: { os: string; token: string }) => {
          console.log('Device registered for notifications:', token);
          this.saveDeviceToken(token.token);
        },

        // iOS: Required for local notifications
        permissions: {
          alert: true,
          badge: true,
          sound: true,
        },

        // Should we request permissions on init
        requestPermissions: Platform.OS === 'ios',

        popInitialNotification: true,
      });

      // Create notification channels (Android 8.0+)
      this.createNotificationChannels();

      this.isConfigured = true;
      console.log('Push notifications initialized');
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      throw error;
    }
  }

  // Create notification channels for Android
  private static createNotificationChannels(): void {
    if (Platform.OS !== 'android') return;

    // High priority channel
    PushNotification.createChannel(
      {
        channelId: 'high-priority',
        channelName: 'High Priority Notifications',
        channelDescription: 'Important notifications',
        importance: Importance.HIGH,
        playSound: true,
        soundName: 'default',
        vibrate: true,
      },
      (created) => console.log(`High priority channel created: ${created}`)
    );

    // Default channel
    PushNotification.createChannel(
      {
        channelId: 'default',
        channelName: 'Default Notifications',
        channelDescription: 'General notifications',
        importance: Importance.DEFAULT,
        playSound: true,
        soundName: 'default',
      },
      (created) => console.log(`Default channel created: ${created}`)
    );

    // Silent channel
    PushNotification.createChannel(
      {
        channelId: 'silent',
        channelName: 'Silent Notifications',
        channelDescription: 'Silent background notifications',
        importance: Importance.LOW,
        playSound: false,
        vibrate: false,
      },
      (created) => console.log(`Silent channel created: ${created}`)
    );
  }

  // Save device token to backend
  private static async saveDeviceToken(token: string): Promise<void> {
    try {
      // Send token to your backend
      await fetch('https://api.example.com/device-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          platform: Platform.OS,
          timestamp: new Date().toISOString(),
        }),
      });
      console.log('Device token saved to backend');
    } catch (error) {
      console.error('Error saving device token:', error);
    }
  }

  // Handle notification tap
  private static handleNotificationTap(notification: any): void {
    console.log('User tapped notification:', notification);

    // Navigate based on notification data
    if (notification.data?.screen) {
      // Use your navigation service to navigate
      // NavigationService.navigate(notification.data.screen, notification.data.params);
    }
  }

  // Request notification permissions
  static async requestPermissions(): Promise<boolean> {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Notification permissions granted:', authStatus);
        return true;
      } else {
        console.log('Notification permissions denied');
        return false;
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  // Get FCM token
  static async getFCMToken(): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      console.log('FCM Token:', token);
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  // Check notification permissions
  static async checkPermissions(): Promise<boolean> {
    const authStatus = await messaging().hasPermission();
    return (
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL
    );
  }
}

// ===========================================
// EXAMPLE 2: Local Notifications
// ===========================================

class LocalNotificationService {
  // Show immediate notification
  static showNotification(
    title: string,
    message: string,
    data?: any
  ): void {
    PushNotification.localNotification({
      channelId: 'default',
      title,
      message,
      playSound: true,
      soundName: 'default',
      vibrate: true,
      vibration: 300,
      priority: 'high',
      importance: 'high',
      data,
      userInfo: data, // iOS
    });
  }

  // Schedule notification
  static scheduleNotification(
    title: string,
    message: string,
    date: Date,
    data?: any
  ): void {
    PushNotification.localNotificationSchedule({
      channelId: 'default',
      title,
      message,
      date,
      playSound: true,
      soundName: 'default',
      vibrate: true,
      vibration: 300,
      data,
      userInfo: data, // iOS
      allowWhileIdle: true, // Android: show even in doze mode
    });

    console.log(`Notification scheduled for ${date}`);
  }

  // Schedule repeating notification
  static scheduleRepeatingNotification(
    title: string,
    message: string,
    repeatType: 'day' | 'week' | 'hour' = 'day'
  ): void {
    PushNotification.localNotificationSchedule({
      channelId: 'default',
      title,
      message,
      date: new Date(Date.now() + 60 * 1000), // Start in 1 minute
      playSound: true,
      repeatType,
      repeatTime: 1,
    });

    console.log(`Repeating notification scheduled (${repeatType})`);
  }

  // Cancel specific notification
  static cancelNotification(notificationId: string): void {
    PushNotification.cancelLocalNotification(notificationId);
    console.log(`Notification ${notificationId} cancelled`);
  }

  // Cancel all notifications
  static cancelAllNotifications(): void {
    PushNotification.cancelAllLocalNotifications();
    console.log('All notifications cancelled');
  }

  // Get scheduled notifications
  static getScheduledNotifications(): Promise<any[]> {
    return new Promise((resolve) => {
      PushNotification.getScheduledLocalNotifications((notifications) => {
        resolve(notifications);
      });
    });
  }

  // Clear notification badge (iOS)
  static clearBadge(): void {
    PushNotification.setApplicationIconBadgeNumber(0);
  }

  // Set notification badge (iOS)
  static setBadge(count: number): void {
    PushNotification.setApplicationIconBadgeNumber(count);
  }
}

// ===========================================
// EXAMPLE 3: Remote Push Notifications (FCM)
// ===========================================

class RemoteNotificationService {
  // Listen to foreground messages
  static onForegroundMessage(
    callback: (message: FirebaseMessagingTypes.RemoteMessage) => void
  ): () => void {
    return messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground message received:', remoteMessage);

      // Show local notification when app is in foreground
      if (remoteMessage.notification) {
        LocalNotificationService.showNotification(
          remoteMessage.notification.title || 'New Message',
          remoteMessage.notification.body || '',
          remoteMessage.data
        );
      }

      callback(remoteMessage);
    });
  }

  // Handle background/quit state messages
  static setBackgroundMessageHandler(): void {
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Background message received:', remoteMessage);

      // Process the message
      // You can perform background tasks here
      if (remoteMessage.data) {
        // Update local database, etc.
      }
    });
  }

  // Get initial notification (app opened from notification)
  static async getInitialNotification(): Promise<FirebaseMessagingTypes.RemoteMessage | null> {
    return await messaging().getInitialNotification();
  }

  // Listen to notification open events
  static onNotificationOpenedApp(
    callback: (message: FirebaseMessagingTypes.RemoteMessage) => void
  ): () => void {
    return messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Notification opened app:', remoteMessage);
      callback(remoteMessage);
    });
  }

  // Subscribe to topic
  static async subscribeToTopic(topic: string): Promise<void> {
    try {
      await messaging().subscribeToTopic(topic);
      console.log(`Subscribed to topic: ${topic}`);
    } catch (error) {
      console.error('Error subscribing to topic:', error);
      throw error;
    }
  }

  // Unsubscribe from topic
  static async unsubscribeFromTopic(topic: string): Promise<void> {
    try {
      await messaging().unsubscribeFromTopic(topic);
      console.log(`Unsubscribed from topic: ${topic}`);
    } catch (error) {
      console.error('Error unsubscribing from topic:', error);
      throw error;
    }
  }
}

// ===========================================
// EXAMPLE 4: Notification Component with UI
// ===========================================

function PushNotificationExample() {
  const [hasPermission, setHasPermission] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    setupNotifications();

    // Cleanup listeners
    return () => {
      // Unsubscribe listeners if needed
    };
  }, []);

  const setupNotifications = async () => {
    try {
      // Initialize service
      await PushNotificationService.initialize();

      // Check permissions
      const hasPermission = await PushNotificationService.checkPermissions();
      setHasPermission(hasPermission);

      if (hasPermission) {
        // Get FCM token
        const token = await PushNotificationService.getFCMToken();
        setFcmToken(token);

        // Setup background handler
        RemoteNotificationService.setBackgroundMessageHandler();

        // Listen to foreground messages
        const unsubscribeForeground = RemoteNotificationService.onForegroundMessage(
          (message) => {
            console.log('Received message:', message);
            // Update UI or show alert
          }
        );

        // Listen to notification open events
        const unsubscribeOpen = RemoteNotificationService.onNotificationOpenedApp(
          (message) => {
            console.log('App opened from notification:', message);
            handleNotificationNavigation(message);
          }
        );

        // Check if app was opened from notification
        const initialNotification = await RemoteNotificationService.getInitialNotification();
        if (initialNotification) {
          handleNotificationNavigation(initialNotification);
        }

        return () => {
          unsubscribeForeground();
          unsubscribeOpen();
        };
      }
    } catch (error) {
      console.error('Error setting up notifications:', error);
    }
  };

  const handleNotificationNavigation = (
    message: FirebaseMessagingTypes.RemoteMessage
  ) => {
    // Navigate based on notification data
    if (message.data?.screen) {
      // navigation.navigate(message.data.screen as never);
      console.log('Navigate to:', message.data.screen);
    }
  };

  const requestPermissions = async () => {
    const granted = await PushNotificationService.requestPermissions();
    setHasPermission(granted);

    if (granted) {
      const token = await PushNotificationService.getFCMToken();
      setFcmToken(token);
      Alert.alert('Success', 'Notifications enabled!');
    } else {
      Alert.alert('Error', 'Notification permissions denied');
    }
  };

  const showLocalNotification = () => {
    LocalNotificationService.showNotification(
      'Test Notification',
      'This is a local notification!',
      { customData: 'test' }
    );
  };

  const scheduleNotification = () => {
    const date = new Date(Date.now() + 10 * 1000); // 10 seconds from now
    LocalNotificationService.scheduleNotification(
      'Scheduled Notification',
      'This notification was scheduled 10 seconds ago!',
      date,
      { type: 'scheduled' }
    );
    Alert.alert('Success', 'Notification scheduled for 10 seconds from now');
  };

  const subscribeTopic = async () => {
    try {
      await RemoteNotificationService.subscribeToTopic('news');
      Alert.alert('Success', 'Subscribed to news topic');
    } catch (error) {
      Alert.alert('Error', 'Failed to subscribe to topic');
    }
  };

  const unsubscribeTopic = async () => {
    try {
      await RemoteNotificationService.unsubscribeFromTopic('news');
      Alert.alert('Success', 'Unsubscribed from news topic');
    } catch (error) {
      Alert.alert('Error', 'Failed to unsubscribe from topic');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Push Notifications</Text>

      {!hasPermission ? (
        <View>
          <Text style={styles.warning}>Notifications are disabled</Text>
          <Button title="Enable Notifications" onPress={requestPermissions} />
        </View>
      ) : (
        <View>
          <Text style={styles.success}>Notifications enabled</Text>
          {fcmToken && (
            <Text style={styles.token}>Token: {fcmToken.substring(0, 30)}...</Text>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Local Notifications</Text>
            <Button title="Show Notification" onPress={showLocalNotification} />
            <Button title="Schedule Notification" onPress={scheduleNotification} />
            <Button
              title="Cancel All"
              onPress={() => LocalNotificationService.cancelAllNotifications()}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Topic Subscriptions</Text>
            <Button title="Subscribe to News" onPress={subscribeTopic} />
            <Button title="Unsubscribe from News" onPress={unsubscribeTopic} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Settings</Text>
            <View style={styles.row}>
              <Text>Enable Notifications</Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

// ===========================================
// Styles
// ===========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  warning: {
    color: '#ff6b6b',
    fontSize: 16,
    marginBottom: 10,
  },
  success: {
    color: '#51cf66',
    fontSize: 16,
    marginBottom: 10,
  },
  token: {
    fontSize: 12,
    color: '#666',
    marginBottom: 20,
  },
  section: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
});

// ===========================================
// Export Services and Components
// ===========================================

export {
  PushNotificationService,
  LocalNotificationService,
  RemoteNotificationService,
  PushNotificationExample,
};

/**
 * USAGE NOTES:
 *
 * 1. Install required dependencies:
 *    npm install @react-native-firebase/app @react-native-firebase/messaging
 *    npm install react-native-push-notification
 *    npm install @react-native-community/push-notification-ios
 *
 * 2. iOS Setup:
 *    - Enable Push Notifications in Xcode capabilities
 *    - Add GoogleService-Info.plist to your iOS project
 *    - cd ios && pod install
 *
 * 3. Android Setup:
 *    - Add google-services.json to android/app/
 *    - Update AndroidManifest.xml with notification permissions
 *
 * 4. Firebase Setup:
 *    - Create a Firebase project
 *    - Add iOS and Android apps to Firebase
 *    - Download and add configuration files
 *
 * 5. Testing:
 *    - Use Firebase Console to send test notifications
 *    - Test foreground, background, and quit state scenarios
 *    - Test deep linking and notification actions
 *
 * 6. Best Practices:
 *    - Request permissions at appropriate time
 *    - Handle permission denial gracefully
 *    - Save FCM token to backend
 *    - Implement notification categories/channels
 *    - Test on both iOS and Android
 */
