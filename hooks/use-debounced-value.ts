import { useState, useEffect } from 'react';

/**
 * Debounces a value by `delay` milliseconds.
 * Returns the latest value only after the caller stops updating for `delay` ms.
 *
 * Used by the search screen to avoid firing an API call on every keystroke (NFR6: 300ms).
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
