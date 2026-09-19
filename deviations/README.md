# Corrected-layer registry

Registry version: `corrected-v1`. Qualified deviations: **none**.

Legacy results and fixtures are the preservation authority. An explicit corrected
layer may create a separate result but cannot overwrite legacy data or quietly
change lookup, spelling normalization, morphology, ranking or meanings.

Before adding a deviation, record a stable ID, affected rows/rules and input scope,
the executable legacy observation, the proposed change, cited linguistic evidence,
adjudication status and executable positive/negative tests. The tests must assert
both the unchanged legacy result and the corrected result. The selected ID and
layer version must be present in the output. Rejected and uncertain proposals
remain documented without activating a change.

The current API rejects every nonempty deviation selection. Its empty corrected
result is an independent copy of the legacy result. Diacritic folding is not
implicitly enabled in either mode.
