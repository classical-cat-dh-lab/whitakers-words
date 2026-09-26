# First-stage compatibility qualification

Qualified on 2026-09-19 against `words-mk270-1f2f0fb`, using the exact
`upstream-tests-v1` profile. The reference program is WORDS 1.99.0 from the
maintained mk270 lineage, not a reconstruction of historical 1.97FC.

| Evidence | Result |
|---|---|
| Original Ada source and four text data files | Hash-locked and unmodified |
| Original upstream regression groups | All five pass |
| Frozen executable baseline | All 21 cases reproduce raw stdout/stderr and process state |
| TypeScript against that baseline | All 751 input fragments match, including all five groups |
| Additional frozen Ada observations | All 3,953 inputs match; no remaining differences in this corpus |
| Runtime adapters | CLI/API equality tests; browser Worker matches eight complete Node JSON hashes |
| Derived data reproducibility | Both complete tables match across two independent native build directories |
| Robustness | Checksum corruption, invalid options, UTF-16 spans, legacy Unicode splitting, long input, compounds, corrected isolation and repeated calls pass |
| Student reading view | All 3,953 inputs retain every candidate and explanatory row in order, without mutating the legacy result; all source class combinations and all 39,336 dictionary entries have display mappings |

`npm run verify` runs the offline build and twenty-seven test groups: the original
nine engine/adapter groups, four student-display groups and three offline-storage
groups, plus two browser-input/comparison-contract groups and two documentation
rendering/preservation groups, plus two search-state and request-isolation groups,
and two source-audit option/width and native-buffer-error groups, plus three
parse-storage, runtime-surface and native-addon-reader groups.
The search-state fixtures preserve fresh native observations for failed attempts,
affix fallback, distinct dictionary/affix spelling comparisons and transformed
part-of-speech checks. The website also passes bounded Chromium/WebKit offline checks and eight
complete browser-to-Node JSON comparisons. Physical mobile-device installation
and full classical-author corpora remain outside this qualification. The
expanded corpus contains Aeneid vocabulary, all unique forms, available examples
derived from the source inflection rules and explicit fallback probes. Repeated
forms are deduplicated. This is broad feature coverage, not every possible stem,
rule, affix combination or malformed input. Exact corpus hashes are in
`tests/compatibility/manifest.json`.

## Comparison contract

The 21 raw Ada observations remain byte-for-byte evidence. The TypeScript
comparison removes terminal prompts and whitespace around each frame, then trims
trailing whitespace/CR on each output line. It retains internal blank lines,
candidate multiplicity, order, morphology, flags, citations, meanings, explanatory
text, unknown results and trimming markers. It never compares an unordered set.
The CLI intentionally omits the startup banner and interactive command interpreter.

## Expanded qualification

The 0.2 candidate includes [full fixed-wordlist acceptance](acceptance.md), which
extends the frozen baseline and records newly exposed compatibility differences.
The old finite baseline remains passing; its success is not universal equivalence.
[Browser macron adaptation](browser-input.md) is separate from the legacy profile.

The local 0.3 storage/reader checkpoint replays all **4,144,877** frozen inputs.
All **4,144,873 comparable normal outputs match**, with zero regressions and no
new exceptions. This resolves all 510 differences in the preceding source-audit
checkpoint, including its two trimming-marker regressions, and all 109,001 output
differences in the original 0.2 baseline. The earlier 240 input/option fixtures
remain passing; another 180 cases across six option profiles and all 343 effective
native addon fix/connection fields are now retained as regression observations.

The original `pilarium`/`pilarivm` native output-buffer failures still raise
explicit port execution errors. Native diagnostic text and process/adapter behavior
are not yet equivalent; do not count them as matches. Empty input and `!` remain
console-adapter comparison limitations. Normal fixed-wordlist output agreement
does not establish complete exceptional-path I/O parity. This checkpoint is local
and has not been published as a release.

## Observed legacy behavior retained

- Unique entries retain the original null part initialization (`X`), even when
  their parse quality is a noun, pronoun or verb. Citation artifacts remain.
- A precomposed macron splits ASCII lookup fragments differently from its NFD
  form; no implicit diacritic folding or i/j/u/v modernization is added.
- The order of the original linked inflection list affects which duplicate
  survives. Reading the text in the opposite order changes visible results.
- Explanatory rows affect fallback control: inserting a trick/syncope marker can
  suppress further affix searches. This is reproduced, including unknown results.
- Rejected attempts can leave dictionary candidates for the subsequent
  `Do_Only_Fixes` pass. That state and the shared reduced stem are request-local
  and retained at native pass boundaries, including the original stem-length
  reduction and empty QU/PACK search behavior. Syncope suppression is scoped to
  the native stages. Affix
  comparison folds u/v only; dictionary matching also folds i/j. Prefix checks
  use the part of speech after any suffix transformation.
- Shared parse buffers retain inactive slots after pruning or rollback; later
  passes can expose them. Mutating loops use the original Ada range bounds.
- Addon reading preserves the native comment buffer's retained tail. In the frozen
  data, this gives the ordinary adjective `cumque` tackon an unusable effective
  spelling. The portable reader reproduces that original defect without changing
  the source data or adding a lexical exception.
- PACK/enclitic duplicate groups, the adjective-to-adverb fallback, period-sensitive
  abbreviations and compound display behavior retain their original irregularities.
- Original data, meanings, frequency labels and heuristic suggestions are retained
  regardless of modern linguistic expectations. No corrected deviations are active.

## Limits and next qualification work

The first-stage deliverables are operational. This is an experimental alpha,
not a claim of complete equivalence for every possible WORDS input or philological
correctness. The qualified profile uses only the canonical general dictionary;
local/special dictionaries, editing modes, interactive menus, persistent option
files and historical platform-specific side effects are not implemented adapters.

Custom option combinations, rare original buffer/exception paths, additional
cross-platform runtimes and broader affix cross-products remain release
qualification work. Nondefault options are explicitly labeled `custom`, not
silently presented as the frozen profile. Native file hash differences do not
change the canonical portable data; see [reference boundaries](building.md).

Future linguistic changes must use a reviewed deviation with evidence and tests.
Full classical-author corpus comparison and stress testing remain future work.
The website alpha does not establish those claims. Release citation metadata is
maintained in [CITATION.cff](../CITATION.cff).
