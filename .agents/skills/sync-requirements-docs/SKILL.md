---
name: sync-requirements-docs
description: Synchronize product requirement changes across every affected document in the weekend-crew-ai repository. Use when a user adds, removes, or changes product behavior, UI flows, business rules, AI costs or quotas, permissions, APIs, data models, state machines, privacy boundaries, acceptance criteria, or implementation scope; also use when asked to update the PRD, technical design, frontend/backend implementation docs, README, or all documentation after a prototype or code change.
---

# Sync Requirements Docs

Keep the repository documentation consistent with the newest confirmed requirement and implemented behavior.

## Required Context

Read [references/project-doc-map.md](references/project-doc-map.md) completely before editing. Then inventory `README.md` and every Markdown file under `docs/`; do not rely on a hard-coded file list alone.

## Workflow

1. Inspect before editing.
   - Read the newest user requirement, relevant implementation/prototype, and affected document sections.
   - Treat the newest explicit requirement as authoritative. Surface a conflict only when it materially changes scope or cannot be resolved from the repository.
   - Preserve unrelated user changes.

2. Build an impact matrix privately.
   - Classify each change as product behavior, information architecture, UI/state, API, data model, AI/cost, permission/privacy, operations, or acceptance/testing.
   - Map each class to documents using the reference matrix.
   - Scan every project document even when no edit is required; avoid meaningless churn in unaffected files.

3. Update in authority order.
   - Update PRD product behavior and acceptance criteria first.
   - Update shared technical contracts and domain boundaries second.
   - Update frontend and backend implementation responsibilities third.
   - Update README last as a concise current-state summary.
   - For dated decision records, append a dated addendum; never rewrite the original decision as if it had always contained the new requirement.

4. Preserve contract detail.
   - Carry exact thresholds, prices/points, limits, roles, state names, failure behavior, privacy rules, and ownership across all relevant documents.
   - Describe success, empty, loading, failure, retry, stale, disabled, and permission-denied states when applicable.
   - When a prototype is ahead of production, label the difference explicitly instead of presenting mock behavior as an implemented backend capability.

5. Verify consistency.
   - Search for superseded phrases, old version labels, contradictory limits, removed fields, stale routes, and obsolete non-goals.
   - Confirm API names, state machines, data entities, permissions, cost rules, and acceptance tests agree across documents.
   - Run `git diff --check` and inspect the documentation diff.
   - Do not claim all documents are synchronized when a relevant file was not inspected.

## Editing Rules

- Keep each document at its proper abstraction level; do not copy implementation internals into README or product prose into API contracts.
- Prefer modifying existing sections over appending duplicate requirements. Add a new section only when the document has no suitable owner section.
- Keep terminology stable. If a term changes, replace or define the old term everywhere it is active.
- Keep historical records traceable with dated addenda.
- Do not silently invent backend support for prototype-only interactions.
- Do not change application code unless the user also requested implementation.

## Completion Report

Report:

- the authoritative requirement decisions captured;
- documents changed and why;
- documents inspected but unchanged, when relevant;
- verification performed;
- unresolved product, platform, legal, or implementation dependencies.
