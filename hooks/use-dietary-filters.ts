import { useState } from 'react';
import { type DietaryTag } from '@/constants/dietary';

export function useDietaryFilters() {
  const [activeFilters, setActiveFilters] = useState<Set<DietaryTag>>(new Set());

  function toggleFilter(tag: DietaryTag) {
    setActiveFilters(prev => {
      const next = new Set(prev); // copy-on-write — never mutate the existing Set
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  }

  function clearFilters() {
    setActiveFilters(new Set());
  }

  function isActive(tag: DietaryTag): boolean {
    return activeFilters.has(tag);
  }

  return { activeFilters, toggleFilter, clearFilters, isActive };
}
