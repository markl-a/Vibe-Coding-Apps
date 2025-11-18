import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { VoiceRecorder } from '../components/VoiceRecorder';
import { Button } from '../../../shared/components';
import { VoiceNote, AIProcessingOptions } from '../types';
import { useNotesStore } from '../store/notesStore';
import { chat, AIConfig } from '../../../shared/services/aiService';

export const RecordScreen = ({ navigation }: any) => {
  const addNote = useNotesStore((state) => state.addNote);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [title, setTitle] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const [aiOptions, setAiOptions] = useState<AIProcessingOptions>({
    transcribe: true,
    summarize: true,
    extractTags: true,
  });

  const handleRecordingComplete = (uri: string, recordingDuration: number) => {
    setRecordedUri(uri);
    setDuration(recordingDuration);
    setTitle(`语音笔记 ${new Date().toLocaleString('zh-CN')}`);
  };

  const simulateTranscription = async (): Promise<string> => {
    // 实际应用中，这里应该调用语音转文字 API
    // 如：OpenAI Whisper API, Google Speech-to-Text, Azure Speech Services
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return '这是模拟的语音转文字内容。在实际应用中，这里会是真实的转录文本。';
  };

  const processWithAI = async (
    transcription: string
  ): Promise<{ summary?: string; tags?: string[] }> => {
    const config: AIConfig = {
      provider: 'openai',
      apiKey: process.env.OPENAI_API_KEY || '',
      model: 'gpt-4o-mini',
    };

    const result: { summary?: string; tags?: string[] } = {};

    try {
      // 生成摘要
      if (aiOptions.summarize) {
        const summaryResponse = await chat(
          [
            {
              role: 'system',
              content: '请为以下文本生成简洁的摘要，不超过 50 字。',
            },
            {
              role: 'user',
              content: transcription,
            },
          ],
          config
        );
        result.summary = summaryResponse.message;
      }

      // 提取标签
      if (aiOptions.extractTags) {
        const tagsResponse = await chat(
          [
            {
              role: 'system',
              content:
                '请为以下文本提取 3-5 个关键词标签，用逗号分隔，只返回标签，不要其他内容。',
            },
            {
              role: 'user',
              content: transcription,
            },
          ],
          config
        );
        result.tags = tagsResponse.message.split(',').map((tag) => tag.trim());
      }
    } catch (error) {
      console.error('AI 处理错误:', error);
      // 继续保存笔记，即使 AI 处理失败
    }

    return result;
  };

  const handleSave = async () => {
    if (!recordedUri) {
      Alert.alert('错误', '请先录制语音');
      return;
    }

    if (!title.trim()) {
      Alert.alert('错误', '请输入标题');
      return;
    }

    setIsProcessing(true);

    try {
      let transcription: string | undefined;
      let summary: string | undefined;
      let tags: string[] | undefined;

      // 语音转文字
      if (aiOptions.transcribe) {
        transcription = await simulateTranscription();
      }

      // AI 处理
      if (transcription && (aiOptions.summarize || aiOptions.extractTags)) {
        const aiResult = await processWithAI(transcription);
        summary = aiResult.summary;
        tags = aiResult.tags;
      }

      // 创建笔记
      const note: VoiceNote = {
        id: Date.now().toString(),
        title: title.trim(),
        audioUri: recordedUri,
        transcription,
        summary,
        tags,
        duration,
        createdAt: new Date(),
        updatedAt: new Date(),
        isFavorite: false,
      };

      addNote(note);

      Alert.alert('成功', '语音笔记已保存', [
        {
          text: '确定',
          onPress: () => {
            // 重置状态
            setRecordedUri(null);
            setDuration(0);
            setTitle('');
            navigation.navigate('Notes');
          },
        },
      ]);
    } catch (error) {
      console.error('保存笔记失败:', error);
      Alert.alert('错误', '保存笔记失败');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>录制语音笔记</Text>

        <VoiceRecorder onRecordingComplete={handleRecordingComplete} />

        {recordedUri && (
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>标题</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="输入笔记标题"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>AI 处理选项</Text>

              <View style={styles.option}>
                <View style={styles.optionInfo}>
                  <Text style={styles.optionLabel}>语音转文字</Text>
                  <Text style={styles.optionDesc}>
                    将录音转换为文字内容
                  </Text>
                </View>
                <Switch
                  value={aiOptions.transcribe}
                  onValueChange={(value) =>
                    setAiOptions({ ...aiOptions, transcribe: value })
                  }
                  trackColor={{ false: '#E0E0E0', true: '#5B5FFF' }}
                />
              </View>

              <View style={styles.option}>
                <View style={styles.optionInfo}>
                  <Text style={styles.optionLabel}>生成摘要</Text>
                  <Text style={styles.optionDesc}>使用 AI 生成内容摘要</Text>
                </View>
                <Switch
                  value={aiOptions.summarize}
                  onValueChange={(value) =>
                    setAiOptions({ ...aiOptions, summarize: value })
                  }
                  trackColor={{ false: '#E0E0E0', true: '#5B5FFF' }}
                  disabled={!aiOptions.transcribe}
                />
              </View>

              <View style={styles.option}>
                <View style={styles.optionInfo}>
                  <Text style={styles.optionLabel}>提取标签</Text>
                  <Text style={styles.optionDesc}>
                    自动提取关键词标签
                  </Text>
                </View>
                <Switch
                  value={aiOptions.extractTags}
                  onValueChange={(value) =>
                    setAiOptions({ ...aiOptions, extractTags: value })
                  }
                  trackColor={{ false: '#E0E0E0', true: '#5B5FFF' }}
                  disabled={!aiOptions.transcribe}
                />
              </View>
            </View>

            <Button
              title={isProcessing ? '处理中...' : '保存笔记'}
              onPress={handleSave}
              loading={isProcessing}
              variant="primary"
              size="large"
            />
          </View>
        )}
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  form: {
    marginTop: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  optionInfo: {
    flex: 1,
    marginRight: 12,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  optionDesc: {
    fontSize: 13,
    color: '#666',
  },
});
