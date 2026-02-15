## 2025-05-14 - [Empty States and ARIA Roles in Data Explorers]
**Learning:** In highly filtered data views, an empty state with a recovery action is more effective than just displaying an empty table. Accessibility roles for tabs and ARIA-live regions for loading states are critical for a polished feel in SPA data tools.
**Action:** Always implement a 'No results found' view with a 'Clear filters' button when building search-heavy interfaces.

## Modern Data Explorer UX (Header Filters, Dark Mode, Insights)

- **Header Filters Synchronization:** When adding column-specific filters in the header, they should synchronize with global filters (like sidebar zip/location). Using a central `columnFilters` state ensures that selecting "Active" in the 'Status' column is immediately reflected in the sidebar filter summary and vice versa.
- **Progressive Disclosure in Details:** The enhanced detail view uses field-specific icons (Phone, Globe, Zap) and clickable links to make the sidebar more functional. Adding an "Educational Tip" section provides context for technical fields (e.g., explaining what a Registration Number represents).
- **Dark Mode Persistence:** Persistence via `localStorage` is crucial for theme preference. Using Tailwind's `dark:` class strategy allows for precise control over contrast in complex components like zebra-striped tables and data charts.
- **Data Visualization Utility:** Charts (Recharts) provide an essential bird's-eye view of large datasets (1M+ rows). A Pie chart is ideal for Status distribution, while a horizontal Bar chart effectively compares counts across Categories.
- **Security UX:** Passcode protection for data exports should include a lockout mechanism with visual feedback (timer) to prevent brute-force attacks while maintaining a user-friendly interface.

## 2025-05-15 - [Icon-Only Buttons and Copy-to-Clipboard Utility]
**Learning:** Icon-only buttons MUST have 'aria-label' for screen readers. A "Copy to Clipboard" utility in data-heavy sidebars provides significant "micro-delight" and utility. For these utilities, use 'focus-visible' and 'group-hover' for clean UI that remains accessible to keyboard users. Always ensure valid values like '0' are copyable by checking for 'null'/'undefined' instead of falsy.
**Action:** When implementing detail views for data records, include a hoverable/focusable copy button for each field with clear visual success feedback.
