# Fixed-wordlist acceptance

The 0.2 candidate compares the complete four-profile version 1.0.0 of
[classical-lexical-test-data](https://github.com/classical-cat-dh-lab/classical-lexical-test-data).
This is a dictionary-input corpus, not classical prose or adjudicated answers.

The reproducible runner is `scripts/acceptance.mjs`. Use an immutable data
directory containing its manifest and four gzip lists, plus the built reference
described in [building.md](building.md):

```sh
node --max-old-space-size=8192 scripts/acceptance.mjs \
  --data /path/to/data --oracle /path/to/oracle --out /path/to/results --workers 6
```

The runner checks input hashes, pins the executable/generated data and comparison
profile, and records the engine/adapter/runner identities. Equal strings shared by
profiles execute once; membership masks preserve full per-profile accounting.
Multiword lines are not flattened. Distinct browser macron-adapted inputs are
compared using the same adapted text on both engines.

Each 2,000-query reference process is isolated. A failing reference batch is
retried as individual cases for classification. Console commands, empty console
input, overlong lines and embedded controls are separately accounted for; they
are never silently discarded or counted as successful lookups.

The comparison preserves candidate order, multiplicity, morphology, meanings and
internal blank lines. It only removes prompts and frame-edge/trailing whitespace.
Per-input outcomes and output hashes, complete differences, timings and runtime
identity remain in resumable files. Completed batches can be reused only under
the same recorded identities. A zero exit means the run completed; counters and
difference adjudication determine acceptance. `--limit` is for harness checks.

## Complete run — 2026-09-22

All four immutable input files were verified and exhausted. Their union contains
4,135,067 exact strings. Applying the browser adapter changes
1,011,189 of these; its additional distinct strings bring the total to
**4,144,877 comparisons**, in 2,073 resumable batches.

| Profile | Inputs | Strictly equal | Output differs | Ada exception | Console limitation |
|---|---:|---:|---:|---:|---:|
| original | 2,074,758 | 2,028,942 | 45,814 | 1 | 1 |
| simple | 3,036,169 | 2,968,006 | 68,160 | 2 | 1 |
| teaching | 4,126,749 | 4,018,678 | 108,068 | 2 | 1 |
| special | 1,014,233 | 974,603 | 39,629 | 0 | 1 |
| browser | 3,133,688 | 3,064,252 | 69,432 | 2 | 2 |

Profiles overlap and must not be added together. The browser row counts distinct
normalized queries, not original marked spellings. Overall unique results are
**4,035,872 equal (97.370%), 109,001 different,
2 reference exceptions and 2 console
limitations**. No TypeScript exception was observed; all reference-exception and
console-limitation inputs were additionally run through the TypeScript API.
Equality includes matching unknown/unsupported results; it is not dictionary
coverage or a judgment of Latin correctness.

Mechanical triage of the recorded failures:

| Output category | Queries |
|---|---:|
| adapterUnsupported | 2 |
| analysis-rows-differ | 61,972 |
| explanatory-or-unknown-output-differs | 15,673 |
| same-analysis-rows-other-output-differs | 31,226 |
| layout-only | 128 |
| order-only | 2 |
| oracleFailure | 2 |

These categories group observed output; they do not establish shared root causes.
Analysis rows are the fixed-column inflection rows. Ordering, multiplicity,
explanations and meanings remain part of the strict acceptance requirement.

The Ada reference reports internal exceptions for `pilarium` and `pilarivm`, even
though it exits with status zero. Frame accounting detects these failures. The
port returns analyses for both; this difference is recorded rather than treated
as a parity pass. A blank adapted query and `!` are console-adapter limitations.

Independent fresh-process replay of 51 selected cases,
including the exceptional boundaries, confirmed the recorded Ada observations
where the console accepts the input, across two independently built source-
identical oracles. Both builds also pass the 21 original byte-for-byte fixtures.
This additional replay is representative confirmation, not a second full run.

## Acceptance judgment

**The full-wordlist compatibility gate fails.** The frozen 21 cases / 751 fragments
and 3,953 expanded observations still pass, but the larger corpus exposes real
unresolved departures. Examples include alternate fallback analyses for `abare`,
additional suffix candidates for `colucula`, and lost explanation-only output for
`ebit`. The input adapter and browser repairs do not resolve these engine issues.

The recommendation is to repair the compatibility differences and rerun this fixed
suite before publishing the candidate. No linguistic correction has been activated;
original dictionary bytes remain fixed. This report does not qualify full classical
prose, every option combination, or physical mobile installation.

## Reproduction identity and performance boundary

- Dataset manifest SHA-256: `e0182347b637457459d6776d08aadb2c29872f48c6a07cc060e24b8fb8c736dd`.
- Compiled engine set SHA-256: `b3ef5a3be596f6d3217580f79b01c4e6f2af9864625de7942929209e098e069b`.
- Input adapter SHA-256: `2edf9b6558b2f0d715c3ec93172a3b9d184d72c221f0373a23ee405fd3a805a2`.
- Reference executable SHA-256: `ad10670238d1418a2f1ba757582dc8732e1e8712fdd3dd82861183dce1e276c9`.
- Reference profile SHA-256: `256c9775d007bcaa7ed98b67bb0c2a55d795cfbf5b3470b82113978de3abbe50`.
- Runner SHA-256: `91f7eaed7ab2a133ea96951006b3cf5ca48c6e92b7445ef0e11fc6db0f9f2a3d` (source checkpoint `c9405a8`).
- Host: Apple M1 Max, arm64, darwin 27.0.0, Node v26.7.0.
- Six concurrent workers; complete comparison wall time 2252.4 s
  (37.5 min), excluding initial corpus preparation.
- Per-batch output hashes, per-input outcomes, discrepancy text, timing and memory
  are retained by the runner. Concurrent batch timings are not single-request
  browser latency or a direct Ada-versus-TypeScript speed comparison.
