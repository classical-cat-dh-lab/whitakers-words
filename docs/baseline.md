# Executable Behavioral Baseline

Canonical source: `words-mk270-1f2f0fb`. Behavioral profile:
`upstream-tests-v1`. The executable banner reports WORDS Version 1.99.0; this
snapshot is the maintained lineage, not the historical 1.97FC distribution.

[The manifest](../tests/legacy/manifest.json) records the build, exact developer
profile, absence of a user mode file, locale, process model and individual file
hashes. Every case retains its exact input bytes, stdout and stderr, plus exit
status and timeout state. Runs use a fresh process and isolated runtime directory.
Multi-line/order probes exercise state within a single process.

## Coverage

- Five original regression groups: `05_multusque`, `10_aeneid`, `20_ius`,
  `30_qualdupes` and `40_english`. All match the original expected outputs under
  the pinned upstream comparison rules.
- Sixteen additional cases: smoke phrase, ambiguity, enclitics, syncope,
  orthographic variants, compounds, Roman numerals, unknown input, precomposed
  macron, decomposed macron, mixed script, empty input, punctuation, two batch-order
  variants and a 2,501-character input.
- The 21 raw observations reproduce byte for byte on replay and after a second
  independent-directory build. They establish an
  executable starting baseline, not exhaustive language/rule coverage or a claim
  that a TypeScript engine is already compatible.

## Preserved observations

Under this legacy profile, UTF-8 `amāre` is treated as separate ASCII fragments
`am` and `re`; the former is unknown and the latter receives analyses of `res`.
The decomposed spelling has different legacy tokenization. A 2,501-character
line is consumed in multiple chunks by the console reader. These behaviors are
captured as legacy observations, not normalized away by the harness.

No linguistic corrections have been enabled. Any future diacritic-aware lookup,
changed tokenization or morphological repair must declare its corrected-layer
deviation, evidence and tests while retaining these legacy observations.

## Remaining qualification

The TypeScript engine must be tested against this executable and an expanded
per-token corpus. Broad paradigm coverage, every fallback interaction, arbitrary
interactive mode changes, custom dictionaries and cross-platform behavior remain
outside this first baseline's measured coverage. This corpus is intended to grow
by adding observations; existing expected legacy behavior is not silently edited.
