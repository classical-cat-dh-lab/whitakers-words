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

`npm run verify` runs the offline build and thirteen test groups: the original
nine engine/adapter groups plus four student-display groups. The
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

## Observed legacy behavior retained

- Unique entries retain the original null part initialization (`X`), even when
  their parse quality is a noun, pronoun or verb. Citation artifacts remain.
- A precomposed macron splits ASCII lookup fragments differently from its NFD
  form; no implicit diacritic folding or i/j/u/v modernization is added.
- The order of the original linked inflection list affects which duplicate
  survives. Reading the text in the opposite order changes visible results.
- Explanatory rows affect fallback control: inserting a trick/syncope marker can
  suppress further affix searches. This is reproduced, including unknown results.
- PACK/enclitic duplicate groups, the adjective-to-adverb fallback, period-sensitive
  abbreviations and compound display behavior retain their original irregularities.
- Original data, meanings, frequency labels and heuristic suggestions are retained
  regardless of modern linguistic expectations. No corrected deviations are active.

## Limits and next qualification work

The first-stage deliverables are operational. This is a development candidate,
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
Public repository creation, publication, package naming and a release are separate
decisions. No public release is implied by these local results.
