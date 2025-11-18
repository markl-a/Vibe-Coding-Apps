import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { RecordScreen } from './src/screens/RecordScreen';
import { NotesListScreen } from './src/screens/NotesListScreen';
import { NoteDetailScreen } from './src/screens/NoteDetailScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function NotesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="NotesList" component={NotesListScreen} />
      <Stack.Screen name="NoteDetail" component={NoteDetailScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            if (route.name === 'Notes') {
              iconName = focused ? 'list' : 'list-outline';
            } else if (route.name === 'Record') {
              iconName = focused ? 'mic-circle' : 'mic-circle-outline';
            } else {
              iconName = 'help-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#5B5FFF',
          tabBarInactiveTintColor: '#999',
          headerShown: false,
        })}
      >
        <Tab.Screen
          name="Notes"
          component={NotesStack}
          options={{ title: '笔记' }}
        />
        <Tab.Screen
          name="Record"
          component={RecordScreen}
          options={{ title: '录音' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
