# Browser guide

Choose **Latin lookup** or **English lookup**, enter your text, and press
**Enter / Return** or **Look up**. **Shift + Enter / Return** inserts a newline.
All lookups run on your device; your text is not sent to a server.

## Latin lookup

Enter a word, phrase or passage. Macrons are ignored for lookup while your
original spelling, punctuation, spaces and line breaks remain visible.
Other diacritics, ligatures and spelling are not automatically normalized.

A passage opens in **Read text**. Select a word to see its entries below without
another query or a page jump. **Word list** shows the same results as an accordion;
opening a word closes the previous one. Switching views retains the selected word
and expanded list entry. A single-word result opens directly. Arrow keys, Home and
End operate the view tabs; Enter or Space operates words and summaries.

Principal parts appear above grammatical labels, meanings and **Possible forms**.
**Word details** contains source metadata. Repeated principal parts share a heading,
but distinct meanings and forms remain available. Grouping does not merge source
records. Unsupported characters or unprocessed text remain visible as plain text.

## English lookup

The working tree adds English passages to **Read text** and **Word list**, with
the same selection controls as Latin. This change is not yet released; published
version 1.0.1 searches only the first word of an English submission.

Each word is looked up separately in the original English gloss index. Spelling,
punctuation, line breaks and repeated occurrences remain visible. A word such as
`the` with no match displays **No matching dictionary entries**; it does not block
later words. A native error is also shown only for its affected word. This is word
lookup, not sentence translation. Apostrophes stay within a word; unsupported
spellings, including contractions and non-ASCII letters, show no match rather
than silently searching an ASCII prefix. Hyphens separate words.

Search uses the supplied spelling without singular/plural expansion. For example,
`dogs` and `dog` have different results; try the singular separately. Common words
such as `the` can have no match because this is a reverse index of Latin glosses,
not a complete English dictionary. Original ranking and the six-entry display
limit apply separately to each word. Engine 1.0.0 remains unchanged; the library
and CLI retain their original single-word input behavior. **Structured data**
contains an `english-passage-v1` wrapper with the submitted text, occurrence spans
and each unchanged engine result. **Original text** concatenates those outputs
in occurrence order.

## Display options

**Original WORDS order** restores source order instead of the browser's default
Latin dictionary-frequency order. **Original text**, **Structured data**,
**Lookup notes** and **Validation tools** reveal optional expandable panels.
These choices do not change the engine result. Technical panels are built only
when opened, and the controls reset when the page is reloaded.

[Abbreviations and terminology](abbreviations.md) explains the displayed notation.
**Back to top** returns focus to the title. **Night mode** saves a manual theme
choice in this browser and applies to the dictionary and help pages, including
offline. The default is light. If preference storage is unavailable, the theme
still works for the open page.

## Dictionary frequency order

Latin entries use dictionary frequency bands **A–F**, from very frequent to very
rare. Ties retain WORDS order. **X** (unspecified), **I** (inscriptions),
**M** (graffiti) and **N** (chiefly Pliny) follow ranked entries in their existing
order; they are not extra rarity bands. These are inherited dictionary labels,
not probabilities or contextual predictions.

Sorting stays within interpretation groups, keeps forms attached to their entries,
and preserves token order and repeated occurrences. English retains native ranking.
Original text and structured data always retain source order. No display option
restores results already trimmed by WORDS.

## Limits and recovery

Each submission accepts at most **2,000 words and 20,000 Unicode characters**.
Punctuation separates words; combining marks remain attached. Oversized input is
rejected before analysis, with your full text and previous results retained.
Split it into shorter passages. The library and CLI keep their own input rules.

**Clear input** clears text and results, focuses the input, and retains mode,
theme and display choices. **Stop analysis** cancels a running lookup or validation;
use **Reload dictionary** to start again. The same control recovers from a failed
analyzer. Initialization has a one-minute deadline.

The completion time measures Worker processing, excluding loading and page
rendering. On narrow touch screens a completed lookup dismisses the keyboard and
moves to the results. Online/offline status describes the browser connection;
lookup itself is always local.

## Offline use and browser requirements

[Offline help](offline-help.md) covers saving, installation, updates and recovery.
The footer opens it in a separate tab, keeping your current lookup and scroll
position. Help and license pages are included in the saved bundle; downloading
the complete source archive requires a connection.

Use a current browser with JavaScript modules and module Workers. Offline saving
also needs Service Workers, Cache Storage, IndexedDB and Web Crypto over HTTPS or
localhost. Private browsing or storage restrictions can disable saving. Browser
and responsive-layout tests do not establish physical-device installation results.

For exact ASCII input behavior, use the [library or CLI](api.md). The browser's
`latin-macrons-v1` adapter removes combining macrons after canonical decomposition
and spacing macrons U+00AF/U+02C9, retaining UTF-16 mappings to the original text.
The former **Latin (original input rules)** menu item is removed in 1.0.1; the
engine and its programmatic interfaces are unchanged.
