---
name: update-docs
description: Sync AGENTS.md, README, and docs with the current state of the codebase.
agent: 'agent'
---

Follow the project conventions in #file:AGENTS.md.

## Goal

Update documentation files to accurately reflect the current state of the codebase.

## Files to update

- **AGENTS.md** — Architecture, key files table, conventions, implementation notes.
- **README.md** — Project overview, setup instructions, feature list.
- **docs/tasks/tasks.md** — Task completion status.

## Process

1. **Scan for drift:** Compare recent code changes (new files, renamed modules, new stores/hooks/services, changed APIs) against what the docs currently describe.
2. **Key Files table:** Check that every significant file in `src/` is listed in the AGENTS.md Key Files table with an accurate description. Add missing entries, remove entries for deleted files.
3. **Implementation notes:** Update the "Key Implementation Notes" section in AGENTS.md with any new patterns, workarounds, or architectural decisions.
4. **Test coverage stats:** Update the test count in "Test coverage" if tests were added or removed.
5. **README features:** Ensure the feature list matches what is actually implemented.
6. **Task status:** Mark completed tasks and update progress notes.

## Constraints

- Do not invent or assume features — only document what exists in code.
- Keep the same formatting style and section structure as the existing docs.
- Do not remove historical notes that are still relevant.
- Keep AGENTS.md concise — each implementation note should be a single bullet with key facts.