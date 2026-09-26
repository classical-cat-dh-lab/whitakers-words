# Compatibility qualification — 0.3 beta

Initial baseline qualified on 2026-09-19 against `words-mk270-1f2f0fb`, using the exact
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

`npm run verify` runs the offline build, frozen backend hash check and portable
regression suite. The released 0.3.0 beta passed 36 groups covering the engine,
adapters, reader, offline storage, input, documents, search state and native
exception/capacity behavior. The current frontend preview adds four groups:
compact notation and three dictionary-order checks. The ordering checks retain
every candidate, form and explanation across the 3,953-input reference corpus,
preserve equal-band order and keep nonordinal frequency categories distinct.
The search-state fixtures preserve fresh native observations for failed attempts,
affix fallback, distinct dictionary/affix spelling comparisons and transformed
part-of-speech checks. The published 0.3.0 website passed bounded Chromium/WebKit
offline checks and eight complete browser-to-Node JSON comparisons. The current
frontend preview is checked in the in-app browser; those checks do not constitute
a new Chromium/WebKit release qualification. Physical mobile-device installation
and full classical-author corpora remain outside this qualification. The
expanded corpus contains Aeneid vocabulary, all unique forms, available examples
derived from the source inflection rules and explicit fallback probes. Repeated
forms are deduplicated. This is broad feature coverage, not every possible stem,
rule, affix combination or malformed input. Exact corpus hashes are in
`tests/compatibility/manifest.json`.

The 0.3 beta designation recognizes preliminary engineering reliability after
the complete comparisons below. The [backend baseline](backend-baseline.md) is
frozen; full classical-text corpus work remains deferred.

## Comparison contract

The 21 raw Ada observations remain byte-for-byte evidence. The TypeScript
comparison removes terminal prompts and whitespace around each frame, then trims
trailing whitespace/CR on each output line. It retains internal blank lines,
candidate multiplicity, order, morphology, flags, citations, meanings, explanatory
text, unknown results and trimming markers. It never compares an unordered set.
The CLI intentionally omits the startup banner and interactive command interpreter.
The browser's selectable dictionary-frequency order is outside this raw-output
contract. The library reader and original text/JSON retain their source order;
the browser reorders complete entries only within uninterrupted interpretation
groups. See [browser ordering](browser-input.md#dictionary-frequency-order).

## Expanded qualification

The 0.2 candidate includes [full fixed-wordlist acceptance](acceptance.md), which
extends the frozen baseline and records newly exposed compatibility differences.
The old finite baseline remains passing; its success is not universal equivalence.
[Browser macron adaptation](browser-input.md) is separate from the legacy profile.

The 0.3 storage/reader checkpoint replays all **4,144,877** frozen inputs.
All **4,144,873 comparable normal outputs match**, with zero regressions and no
new exceptions. This resolves all 510 differences in the preceding source-audit
checkpoint, including its two trimming-marker regressions, and all 109,001 output
differences in the original 0.2 baseline. The earlier 240 input/option fixtures
remain passing; another 180 cases across six option profiles and all 343 effective
native addon fix/connection fields are now retained as regression observations.

The following local repair restores native line-atomic analysis and exceptional
termination. All 222 input/option session cases match two native builds, compared
with 68 before the repair. These include 105 native failures and controls for
blank reads, 2,500-byte boundaries, same-line and preceding-line output, case,
punctuation, compounds and Unicode. Six synthetic states injected at the native
grouping caller verify 12/13 forms, 40/41 groups and 99/100 parse slots. The native
grouping routine itself is unchanged in this probe. The final 100th nominal/verb
record can fail because Ada evaluates the next array access even after the active
range ends.

The two original native-error inputs remain errors in the source algorithm.
They now return explicit `legacy-error` results with the original diagnostic
body; CLI stdout, empty stderr and exit code 0 reproduce the native outer handler.
These are classified separately from successful normal analyses. Empty input and
`!` remain limitations of the original wordlist console comparator. The 0.3 beta qualification does not establish universal exceptional-path equivalence. See [the result contract](api.md).

## Observed legacy behavior retained

The subsequent capacity review qualifies ten synthetic native caller states:
dictionary candidates at 80/81, inflections at 249/250/251, reduced records at
250/252, and QU processing at 249/250/251. It preserves failing-write timing,
the retained 81st candidate count, and the QU/PACK read beyond a full 250-slot
array while searching for its null sentinel. All ten states match, compared with
six before this repair. These are injected caller/table states in an isolated
native copy; the original matching routines are unchanged.

All **23,808 nonempty distinct English index spellings**, plus 192 POS/trim/input
probes, match both native builds: **24,000/24,000**, versus 23,963 before repair,
with no regressions. Five observations intentionally reproduce the original
500-hit overflow; they are failure outcomes, not successful lookups. The other
resolved observations cover native QV conversion and input with no ASCII word.
Another **512 Latin sessions across 16 option profiles** match both native builds,
including combined settings and multiline sequences. Portable tests also reverse
request order. These finite profiles do not qualify every option/input combination.

The complete **4,144,877-query** Latin replay after these repairs retains all
**4,144,873 normal matches** and both original native failure outcomes, with no
new differences or port failures. The two original comparator exclusions remain
separate. This result is the frozen 0.3 beta backend baseline.

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
- Analysis completes for every word in a native input line before ordinary
  results for that line are printed. A failure discards that pending line, retains
  previously completed lines and terminates subsequent processing. Two blank
  native reads also end a session; prompt width after one blank read affects
  unknown-word alignment even when the prompt itself is omitted.
- Addon reading preserves the native comment buffer's retained tail. In the frozen
  data, this gives the ordinary adjective `cumque` tackon an unusable effective
  spelling. The portable reader reproduces that original defect without changing
  the source data or adding a lexical exception.
- PACK/enclitic duplicate groups, the adjective-to-adverb fallback, period-sensitive
  abbreviations and compound display behavior retain their original irregularities.
- Original data, meanings, frequency labels and heuristic suggestions are retained
  regardless of modern linguistic expectations. No corrected deviations are active.

## Limits and next qualification work

The first-stage deliverables are operational. This is a beta release,
not a claim of complete equivalence for every possible WORDS input or philological
correctness. The qualified profile uses only the canonical general dictionary;
local/special dictionaries, editing modes, interactive menus, persistent option
files and historical platform-specific side effects are not implemented adapters.

Custom option combinations, unqualified original buffer/exception paths, additional
cross-platform runtimes and broader affix cross-products remain release
qualification work. Nondefault options are explicitly labeled `custom`, not
silently presented as the frozen profile. Native file hash differences do not
change the canonical portable data; see [reference boundaries](building.md).
Host memory exhaustion, storage-error retries, native file-system failures and
platform-specific exception-information strings are not reproduced by the API.
The CLI exposes the analysis body through its own documented arguments and stdin
protocol; it is not a clone of native interactive menus or native command-line
invocation modes.

Future linguistic changes must use a reviewed deviation with evidence and tests.
Full classical-author corpus comparison and stress testing remain future work.
The beta designation does not establish those claims. Release citation metadata is
maintained in [CITATION.cff](../CITATION.cff).
