/**
 * Biometric Authentication for React Native
 *
 * Comprehensive examples of biometric authentication (Face ID, Touch ID, Fingerprint)
 * Includes hardware detection, fallback mechanisms, and secure credential storage
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  Alert,
  Platform,
  Switch,
  Image,
} from 'react-native';
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import * as Keychain from 'react-native-keychain';
import TouchID from 'react-native-touch-id';

// ===========================================
// EXAMPLE 1: Biometric Service Setup
// ===========================================

interface BiometricCapabilities {
  available: boolean;
  biometryType: BiometryTypes | null;
  error?: string;
}

class BiometricAuthService {
  private static rnBiometrics = new ReactNativeBiometrics({
    allowDeviceCredentials: true,
  });

  // Check if biometrics are available
  static async checkBiometricAvailability(): Promise<BiometricCapabilities> {
    try {
      const { available, biometryType } = await this.rnBiometrics.isSensorAvailable();

      return {
        available,
        biometryType,
      };
    } catch (error: any) {
      console.error('Error checking biometric availability:', error);
      return {
        available: false,
        biometryType: null,
        error: error.message,
      };
    }
  }

  // Get biometric type name
  static getBiometricTypeName(biometryType: BiometryTypes | null): string {
    switch (biometryType) {
      case BiometryTypes.FaceID:
        return 'Face ID';
      case BiometryTypes.TouchID:
        return 'Touch ID';
      case BiometryTypes.Biometrics:
        return 'Biometric Authentication';
      default:
        return 'Not Available';
    }
  }

  // Simple biometric authentication
  static async authenticate(reason?: string): Promise<boolean> {
    try {
      const { available, biometryType } = await this.checkBiometricAvailability();

      if (!available) {
        throw new Error('Biometric authentication not available');
      }

      const promptMessage = reason || `Authenticate with ${this.getBiometricTypeName(biometryType)}`;

      const { success } = await this.rnBiometrics.simplePrompt({
        promptMessage,
        cancelButtonText: 'Cancel',
      });

      return success;
    } catch (error: any) {
      console.error('Biometric authentication error:', error);
      throw error;
    }
  }

  // Create biometric keys (for signature-based auth)
  static async createKeys(): Promise<boolean> {
    try {
      const { publicKey } = await this.rnBiometrics.createKeys();
      console.log('Public key created:', publicKey);

      // Send public key to your backend for storage
      await this.sendPublicKeyToBackend(publicKey);

      return true;
    } catch (error: any) {
      console.error('Error creating biometric keys:', error);
      return false;
    }
  }

  // Delete biometric keys
  static async deleteKeys(): Promise<boolean> {
    try {
      const { keysDeleted } = await this.rnBiometrics.deleteKeys();
      console.log('Keys deleted:', keysDeleted);
      return keysDeleted;
    } catch (error: any) {
      console.error('Error deleting keys:', error);
      return false;
    }
  }

  // Check if keys exist
  static async biometricKeysExist(): Promise<boolean> {
    try {
      const { keysExist } = await this.rnBiometrics.biometricKeysExist();
      return keysExist;
    } catch (error: any) {
      console.error('Error checking keys:', error);
      return false;
    }
  }

  // Create signature (for advanced auth)
  static async createSignature(payload: string): Promise<string | null> {
    try {
      const { available } = await this.checkBiometricAvailability();

      if (!available) {
        throw new Error('Biometric authentication not available');
      }

      const { success, signature } = await this.rnBiometrics.createSignature({
        promptMessage: 'Sign in',
        payload,
        cancelButtonText: 'Cancel',
      });

      if (success && signature) {
        return signature;
      }

      return null;
    } catch (error: any) {
      console.error('Error creating signature:', error);
      throw error;
    }
  }

  // Send public key to backend
  private static async sendPublicKeyToBackend(publicKey: string): Promise<void> {
    try {
      await fetch('https://api.example.com/biometric/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          publicKey,
          deviceId: 'unique-device-id',
          timestamp: new Date().toISOString(),
        }),
      });
      console.log('Public key sent to backend');
    } catch (error) {
      console.error('Error sending public key:', error);
      throw error;
    }
  }
}

// ===========================================
// EXAMPLE 2: Touch ID / Face ID (Legacy API)
// ===========================================

class TouchIDService {
  // Touch ID configuration
  private static optionalConfigObject = {
    title: 'Authentication Required',
    imageColor: '#e00606',
    imageErrorColor: '#ff0000',
    sensorDescription: 'Touch sensor',
    sensorErrorDescription: 'Failed',
    cancelText: 'Cancel',
    fallbackLabel: 'Use Passcode',
    unifiedErrors: false,
    passcodeFallback: false,
  };

  // Check if Touch ID is supported
  static async isSupported(): Promise<string | null> {
    try {
      const biometryType = await TouchID.isSupported();
      console.log('Biometry type:', biometryType);
      return biometryType;
    } catch (error: any) {
      console.error('Touch ID not supported:', error);
      return null;
    }
  }

  // Authenticate with Touch ID / Face ID
  static async authenticate(reason?: string): Promise<boolean> {
    try {
      const biometryType = await this.isSupported();

      if (!biometryType) {
        throw new Error('Biometric authentication not supported');
      }

      await TouchID.authenticate(
        reason || 'Authenticate to continue',
        this.optionalConfigObject
      );

      return true;
    } catch (error: any) {
      console.error('Touch ID authentication failed:', error);

      if (error.name === 'LAErrorUserCancel') {
        console.log('User cancelled authentication');
      } else if (error.name === 'LAErrorUserFallback') {
        console.log('User chose to use passcode');
      } else if (error.name === 'LAErrorSystemCancel') {
        console.log('System cancelled authentication');
      }

      return false;
    }
  }
}

// ===========================================
// EXAMPLE 3: Secure Credential Storage with Keychain
// ===========================================

class SecureStorageService {
  // Save credentials with biometric protection
  static async saveCredentials(
    username: string,
    password: string,
    useBiometrics: boolean = true
  ): Promise<boolean> {
    try {
      const options: Keychain.Options = {
        service: 'com.yourapp.auth',
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      };

      if (useBiometrics && Platform.OS === 'ios') {
        options.accessControl = Keychain.ACCESS_CONTROL.BIOMETRY_ANY;
        options.authenticationType = Keychain.AUTHENTICATION_TYPE.BIOMETRICS;
      }

      await Keychain.setGenericPassword(username, password, options);
      console.log('Credentials saved securely');
      return true;
    } catch (error: any) {
      console.error('Error saving credentials:', error);
      return false;
    }
  }

  // Get credentials with biometric authentication
  static async getCredentials(
    promptMessage?: string
  ): Promise<{ username: string; password: string } | null> {
    try {
      const options: Keychain.Options = {
        service: 'com.yourapp.auth',
        authenticationPrompt: {
          title: 'Authentication Required',
          subtitle: promptMessage || 'Authenticate to access your account',
          cancel: 'Cancel',
        },
      };

      const credentials = await Keychain.getGenericPassword(options);

      if (credentials) {
        console.log('Credentials retrieved successfully');
        return {
          username: credentials.username,
          password: credentials.password,
        };
      }

      return null;
    } catch (error: any) {
      console.error('Error retrieving credentials:', error);
      return null;
    }
  }

  // Check if credentials exist
  static async hasCredentials(): Promise<boolean> {
    try {
      const hasCredentials = await Keychain.hasGenericPassword({
        service: 'com.yourapp.auth',
      });
      return hasCredentials;
    } catch (error: any) {
      console.error('Error checking credentials:', error);
      return false;
    }
  }

  // Delete credentials
  static async deleteCredentials(): Promise<boolean> {
    try {
      await Keychain.resetGenericPassword({
        service: 'com.yourapp.auth',
      });
      console.log('Credentials deleted');
      return true;
    } catch (error: any) {
      console.error('Error deleting credentials:', error);
      return false;
    }
  }

  // Get supported biometry type
  static async getSupportedBiometryType(): Promise<Keychain.BIOMETRY_TYPE | null> {
    try {
      return await Keychain.getSupportedBiometryType();
    } catch (error) {
      console.error('Error getting biometry type:', error);
      return null;
    }
  }
}

// ===========================================
// EXAMPLE 4: Complete Biometric Auth Component
// ===========================================

function BiometricAuthExample() {
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<BiometryTypes | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [hasStoredCredentials, setHasStoredCredentials] = useState(false);

  useEffect(() => {
    checkBiometricSupport();
    checkStoredCredentials();
  }, []);

  const checkBiometricSupport = async () => {
    const capabilities = await BiometricAuthService.checkBiometricAvailability();
    setBiometricAvailable(capabilities.available);
    setBiometricType(capabilities.biometryType);

    if (capabilities.available) {
      const keysExist = await BiometricAuthService.biometricKeysExist();
      setBiometricEnabled(keysExist);
    }
  };

  const checkStoredCredentials = async () => {
    const hasCredentials = await SecureStorageService.hasCredentials();
    setHasStoredCredentials(hasCredentials);
  };

  const handleBiometricAuth = async () => {
    try {
      const success = await BiometricAuthService.authenticate(
        'Authenticate to access your account'
      );

      if (success) {
        setIsAuthenticated(true);
        Alert.alert('Success', 'Authentication successful!');
      } else {
        Alert.alert('Failed', 'Authentication failed');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Authentication error');
    }
  };

  const handleEnableBiometric = async () => {
    try {
      const success = await BiometricAuthService.createKeys();

      if (success) {
        setBiometricEnabled(true);
        Alert.alert('Success', 'Biometric authentication enabled!');
      } else {
        Alert.alert('Error', 'Failed to enable biometric authentication');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to enable biometric authentication');
    }
  };

  const handleDisableBiometric = async () => {
    try {
      const success = await BiometricAuthService.deleteKeys();

      if (success) {
        setBiometricEnabled(false);
        Alert.alert('Success', 'Biometric authentication disabled');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to disable biometric authentication');
    }
  };

  const handleSaveCredentials = async () => {
    try {
      const success = await SecureStorageService.saveCredentials(
        'user@example.com',
        'securePassword123',
        biometricEnabled
      );

      if (success) {
        setHasStoredCredentials(true);
        Alert.alert('Success', 'Credentials saved securely!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save credentials');
    }
  };

  const handleGetCredentials = async () => {
    try {
      const credentials = await SecureStorageService.getCredentials(
        'Access your saved credentials'
      );

      if (credentials) {
        Alert.alert(
          'Credentials Retrieved',
          `Username: ${credentials.username}\nPassword: ${credentials.password}`
        );
      } else {
        Alert.alert('Info', 'No credentials found');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to retrieve credentials');
    }
  };

  const handleDeleteCredentials = async () => {
    try {
      const success = await SecureStorageService.deleteCredentials();

      if (success) {
        setHasStoredCredentials(false);
        Alert.alert('Success', 'Credentials deleted');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete credentials');
    }
  };

  const renderBiometricIcon = () => {
    if (biometricType === BiometryTypes.FaceID) {
      return <Text style={styles.icon}>👤</Text>;
    } else if (
      biometricType === BiometryTypes.TouchID ||
      biometricType === BiometryTypes.Biometrics
    ) {
      return <Text style={styles.icon}>👆</Text>;
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Biometric Authentication</Text>

      {/* Biometric Status */}
      <View style={styles.statusCard}>
        {renderBiometricIcon()}
        <Text style={styles.statusText}>
          {biometricAvailable
            ? `${BiometricAuthService.getBiometricTypeName(biometricType)} Available`
            : 'Biometric Authentication Not Available'}
        </Text>
      </View>

      {biometricAvailable && (
        <>
          {/* Authentication Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Authentication Status</Text>
            <Text style={isAuthenticated ? styles.authenticated : styles.notAuthenticated}>
              {isAuthenticated ? '✓ Authenticated' : '✗ Not Authenticated'}
            </Text>
          </View>

          {/* Authentication Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Authentication</Text>
            <Button
              title="Authenticate with Biometrics"
              onPress={handleBiometricAuth}
            />
          </View>

          {/* Biometric Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Biometric Settings</Text>
            <View style={styles.row}>
              <Text>Biometric Login Enabled</Text>
              <Switch
                value={biometricEnabled}
                onValueChange={(value) => {
                  if (value) {
                    handleEnableBiometric();
                  } else {
                    handleDisableBiometric();
                  }
                }}
              />
            </View>
          </View>

          {/* Secure Storage */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Secure Credential Storage</Text>
            <Text style={styles.subtitle}>
              {hasStoredCredentials
                ? 'Credentials are stored securely'
                : 'No stored credentials'}
            </Text>
            <Button title="Save Test Credentials" onPress={handleSaveCredentials} />
            <Button
              title="Get Credentials"
              onPress={handleGetCredentials}
              disabled={!hasStoredCredentials}
            />
            <Button
              title="Delete Credentials"
              onPress={handleDeleteCredentials}
              disabled={!hasStoredCredentials}
            />
          </View>
        </>
      )}
    </View>
  );
}

// ===========================================
// EXAMPLE 5: Login Screen with Biometric Auth
// ===========================================

function BiometricLoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    checkBiometricAndAutoLogin();
  }, []);

  const checkBiometricAndAutoLogin = async () => {
    const capabilities = await BiometricAuthService.checkBiometricAvailability();
    setBiometricAvailable(capabilities.available);

    // Try auto-login with stored credentials
    if (capabilities.available) {
      const hasCredentials = await SecureStorageService.hasCredentials();

      if (hasCredentials) {
        handleBiometricLogin();
      }
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const credentials = await SecureStorageService.getCredentials();

      if (credentials) {
        // Login with retrieved credentials
        await loginWithCredentials(credentials.username, credentials.password);
      }
    } catch (error) {
      console.error('Biometric login failed:', error);
    }
  };

  const handleLogin = async () => {
    try {
      await loginWithCredentials(username, password);

      // Optionally save credentials for biometric login
      if (biometricAvailable) {
        Alert.alert(
          'Save Credentials',
          'Do you want to enable biometric login?',
          [
            { text: 'No', style: 'cancel' },
            {
              text: 'Yes',
              onPress: async () => {
                await SecureStorageService.saveCredentials(username, password, true);
              },
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Login failed');
    }
  };

  const loginWithCredentials = async (user: string, pass: string) => {
    // Implement your login logic here
    console.log('Logging in with:', user, pass);
    Alert.alert('Success', 'Logged in successfully!');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      {biometricAvailable && (
        <Button title="Login with Biometrics" onPress={handleBiometricLogin} />
      )}

      {/* Traditional login form */}
      <Text style={styles.subtitle}>Or login with credentials</Text>
      {/* Add TextInput components for username and password */}
      <Button title="Login" onPress={handleLogin} />
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
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginVertical: 10,
    textAlign: 'center',
  },
  statusCard: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginBottom: 20,
  },
  icon: {
    fontSize: 48,
    marginBottom: 10,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
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
  authenticated: {
    color: '#51cf66',
    fontSize: 16,
    fontWeight: 'bold',
  },
  notAuthenticated: {
    color: '#ff6b6b',
    fontSize: 16,
    fontWeight: 'bold',
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
  BiometricAuthService,
  TouchIDService,
  SecureStorageService,
  BiometricAuthExample,
  BiometricLoginScreen,
};

/**
 * USAGE NOTES:
 *
 * 1. Install required dependencies:
 *    npm install react-native-biometrics
 *    npm install react-native-keychain
 *    npm install react-native-touch-id
 *
 * 2. iOS Setup:
 *    - Add NSFaceIDUsageDescription to Info.plist:
 *      <key>NSFaceIDUsageDescription</key>
 *      <string>We use Face ID to authenticate you</string>
 *    - cd ios && pod install
 *
 * 3. Android Setup:
 *    - Add permission to AndroidManifest.xml:
 *      <uses-permission android:name="android.permission.USE_BIOMETRIC" />
 *    - Minimum SDK version should be 23 or higher
 *
 * 4. Security Best Practices:
 *    - Never store sensitive data unencrypted
 *    - Use Keychain for credential storage
 *    - Implement fallback authentication methods
 *    - Handle biometric changes (fingerprint added/removed)
 *    - Clear sensitive data when biometric auth fails
 *
 * 5. Testing:
 *    - Test on real devices (biometrics don't work well in simulators)
 *    - Test all authentication states (success, cancel, fallback)
 *    - Test with different biometric types (Face ID, Touch ID, Fingerprint)
 *    - Test credential storage and retrieval
 */
