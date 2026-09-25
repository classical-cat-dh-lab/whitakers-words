# 0.2.1-alpha.1

This frontend patch retains the 0.2 engine: its full 4,144,877-query Ada comparison found 109,001 output differences, two Ada exceptions and two console limitations, with no TypeScript runtime exceptions; engine compatibility repairs remain scheduled for 0.3 alpha.

- The original-input option now explains that it does not remove macrons and can
  split words containing them. The normal Latin lookup remains macron-aware.
  Original-style text output is clearly identified as an alternative layout.
  The empty corrected layer remains available in the API, outside the lookup menu.
- Saved installations put Update beside Night mode in the page header. The
  download panel takes no space when the saved dictionary is ready; progress,
  failures, repairs and pending update activation still remain visible.
- Pages start in light mode. Night mode is an explicit choice, saved locally in
  IndexedDB and shared by lookup and documentation pages. It survives reopening
  and offline use; clearing site data removes the preference.
- Footer documents open as typeset, same-origin HTML pages, with responsive tables,
  readable legal notices, return navigation and the same theme control. Source
  download has its own introduction page. These pages join the offline bundle;
  downloading the complete source archive itself requires a connection.

The dictionary, rules and analysis algorithms are unchanged. Original notices are
reflowed for reading without changing their text; their raw files remain included.
