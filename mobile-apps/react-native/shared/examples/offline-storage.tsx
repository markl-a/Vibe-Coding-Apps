/**
 * Offline Storage Patterns for React Native
 *
 * Comprehensive examples of local data storage using AsyncStorage, SQLite, and Realm
 * Includes data persistence, caching strategies, and offline-first patterns
 */

import React, { useState, useEffect } from 'react';
import { View, Text, Button, TextInput, FlatList, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SQLite from 'react-native-sqlite-storage';
import NetInfo from '@react-native-community/netinfo';

// ===========================================
// EXAMPLE 1: AsyncStorage - Simple Key-Value Storage
// ===========================================

interface UserPreferences {
  theme: 'light' | 'dark';
  notifications: boolean;
  language: string;
  fontSize: number;
}

class AsyncStorageService {
  private static KEYS = {
    USER_PREFS: '@user_preferences',
    USER_TOKEN: '@user_token',
    CACHE_DATA: '@cache_data',
  };

  // Save user preferences
  static async saveUserPreferences(prefs: UserPreferences): Promise<void> {
    try {
      const jsonValue = JSON.stringify(prefs);
      await AsyncStorage.setItem(this.KEYS.USER_PREFS, jsonValue);
      console.log('Preferences saved successfully');
    } catch (error) {
      console.error('Error saving preferences:', error);
      throw new Error('Failed to save preferences');
    }
  }

  // Get user preferences
  static async getUserPreferences(): Promise<UserPreferences | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(this.KEYS.USER_PREFS);
      return jsonValue ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Error reading preferences:', error);
      return null;
    }
  }

  // Save auth token
  static async saveAuthToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(this.KEYS.USER_TOKEN, token);
    } catch (error) {
      console.error('Error saving token:', error);
      throw error;
    }
  }

  // Get auth token
  static async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.KEYS.USER_TOKEN);
    } catch (error) {
      console.error('Error reading token:', error);
      return null;
    }
  }

  // Remove auth token (logout)
  static async removeAuthToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.KEYS.USER_TOKEN);
    } catch (error) {
      console.error('Error removing token:', error);
      throw error;
    }
  }

  // Clear all storage (use with caution)
  static async clearAll(): Promise<void> {
    try {
      await AsyncStorage.clear();
      console.log('All storage cleared');
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }

  // Get all keys
  static async getAllKeys(): Promise<readonly string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Error getting keys:', error);
      return [];
    }
  }

  // Batch operations for better performance
  static async saveMultipleItems(items: [string, string][]): Promise<void> {
    try {
      await AsyncStorage.multiSet(items);
      console.log('Multiple items saved');
    } catch (error) {
      console.error('Error saving multiple items:', error);
      throw error;
    }
  }
}

// Component using AsyncStorage
function AsyncStorageExample() {
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'light',
    notifications: true,
    language: 'en',
    fontSize: 14,
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await AsyncStorageService.getUserPreferences();
      if (prefs) {
        setPreferences(prefs);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load preferences');
    }
  };

  const savePreferences = async () => {
    try {
      await AsyncStorageService.saveUserPreferences(preferences);
      Alert.alert('Success', 'Preferences saved!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save preferences');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AsyncStorage Example</Text>
      <Button title="Toggle Theme" onPress={() => {
        setPreferences(prev => ({
          ...prev,
          theme: prev.theme === 'light' ? 'dark' : 'light'
        }));
      }} />
      <Button title="Save Preferences" onPress={savePreferences} />
      <Text>Current Theme: {preferences.theme}</Text>
    </View>
  );
}

// ===========================================
// EXAMPLE 2: SQLite - Relational Database
// ===========================================

interface Task {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  createdAt: string;
}

class SQLiteService {
  private static db: SQLite.SQLiteDatabase | null = null;

  // Initialize database
  static async initDatabase(): Promise<void> {
    try {
      this.db = await SQLite.openDatabase({
        name: 'app_database.db',
        location: 'default',
      });

      console.log('Database opened successfully');

      // Create tables
      await this.createTables();
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  // Create tables
  private static async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const createTasksTable = `
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        completed INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await this.db.executeSql(createTasksTable);
    console.log('Tables created successfully');
  }

  // Insert task
  static async insertTask(title: string, description: string): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.executeSql(
        'INSERT INTO tasks (title, description) VALUES (?, ?)',
        [title, description]
      );

      const insertId = result[0].insertId;
      console.log('Task inserted with ID:', insertId);
      return insertId;
    } catch (error) {
      console.error('Error inserting task:', error);
      throw error;
    }
  }

  // Get all tasks
  static async getAllTasks(): Promise<Task[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const results = await this.db.executeSql('SELECT * FROM tasks ORDER BY created_at DESC');
      const tasks: Task[] = [];

      for (let i = 0; i < results[0].rows.length; i++) {
        const row = results[0].rows.item(i);
        tasks.push({
          id: row.id,
          title: row.title,
          description: row.description,
          completed: row.completed === 1,
          createdAt: row.created_at,
        });
      }

      return tasks;
    } catch (error) {
      console.error('Error getting tasks:', error);
      throw error;
    }
  }

  // Update task
  static async updateTask(id: number, completed: boolean): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.executeSql(
        'UPDATE tasks SET completed = ? WHERE id = ?',
        [completed ? 1 : 0, id]
      );
      console.log('Task updated successfully');
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  // Delete task
  static async deleteTask(id: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.executeSql('DELETE FROM tasks WHERE id = ?', [id]);
      console.log('Task deleted successfully');
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }

  // Search tasks
  static async searchTasks(query: string): Promise<Task[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const results = await this.db.executeSql(
        'SELECT * FROM tasks WHERE title LIKE ? OR description LIKE ?',
        [`%${query}%`, `%${query}%`]
      );

      const tasks: Task[] = [];
      for (let i = 0; i < results[0].rows.length; i++) {
        const row = results[0].rows.item(i);
        tasks.push({
          id: row.id,
          title: row.title,
          description: row.description,
          completed: row.completed === 1,
          createdAt: row.created_at,
        });
      }

      return tasks;
    } catch (error) {
      console.error('Error searching tasks:', error);
      throw error;
    }
  }

  // Close database
  static async closeDatabase(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      console.log('Database closed');
    }
  }
}

// Component using SQLite
function SQLiteExample() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    initAndLoadTasks();

    return () => {
      SQLiteService.closeDatabase();
    };
  }, []);

  const initAndLoadTasks = async () => {
    try {
      await SQLiteService.initDatabase();
      await loadTasks();
    } catch (error) {
      Alert.alert('Error', 'Failed to initialize database');
    }
  };

  const loadTasks = async () => {
    try {
      const allTasks = await SQLiteService.getAllTasks();
      setTasks(allTasks);
    } catch (error) {
      Alert.alert('Error', 'Failed to load tasks');
    }
  };

  const addTask = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    try {
      await SQLiteService.insertTask(title, description);
      setTitle('');
      setDescription('');
      await loadTasks();
      Alert.alert('Success', 'Task added!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add task');
    }
  };

  const toggleTask = async (task: Task) => {
    try {
      await SQLiteService.updateTask(task.id, !task.completed);
      await loadTasks();
    } catch (error) {
      Alert.alert('Error', 'Failed to update task');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SQLite Example</Text>
      <TextInput
        style={styles.input}
        placeholder="Task title"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={styles.input}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
      />
      <Button title="Add Task" onPress={addTask} />
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.taskItem}>
            <Text style={item.completed ? styles.completedTask : styles.taskText}>
              {item.title}
            </Text>
            <Button
              title={item.completed ? 'Undo' : 'Complete'}
              onPress={() => toggleTask(item)}
            />
          </View>
        )}
      />
    </View>
  );
}

// ===========================================
// EXAMPLE 3: Offline-First Pattern with Sync
// ===========================================

interface CachedData {
  data: any;
  timestamp: number;
  expiresIn: number; // milliseconds
}

class OfflineFirstService {
  private static CACHE_PREFIX = '@cache_';

  // Check if device is online
  static async isOnline(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  }

  // Fetch data with offline-first strategy
  static async fetchWithCache<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    expiresIn: number = 300000 // 5 minutes default
  ): Promise<T> {
    try {
      // Try to get from cache first
      const cached = await this.getFromCache<T>(key);
      if (cached) {
        console.log('Returning cached data');

        // If online, refresh in background
        if (await this.isOnline()) {
          this.refreshCache(key, fetchFunction, expiresIn).catch(console.error);
        }

        return cached;
      }

      // If not in cache and online, fetch from network
      if (await this.isOnline()) {
        const data = await fetchFunction();
        await this.saveToCache(key, data, expiresIn);
        return data;
      }

      // Offline and no cache
      throw new Error('No cached data available and device is offline');
    } catch (error) {
      console.error('Error in fetchWithCache:', error);
      throw error;
    }
  }

  // Save to cache
  private static async saveToCache<T>(
    key: string,
    data: T,
    expiresIn: number
  ): Promise<void> {
    const cachedData: CachedData = {
      data,
      timestamp: Date.now(),
      expiresIn,
    };

    await AsyncStorage.setItem(
      `${this.CACHE_PREFIX}${key}`,
      JSON.stringify(cachedData)
    );
  }

  // Get from cache
  private static async getFromCache<T>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(`${this.CACHE_PREFIX}${key}`);
      if (!cached) return null;

      const cachedData: CachedData = JSON.parse(cached);
      const now = Date.now();

      // Check if cache is expired
      if (now - cachedData.timestamp > cachedData.expiresIn) {
        await this.clearCache(key);
        return null;
      }

      return cachedData.data as T;
    } catch (error) {
      console.error('Error reading from cache:', error);
      return null;
    }
  }

  // Refresh cache in background
  private static async refreshCache<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    expiresIn: number
  ): Promise<void> {
    try {
      const data = await fetchFunction();
      await this.saveToCache(key, data, expiresIn);
      console.log('Cache refreshed in background');
    } catch (error) {
      console.error('Error refreshing cache:', error);
    }
  }

  // Clear specific cache
  private static async clearCache(key: string): Promise<void> {
    await AsyncStorage.removeItem(`${this.CACHE_PREFIX}${key}`);
  }

  // Clear all cache
  static async clearAllCache(): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
    await AsyncStorage.multiRemove(cacheKeys);
    console.log('All cache cleared');
  }
}

// Component using offline-first pattern
function OfflineFirstExample() {
  const [data, setData] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });

    loadData();

    return () => {
      unsubscribe();
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await OfflineFirstService.fetchWithCache(
        'user_data',
        async () => {
          // Simulate API call
          const response = await fetch('https://api.example.com/data');
          return await response.json();
        },
        300000 // 5 minutes cache
      );
      setData(result);
    } catch (error) {
      Alert.alert('Error', 'Failed to load data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Offline-First Example</Text>
      <Text>Status: {isOnline ? 'Online' : 'Offline'}</Text>
      <Button title="Refresh Data" onPress={loadData} disabled={loading} />
      {loading && <Text>Loading...</Text>}
      {data && <Text>Data loaded: {JSON.stringify(data).substring(0, 50)}...</Text>}
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
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  taskText: {
    fontSize: 16,
  },
  completedTask: {
    fontSize: 16,
    textDecorationLine: 'line-through',
    color: '#999',
  },
});

// ===========================================
// Export Examples
// ===========================================

export {
  AsyncStorageService,
  AsyncStorageExample,
  SQLiteService,
  SQLiteExample,
  OfflineFirstService,
  OfflineFirstExample,
};

/**
 * USAGE NOTES:
 *
 * 1. Install required dependencies:
 *    npm install @react-native-async-storage/async-storage
 *    npm install react-native-sqlite-storage
 *    npm install @react-native-community/netinfo
 *
 * 2. For iOS: cd ios && pod install
 *
 * 3. AsyncStorage is best for:
 *    - Simple key-value pairs
 *    - User preferences
 *    - Auth tokens
 *    - Small amounts of data (<6MB)
 *
 * 4. SQLite is best for:
 *    - Complex data structures
 *    - Relational data
 *    - Large datasets
 *    - Advanced queries
 *
 * 5. Offline-first pattern:
 *    - Always try cache first
 *    - Refresh in background when online
 *    - Handle network errors gracefully
 *    - Implement cache expiration
 */
