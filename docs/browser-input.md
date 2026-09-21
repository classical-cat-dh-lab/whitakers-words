# Browser lookup and offline use

The default **Latin lookup** accepts a word, phrase or sentence. Press Enter or
Return to look it up; Shift+Enter inserts a newline. A **Look up** button supports
touch input. Composition events do not submit unfinished input.

## Macron adaptation

The browser Worker applies `latin-macrons-v1` before calling the unchanged legacy
engine. It removes combining macrons (U+0304) after canonical decomposition and
spacing macrons U+00AF/U+02C9. This handles both precomposed `amāre` and decomposed
`ama` + combining macron + `re`, including uppercase vowels and y. Other marks,
ligatures, spelling and letter case are not folded. Punctuation and whitespace
remain available to the legacy tokenizer; sentences need no manual cleaning.

The input box is never rewritten. The reading view maps lookup spans back to
original character clusters, so result headings retain supplied macrons. The
structured browser result includes the named adapter, original input, lookup input
and UTF-16 span mapping alongside the unchanged engine result. Engine spans and
legacy output refer to the lookup input, not the original marked text.

**Exact legacy input**, the analysis library and CLI keep the original ASCII-byte
behavior, including macron splitting. This lets callers reproduce the reference
program. English lookup and the explicitly empty corrected layer do not activate
the browser adapter. This input convenience is not a linguistic correction.

## Reading meanings

The original dictionary uses slashes between alternatives within its meanings.
The reading view puts those alternatives on separate lines. It preserves their
order and words; raw meanings and legacy output retain the original punctuation.
This display does not assign new sense numbers or claim editorial correction.

## Offline and mobile

**Save for offline use** downloads the complete application and dictionary, checks
every file and starts a fresh saved analyzer before declaring success. Only then
does the download panel collapse to **Update**. A newly verified version offers
**Reload with update**. Errors or progress remain visible when attention is needed.
A missing or incomplete cache restores the save/repair invitation.

On iPhone or iPad, Safari's Share menu provides Add to Home Screen. Open the saved
Home Screen app and save its dictionary there as well; an installed icon alone
is not evidence that all resources are cached. Clearing site data removes the
saved dictionary. The interface supports system light/dark themes, safe-area
insets, keyboard input and touch controls without page-wide horizontal scrolling.

All lookups run on the device. Hosting serves application/data files; the offline
bundle reduces repeated transfers. Entered text is not sent to the host.
