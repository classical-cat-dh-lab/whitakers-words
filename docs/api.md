# API and CLI

Build with `npm run build`. All runtime imports are JavaScript ESM; declarations
are emitted beside them. The following example runs from this repository:

```js
import { createNodeAnalyzer } from './node/index.mjs';
const words = await createNodeAnalyzer();
const result = words.analyze('amatus est');
console.log(result.tokens[0].parses.map(parse => parse.morphology));
console.log(words.lookupEnglish('wild').hits);
```

Browser or custom-transport callers use `createAnalyzer(source)` from
`dist/index.js`. Supply the UTF-8 contents of `dictionary`, `inflections`, `addons`,
`uniques`, `dictionaryForms` and `englishIndex`; the loader verifies all six
canonical SHA-256 values. See `browser/worker.mjs` for the concrete same-origin
adapter. Internal ingestion/matching modules are not a supported consumer API.

## Analysis schema 1

`analyze(input, options?)` returns engine/snapshot/profile identity, full data
commit and archive/table hashes, unchanged input, effective options, status,
diagnostics, ordered tokens, legacy text and applied deviation IDs.

Each token contains its exact `surface`, lookup form, UTF-16 half-open `span`
(`input.slice(start, end) === surface`), analysis/unknown status, ordered parse
records, trimming state and whether it consumed the following token. Compounds
span both words and their intervening original text. NFC and NFD are preserved,
not silently normalized. Non-ASCII bytes split ASCII fragments under the legacy
profile; a diagnostic explains that treatment. Long lines are consumed in the
reference's successive 2,500-byte chunks, with a diagnostic. No characters are
silently cut off by an API size limit; `truncated` is false for completed calls.
Within one call, two consecutive empty or space-only native reads end the input
session. A full 2,500-byte read leaves its terminating newline for the next read.
If this leaves nonblank input unread, `truncated` is true and `legacyStop` records
`reason: blank-input` and the UTF-16 offset of the unread remainder. Independent
calls start new sessions. Console commands are not executed.

Parse records include explanatory affix/trick nodes as well as lexical analyses:

- `dictionary`: `GEN`, `UNI`, `ADDONS` or the native synthetic categories.
- `entry`: native ID, one-based source line, stems, raw part codes, metadata,
  original meaning and citation form. `sourceLine: null` identifies synthetic
  material, including compiler-added `sum`.
- `rule`: original rule ID/source line, matched ending and resolved legacy quality.
  The resolved quality can differ from the original wildcard rule; the original
  line remains available in the pinned text data.
- `morphology`: the `NativeMorphology` discriminated union, with POS-specific named
  features. `X` remains the original wildcard/unknown code; absent features are
  inapplicable. There is no invented probability or linguistic certainty score.
- `traces`: explicit affix, syncope, trick, split, numeral or compound evidence.
  Explanatory rows remain ordered with the candidates, as in WORDS.

The top-level status is `analyzed`, `unknown`, `partial`, `empty`,
`unsupported-input`, or `legacy-error`. A modeled native analysis failure returns
`legacy-error`, `truncated: true`, and `legacyFailure` with its stage, word,
one-based native analysis-line number and native exit code (0). This line number
counts nonblank reads passed to analysis, including separate long-line chunks.
The result retains previously completed lines and the original diagnostic text.
No ordinary result from the failing line is emitted; its failed token contains
no parses. Later words and lines in that call are not processed. The native
program catches this failure at its outer input handler, writes to stdout, and
returns successfully; a zero process exit code alone does not imply an analysis
succeeded. Subsequent independent API calls remain usable.

Malformed data/checksum failures reject initialization; invalid arguments/options
and unmodeled host/programming errors still throw. The CLI reports those on stderr
with exit code 1; the Worker reports an error message.

Options are strict booleans matching the exposed legacy controls in
`DEFAULT_OPTIONS`. Any nondefault value labels the result `profile: custom`.
The frozen compatibility claim applies to `upstream-tests-v1`; custom combinations
need their own qualification. `ignoreUnknownCaps` is retained as an inert flag
where the selected source has disabled its original handling.

## English and corrected layers

`lookupEnglish(input, partOfSpeech = 'X', trim = true)` uses the first ASCII word,
applies the native `QV`/`qv` to `QU`/`qu` conversion, then limits the lookup to
24 characters. Input without an ASCII word produces no legacy output. It returns entry/index
provenance, total hit count, visible hits and legacy text. Default trimming shows
the first six hits in original rank/frequency/semicolon order. POS filtering and
untrimmed output are custom profiles. On the attempted 501st accepted hit, the
native 500-slot buffer fails before sorting or displaying any hit. The result
returns `status: legacy-error`, `truncated: true`, `totalHits: 501` (the attempted
count), `trimmed: false`, no hits, and the original three diagnostic lines in
`diagnostics` and `legacyText`. `legacyFailure` records `stage: english-search`
and `exitCode: 0`. CLI and JSONL termination follow the same failure contract as
Latin analysis. A later independent call remains usable.

`applyCorrectedLayer(legacy, selectedDeviations = [])` returns separate `legacy`
and `corrected` values plus the selected layer ID. Currently the registry is empty:
the two values are equal and independently copied; nonempty selections are
rejected. See [deviation requirements](../deviations/README.md).

## Student reading view

`presentAnalysis(result)` accepts an `Analysis` or `EnglishResult` and returns a
separate `ReaderResult` with `version: student-v1`. Import it and `ABBREVIATIONS`
from `dist/index.js`. The function is deterministic and has no DOM dependency;
the browser renderer is a separate adapter.

```js
import { presentAnalysis } from './dist/index.js';
const reading = presentAnalysis(words.analyze('tetigisti'));
// tango, tangere, tetigi, tactus — verb · third conj.
// perf. act. indic. 2nd sg.
```

The view contains ordered tokens, dictionary entries, form lines, explanatory
items and expandable details. Every item retains `sourceIndices` into that token's
original `parses` array (or the English `hits` array); each form also retains its
`sourceIndex`. Only consecutive records for the same entry and part of speech are
grouped. Compound form rows remain attached to their preceding participle or
supine. Grouping does not discard or reorder the original alternatives.

Each display term supplies `text`, `full`, `category` and an identifier. The shared
registry drives display hints; the browser projects compact numeric ordinals
through `browser/notation.mjs`, also used for its [review table](abbreviations.md).
Inflection codes become contextual descriptions, such as `fourth conj.` or
`irregular: sum-type`; unknown fields are written out. English lookup retains
dictionary gender, comparison and governed-case labels without inventing form
analyses. Original gloss prose remains inherited text.

This layer changes presentation only. It leaves schema 1, native codes, candidate
identity, the legacy formatter and corrected-layer selection unchanged. Pass
`correctedResult.corrected` explicitly to display an independently selected
corrected result. Unsupported future code values throw instead of guessing a
student-facing interpretation.

The browser adds a separate [reading-order control](browser-input.md#dictionary-frequency-order).
Its default dictionary-frequency order is a presentation choice; `presentAnalysis`,
the API, CLI, original text and structured browser output retain their original
order. Browser labels such as `3rd conj` likewise do not change this API's
`third conj.` term or the immutable `student-v1` result contract.

## CLI

```sh
node cli/main.mjs --legacy rem acu tetigisti
node cli/main.mjs amatus est
node cli/main.mjs --english wild
node cli/main.mjs --corrected amāre
node cli/main.mjs --jsonl < input.txt
```

Default output is structured JSON. With no text arguments, UTF-8 stdin is read
to EOF. `--jsonl` produces one result per input line and stops after a
`legacy-error` record, including in corrected mode. These are independent lookup
records, rather than one native console session across records. `--legacy` emits analysis
text without the old interactive menus, banner or command interpreter. It does
not execute file, shell or configuration commands from input text. `--help` and
`--version` do not load data. For modeled native failures, `--legacy` writes the
original diagnostic body to stdout with empty stderr and exit code 0; JSON modes
return the explicit failure status with the same process outcome.
