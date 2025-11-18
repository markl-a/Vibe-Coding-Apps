import { useState, useEffect, useCallback } from 'react';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/**
 * useAsync - 处理异步操作的 Hook
 *
 * @param asyncFunction - 异步函数
 * @param immediate - 是否立即执行，默认为 true
 * @returns [状态对象, 执行函数, 重置函数]
 *
 * @example
 * const fetchUser = async (id: string) => {
 *   const response = await fetch(`/api/users/${id}`);
 *   return response.json();
 * };
 *
 * const [{ data, loading, error }, execute] = useAsync(
 *   () => fetchUser('123'),
 *   true
 * );
 *
 * if (loading) return <LoadingSpinner />;
 * if (error) return <Text>Error: {error.message}</Text>;
 * if (data) return <Text>{data.name}</Text>;
 */
export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  immediate: boolean = true
): [AsyncState<T>, () => Promise<void>, () => void] {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  const execute = useCallback(async () => {
    setState({ data: null, loading: true, error: null });

    try {
      const data = await asyncFunction();
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error as Error,
      });
    }
  }, [asyncFunction]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return [state, execute, reset];
}
