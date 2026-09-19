# Whitaker's Words — TypeScript preservation

A working preservation/resurrection of William Whitaker's WORDS in TypeScript,
compiled to JavaScript ESM. The first-stage implementation provides a Latin
analysis library, a structured API, English gloss lookup, a CLI and a small
browser validation harness. It has no runtime dependencies or external services.
The browser presents compact dictionary notation for Latin students, with
expandable original output and structured results.

The canonical reference is **WORDS 1.99.0**, commit
`1f2f0fb0867a896d7b9284a03d615ed635d6f992` of
[mk270/whitakers-words](https://github.com/mk270/whitakers-words).
This is an independent preservation project, separate from designing a new Latin
analyzer. Original linguistic errors and observed quirks remain legacy behavior.
The explicit corrected layer is initially empty.

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
No `npm install` is required. This is a local development candidate; no package
or public release has been published.

## Verification and documentation

- [API and CLI](docs/api.md): result types, spans, provenance, options and errors.
- [Student abbreviations](docs/abbreviations.md): the implemented, reviewable
  terminology table, also available inside the browser page.
- [Compatibility report](docs/compatibility.md): 3,953 frozen reference inputs;
  all 21 legacy cases, including the five original upstream groups and 751 input
  fragments; browser parity and explicit qualification limits.
- [Build and data reproduction](docs/building.md): portable ESM build and optional
  independent Ada reference rebuild.
- [Legacy contract](docs/legacy-contract.md) and [corrected layers](deviations/README.md).
- [Architecture](docs/architecture.md) and [measured performance](docs/performance.json).
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
