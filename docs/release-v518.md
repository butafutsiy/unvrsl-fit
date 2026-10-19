# v518 – Keep the page scale stable while editing on iPhone

Editing workout parameters could trigger Safari's focus zoom because compact
styles reduced input text to 12–14px, including the active input.

- Use 16px text for ordinary workout inputs at every supported screen width.
- Keep compact paired-weight and per-leg labels only outside editing.
- Add a touch-only focused-control CSS layer so dynamically loaded compact
  styles cannot reduce the active input below 16px. Covers inputs, textareas
  and selects across the app, including modal editors and cardio.
- Preserve native pinch zoom and the existing viewport configuration.
- Refresh the versioned PWA shell and dynamic module URLs to v518.

Validation: 381 contract tests passed; per-leg entry/edit/save/reopen/launch
runtime scenario passed; JavaScript syntax, catalog completeness and nutrition
catalog checks passed. The CSS parses with the project's jsdom version.
Native iPhone keyboard/focus behavior still needs a device check; a native iOS
runtime is unavailable in this environment.
