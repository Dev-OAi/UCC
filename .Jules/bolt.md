## 2025-02-15 - Decoupling High-Frequency from High-Cardinality Filtering
**Learning:** In React applications handling large datasets (>500k rows), a single `useMemo` for filtering can become a major bottleneck if it combines high-frequency triggers (like a debounced search input) with expensive but less frequent filters (like category selection). Decoupling these into hierarchical `useMemo` hooks significantly improves interactive performance.
**Action:** Always separate data subsetting (filtering by category/tab) from interactive filtering (search, column filters) when dealing with large client-side datasets.

## 2025-02-15 - Efficient Metadata Sampling
**Learning:** Using `Array.find()` repeatedly on a large array to find samples for multiple categories is $O(T \times N)$. A single-pass iteration that builds a Map of samples is $O(N)$ and can be further optimized with an early exit once all expected categories are found.
**Action:** Use a single-pass loop with a `Map` and early `break` for sampling metadata from large arrays.

## 2025-02-15 - High-Speed String Comparison
**Learning:** `localeCompare` is significantly slower than `Intl.Collator.prototype.compare` when sorting large arrays of strings, especially with `numeric: true`.
**Action:** Re-use a single `Intl.Collator` instance for all sorting operations in performance-critical data views.
