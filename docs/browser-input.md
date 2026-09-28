# Browser lookup and offline use

This guide describes the browser interface on the frozen legacy engine.

The default **Latin lookup** accepts a word, phrase or sentence. Press Enter or
Return to look it up; Shift + Enter / Return inserts a newline. A **Look up** button supports
touch input. Composition events do not submit unfinished input. On a narrow touch
screen, a completed lookup dismisses the input keyboard and moves to the results.
The **Clear input** button clears the input and lookup results, then focuses the
empty input. It sits beside **Look up** and retains the selected lookup mode and display options without
reloading the dictionary. Desktop keyboard focus stays in the input for repeated
queries. The completion status shows each lookup's Worker processing time in
milliseconds; it excludes dictionary loading, message transfer and page rendering.
Above Display options, **Online / Offline** reports the browser connection state;
**On-device lookup** identifies where analysis runs in either state. A network
connection indicator does not guarantee that the update server is reachable.

If the analyzer fails to load or stops unexpectedly, **Reload dictionary** starts
a fresh analyzer without reloading the page. **Stop analysis** cancels current
analysis and validation; reload the dictionary before another lookup. Dictionary
initialization has a one-minute deadline. Validation tools have their own status
line, so finishing validation does not replace a lookup's completion message.

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

**Latin (original input rules)**, the analysis library and CLI keep the original ASCII-byte
behavior, including macron splitting. This lets callers reproduce the reference
program. English lookup and the explicitly empty corrected layer do not activate
the browser adapter. This input convenience is not a linguistic correction.

## Reading meanings

A Latin passage opens in **Read text**. Select a
word in the text to show its entries immediately below; selecting another word
replaces that detail without another query, page reload or change of keyboard
focus. Spelling, whitespace, line breaks, punctuation and repeated occurrences
are retained. Only spans returned by WORDS are selectable; unsupported characters
and any unprocessed remainder stay visible as plain text.

The **Read text / Word list** tabs above the results show one view at a time.
The selected word appears in a labeled area below the passage; the complete word
list appears only in its own tab. Switching tabs retains the selected occurrence,
passage scroll position and expanded list word without another lookup. Arrow keys,
Home and End select tabs from the keyboard. The view choice survives Clear input
and resets to Read text on reload. A single word and English lookup show expanded
entries without tabs. Long passages scroll inside their text area.

The list starts collapsed. Each summary shows only the original word and its
principal parts. Identical principal-part headings appear once in that summary;
opening it retains every meaning, distinct form and explanation. Opening
another list word closes the previous one. Enter or Space operates focused words
and summaries.
Details are built when first opened. Structured data, original text and lookup
notes are also built only when their panels are opened; all returned information
remains available. This reduces initial page work for long passages.

Expanded entries present principal parts, fixed grammatical labels, English
meanings, then **Possible forms**. Additional source metadata stays under
**Word details**. Expanded entry headings are bold; list principal parts use
regular weight and an inset to distinguish them from the input word. **Back to top**
returns to the page title. The separate [abbreviations and terminology](abbreviations.md) page is
linked from the footer and included in the offline bundle.

Repeated principal parts share one heading within each interpretation group.
For example, `magnus` has three source meaning records: the reader keeps all
three as separate bullets and shows their identical grammatical forms once.
Equal headings do not establish that records are the same lexeme. Different
grammatical labels, metadata or meaning-to-form associations remain separate
within the group; affix and spelling explanations still delimit groups. Exact
duplicate meanings/forms share display space without changing the underlying
records. Original text and structured data retain the full engine output.

**Display options** contains the unchecked **Original WORDS order** switch and
unchecked-by-default controls for **Original text**,
**Structured data**, **Lookup notes** and **Validation tools**. These controls
also update the current results. Checking an information option reveals a closed panel;
select its heading to expand it. Unchecking hides and closes the panel. Lookup
notes appear in their own panel. Lookup failures remain visible even when their
technical diagnostics are hidden. The checkboxes reset when the page is reloaded.
Numbered reading labels use **1st decl**, **1st and 2nd decl**, **3rd conj**, and
the corresponding other ordinals. Expanded meanings remain available as hints.
This browser notation does not modify the frozen structured results or engine.

The original dictionary keeps closely related alternatives together with slashes
and separates broader meaning groups with semicolons. The reading view keeps
slash-separated alternatives inline and starts a new line after each semicolon,
retaining the original punctuation. Raw meanings and legacy output are unchanged.
This display does not assign new sense numbers or claim editorial correction.

## Dictionary frequency order

Latin lookup defaults to **Dictionary frequency**. Entries use the frequency
code of their dictionary record, not the frequency of an inflection rule:
**A** (very frequent), **B** (frequent), **C** (common), **D** (less frequent),
**E** (uncommon), then **F** (very rare). These are the original dictionary's
relative labels, not measured probabilities or a prediction about the sentence.
For example, `cornu` puts the A-rated *cornu* (horn) before the C-rated *cornus*
(cornel tree). The label beside each entry makes this ordering visible.

Ties preserve original WORDS order. Unspecified frequency (**X**) and special
evidence categories (**I**, inscriptions; **M**, graffiti; **N**, chiefly Pliny)
follow ranked entries in their existing order; they are not treated as lower
frequency bands. Explanatory rows delimit interpretation groups, so sorting never
moves an entry across an affix, compound or heuristic explanation. Form rows stay
attached to their entry. Sentence tokens and repeated occurrences keep their
input order; English lookup keeps its native ranking.

Check **Original WORDS order** inside **Display options** to order principal-parts
groups by their first source occurrence. Uncheck it to return to dictionary-frequency
ordering. Group order follows the first member in the selected ordering; each
member's frequency and source metadata stay attached to its meanings and forms.
Original text and structured data always retain source order regardless of this
control. The display does not restore candidates already trimmed by WORDS or
discard any returned alternative. See the
[pinned original frequency definitions](https://github.com/mk270/whitakers-words/blob/1f2f0fb0867a896d7b9284a03d615ed635d6f992/src/latin_utils/latin_utils-inflections_package.ads#L858-L881).

## Offline and mobile

**Save offline**, beside **Night mode**, downloads the complete application and dictionary, checks
every file and starts a fresh saved analyzer before declaring success. Only then
does the progress panel disappear and the same button become **Check for updates**.
The initial page needs no download panel; **Offline help** in the footer opens
the installation guidance and saved status. A newly verified version offers
**Reload with update**. Errors or progress remain visible when attention is needed.
A missing or incomplete cache restores the save/repair invitation.

An update check times out after 30 seconds. Downloads may take longer than three
minutes while data continues arriving; three minutes without progress cancels the
job. Failed or cancelled jobs discard their incomplete files before a retry.
An optional persistent-storage permission request does not delay saving.

On iPhone or iPad, Safari's Share menu provides Add to Home Screen. Open the saved
Home Screen app and save its dictionary there as well; an installed icon alone
is not evidence that all resources are cached. Clearing site data removes the
saved dictionary and theme preference. The interface supports safe-area
insets, keyboard input and touch controls without page-wide horizontal scrolling.

All lookups run on the device. Hosting serves application/data files; the offline
bundle reduces repeated transfers. Entered text is not sent to the host.

## Appearance and documentation

The default is light mode, independently of the operating system. **Night mode**
switches the theme manually; IndexedDB saves the choice on this browser/device.
The same setting applies to the dictionary and its documentation, survives a
restart, and works offline. If browser storage is unavailable, the switch still
works for the open page and explains that the choice could not be saved.
The preference is read before showing page content to avoid a light flash when
night mode was saved. A blocked preference read falls back within 1.5 seconds.
IndexedDB remains the only preference store.

The 0.3.3 night palette uses charcoal surfaces, softened chalk text, muted
ochre headings and dark green-earth controls. It is designed for low-light reading;
adjust the device's screen brightness to the room as well. Light mode is unchanged.

Footer links open formatted HTML pages with return navigation. These documents,
including the original WORDS notice and full AGPL license, are included in the
saved offline bundle. The source introduction page offers the complete source
archive as an explicit download; that archive requires a connection.

## Stable pages and offline updates

Bookmark [the dictionary](https://words.latingreek.org/) or any help page directly.
Page addresses remain the same across releases; older versioned page links redirect
to the corresponding permanent page. Each loaded page uses its own immutable
application and dictionary resources.

After **Save offline**, the header offers **Check for updates**. It reads the
latest release manifest and checks the saved files. An intact current version
shows **Up to date** without downloading any runtime files. A newer bundle found
on opening, refocusing, reconnecting or a manual check changes the action to
**Download update**. A manual check never starts a new-version download by itself.
Unchanged dictionary, engine and font files are reused only after length and
SHA-256 verification. Missing or damaged files are downloaded again. During the
first upgrade from an older release, its older download implementation still
applies; reuse begins once the 0.3.2 offline worker is installed. Every file is checked and a sample analysis is
run before **Reload** becomes available. Your current input and results remain
until you choose to reload. A failed or cancelled download preserves the complete
saved version; already open tabs continue using their own resources.

Obsolete application caches are reclaimed after downloads and update checks.
The selected release, its previous release, a pending candidate and releases
needed by open tabs are retained. Cleanup waits when an older or sleeping tab
cannot identify its release. Close old tabs and revisit the app to allow cleanup.
Queries do not add results to the offline cache. File integrity is checked again
when the saved installation is inspected or used for navigation.

## Browser support

Use a maintained Chrome, Safari, Firefox or Edge browser. The interface targets
desktop and laptop computers, phones and tablets on macOS, Windows, iOS/iPadOS
and Android. Responsive layouts and browser-engine tests do not substitute for
testing each operating system and installed-app environment.

Basic lookup needs JavaScript modules, module Workers and current JavaScript
collection/string APIs. Offline use additionally needs Service Workers, Cache
Storage, IndexedDB and Web Crypto in a secure context. Private modes or browser
storage restrictions may disable offline saving while online lookup still works.
Older browsers are supported where these capabilities are available; obsolete
browsers lacking module Workers cannot run the analyzer. Updating the browser is
recommended when dictionary loading fails repeatedly. Back to top uses ordinary
coordinate scrolling without requiring a newer scroll-behavior value.

The app installs only when you choose to use your browser's installation feature.
Clearing site data removes the offline installation. The browser may reclaim
storage when space is low; reconnect and save again if the app reports missing files.
