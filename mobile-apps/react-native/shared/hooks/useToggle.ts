import { useState, useCallback } from 'react';

/**
 * useToggle - 切换布尔值的 Hook
 *
 * @param initialValue - 初始值，默认为 false
 * @returns [当前值, 切换函数, 设置为 true 函数, 设置为 false 函数]
 *
 * @example
 * const [isOpen, toggleOpen, setOpen, setClosed] = useToggle(false);
 *
 * // 切换
 * <Button onPress={toggleOpen} title="Toggle" />
 *
 * // 明确设置
 * <Button onPress={setOpen} title="Open" />
 * <Button onPress={setClosed} title="Close" />
 */
export function useToggle(
  initialValue: boolean = false
): [boolean, () => void, () => void, () => void] {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue(v => !v);
  }, []);

  const setTrue = useCallback(() => {
    setValue(true);
  }, []);

  const setFalse = useCallback(() => {
    setValue(false);
  }, []);

  return [value, toggle, setTrue, setFalse];
}
