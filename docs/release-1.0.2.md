# Version 1.0.2 — English passage lookup

English text now uses the same **Read text** and **Word list** views as Latin.
Select a word in the displayed passage to see its dictionary entries. Original
spelling, punctuation, line breaks and repeated occurrences remain visible.

- Each English word is queried separately. A first word with no match, such as
  `the` in `the queen`, no longer prevents the remaining words from being queried.
- No-match results and original WORDS errors are shown for their affected word;
  other words retain their results. Keyboard selection and view switching work
  in both languages, including when saved offline.
- English prompts now accept a word, phrase or sentence. The existing 2,000-word
  and 20,000-character input limits remain in place.

Application **1.0.2** retains frozen **engine 1.0.0**, all 28 locked backend paths,
dictionary data, native per-word ranking, six-entry trimming, API and CLI behavior.
English singular/plural normalization is not included. The
[browser guide](browser-input.md#english-lookup) describes spelling support and
the browser-only `english-passage-v1` structured wrapper.

Verification includes 62 portable tests, the frozen backend guard, Chromium and
WebKit passage/list interaction, unknown/error isolation, input boundaries, all
8 raw browser validation cases, saved offline cold restart and upgrade from
1.0.1. The complete source reproduces the runtime and source archive byte-for-byte.
Automated checks do not claim physical-device installation testing.

This application patch is distributed through
[GitHub](https://github.com/classical-cat-dh-lab/whitakers-words/releases/tag/v1.0.2)
and the website. No new Zenodo archive is requested; the
[1.0.0 archive](https://zenodo.org/records/23020269) remains the preserved engine
milestone. [Citation metadata](../CITATION.cff) identifies this patch's artifacts.
