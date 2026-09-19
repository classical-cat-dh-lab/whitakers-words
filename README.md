# Whitaker Words Modernization

A preservation/resurrection of William Whitaker's WORDS in TypeScript compiled
to JavaScript ESM, with an analysis library, structured API, CLI and minimal
browser validation harness as its first delivery.

The canonical source and executable behavioral baseline are established:
five upstream regression groups and 21 captured cases pass. See the
[baseline and its limits](docs/baseline.md) and [reproduction commands](docs/building.md).
The TypeScript engine, structured API, CLI and browser harness remain the next
implementation stages. No installable product release is available yet.

The [legacy contract](docs/legacy-contract.md) freezes an explicit source snapshot
and preserves observed behavior, including original errors. Linguistic corrections
belong to separate, explicitly selected layers with deviation evidence and tests.
This project remains distinct from a new Latin analyzer.

## Upstream

William Whitaker created the original WORDS program and dictionary. Source
references include the [maintained Ada project](https://github.com/mk270/whitakers-words)
and the [historical 1.97FC distribution](https://github.com/dsanson/Words).
This project is an independent reimplementation effort.

## Documentation license

Original reference tooling is licensed under AGPL-3.0-only; see [LICENSE](LICENSE).
The preserved WORDS source and data retain [Whitaker's notice](licenses/whitaker.txt).

Original documentation is licensed under
[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/).
Third-party software and data retain their respective notices and terms.
