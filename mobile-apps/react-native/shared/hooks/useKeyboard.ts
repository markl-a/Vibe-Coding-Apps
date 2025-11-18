import { useEffect, useState } from 'react';
import { Keyboard, KeyboardEvent } from 'react-native';

interface KeyboardInfo {
  isVisible: boolean;
  keyboardHeight: number;
}

/**
 * useKeyboard - 监听键盘显示/隐藏状态
 *
 * @returns 键盘状态信息（是否显示、高度）
 *
 * @example
 * const { isVisible, keyboardHeight } = useKeyboard();
 *
 * return (
 *   <View style={{ marginBottom: isVisible ? keyboardHeight : 0 }}>
 *     <TextInput />
 *   </View>
 * );
 */
export function useKeyboard(): KeyboardInfo {
  const [keyboardInfo, setKeyboardInfo] = useState<KeyboardInfo>({
    isVisible: false,
    keyboardHeight: 0,
  });

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      'keyboardDidShow',
      (e: KeyboardEvent) => {
        setKeyboardInfo({
          isVisible: true,
          keyboardHeight: e.endCoordinates.height,
        });
      }
    );

    const hideSubscription = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardInfo({
          isVisible: false,
          keyboardHeight: 0,
        });
      }
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return keyboardInfo;
}
