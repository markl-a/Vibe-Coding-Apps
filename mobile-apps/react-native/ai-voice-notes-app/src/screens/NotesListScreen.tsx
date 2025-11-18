import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NoteCard } from '../components/NoteCard';
import { EmptyState } from '../../../shared/components';
import { useNotesStore } from '../store/notesStore';
import { VoiceNote } from '../types';

type FilterType = 'all' | 'favorites';

export const NotesListScreen = ({ navigation }: any) => {
  const notes = useNotesStore((state) => state.notes);
  const deleteNote = useNotesStore((state) => state.deleteNote);
  const toggleFavorite = useNotesStore((state) => state.toggleFavorite);
  const loadNotes = useNotesStore((state) => state.loadNotes);

  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    loadNotes();
  }, []);

  const filteredNotes = notes.filter((note) => {
    if (filter === 'favorites') {
      return note.isFavorite;
    }
    return true;
  });

  const handleNotePress = (note: VoiceNote) => {
    navigation.navigate('NoteDetail', { note });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>我的语音笔记</Text>

        <View style={styles.filters}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              全部 ({notes.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'favorites' && styles.filterButtonActive,
            ]}
            onPress={() => setFilter('favorites')}
          >
            <Ionicons
              name="star"
              size={16}
              color={filter === 'favorites' ? '#FFFFFF' : '#666'}
            />
            <Text
              style={[
                styles.filterText,
                filter === 'favorites' && styles.filterTextActive,
              ]}
            >
              收藏 ({notes.filter((n) => n.isFavorite).length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {filteredNotes.length === 0 ? (
        <EmptyState
          icon={filter === 'favorites' ? 'star-outline' : 'mic-outline'}
          title={filter === 'favorites' ? '暂无收藏' : '暂无笔记'}
          description={
            filter === 'favorites'
              ? '点击笔记上的星标来收藏'
              : '点击下方按钮开始录制语音笔记'
          }
          actionText={filter === 'all' ? '开始录音' : undefined}
          onAction={filter === 'all' ? () => navigation.navigate('Record') : undefined}
        />
      ) : (
        <FlatList
          data={filteredNotes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NoteCard
              note={item}
              onPress={() => handleNotePress(item)}
              onDelete={() => deleteNote(item.id)}
              onToggleFavorite={() => toggleFavorite(item.id)}
            />
          )}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  filters: {
    flexDirection: 'row',
    gap: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: '#5B5FFF',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  list: {
    padding: 16,
  },
});
