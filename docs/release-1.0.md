# Version 1.0 — stable preservation release

Version **1.0.0** completes the behavior-preserving port of the pinned Whitaker's
WORDS analysis engine within the declared [API and CLI contract](api.md).
The reference is WORDS 1.99.0, commit
`1f2f0fb0867a896d7b9284a03d615ed635d6f992`. Original dictionary content,
linguistic judgments, alternative analyses, ordering and native errors remain
part of the legacy profile. This release does not correct inherited scholarship.

## Frozen engine

The [release manifest](legacy-release.json) freezes all 28 engine/data/adapter
paths. Relative to the [qualified checkpoint](legacy-checkpoint.md), release
finalization changes only the reported engine version from `1.0.0-rc.1` to
`1.0.0`. The original checkpoint and historical 0.3 baseline remain immutable.
Compared with 0.3, the final audit restored Ada's English inline-comment handling,
including its column-one exception.

The final qualification retains 4,144,877 Latin observations: 4,144,873 normal
matches, two reproduced native errors and two explicitly separate comparator
exclusions. Fresh checks include 24,000 English observations, 4,096 exposed
Boolean-option combinations, 2,048 ordered sessions and input/failure boundaries.
There are no unexplained differences or regressions in that qualification.
Native terminal menus, file commands and host I/O/resource failures are outside
the analysis-engine API. Full classical-author corpus processing and universal
equivalence are not claimed.

## Browser completion

- Failed or unresponsive analysis can be stopped and the dictionary reloaded.
- Offline updates have bounded checks, progress-aware timeouts, cancellation,
  retry and safe cleanup. Optional storage permission does not delay saving.
- Saved night mode is applied before showing content; a blocked preference read
  has a bounded fallback. Validation and lookup use separate status lines.
- Collapsed word details and technical output are built when opened, reducing
  initial work for long passages while preserving all returned information.
- Each webpage submission is limited to 2,000 words and 20,000 Unicode characters.
  Excess input is rejected with guidance to split it; nothing is silently truncated.
  The analysis library and CLI retain their original input behavior.
- Older cached releases are reclaimed while retaining the selected release,
  rollback, pending candidate and resources required by open tabs.

The interface retains the accepted palette, text/list views, meanings, punctuation,
macron display and version badge. The beta label is removed. See the
[browser guide](browser-input.md) for input, recovery and offline behavior.

The release is qualified through portable regression tests, browser fault and
boundary tests, cold offline restart, archived-release migration and independent
source reconstruction. Chrome, Edge, Firefox and WebKit-family coverage is
recorded; physical-device testing is not a release gate and is not claimed done.

The v1 legacy backend is frozen. Intentional engineering or scholarly improvements
belong to a separately identified future profile; the original evidence and
released files will not be rewritten.
