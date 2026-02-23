import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

/**
 * Subscribes to real-time network connectivity state.
 * Returns null while the initial state is still being determined.
 */
export function useNetwork() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? false);
    });
    return unsubscribe;
  }, []);

  return { isConnected };
}
