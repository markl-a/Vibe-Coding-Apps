export interface VoiceNote {
  id: string;
  title: string;
  audioUri: string;
  transcription?: string;
  summary?: string;
  tags?: string[];
  duration: number; // 秒
  createdAt: Date;
  updatedAt: Date;
  isFavorite: boolean;
}

export interface RecordingState {
  isRecording: boolean;
  duration: number;
  uri: string | null;
}

export interface AIProcessingOptions {
  transcribe: boolean;
  summarize: boolean;
  extractTags: boolean;
  translate?: string; // 目标语言
}
