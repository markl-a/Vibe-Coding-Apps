import React, { useState } from 'react';
import {
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AIChatBot } from './AIChatBot';
import { AIConfig, AI_ASSISTANTS } from '../services/aiService';

interface AIAssistantButtonProps {
  config: AIConfig;
  assistantType?: keyof typeof AI_ASSISTANTS;
  buttonPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  buttonColor?: string;
}

/**
 * AI 助手浮动按钮
 * 点击后弹出聊天界面
 *
 * @example
 * <AIAssistantButton
 *   config={{
 *     provider: 'openai',
 *     apiKey: process.env.OPENAI_API_KEY,
 *   }}
 *   assistantType="general"
 *   buttonPosition="bottom-right"
 * />
 */
export const AIAssistantButton: React.FC<AIAssistantButtonProps> = ({
  config,
  assistantType = 'general',
  buttonPosition = 'bottom-right',
  buttonColor = '#5B5FFF',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const scaleAnim = useState(new Animated.Value(1))[0];

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const getPositionStyle = () => {
    const base = {
      position: 'absolute' as const,
    };

    switch (buttonPosition) {
      case 'bottom-right':
        return { ...base, bottom: 20, right: 20 };
      case 'bottom-left':
        return { ...base, bottom: 20, left: 20 };
      case 'top-right':
        return { ...base, top: 20, right: 20 };
      case 'top-left':
        return { ...base, top: 20, left: 20 };
      default:
        return { ...base, bottom: 20, right: 20 };
    }
  };

  return (
    <>
      <Animated.View
        style={[
          getPositionStyle(),
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.floatingButton, { backgroundColor: buttonColor }]}
          onPress={() => setIsVisible(true)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.8}
        >
          <Ionicons name="chatbubble-ellipses" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>

      <Modal
        visible={isVisible}
        animationType="slide"
        onRequestClose={() => setIsVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setIsVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          <AIChatBot config={config} assistantType={assistantType} />
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  closeButton: {
    padding: 8,
  },
});
