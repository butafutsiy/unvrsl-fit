# v540: recommendation latency and familiar cards

v539 repeatedly scanned and normalized unrelated historical sets for every pending target. Profile resolution also scanned all 201 routing names even when the caller supplied a known canonical ID. A missing exercise in a large history caused the largest stalls.

The fix indexes immutable routing names, takes the canonical identity path before looking up names, resolves each historical exercise once, and skips its sets when the canonical identity differs. Repeated evidence reads within one synchronous recommendation share a private snapshot. The snapshot is never serialized or reused across user edits, account changes or successive decisions. The load model obtains its owned history once per run.

Numerical policies, history windows, RIR handling, caps, strategies and Apply/undo rules are unchanged. The benchmark compares the complete recommendation results, not only suggested weights: all three before/after decision digests agree (`v3:c9b1e5e5`). New regression tests reject reads of unrelated set metrics and check evidence reuse against actor, time, ROM, explicit history and subsequent edits.

The shared active/focus card returns to the familiar compact structure: “Автовес” / “Следующий подход”, weight and repetition target, coach comparison, history, and “Почему этот вес?”. Apply/dismiss/undo, review and stop protections still use Engine 3.0. Confidence and profile detail are under the disclosure instead of expanding the main card.

## Measurements

Source baseline: main `f76c95d`, release v539. Data is synthetic and contains no private account history. Exact samples and limits are in [performance-v540.json](performance-v540.json).

| Scenario | v539 | v540 |
|---|---:|---:|
| Node: 32 matched proposals, median of 3 runs | 4,987 ms | 205 ms |
| Node: 4 proposals absent from history, median of 3 runs | 13,473 ms | 14 ms |
| Chromium, CPU throttled 4×: first full load-model run, 16 targets | 46,570 ms | 990 ms |
| Same Chromium fixture: repeated run | 47,722 ms | 337 ms |
| Same Chromium fixture: workout render | 10,167 ms | 2,170 ms |

These are controlled regression scenarios with 90 sessions and 2,880 historical sets. CPU contention affects absolute measurements; throttled Chromium does not establish real iPhone or Android timings, and these ratios do not describe every screen. History remained byte-for-byte unchanged in both browser runs. Safety/functional tests and responsive browser checks run separately.

Reproduce the pure benchmark against a checkout containing the three recommendation modules:

```
node scripts/benchmark-recommendations.cjs /path/to/checkout
```
