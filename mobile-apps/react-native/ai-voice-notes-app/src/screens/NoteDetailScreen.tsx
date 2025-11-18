import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { VoiceNote } from '../types';
import { Card, Button } from '../../../shared/components';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export const NoteDetailScreen = ({ route, navigation }: any) => {
  const note: VoiceNote = route.params.note;
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const playAudio = async () => {
    try {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
        setIsPlaying(false);
        return;
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: note.audioUri },
        { shouldPlay: true }
      );

      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
          newSound.unloadAsync();
          setSound(null);
        }
      });
    } catch (error) {
      console.error('播放音频失败:', error);
      Alert.alert('错误', '无法播放录音');
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>

          <Text style={styles.title}>{note.title}</Text>

          <View style={styles.meta}>
            <Ionicons name="time-outline" size={16} color="#999" />
            <Text style={styles.metaText}>
              {format(note.createdAt, 'PPp', { locale: zhCN })}
            </Text>
          </View>
        </View>

        <Card style={styles.audioCard}>
          <View style={styles.audioInfo}>
            <Ionicons name="musical-notes" size={32} color="#5B5FFF" />
            <View style={styles.audioMeta}>
              <Text style={styles.audioTitle}>语音录制</Text>
              <Text style={styles.audioDuration}>
                时长: {formatDuration(note.duration)}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.playButton} onPress={playAudio}>
            <Ionicons
              name={isPlaying ? 'pause-circle' : 'play-circle'}
              size={64}
              color="#5B5FFF"
            />
          </TouchableOpacity>
        </Card>

        {note.summary && (
          <Card style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="sparkles" size={20} color="#5B5FFF" />
              <Text style={styles.sectionTitle}>AI 摘要</Text>
            </View>
            <Text style={styles.summaryText}>{note.summary}</Text>
          </Card>
        )}

        {note.transcription && (
          <Card style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text-outline" size={20} color="#5B5FFF" />
              <Text style={styles.sectionTitle}>转录文本</Text>
            </View>
            <Text style={styles.transcriptionText}>{note.transcription}</Text>
          </Card>
        )}

        {note.tags && note.tags.length > 0 && (
          <Card style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="pricetags-outline" size={20} color="#5B5FFF" />
              <Text style={styles.sectionTitle}>标签</Text>
            </View>
            <View style={styles.tags}>
              {note.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        <View style={styles.actions}>
          <Button
            title="分享"
            variant="outline"
            onPress={() => Alert.alert('功能开发中', '分享功能即将推出')}
          />
          <Button
            title="导出"
            variant="outline"
            onPress={() => Alert.alert('功能开发中', '导出功能即将推出')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  backButton: {
    marginBottom: 16,
    width: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: '#999',
  },
  audioCard: {
    marginBottom: 16,
    alignItems: 'center',
    padding: 24,
  },
  audioInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  audioMeta: {
    marginLeft: 12,
  },
  audioTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  audioDuration: {
    fontSize: 14,
    color: '#666',
  },
  playButton: {
    padding: 8,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  summaryText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    backgroundColor: '#F8F8FF',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#5B5FFF',
  },
  transcriptionText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#F0F0FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 14,
    color: '#5B5FFF',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
});
