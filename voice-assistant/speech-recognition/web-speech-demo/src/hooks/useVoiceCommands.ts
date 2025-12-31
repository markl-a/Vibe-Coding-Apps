import { useCallback, useMemo, useState } from 'react';

/**
 * Voice Commands Hook
 *
 * Matches spoken phrases to registered commands.
 * Supports fuzzy matching and command parameters.
 */

export interface VoiceCommand {
  phrase: string;
  description: string;
  action: (params?: string) => void;
  aliases?: string[];
}

export interface UseVoiceCommandsReturn {
  commands: VoiceCommand[];
  registerCommand: (command: VoiceCommand) => void;
  processTranscript: (transcript: string) => { matched: boolean; command?: string };
  lastMatchedCommand: string | null;
}

export function useVoiceCommands(
  initialCommands: VoiceCommand[] = []
): UseVoiceCommandsReturn {
  const [commands, setCommands] = useState<VoiceCommand[]>(initialCommands);
  const [lastMatchedCommand, setLastMatchedCommand] = useState<string | null>(null);

  // Create pattern matchers for all commands
  const commandMatchers = useMemo(() => {
    return commands.map((cmd) => {
      const phrases = [cmd.phrase, ...(cmd.aliases || [])];
      return {
        command: cmd,
        patterns: phrases.map((phrase) => ({
          phrase,
          regex: createFlexiblePattern(phrase),
        })),
      };
    });
  }, [commands]);

  const registerCommand = useCallback((command: VoiceCommand) => {
    setCommands((prev) => {
      // Replace if same phrase exists
      const filtered = prev.filter((c) => c.phrase !== command.phrase);
      return [...filtered, command];
    });
  }, []);

  const processTranscript = useCallback(
    (transcript: string): { matched: boolean; command?: string } => {
      const normalizedInput = normalizeText(transcript);

      for (const matcher of commandMatchers) {
        for (const pattern of matcher.patterns) {
          const match = normalizedInput.match(pattern.regex);
          if (match) {
            // Extract parameters if any
            const params = match.groups?.params?.trim();

            // Execute command
            matcher.command.action(params);
            setLastMatchedCommand(matcher.command.phrase);

            return { matched: true, command: matcher.command.phrase };
          }
        }
      }

      return { matched: false };
    },
    [commandMatchers]
  );

  return {
    commands,
    registerCommand,
    processTranscript,
    lastMatchedCommand,
  };
}

/**
 * Normalize text for matching
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[.,!?]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Create flexible regex pattern from phrase
 */
function createFlexiblePattern(phrase: string): RegExp {
  const normalized = normalizeText(phrase);

  // Handle wildcard parameters
  const patternStr = normalized
    .replace(/\*/g, '(?<params>.+)')
    .replace(/\s+/g, '\\s+');

  // Allow phrase to appear anywhere in input
  return new RegExp(`(?:^|\\s)${patternStr}(?:\\s|$)`, 'i');
}

/**
 * Calculate similarity between two strings (Levenshtein distance based)
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeText(str1);
  const s2 = normalizeText(str2);

  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  const longerLength = longer.length;
  if (longerLength === 0) return 1;

  const distance = levenshteinDistance(longer, shorter);
  return (longerLength - distance) / longerLength;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      const cost = str1[j - 1] === str2[i - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[str2.length][str1.length];
}
