# Compatibility and tested scope

The application uses the frozen **engine 1.0.0**, a behavior-preserving port of
WORDS 1.99.0 at commit `1f2f0fb0867a896d7b9284a03d615ed635d6f992`.
[Version 1.0.2](release-1.0.2.md) adds English passage lookup in the browser.
The [engine release manifest](legacy-release.json) still fixes all 28 engine,
data and adapter paths. The comparison profile is `upstream-tests-v1`.

## Engine qualification

| Check | Recorded result |
|---|---|
| Complete Latin replay | 4,144,877 inputs; 4,144,873 matching normal outputs |
| Native Latin errors | 2 matching failures: `pilarium`, `pilarivm` |
| Console comparator exclusions | 2: empty input and the `!` developer menu |
| Unexplained differences and regressions | 0 |
| English index and input probes | 24,000 matching observations, including 5 native failure outcomes |
| Boolean option combinations | 4,096 |
| Ordered sessions | 2,048 |
| Input and failure boundaries | 454 comparable sessions match; 2 single-lookup boundaries recorded separately |
| Original executable fixtures | 21 raw cases, including the five upstream regression groups |
| Expanded portable corpus | 3,953 frozen observations |

These are the final 1.0 engine results, retained by the immutable manifests and
fixtures. Application patch tests are described in their own release notes.
Matching failures are not successful lookups, and matching unknown results do not
measure dictionary coverage. Historical 0.2 differences were resolved before
stable 1.0; they are not current failures.

## Comparison contract

Reference comparisons remove terminal prompts and frame-edge/trailing whitespace
under the declared runner. They preserve internal blank lines, token order,
candidate multiplicity, morphology, meanings, flags, explanations and errors.
The 21 raw baseline fixtures separately retain exact stdout, stderr and process
state. Expected fixtures are not replaced by outputs of this port.

Browser macron adaptation, English passage batching, grouping and dictionary-frequency
ordering operate outside the legacy engine contract. Original text and structured data retain
engine results. See the [browser guide](browser-input.md), [API and CLI](api.md),
[build instructions](building.md) and [legacy contract](legacy-contract.md).

## Retained behavior and limits

- Dictionary content, linguistic judgments, native ranking, trimming and failures
  remain as inherited. No scholarly corrections are active.
- Each English engine call searches one ASCII word, without singular/plural normalization. More
  than 500 accepted English hits reproduces the native error; normal display is
  limited to six entries unless an API caller requests untrimmed results. The
  browser calls this unchanged engine separately for each word in a passage;
  an unknown word or native error does not prevent later words from being queried.
- The legacy engine splits non-ASCII input and retains native console chunking,
  line-atomic failures, buffer limits and exceptional-session behavior within the
  declared API profile. The browser separately adapts Latin macrons.
- Native terminal menus, file commands, local/special dictionary installation,
  host filesystem failures and resource exhaustion are outside the analysis API.
- Full classical-text corpus comparison, universal input equivalence and
  philological correctness are not established by these finite tests.

`npm run verify` checks source/data locks, the frozen backend and the portable
regression suite. The [1.0 release record](release-1.0.md) identifies its browser,
recovery, offline and migration coverage. Automated browser testing does not
claim physical-device installation testing.

## Reproduce the full wordlist comparison

With the pinned Ada reference and an immutable
[classical-lexical-test-data](https://github.com/classical-cat-dh-lab/classical-lexical-test-data)
release containing its manifest and four gzip lists:

```sh
node --max-old-space-size=8192 scripts/acceptance.mjs \
  --data /path/to/data --oracle /path/to/oracle --out /path/to/results --workers 6
```

The runner verifies input identities and preserves per-profile membership,
ordered output hashes, differences, failures and resumable checkpoints. Reuse
requires the same engine, input and runner identities. A zero process exit means
the run completed; its comparison counters determine the result.
