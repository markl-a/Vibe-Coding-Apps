import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../types';
import { useCartStore } from '../store/cartStore';

// Mock data
const featuredProducts: Product[] = [
  {
    id: '1',
    name: 'iPhone 15 Pro',
    price: 33900,
    image: 'https://via.placeholder.com/200',
    category: '電子產品',
    description: '最新的 iPhone 旗艦手機',
    rating: 4.8,
    reviews: 156,
    inStock: true,
  },
  {
    id: '2',
    name: 'MacBook Air M3',
    price: 36900,
    image: 'https://via.placeholder.com/200',
    category: '電子產品',
    description: '輕薄高效能筆記本電腦',
    rating: 4.9,
    reviews: 203,
    inStock: true,
  },
  {
    id: '3',
    name: 'AirPods Pro 2',
    price: 7990,
    image: 'https://via.placeholder.com/200',
    category: '配件',
    description: '主動降噪無線耳機',
    rating: 4.7,
    reviews: 89,
    inStock: true,
  },
  {
    id: '4',
    name: 'iPad Air',
    price: 19900,
    image: 'https://via.placeholder.com/200',
    category: '平板',
    description: '多功能平板電腦',
    rating: 4.6,
    reviews: 124,
    inStock: true,
  },
];

const HomeScreen = () => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = (product: Product) => {
    addItem(product);
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <Image source={{ uri: item.image }} style={styles.productImage} />

      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>

        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={14} color="#FFD700" />
          <Text style={styles.rating}>{item.rating}</Text>
          <Text style={styles.reviews}>({item.reviews})</Text>
        </View>

        <Text style={styles.price}>NT$ {item.price.toLocaleString()}</Text>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => handleAddToCart(item)}
        >
          <Ionicons name="cart-outline" size={20} color="#fff" />
          <Text style={styles.addButtonText}>加入購物車</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="搜尋商品..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.bannerContainer}>
        <Image
          source={{ uri: 'https://via.placeholder.com/800x300' }}
          style={styles.banner}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>精選商品</Text>
        <FlatList
          data={featuredProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          numColumns={2}
          scrollEnabled={false}
          columnWrapperStyle={styles.row}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
  },
  bannerContainer: {
    marginBottom: 16,
  },
  banner: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  row: {
    justifyContent: 'space-between',
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    width: '48%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  productImage: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    resizeMode: 'cover',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
    height: 36,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rating: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  reviews: {
    fontSize: 12,
    color: '#999',
    marginLeft: 2,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 8,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#FF6B35',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default HomeScreen;
