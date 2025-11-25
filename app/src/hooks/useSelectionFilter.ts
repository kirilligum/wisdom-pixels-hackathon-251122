import { useMemo, useState } from 'react';

type Predicate<T> = (item: T, needle: string) => boolean;

export function useSelectionFilter<T, K extends string | number>(
  items: T[],
  getKey: (item: T) => K,
  matches: Predicate<T>,
) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKeys, setSelectedKeys] = useState<Set<K>>(new Set());

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return items;
    return items.filter((item) => matches(item, searchTerm));
  }, [items, searchTerm, matches]);

  const toggleSelection = (key: K) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedKeys(new Set(filtered.map(getKey)));
  };

  const clearSelection = () => {
    setSelectedKeys(new Set());
  };

  return {
    searchTerm,
    setSearchTerm,
    filtered,
    selectedKeys,
    toggleSelection,
    selectAll,
    clearSelection,
  };
}
