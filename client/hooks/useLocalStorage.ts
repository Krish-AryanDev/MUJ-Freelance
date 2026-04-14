import { useCallback, useEffect, useState } from 'react';

const isBrowser = (): boolean => typeof window !== 'undefined';

const readStoredValue = <T,>(key: string, initialValue: T): T => {
  if (!isBrowser()) {
    return initialValue;
  }

  try {
    const item = window.localStorage.getItem(key);
    if (!item) {
      return initialValue;
    }

    return JSON.parse(item) as T;
  } catch {
    return initialValue;
  }
};

export const useLocalStorage = <T,>(key: string, initialValue: T): [T, (value: T) => void, () => void] => {
  const [value, setValueState] = useState<T>(() => readStoredValue(key, initialValue));

  const setValue = useCallback(
    (nextValue: T) => {
      setValueState(nextValue);

      if (!isBrowser()) {
        return;
      }

      try {
        window.localStorage.setItem(key, JSON.stringify(nextValue));
      } catch {
        // Ignore quota and serialization errors to avoid crashing UI state.
      }
    },
    [key],
  );

  const removeValue = useCallback(() => {
    setValueState(initialValue);

    if (!isBrowser()) {
      return;
    }

    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore storage permission issues.
    }
  }, [initialValue, key]);

  useEffect(() => {
    setValueState(readStoredValue(key, initialValue));
  }, [initialValue, key]);

  useEffect(() => {
    if (!isBrowser()) {
      return;
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.storageArea !== window.localStorage || event.key !== key) {
        return;
      }

      if (event.newValue === null) {
        setValueState(initialValue);
        return;
      }

      try {
        setValueState(JSON.parse(event.newValue) as T);
      } catch {
        setValueState(initialValue);
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, [initialValue, key]);

  return [value, setValue, removeValue];
};