import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { chat, AIConfig } from '../services/aiService';

interface AITextEnhancerProps {
  text: string;
  onEnhanced: (enhancedText: string) => void;
  config: AIConfig;
  enhancementType?: 'grammar' | 'professional' | 'casual' | 'shorter' | 'longer';
}

/**
 * AI 文本增强组件
 * 用于改进、润色文本
 *
 * @example
 * <AITextEnhancer
 *   text={userInput}
 *   onEnhanced={(enhanced) => setUserInput(enhanced)}
 *   config={{ provider: 'openai', apiKey: 'your-key' }}
 *   enhancementType="professional"
 * />
 */
export const AITextEnhancer: React.FC<AITextEnhancerProps> = ({
  text,
  onEnhanced,
  config,
  enhancementType = 'grammar',
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const enhancementPrompts = {
    grammar: '请修正以下文本的语法和拼写错误，保持原意不变：',
    professional: '请将以下文本改写为更专业、正式的风格：',
    casual: '请将以下文本改写为更轻松、随意的风格：',
    shorter: '请将以下文本精简，去除冗余，保持核心意思：',
    longer: '请扩展以下文本，添加更多细节和说明：',
  };

  const handleEnhance = async () => {
    if (!text.trim() || isLoading) return;

    setIsLoading(true);

    try {
      const response = await chat(
        [
          {
            role: 'system',
            content:
              '你是一个专业的文本编辑助手。只返回改进后的文本，不要添加任何解释或注释。',
          },
          {
            role: 'user',
            content: `${enhancementPrompts[enhancementType]}\n\n${text}`,
          },
        ],
        config
      );

      onEnhanced(response.message.trim());
    } catch (error) {
      console.error('文本增强错误:', error);
      alert('文本增强失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const enhancementLabels = {
    grammar: '修正语法',
    professional: '专业风格',
    casual: '轻松风格',
    shorter: '精简文本',
    longer: '扩展文本',
  };

  return (
    <TouchableOpacity
      style={[styles.button, isLoading && styles.buttonDisabled]}
      onPress={handleEnhance}
      disabled={isLoading || !text.trim()}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="#5B5FFF" />
      ) : (
        <>
          <Ionicons name="sparkles" size={16} color="#5B5FFF" />
          <Text style={styles.buttonText}>
            {enhancementLabels[enhancementType]}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F0F0FF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#5B5FFF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#5B5FFF',
    fontWeight: '600',
  },
});
