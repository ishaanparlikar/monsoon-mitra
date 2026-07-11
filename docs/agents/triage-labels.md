# Triage Labels

This project uses the **default five canonical labels** (recommended). The `triage` skill will apply these strings directly.

| Canonical Role    | Label String      | When to Apply                                 |
| ----------------- | ----------------- | --------------------------------------------- |
| `needs-triage`    | `needs-triage`    | New issue/feature needs evaluation            |
| `needs-info`      | `needs-info`      | Blocked waiting on clarification              |
| `ready-for-agent` | `ready-for-agent` | Spec complete, can be implemented by AI agent |
| `ready-for-human` | `ready-for-human` | Requires human decision/design/approval       |
| `wontfix`         | `wontfix`         | Out of scope, duplicate, or abandoned         |

## Hackathon Usage

- **Labels live in `issue.md` frontmatter** of each `.scratch/<feature>/` folder:

```yaml
---
labels: [ready-for-agent, needs-triage]
---
```

- No GitHub/GitLab label creation needed
- `triage` skill reads/writes this frontmatter
