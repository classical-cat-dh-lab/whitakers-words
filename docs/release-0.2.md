# 0.2.0-alpha.1

- Latin browser lookup accepts precomposed and decomposed macrons without splitting
  words. Original spelling remains visible; the legacy engine/API/CLI are unchanged.
- Saved offline installations show a compact Update control. Download progress,
  failures, incomplete cache repair and explicit update activation remain available.
- Enter / Return submits a lookup; Shift+Enter inserts a newline. The empty input
  gives a useful prompt, and composition input is protected from premature submit.
- Phone and tablet layouts retain readable input, touch targets, wrapping and safe
  areas in light and dark mode. iPhone/iPad installation guidance is included.
- Slash-separated meaning alternatives render on separate lines in the reading
  view. Raw dictionary meanings and legacy output remain preserved.
- A resumable, fixed-package Ada/TypeScript acceptance runner accounts for all four
  published lexical input profiles and browser-normalized lookup strings. See
  [acceptance results and limits](acceptance.md); the old passing fixtures do not
  imply universal compatibility.
- The corresponding source archive includes the reference toolchain lock required
  to reproduce the optional Ada build.

Local verification covers the frozen Ada baseline, 18 product test groups, eight
browser structured-result fixtures, Chromium/WebKit offline lifecycle checks,
phone/tablet viewport and touch emulation, and upgrade from the archived 0.1 bundle.
Physical iOS installation and full classical-author prose remain outside these
checks. This is experimental preservation software; no corrected linguistic layer
has been activated.
