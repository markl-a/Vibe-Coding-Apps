/**
 * Navigation Patterns for React Native
 *
 * Comprehensive examples of Stack and Tab navigation patterns using React Navigation
 * Includes nested navigation, deep linking, and custom navigation flows
 */

import React from 'react';
import { View, Text, Button, StyleSheet, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/Ionicons';

// Type definitions for navigation
type RootStackParamList = {
  Home: undefined;
  Profile: { userId: string; name: string };
  Settings: undefined;
  Details: { itemId: number; title: string };
};

type TabParamList = {
  HomeTab: undefined;
  Search: undefined;
  Notifications: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();
const Drawer = createDrawerNavigator();

// ===========================================
// EXAMPLE 1: Basic Stack Navigation
// ===========================================

function HomeScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home Screen</Text>
      <Button
        title="Go to Profile"
        onPress={() => navigation.navigate('Profile', {
          userId: '123',
          name: 'John Doe'
        })}
      />
      <Button
        title="Go to Details"
        onPress={() => navigation.navigate('Details', {
          itemId: 42,
          title: 'Amazing Item'
        })}
      />
    </View>
  );
}

function ProfileScreen({ route, navigation }: any) {
  const { userId, name } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile Screen</Text>
      <Text>User ID: {userId}</Text>
      <Text>Name: {name}</Text>
      <Button title="Go Back" onPress={() => navigation.goBack()} />
      <Button
        title="Go to Settings"
        onPress={() => navigation.navigate('Settings')}
      />
    </View>
  );
}

function DetailsScreen({ route, navigation }: any) {
  const { itemId, title } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Details Screen</Text>
      <Text>Item ID: {itemId}</Text>
      <Text>Title: {title}</Text>
      <Button
        title="Update Title"
        onPress={() => {
          // Update navigation params
          navigation.setParams({ title: 'Updated Title' });
        }}
      />
      <Button title="Go Back" onPress={() => navigation.goBack()} />
    </View>
  );
}

function SettingsScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings Screen</Text>
      <Button
        title="Go to Home"
        onPress={() => navigation.navigate('Home')}
      />
      <Button
        title="Go Back to First Screen"
        onPress={() => navigation.popToTop()}
      />
    </View>
  );
}

// Stack Navigator Component
function StackNavigatorExample() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: { backgroundColor: '#6200ee' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Home' }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={({ route }) => ({
          title: route.params?.name || 'Profile'
        })}
      />
      <Stack.Screen
        name="Details"
        component={DetailsScreen}
        options={({ route }) => ({
          title: route.params?.title || 'Details'
        })}
      />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}

// ===========================================
// EXAMPLE 2: Tab Navigation with Icons
// ===========================================

function HomeTabScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home Tab</Text>
      <Text>Main content goes here</Text>
    </View>
  );
}

function SearchScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Search</Text>
      <Text>Search functionality here</Text>
    </View>
  );
}

function NotificationsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notifications</Text>
      <Text>Your notifications</Text>
    </View>
  );
}

function TabNavigatorExample() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'HomeTab':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Search':
              iconName = focused ? 'search' : 'search-outline';
              break;
            case 'Notifications':
              iconName = focused ? 'notifications' : 'notifications-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6200ee',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeTabScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ tabBarBadge: 3 }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// ===========================================
// EXAMPLE 3: Nested Navigation (Tabs + Stack)
// ===========================================

function HomeStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Details" component={DetailsScreen} />
    </Stack.Navigator>
  );
}

function NestedNavigatorExample() {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="search" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// ===========================================
// EXAMPLE 4: Drawer Navigation
// ===========================================

function DrawerNavigatorExample() {
  return (
    <Drawer.Navigator
      screenOptions={{
        drawerStyle: {
          backgroundColor: '#f5f5f5',
          width: 240,
        },
        drawerActiveTintColor: '#6200ee',
        drawerInactiveTintColor: '#666',
      }}
    >
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <Icon name="home" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <Icon name="person" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <Icon name="settings" size={size} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
}

// ===========================================
// EXAMPLE 5: Deep Linking Configuration
// ===========================================

const linking = {
  prefixes: ['myapp://', 'https://myapp.com'],
  config: {
    screens: {
      Home: 'home',
      Profile: 'profile/:userId',
      Details: 'details/:itemId',
      Settings: 'settings',
      NotFound: '*',
    },
  },
};

function AppWithDeepLinking() {
  return (
    <NavigationContainer linking={linking}>
      <StackNavigatorExample />
    </NavigationContainer>
  );
}

// ===========================================
// EXAMPLE 6: Custom Navigation Actions
// ===========================================

function CustomNavigationExample({ navigation }: any) {
  const handleComplexNavigation = () => {
    // Reset navigation stack
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  };

  const handleConditionalNavigation = async () => {
    try {
      // Check some condition (e.g., authentication)
      const isAuthenticated = await checkAuthentication();

      if (isAuthenticated) {
        navigation.navigate('Profile', { userId: 'current' });
      } else {
        navigation.navigate('Login');
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Reset Navigation" onPress={handleComplexNavigation} />
      <Button title="Conditional Navigation" onPress={handleConditionalNavigation} />
    </View>
  );
}

// Helper function for example
async function checkAuthentication(): Promise<boolean> {
  // Implement your authentication check here
  return true;
}

// ===========================================
// EXAMPLE 7: Navigation Listeners & Lifecycle
// ===========================================

function ScreenWithListeners({ navigation }: any) {
  React.useEffect(() => {
    // Listen to focus event
    const unsubscribeFocus = navigation.addListener('focus', () => {
      console.log('Screen is focused');
      // Refresh data or update UI
    });

    // Listen to blur event
    const unsubscribeBlur = navigation.addListener('blur', () => {
      console.log('Screen is blurred');
      // Clean up or save state
    });

    // Cleanup listeners
    return () => {
      unsubscribeFocus();
      unsubscribeBlur();
    };
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text>Screen with Navigation Listeners</Text>
    </View>
  );
}

// ===========================================
// EXAMPLE 8: Modal Navigation Pattern
// ===========================================

function ModalNavigationExample() {
  return (
    <Stack.Navigator>
      <Stack.Group>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Details" component={DetailsScreen} />
      </Stack.Group>
      <Stack.Group screenOptions={{ presentation: 'modal' }}>
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            presentation: 'fullScreenModal',
          }}
        />
      </Stack.Group>
    </Stack.Navigator>
  );
}

// ===========================================
// Styles
// ===========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

// ===========================================
// Export Examples
// ===========================================

export {
  StackNavigatorExample,
  TabNavigatorExample,
  NestedNavigatorExample,
  DrawerNavigatorExample,
  AppWithDeepLinking,
  CustomNavigationExample,
  ScreenWithListeners,
  ModalNavigationExample,
};

/**
 * USAGE NOTES:
 *
 * 1. Install required dependencies:
 *    npm install @react-navigation/native @react-navigation/native-stack
 *    @react-navigation/bottom-tabs @react-navigation/drawer
 *    react-native-screens react-native-safe-area-context
 *    react-native-vector-icons
 *
 * 2. For iOS, run: cd ios && pod install
 *
 * 3. Basic usage in App.tsx:
 *    import { NavigationContainer } from '@react-navigation/native';
 *    import { StackNavigatorExample } from './examples/navigation-patterns';
 *
 *    export default function App() {
 *      return (
 *        <NavigationContainer>
 *          <StackNavigatorExample />
 *        </NavigationContainer>
 *      );
 *    }
 *
 * 4. Deep linking requires additional setup in AndroidManifest.xml and Info.plist
 */
