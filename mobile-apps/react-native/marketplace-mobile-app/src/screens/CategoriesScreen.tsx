import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Category } from '../types';

// Mock categories
const categories: Category[] = [
  { id: '1', name: '電子產品', icon: 'laptop-outline' },
  { id: '2', name: '服飾配件', icon: 'shirt-outline' },
  { id: '3', name: '家居生活', icon: 'home-outline' },
  { id: '4', name: '運動健身', icon: 'fitness-outline' },
  { id: '5', name: '美妝保養', icon: 'color-palette-outline' },
  { id: '6', name: '書籍文具', icon: 'book-outline' },
  { id: '7', name: '玩具遊戲', icon: 'game-controller-outline' },
  { id: '8', name: '食品飲料', icon: 'fast-food-outline' },
  { id: '9', name: '寵物用品', icon: 'paw-outline' },
  { id: '10', name: '汽車用品', icon: 'car-outline' },
];

const CategoriesScreen = () => {
  const renderCategory = ({ item }: { item: Category }) => (
    <TouchableOpacity style={styles.categoryCard}>
      <View style={styles.iconContainer}>
        <Ionicons name={item.icon as any} size={40} color="#FF6B35" />
      </View>
      <Text style={styles.categoryName}>{item.name}</Text>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  list: {
    padding: 16,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF5F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
});

export default CategoriesScreen;
