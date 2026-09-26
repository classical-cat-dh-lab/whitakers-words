# Frozen backend baseline — 0.3 beta

The backend baseline is `words-0.3.0-beta.1`. Its source and data hashes are recorded
in the [machine-readable manifest](backend-baseline.json). The signed release tag
`v0.3.0-beta.1` fixes the complete product tree and archive contents.

The qualified implementation comes from signed commit
`18250decd9a28e0a385f9afa330c6b205defb4bb`. Release preparation changes only the
backend version constant; matching, parsing, formatting, diagnostics and data
remain byte-identical to the fully tested checkpoint. The manifest records both
the qualification identities and release source hashes.

`npm run verify` checks the frozen source/data/adapter hashes and then runs the
regression suite. The release qualified 36 groups; later frontend tests extend
that suite without changing the frozen backend. A backend change requires a new reviewed baseline and
appropriate comparison against this release; do not rewrite this immutable tag
or its published archives. Frontend work may continue independently. In the 0.3.1 frontend release, the
application/package version is `0.3.1-beta.1`; the frozen engine continues to
report `0.3.0-beta.1`. The website manifest records both identities.

The measured counts and exceptions are in [backend acceptance](acceptance.md).
The reference is WORDS 1.99.0, snapshot `words-mk270-1f2f0fb`, from commit
`1f2f0fb0867a896d7b9284a03d615ed635d6f992`. The portable fixtures include the full
English observations, source-selected option sessions and native boundary states.
The fixed-wordlist corpus and reproduction route are identified in the acceptance
report. The original source archive and licenses remain bundled.

Classical-text corpus acquisition and processing are deferred. This baseline
provides a fixed comparator for that later work; its beta label does not expand
the measured compatibility claim.
