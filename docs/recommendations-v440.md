# Recommendations v440

All compatible completed history contributes to the shared strength estimate. RPE/RIR, method role, freshness, repetition count and fatigue determine evidence weight. Workout-level normalization prevents numerous mini-sets from dominating. Protocol estimates partition the final evidence weights: recombining them gives the same shared estimate, with no duplicate contribution. Old sessions remain available, including cloud histories exceeding 2500 workouts.

A latest session without RPE no longer disables projection when older compatible effort evidence exists. The UI reports the number of contributing sessions and sets, and exposes protocol estimates in the explanation. Estimates remain predictions; confirmed singles are stored separately.

Explicit weighted TEST blocks default to three attempts, respecting an explicit `testAttempts` count. Existing multi-repetition tests retain their prescribed repetitions. Single-attempt previews use the weekly intensity corridor, then actual attempts determine the next load. Failure, technical failure, an explicit stop or RPE >= 9.5 stops pending stages. Back-off slots match successful attempts after a stop. Omitted stages are retained and can be restored after correcting a recorded result. Completed and manually edited loads are preserved.

Week-eight isolation exercises and custom exercises marked `testMode: isolation` use three working-range tests. Initial stages preview 90/95/100% of estimated working-range load, never of 1RM. Actual TARGET holds weight; easy/hard performance adjusts the next stage. Back-offs use 90% of an actual successful working load, with RPE 7–8.

Recommendation and auto-weight share the same calculation. Apply only changes eligible pending loads. Cancel dismisses the current proposal and keeps the current loads; it does not undo an already applied weight. Dismissal is serialized and blocks auto-application of the same proposal after rerender/reload. Changed completed evidence, targets, equipment step or readiness produces a new proposal. Manual loads and completed sets remain protected.

Validation: unit regressions cover missing recent RPE, protocol reconstruction, test-block migration and idempotence, stop/correction, isolation, persistent cancellation, manual loads, and cloud paging. The real-app JSDOM runner checks all eight weeks, three attempts/back-offs, isolation blocks and visible Apply/Cancel controls. The broader runner covers startup, draft restoration, manual zero loads, completion, sync failure, sharing and program launch.
