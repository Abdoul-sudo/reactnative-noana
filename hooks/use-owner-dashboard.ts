import { useEffect, useRef, useState } from 'react';
import {
  fetchOwnerRestaurantId,
  fetchRevenueSummary,
  fetchRevenueChart,
  fetchOrderStats,
  fetchTopDishes,
  type RevenueSummary,
  type RevenueChartPoint,
  type OrderStats,
  type TopDish,
} from '@/lib/api/owner-analytics';

export function useOwnerDashboard(userId: string) {
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [chartData, setChartData] = useState<RevenueChartPoint[]>([]);
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
  const [topDishes, setTopDishes] = useState<TopDish[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isEmpty, setIsEmpty] = useState(false);

  const mountedRef = useRef(true);
  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      setIsEmpty(false);

      try {
        // Step 1: fetch restaurant ID
        const rid = await fetchOwnerRestaurantId(userId);

        if (cancelled) return;

        if (!rid) {
          // Owner has no restaurants yet → empty state, not error
          setIsEmpty(true);
          setIsLoading(false);
          return;
        }

        setRestaurantId(rid);

        // Step 2: fetch all 4 analytics in parallel
        const [summaryData, chartPoints, stats, dishes] = await Promise.all([
          fetchRevenueSummary(rid),
          fetchRevenueChart(rid),
          fetchOrderStats(rid),
          fetchTopDishes(rid),
        ]);

        if (!cancelled) {
          setSummary(summaryData);
          setChartData(chartPoints);
          setOrderStats(stats);
          setTopDishes(dishes);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e : new Error('Failed to load dashboard'));
          if (__DEV__) console.warn('[use-owner-dashboard] load failed:', e);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [userId]);

  async function refetch() {
    setError(null);
    setIsEmpty(false);

    try {
      const rid = await fetchOwnerRestaurantId(userId);

      if (!mountedRef.current) return;

      if (!rid) {
        setIsEmpty(true);
        return;
      }

      setRestaurantId(rid);

      const [summaryData, chartPoints, stats, dishes] = await Promise.all([
        fetchRevenueSummary(rid),
        fetchRevenueChart(rid),
        fetchOrderStats(rid),
        fetchTopDishes(rid),
      ]);

      if (mountedRef.current) {
        setSummary(summaryData);
        setChartData(chartPoints);
        setOrderStats(stats);
        setTopDishes(dishes);
      }
    } catch (e) {
      if (mountedRef.current) {
        setError(e instanceof Error ? e : new Error('Failed to load dashboard'));
        if (__DEV__) console.warn('[use-owner-dashboard] refetch failed:', e);
      }
    }
  }

  return { summary, chartData, orderStats, topDishes, restaurantId, isLoading, error, isEmpty, refetch };
}
