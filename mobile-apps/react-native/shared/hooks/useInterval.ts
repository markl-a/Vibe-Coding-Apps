import { useEffect, useRef } from 'react';

/**
 * useInterval - 使用 setInterval 的 Hook
 *
 * @param callback - 要执行的回调函数
 * @param delay - 间隔时间（毫秒），null 则暂停
 *
 * @example
 * const [count, setCount] = useState(0);
 * const [delay, setDelay] = useState(1000);
 * const [isRunning, setIsRunning] = useState(true);
 *
 * useInterval(
 *   () => {
 *     setCount(count + 1);
 *   },
 *   isRunning ? delay : null
 * );
 *
 * return (
 *   <View>
 *     <Text>计数: {count}</Text>
 *     <Button
 *       onPress={() => setIsRunning(!isRunning)}
 *       title={isRunning ? '暂停' : '开始'}
 *     />
 *   </View>
 * );
 */
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef<() => void>();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) {
      return;
    }

    const tick = () => {
      savedCallback.current?.();
    };

    const id = setInterval(tick, delay);
    return () => clearInterval(id);
  }, [delay]);
}
