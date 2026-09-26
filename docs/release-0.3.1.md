# 0.3.1-beta.1

This frontend release improves dictionary reading and introduces permanent page
URLs while retaining the hash-frozen 0.3.0 beta backend and original dictionary.

- Passage results start collapsed and only one word expands at a time. Principal
  parts are bold, grammar is indented, and notation is compact.
- Dictionary-frequency order is the default. Display options can restore original
  WORDS order or enable expandable original text, JSON, notes and validation.
  New lookup clears the previous search; query timing and Back to top are available.
- The home page and documentation use permanent URLs. Older versioned page links
  redirect to those pages. Runtime files remain isolated by their release identity.
- Offline updates verify every file and run a sample analysis before offering
  Reload. A failed or cancelled update keeps the complete saved version; open old
  tabs retain their own resources. Updates never interrupt an in-progress lookup.
- The portable suite passes all 43 groups, including the frozen backend check,
  candidate-preserving ordering and stable-page routing. Chromium and WebKit cover
  offline restart, interrupted/corrupt downloads, explicit updates, concurrent
  old tabs, documentation, and touch/viewport behavior.

The application version is 0.3.1-beta.1; the engine version remains 0.3.0-beta.1.
The [backend acceptance](acceptance.md) and [frozen baseline](backend-baseline.md)
are unchanged. No new complete corpus run or physical iOS installation is claimed.
See [compatibility scope](compatibility.md) and [browser use](browser-input.md).

Archive: [DOI 10.5281/zenodo.22973796](https://doi.org/10.5281/zenodo.22973796), in the existing Words version lineage.
