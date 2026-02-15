## 2025-05-14 - [React Filtering/Sorting Decoupling & Loop Optimization]
**Learning:** Decoupling filtering from sorting in `useMemo` is a massive performance win for large datasets (1M+ rows). When combined with debouncing and optimized loops (avoiding `Object.entries` and redundant `toLowerCase` calls), it can reduce search/sort lag by 3x-6x.
**Action:** Always check if multiple expensive operations are bundled in a single `useMemo`. Ensure tight loops are free of object allocations and repeated constant computations.
