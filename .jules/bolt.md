## 2025-05-15 - [O(1) Scoring Cache with WeakMap]
**Learning:** Using `WeakMap` to cache derived data (like transforming arrays to Maps) for immutable metadata objects prevents millions of redundant iterations during bulk ingestion. Passing a shared `now` Date reference further avoids thousands of object allocations in tight loops.
**Action:** Apply this pattern for any bulk data processing that involves looking up attributes against a static or rarely-changing configuration object.
