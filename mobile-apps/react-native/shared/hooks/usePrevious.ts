import { useEffect, useRef } from 'react';

/**
 * usePrevious - 获取上一次的值
 *
 * @param value - 需要追踪的值
 * @returns 上一次的值
 *
 * @example
 * const [count, setCount] = useState(0);
 * const prevCount = usePrevious(count);
 *
 * return (
 *   <View>
 *     <Text>当前: {count}</Text>
 *     <Text>之前: {prevCount}</Text>
 *     <Button onPress={() => setCount(count + 1)} title="增加" />
 *   </View>
 * );
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}
