import { useEffect, useState, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

/**
 * useAppState - 监听应用前后台状态
 *
 * @param onChange - 状态改变时的回调函数
 * @returns 当前应用状态
 *
 * @example
 * const appState = useAppState((status) => {
 *   if (status === 'active') {
 *     // 应用回到前台，刷新数据
 *     refreshData();
 *   }
 * });
 *
 * return (
 *   <View>
 *     <Text>应用状态: {appState}</Text>
 *   </View>
 * );
 */
export function useAppState(
  onChange?: (status: AppStateStatus) => void
): AppStateStatus {
  const [appState, setAppState] = useState<AppStateStatus>(
    AppState.currentState
  );
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      appStateRef.current = nextAppState;
      setAppState(nextAppState);

      if (onChange) {
        onChange(nextAppState);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [onChange]);

  return appState;
}
