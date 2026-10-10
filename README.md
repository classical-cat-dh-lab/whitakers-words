# Whitaker's Words — TypeScript preservation

**Application 1.0.3 · Engine 1.0.0 · Stable** —
[Open the dictionary](https://words.latingreek.org/).

An independent preservation of William Whitaker's WORDS in TypeScript compiled
to JavaScript ESM. Latin morphology and English gloss lookup run entirely on your
device, through a browser dictionary, library or CLI. There is no query server.

The browser accepts Latin and English words and passages, retains your spelling,
and lets you select individual words to inspect their entries. English lookup
does not expand singular/plural forms. Choose **Save offline** before
disconnecting. [Browser guide](docs/browser-input.md) ·
[Offline help](docs/offline-help.md) · [Terminology](docs/abbreviations.md).

[Version 1.0.3](docs/release-1.0.3.md) identifies the target application version
in update notices and reload controls. English passages retain the same clickable
reading and word-list views as Latin, with independent results for each word.
It retains the frozen **1.0.0 engine** and data. The upstream reference is
**WORDS 1.99.0**, commit `1f2f0fb0867a896d7b9284a03d615ed635d6f992` of
[mk270/whitakers-words](https://github.com/mk270/whitakers-words).
Original scholarly content and native errors remain preserved.

## Run locally

With Node.js 22 or later:

```sh
npm run verify
node cli/main.mjs --legacy rem acu tetigisti
node cli/main.mjs --english wild
npm run site
npm run preview
```

Open `http://127.0.0.1:4173/`. Builds and tests work offline using vendored
TypeScript 6.0.3 and hash-checked data; no `npm install` is required. Deploy the
generated `site/` directory over HTTPS. For source development, `npm run serve`
opens the dictionary at `http://127.0.0.1:4173/browser/`.

[GitHub 1.0.3](https://github.com/classical-cat-dh-lab/whitakers-words/releases/tag/v1.0.3)
provides complete source, the ready-to-host site, a manifest and checksums.
No npm package is published. The
[Zenodo 1.0.0 archive](https://zenodo.org/records/23020269) preserves the engine
milestone; this application patch has no new DOI.

## Engineering documentation

- [API and CLI](docs/api.md): types, spans, profiles, provenance and errors.
- [Build and reproduction](docs/building.md): portable build and optional Ada reference.
- [Architecture](docs/architecture.md): modules, data and offline resources.
- [Compatibility](docs/compatibility.md): final qualification and known limitations.
- [Engine manifest](docs/legacy-release.json): frozen source/data hashes.

## Attribution and licenses

William Whitaker created WORDS and its dictionary. Preserved source, data and
adapted algorithms retain [Whitaker's notice](licenses/whitaker.txt). The original
source archive is included in `vendor/legacy/`.

This project's TypeScript implementation and tooling are © 2026 Xinjie Fang /
Classical Cat Digital Humanities Lab, licensed under [AGPL-3.0-only](LICENSE).
Original project documentation is [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/).
TypeScript retains its [license](licenses/typescript.txt) and
[third-party notices](licenses/typescript-third-party.txt); fonts retain the notices
in `browser/resources/design-system/2.3.0/fonts/licenses/`.
[CITATION.cff](CITATION.cff) identifies the current application release.
