# Whitaker's Words — TypeScript preservation

**0.3.0-beta.1 · Beta** — [Open the dictionary](https://words.latingreek.org/).

The [0.3 beta release](docs/release-0.3.md) restores the original Ada execution
behavior and freezes the verified backend baseline. It includes the accepted
0.2.1 browser interface, offline use and saved night mode.

The current source includes a frontend preview on that frozen backend: compact
header controls, single-word reading, collapsed passage results and optional
technical output. This preview has not replaced the published beta.

A preservation of William Whitaker's WORDS in TypeScript, compiled to JavaScript
ESM: Latin analysis, English gloss lookup, a structured API, a CLI and a small
browser application with dictionary notation for students. Analysis runs entirely
on the user's device. There is no runtime service or database server.

Choose **Save offline** in the preview to download and verify the complete
dictionary and application. It then works without a connection. App installation
is optional; clearing the website's data removes its saved offline files. After
saving, the download panel becomes a compact Update control. Enter a word, phrase
or sentence and press Enter / Return; macrons are ignored for lookup while your
original spelling remains visible. [Browser and mobile guide](docs/browser-input.md).

The complete 4,144,877-query Latin replay retains 4,144,873 matching normal
outputs, reproduces two original native errors, and keeps two comparator limits
separate. All 24,000 English observations match, along with ten native capacity
states and 512 Latin option sessions. There are no unexplained differences or
regressions in these tests. See [backend acceptance](docs/acceptance.md).

Beta marks preliminary engineering reliability. Full classical-text corpus
comparison and broad stress testing remain pending; these measurements do not
establish universal equivalence or linguistic correctness. The
[backend baseline](docs/backend-baseline.md) is frozen for later corpus work.

The canonical reference is **WORDS 1.99.0**, commit
`1f2f0fb0867a896d7b9284a03d615ed635d6f992` of
[mk270/whitakers-words](https://github.com/mk270/whitakers-words).
This is an independent preservation project, separate from designing a new Latin
analyzer. The legacy profile targets original behavior, including linguistic
errors and quirks; [tested behavior and remaining limits](docs/acceptance.md) are
recorded explicitly. The corrected layer is empty.

Archived release: [0.3.0-beta.1 — DOI: 10.5281/zenodo.22970444](https://doi.org/10.5281/zenodo.22970444).
The archive preserves the exact release files; citation metadata is also available
in [CITATION.cff](CITATION.cff).

## Run locally

With Node.js 22 or later (verified locally on 26.7.0):

```sh
npm run verify
node cli/main.mjs --legacy rem acu tetigisti
node cli/main.mjs amatus est
node cli/main.mjs --english wild
npm run serve
```

Open `http://127.0.0.1:4173/browser/` for the validation harness. Build and tests
work offline: TypeScript 6.0.3 and all runtime data are vendored and hash-checked.
No `npm install` is required. Use `npm run site` then `npm run preview` to build
and preview the offline website. Serve `site/` over HTTPS (or localhost); opening
files directly does not support modules or Service Workers. Download the frozen
source and ready-to-host website from the
[0.3.0-beta.1 release](https://github.com/classical-cat-dh-lab/whitakers-words/releases/tag/v0.3.0-beta.1).
No npm package is published.

## Verification and documentation

- [Full fixed-wordlist acceptance](docs/acceptance.md): reproducible Ada/TypeScript
  comparison, complete 0.3 counts and historical 0.2 results.
- [API and CLI](docs/api.md): result types, spans, provenance, options and errors.
- [Student abbreviations](docs/abbreviations.md): the implemented, reviewable
  terminology table, also available inside the browser page.
- [Compatibility report](docs/compatibility.md): full wordlist, English and boundary qualification;
  all 21 legacy cases, including the five original upstream groups and 751 input
  fragments; browser parity and explicit qualification limits.
- [Build and data reproduction](docs/building.md): portable ESM build and optional
  independent Ada reference rebuild.
- [Legacy contract](docs/legacy-contract.md) and [corrected layers](deviations/README.md).
- [Architecture](docs/architecture.md); historical local measurements in
  [performance.json](docs/performance.json) are not full-corpus benchmarks.
- [Original baseline](docs/baseline.md): raw executable observations and provenance.

## Attribution and licenses

William Whitaker created WORDS and its dictionary. The preserved source, data and
adapted algorithms retain [Whitaker's notice](licenses/whitaker.txt). The full
unmodified source archive is in `vendor/legacy/`. Original implementation and
tooling are licensed under [AGPL-3.0-only](LICENSE); original documentation is
licensed under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/).
TypeScript retains its [license](licenses/typescript.txt) and
[third-party notices](licenses/typescript-third-party.txt). Browser fonts retain
the notices in `browser/resources/design-system/2.3.0/fonts/licenses/`.
See [CITATION.cff](CITATION.cff) for project citation metadata. No official successor
status or new scholarly authority is asserted.
