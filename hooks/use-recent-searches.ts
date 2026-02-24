import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@noana_recent_searches';
const MAX_RECENT = 10;

/**
 * Manages recent search history persisted in AsyncStorage.
 * Deduplicates entries, keeps newest-first, caps at 10.
 */
export function useRecentSearches() {
  const [searches, setSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setSearches(JSON.parse(raw));
    } catch {
      // Silently fail — recent searches are non-critical
    } finally {
      setIsLoading(false);
    }
  }

  async function add(query: string) {
    const trimmed = query.trim();
    if (!trimmed) return;

    const updated = [trimmed, ...searches.filter(s => s !== trimmed)].slice(0, MAX_RECENT);
    setSearches(updated);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Silently fail — recent searches are non-critical
    }
  }

  async function remove(query: string) {
    const updated = searches.filter(s => s !== query);
    setSearches(updated);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Silently fail — recent searches are non-critical
    }
  }

  async function clear() {
    setSearches([]);
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
      // Silently fail — recent searches are non-critical
    }
  }

  return { searches, add, remove, clear, isLoading };
}
