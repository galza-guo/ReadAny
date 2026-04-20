# App Typography System Design

Status: Approved on 2026-04-20

## Goal

Create one small app-wide typography system so pane headers, section headers, dialog titles, settings labels, and supporting text all feel like they belong to the same product instead of a collection of local tweaks.

## Product Decision

The app should stop treating each screen area as a special case.

Instead, the UI should use a shared semantic type scale with a few clear roles:

- app title
- rail pane title
- section title
- field label
- body text
- meta or status text
- compact uppercase label

These roles should be defined once in `src/App.css` and reused across the app.

## Typography Roles

### App Title

Use for the top-level product title only.

- size: `18px`
- weight: `700`
- case: normal
- spacing: neutral, not decorative

### Rail Pane Title

Use for pane headers inside the reading workspace, including `Translation` and `AI Assistant`.

- size: `15px`
- weight: `600`
- case: normal
- line-height: compact and calm
- purpose: primary title inside a rail or sidebar pane

### Section Title

Use for smaller structural headings such as `Contents`, `Model Presets`, and `Recent`.

- size: `13px`
- weight: `600`
- case: normal by default
- color: slightly muted when the section is secondary

### Field Label

Use for form labels and short control labels.

- size: `13px`
- weight: `600`
- case: normal

### Body Text

Use for normal copy and larger content blocks.

- size: `14px`
- weight: `400`
- line-height: `1.5`

### Meta Or Status Text

Use for helper copy, timestamps, supporting detail, and status messages.

- size: `12px`
- weight: `500` for short UI metadata, otherwise `400`
- color: muted

### Compact Uppercase Label

Reserve uppercase text for compact UI labels only. Do not use it for major pane headers.

- size: `11px`
- weight: `600`
- letter spacing: `0`
- case: uppercase

This means `Translation` and `AI Assistant` should no longer use the old uppercase micro-label treatment.

## Shared Rail Header Pattern

The reader should have one shared rail header pattern that can be reused wherever a pane needs a title row.

The pattern should include:

- a left-aligned title group
- an optional icon
- an optional meta line below the title
- an actions area on the right
- consistent padding and vertical rhythm

The visual effect should be quieter than a card header. It should feel like part of the pane surface, not a separate framed block.

## Reader Surfaces

### Translation Pane

`Translation` should use the new rail pane title role and the shared rail header layout.

This should also reduce the current feeling of too much empty space above the title.

For EPUB, the title should stay `Translation`. If section or page context is needed later, it should appear as meta text, not as part of the title.

### AI Assistant Pane

`AI Assistant` should move onto the same rail pane title system as `Translation`.

The icon can stay, but the text sizing, weight, spacing, and header padding should match the shared pattern.

### Navigation Sidebars

Pane-like sidebars such as EPUB `Contents` should use the same title language, scaled through the section-title role when they are structurally secondary.

## App-Wide Surfaces

### Dialogs

Dialog titles and descriptions should align with the same system:

- dialog title should feel related to the app title family, not a random one-off
- dialog description should use the shared meta or supporting-copy role

### Settings

Settings should stop mixing uppercase section headers, ad hoc toolbar titles, and form labels that are close but not identical.

The settings screen should use:

- section title for section headers and toolbar headings
- field label for input labels
- meta text for helper or empty-state copy

### Home

The home view should also fit the same language:

- subtitle uses body-supporting text
- `Open PDF or EPUB` uses section-title strength
- `Recent` uses the section-title role instead of the old tiny uppercase treatment

## Spacing Rhythm

The refactor should also normalize vertical rhythm around text.

Key rules:

- pane headers should use one shared top and bottom padding value
- titles should not depend on extra margins for visual position
- section titles should create structure through spacing and weight, not through oversized gaps
- supporting text should sit close enough to the title to read as one unit

## Non-Goals

This refactor should not:

- change the app font family
- add a large design-token framework
- redesign unrelated layout structure
- add new product features

## Testing Expectations

Verification should cover:

- `Translation` and `AI Assistant` using the same shared header classes
- removal of uppercase label styling from major pane headers
- reduced top padding above the translation title
- consistent title and label roles across home, settings, and dialogs
- successful build after the class migration
