# v517: round live method weights before applying them

Reproduced the screenshot with a 110 kg completed UNVRSL heavy stage and a
120/130 authored middle-stage ratio. The recommendation card rounded the
result to 102.5 kg, while nextSetSuggestion.weight retained
101.53846153846155. Applying the proposal selected the latter value.

Live method recommendations now pass through the same equipment rounding as
other working loads. The original calculation remains available as raw
metadata; the applicable next-set weight respects equipment steps and the
available-load list. Fractional steps are supported.

When reopening an active draft, pending generated or long floating-point
loads are normalized, including saved recommendation/restore weights. The
repair skips completed, skipped, manually entered and finalized data and
uses the set equipment snapshot when present. Existing explicit short
fractional plan weights are preserved. The active input is rerendered and
the repaired draft is saved.

Validation: 381 contract tests passed. Reproduced screenshot DOM test passed
for 102.5 kg inputs, new proposals, persistence after reload and unchanged
manual/completed/history values. Step tests cover 2.5, 5, 0.5, 0.25 kg and
an explicit available-load list. Replacement and all eight method-week
integrations passed; the existing weekly recommendation UI test passed.
Shell, dynamic assets and service worker advance to v517. DOM integration
is not physical iPhone verification.
