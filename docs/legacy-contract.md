# Canonical Legacy Contract

This is a preservation of Whitaker's WORDS. Its scope is distinct from designing
a new Latin analyzer. TypeScript is compiled to JavaScript ESM; legacy behavior
is defined by a fixed executable reference, not by expectations about Latin.

## Snapshot identity

`words-mk270-1f2f0fb` is the canonical legacy source snapshot. The exact upstream
commit is `1f2f0fb0867a896d7b9284a03d615ed635d6f992` from
[mk270/whitakers-words](https://github.com/mk270/whitakers-words).
[legacy.lock.json](../legacy.lock.json) locks its source archive and original data
hashes. The archive contains the complete source tree and upstream license notice.
Historical releases and other ports do not supply substitute data or expected
results for this snapshot.

An executable baseline additionally identifies compiler, build options, platform,
configuration files and process invocation. Those factors are part of a measured
behavior profile; source identity alone is insufficient.

## What compatibility preserves

Preserve the reference's admitted candidates, ordering, metadata, fallback order,
trimming, input treatment, compound handling and errors within the qualified
profile. Original linguistic errors remain legacy behavior. Repeated-call or
batch-order effects are observations to reproduce or explicitly delimit, not
opportunities for silent correction.

Keep raw input and raw executable output in fixtures. A comparison may have a
declared normalized view, but must retain ordering, multiplicity, token boundaries
and error states. Never use a global set of output lines as a conformance claim.
Distinguish startup/terminal protocol from linguistic results explicitly.

The first delivery includes an analysis library, structured API, CLI and minimal
browser validation harness. A complete dictionary UI is outside that delivery.

## Corrected layer

The legacy result is immutable input to a separately selected corrected layer.
No linguistic corrections are enabled by default. Each correction must declare:

- a stable deviation ID and layer version;
- affected source rows, rules or behavior, and applicable inputs;
- the legacy observation and proposed corrected behavior;
- evidence and the status of its adjudication;
- tests covering the change and unaffected behavior.

Results from a corrected layer retain the original legacy result and identify
every applied deviation. Legacy baseline fixtures are never rewritten to make a
correction appear compatible. A new layer version cannot alter a frozen legacy
profile. Technical transport/build adaptations also remain explicit, but are
separate from linguistic deviations.

## Claims

Source preservation, executable reproducibility, behavioral compatibility and
linguistic correctness are separate claims. Report measured coverage and remaining
differences. A passing build, a few familiar words or a fixture subset does not
establish complete Whitaker compatibility.
