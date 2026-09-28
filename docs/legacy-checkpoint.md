# Final legacy engine checkpoint

The unreleased backend checkpoint is `words-legacy-1.0.0-rc.1`, qualified on
2026-09-28. The application release remains 0.3.3 beta; this checkpoint prepares
the final frontend iteration and eventual v1.0 release. It is not a published v1.0.
The [checkpoint manifest](legacy-checkpoint.json) fixes the source/data/adapter
hashes and the predecessor manifest. The original
[0.3.0 baseline](backend-baseline.md), signed tag and archives remain immutable.

## Result and repair

Within the declared analysis-engine contract, the final replay and source-led
checks have no unexplained differences or regressions. One remaining port defect
was repaired: English lookup now follows Ada's `String_Before_Dash` before finding
its first word. ` -- make`, `123 -- make` and `... -- make` produce no lookup;
`-- make` still raises the native English capacity failure because column-one
double dashes are not stripped by this Ada snapshot. No dictionary, linguistic
rule or intentional correction to Ada was introduced.

Only `src/english.ts` and the engine version constant differ among the original
28 frozen paths. The new engine reports `1.0.0-rc.1` to distinguish its behavior
from the published beta. Browser validation hashes include that identity; the
frontend interaction and display remain those of the accepted beta.

| Qualification | Result |
|---|---|
| Complete frozen Latin observations | 4,144,877 inputs: 4,144,873 normal matches, two reproduced native errors, two original console-comparator exclusions; zero differences or regressions |
| Fresh English index and POS/trim probes | 24,000/24,000 matches, including five native failure observations |
| Fresh input/session boundaries | 454/454 comparable cases match, including 123 native failures; two further English transport-boundary probes recorded separately |
| All combinations of the 12 exposed booleans | 4,096/4,096 source-selected stress sessions match |
| Seeded forward/reverse sequences | 2,048/2,048 sessions match |
| Independent generated stores | 39,336 citation rows, 149,326 English index rows and 62,084 ordered stems match; 26 trick tables / 117 rows agree with the source |

The new session checks use both independent native builds with each build's own
generated runtime data and require their stdout, stderr and exit status to agree.
The complete Latin run reuses immutable per-query native observations; it is not
a fresh native execution of every one of the 4.1 million inputs. Fresh selected
native controls and the new session suites check the retained reference.
Historical capacity fixtures and the existing original regression groups remain
part of the portable suite. Matching a native error is recorded as failure parity,
not a successful lexical analysis.

## Exact scope

The target remains WORDS 1.99.0 at snapshot `words-mk270-1f2f0fb`, with its fixed
data and `upstream-tests-v1` configuration. Nondefault option combinations have
the bounded additional coverage above, not an exhaustive input proof.

The comparison removes console framing, line-tail whitespace/CR and outer
whitespace; it preserves internal blank lines, candidate order/multiplicity,
meanings, features, explanations, unknowns, trimming and failure/session behavior.
It does not claim byte-for-byte identity with an entire terminal transcript.
Original raw observations remain available; the two wordlist exception bodies
also have exact CLI stdout/stderr/exit-status checks.

The new library/CLI omits native menus, console commands, file redirection,
argument modes, mutable native configuration, custom/local/special dictionaries
and host resource/I/O failures. English POS is an explicit API argument and each
call is one lookup; a native console may make multiple 2,500-byte reads for a
long string. Two such probes are classified as that existing transport boundary,
not silently counted as engine matches. See [API and CLI](api.md).

The browser has an explicitly separate macron-input adapter and display ordering.
Those are not claims about raw native input or output. Full classical-author
corpus processing and cross-platform Ada equivalence remain unqualified. This is
a qualified preservation completion checkpoint, not a formal proof over all
possible inputs or a certification of inherited scholarship.

`npm run verify` checks the new frozen hashes, the unchanged historical manifest,
the added 6,600-case session fixture (including its declared boundaries), and the
existing regression suite. Intentional engineering or scholarly changes belong
to a separately identified future profile; they must not rewrite this comparator.
