# Domain Docs — Consumer Rules

This is a **single-context** repository. All domain documentation lives at the root.

## Files to Read

| File         | Purpose                                                | When to Read                              |
| ------------ | ------------------------------------------------------ | ----------------------------------------- |
| `CONTEXT.md` | Glossary of domain terms, relationships, key decisions | **Always** — before any code exploration  |
| `docs/adr/`  | Architectural Decision Records (numbered)              | When working in an area touched by an ADR |

## No `CONTEXT-MAP.md`

This repo does **not** have a `CONTEXT-MAP.md` at the root. Therefore:

- There is exactly **one** `CONTEXT.md` (at `/`)
- There is exactly **one** `docs/adr/` (at `/docs/adr/`)
- No per-context `CONTEXT.md` files under `src/*/`

## Reading Rules

1. **Read `CONTEXT.md` first** — it defines the vocabulary. Use its terms exactly.
2. **Check `docs/adr/` for relevant ADRs** — `ls docs/adr/` to list, then read any matching your task.
3. **Don't invent synonyms** — if `CONTEXT.md` says "Family" not "Household", use "Family".
4. **Flag conflicts** — if your task contradicts an ADR, surface it: _"Contradicts ADR-0002 (data model) — but worth reopening because..."_

## Hackathon Note

- ADRs 0001–0003 exist and define: architecture, data model, GenAI prompts
- These are **authoritative** for the 2-hour build
- No time for debate — follow them unless a hard blocker appears
