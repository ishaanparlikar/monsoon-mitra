# Issue Tracker — Local Markdown

This repository uses **local markdown files** under `.scratch/<feature>/` as its issue tracker.

## Structure

```
.scratch/
├── <feature-slug>/
│   ├── issue.md          # Main issue description
│   ├── tasks.md          # Task breakdown (checkbox format)
│   └── notes.md          # Scratchpad for implementation notes
```

## Conventions

- **One feature = one folder** under `.scratch/`
- **Folder name** = kebab-case feature slug (e.g., `family-onboarding`, `alert-localization`)
- **`issue.md`** contains: problem statement, acceptance criteria, links to ADRs
- **`tasks.md`** uses `- [ ]` / `- [x]` syntax for task tracking
- **`notes.md`** is free-form for the implementing agent

## Tooling

- No external CLI needed — standard file reads/writes
- `to-tickets` skill writes here
- `triage` skill reads/writes `issue.md` frontmatter for labels
- `qa` skill writes test results to `notes.md`

## Why Not GitHub Issues?

- Hackathon timeline (2 hours) — no time for `gh` auth/remote setup
- Solo/duo work — no team triage overhead
- Local files = zero latency, works offline
- Can migrate to GitHub Issues post-hackathon if needed
