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

## Candidate status

The full run is in progress. The harness pilot exposed reference differences,
including fallback analyses and explanatory rows not covered by the old frozen
fixtures. Do not infer full compatibility from the passing baseline.
