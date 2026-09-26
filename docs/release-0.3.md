# 0.3.0-beta.1

This release moves Words from alpha to beta after preliminary engineering
reliability verification and freezes the backend for later classical-text corpus
work. It includes the accepted 0.2.1 browser interface and offline behavior.

- The complete 4,144,877-query Latin replay has 4,144,873 matching normal outputs,
  two faithfully reproduced original errors, and two separately recorded console
  comparator limits. All 109,001 original 0.2 output differences are resolved;
  there are no new differences or regressions.
- All 24,000 English observations match the original program, including its
  500-hit overflow behavior. Ten synthetic native capacity states and 512 Latin
  sessions across 16 option profiles also match. All 36 regression groups pass.
- Repairs preserve native retained search/parse state, ordering, fallback,
  capacity boundaries, line-atomic output, diagnostics and session termination.
  The original dictionary, linguistic errors and empty corrected layer remain.
- The backend source, data and executable adapters are hash-frozen. Ordinary
  verification checks this baseline before running the regression suite.

Beta recognizes the tested engineering state. Full classical-text corpus
comparison and broad stress testing are deferred; universal equivalence and
philological correctness are not claimed. Native exceptions remain failures,
not successful lookups. Physical iOS installation is outside the browser-emulation
qualification.

See [backend acceptance](acceptance.md), [the frozen baseline](backend-baseline.md)
and [compatibility scope](compatibility.md). The library, CLI and website run
locally; there is no remote query service.

Archive: [DOI 10.5281/zenodo.22970444](https://doi.org/10.5281/zenodo.22970444), in the existing Words version lineage.
