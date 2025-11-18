import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { RecordingState } from '../types';

interface VoiceRecorderProps {
  onRecordingComplete: (uri: string, duration: number) => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onRecordingComplete,
}) => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    duration: 0,
    uri: null,
  });
  const [permissionResponse, requestPermission] = Audio.usePermissions();

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (recordingState.isRecording) {
      interval = setInterval(() => {
        setRecordingState((prev) => ({
          ...prev,
          duration: prev.duration + 1,
        }));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [recordingState.isRecording]);

  const startRecording = async () => {
    try {
      if (permissionResponse?.status !== 'granted') {
        const permission = await requestPermission();
        if (!permission.granted) {
          Alert.alert('权限被拒绝', '需要麦克风权限才能录音');
          return;
        }
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setRecordingState({
        isRecording: true,
        duration: 0,
        uri: null,
      });
    } catch (err) {
      console.error('开始录音失败:', err);
      Alert.alert('错误', '无法开始录音');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      if (uri) {
        setRecordingState((prev) => ({
          ...prev,
          isRecording: false,
          uri,
        }));

        onRecordingComplete(uri, recordingState.duration);
      }

      setRecording(null);
      setRecordingState({
        isRecording: false,
        duration: 0,
        uri: null,
      });
    } catch (err) {
      console.error('停止录音失败:', err);
      Alert.alert('错误', '停止录音失败');
    }
  };

  const cancelRecording = async () => {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      setRecording(null);
      setRecordingState({
        isRecording: false,
        duration: 0,
        uri: null,
      });
    } catch (err) {
      console.error('取消录音失败:', err);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {recordingState.isRecording ? (
        <>
          <View style={styles.recordingInfo}>
            <View style={styles.recordingIndicator} />
            <Text style={styles.duration}>
              {formatDuration(recordingState.duration)}
            </Text>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={cancelRecording}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
              <Text style={styles.buttonText}>取消</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.stopButton]}
              onPress={stopRecording}
            >
              <Ionicons name="stop" size={24} color="#FFFFFF" />
              <Text style={styles.buttonText}>停止</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <TouchableOpacity
          style={[styles.button, styles.recordButton]}
          onPress={startRecording}
        >
          <Ionicons name="mic" size={32} color="#FFFFFF" />
          <Text style={[styles.buttonText, styles.recordButtonText]}>
            开始录音
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  recordingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  recordingIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
    marginRight: 12,
  },
  duration: {
    fontSize: 32,
    fontWeight: '600',
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  recordButton: {
    backgroundColor: '#5B5FFF',
    paddingHorizontal: 40,
    paddingVertical: 20,
  },
  stopButton: {
    backgroundColor: '#FF3B30',
  },
  cancelButton: {
    backgroundColor: '#6C757D',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  recordButtonText: {
    fontSize: 18,
  },
});
