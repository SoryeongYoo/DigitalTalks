// 로컬 스토리지 훅
import { useState, useCallback } from 'react';

const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      return initialValue; // localStorage 사용 불가로 초기값 반환
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      setStoredValue(value);
      // localStorage는 지원되지 않으므로 메모리에만 저장
    } catch (error) {
      console.error('Error setting value:', error);
    }
  }, []);

  return [storedValue, setValue];
};

export default useLocalStorage;