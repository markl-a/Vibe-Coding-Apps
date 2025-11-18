/**
 * useAI Hook - AI 功能集成
 */

import { useState, useCallback } from 'react';
import {
  moderateContent,
  ModerationResult,
} from '@/ai/contentModeration';
import {
  generateTags,
  summarizeContent,
  analyzeSentiment,
  SentimentResult,
} from '@/ai/tagging';
import {
  translateText,
  detectLanguage,
  SupportedLanguage,
} from '@/ai/translation';
import { getRecommendations, Post, UserProfile } from '@/ai/recommendation';

export function useAI() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * 內容審核
   */
  const moderate = useCallback(
    async (content: string): Promise<ModerationResult | null> => {
      setIsProcessing(true);
      setError(null);

      try {
        const result = await moderateContent(content);
        return result;
      } catch (err) {
        const error = err as Error;
        setError(error);
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  /**
   * 生成標籤
   */
  const generateContentTags = useCallback(
    async (content: string, maxTags: number = 5): Promise<string[]> => {
      setIsProcessing(true);
      setError(null);

      try {
        const tags = await generateTags(content, maxTags);
        return tags;
      } catch (err) {
        const error = err as Error;
        setError(error);
        return [];
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  /**
   * 生成摘要
   */
  const summarize = useCallback(
    async (content: string, maxLength: number = 100): Promise<string> => {
      setIsProcessing(true);
      setError(null);

      try {
        const summary = await summarizeContent(content, maxLength);
        return summary;
      } catch (err) {
        const error = err as Error;
        setError(error);
        return content.substring(0, maxLength);
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  /**
   * 情感分析
   */
  const analyzeSentimentContent = useCallback(
    async (content: string): Promise<SentimentResult | null> => {
      setIsProcessing(true);
      setError(null);

      try {
        const result = await analyzeSentiment(content);
        return result;
      } catch (err) {
        const error = err as Error;
        setError(error);
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  /**
   * 翻譯內容
   */
  const translate = useCallback(
    async (
      text: string,
      targetLang: SupportedLanguage,
      sourceLang?: SupportedLanguage
    ): Promise<string> => {
      setIsProcessing(true);
      setError(null);

      try {
        const translated = await translateText(text, targetLang, sourceLang);
        return translated;
      } catch (err) {
        const error = err as Error;
        setError(error);
        return text;
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  /**
   * 檢測語言
   */
  const detectLang = useCallback(
    async (text: string): Promise<SupportedLanguage> => {
      setIsProcessing(true);
      setError(null);

      try {
        const lang = await detectLanguage(text);
        return lang;
      } catch (err) {
        const error = err as Error;
        setError(error);
        return 'en';
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  /**
   * 獲取推薦內容
   */
  const getContentRecommendations = useCallback(
    async (
      userProfile: UserProfile,
      allUsers: UserProfile[],
      allPosts: Post[],
      limit: number = 20
    ): Promise<Post[]> => {
      setIsProcessing(true);
      setError(null);

      try {
        const recommendations = await getRecommendations(
          userProfile,
          allUsers,
          allPosts,
          limit
        );
        return recommendations;
      } catch (err) {
        const error = err as Error;
        setError(error);
        return [];
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  return {
    moderate,
    generateContentTags,
    summarize,
    analyzeSentimentContent,
    translate,
    detectLang,
    getContentRecommendations,
    isProcessing,
    error,
  };
}

/**
 * useAIModerator - 實時內容審核 Hook
 */
export function useAIModerator() {
  const [moderationResult, setModerationResult] = useState<ModerationResult | null>(
    null
  );
  const [isChecking, setIsChecking] = useState(false);

  const checkContent = useCallback(async (content: string) => {
    if (!content || content.trim().length === 0) {
      setModerationResult(null);
      return;
    }

    setIsChecking(true);

    try {
      const result = await moderateContent(content);
      setModerationResult(result);
    } catch (error) {
      console.error('Moderation error:', error);
      setModerationResult(null);
    } finally {
      setIsChecking(false);
    }
  }, []);

  return {
    moderationResult,
    isChecking,
    checkContent,
  };
}

/**
 * useAITagSuggestions - 標籤建議 Hook
 */
export function useAITagSuggestions() {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const getSuggestions = useCallback(async (content: string, maxTags: number = 5) => {
    if (!content || content.trim().length < 10) {
      setSuggestions([]);
      return;
    }

    setIsGenerating(true);

    try {
      const tags = await generateTags(content, maxTags);
      setSuggestions(tags);
    } catch (error) {
      console.error('Tag generation error:', error);
      setSuggestions([]);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    suggestions,
    isGenerating,
    getSuggestions,
  };
}
