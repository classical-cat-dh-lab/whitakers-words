# Version 1.0.1 — documentation and browser maintenance

Application **1.0.1** retains **engine 1.0.0**, its dictionary, API, CLI and all
28 frozen backend paths. Upstream WORDS **1.99.0** is the reference program's
version, not this application's version.

- Simplified the browser guide and consolidated current compatibility results.
  Historical alpha/beta material is labeled and separated from current help.
- Added complete component-license and citation navigation, and clarified the
  distinction between Whitaker's work and this TypeScript implementation.
- Moved **Offline help** to a separate offline-capable page that opens in a new
  tab, preserving the dictionary page's input, results and scroll position.
- Removed **Latin (original input rules)** from the browser mode menu. **Latin
  lookup** and **English lookup** remain; exact legacy input remains available
  through the library and CLI.

English lookup still searches one word without singular/plural expansion. See
[the browser guide](browser-input.md#english-lookup) for its current limitations.

This maintenance release is distributed through
[GitHub](https://github.com/classical-cat-dh-lab/whitakers-words/releases/tag/v1.0.1)
and the website. No new Zenodo archive is requested. The
[1.0.0 archive](https://zenodo.org/records/23020269) remains the preserved engine
milestone; it does not identify the 1.0.1 application artifacts.
[Citation metadata](../CITATION.cff) identifies this patch by its GitHub release.
