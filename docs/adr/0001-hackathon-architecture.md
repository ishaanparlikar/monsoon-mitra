# ADR 0001: Hackathon Architecture for Monsoon Preparedness Prototype

## Status

Accepted

## Context

We are building a GenAI-powered Monsoon Preparedness & Citizen Assistance prototype for a 2-hour hackathon with 1-2 engineers. The full vision includes: personalized preparedness plans, weather-aware guidance, emergency checklists, travel advisories, safety recommendations, multilingual assistance (12 Indian languages), and real-time alerts across pre/during/post monsoon phases.

## Decision

We will build a **modular monolith PWA** with the following constraints:

1. **Single deployable unit** — Next.js (App Router) with API routes as internal services. No microservices, no separate services.
2. **PWA only** — No native app, no WhatsApp bot, no IVR. Single codebase, installable, offline-capable via Service Worker.
3. **Mock external data** — IMD, CWC, ULB data will be mocked via JSON fixtures. No live API integration.
4. **API-based GenAI** — OpenAI/Anthropic API for all GenAI features (plan generation, localization, Q&A, risk explanation). No self-hosted models.
5. **Phone OTP auth only** — Supabase Auth or Firebase Auth with phone provider. No passwords, no social login.
6. **Supabase/PostgreSQL** — Single database for auth, profiles, families, plans, checklists, alerts, reports.
7. **12 languages via GenAI translation** — System prompt handles translation; no separate i18n files for dynamic content. Static UI strings use next-intl.
8. **Offline-first for critical paths** — Service Worker caches: personalized checklist, evacuation routes, shelter map, emergency contacts.
9. **Scope: 1 district (e.g., Mumbai Suburban)** — All data fixtures scoped to one district for demo realism.

## Consequences

### Positive

- Single developer can build and deploy in 2 hours
- No infrastructure complexity (Vercel + Supabase free tiers)
- GenAI API gives highest quality output for demo
- PWA works offline for core preparedness features
- Phone OTP is fastest auth to implement

### Negative

- Not production-ready (no rate limiting, observability, CI/CD, multi-region)
- Mock data limits realism of demo
- API costs for GenAI (mitigated: short prompts, cached responses)
- No real SOS integration (simulated only)
- iOS PWA push notification limitations (mitigated: SMS fallback for critical alerts)

### Risks

- GenAI hallucination in safety-critical guidance (mitigated: RAG over official advisories, human-in-loop disclaimer)
- API latency affects perceived performance (mitigated: streaming responses, loading states)
- 2-hour scope creep (mitigated: ruthless feature flagging, v1 = checklist + plan + alerts only)

## Alternatives Considered

| Alternative                                         | Rejected Because                                                  |
| --------------------------------------------------- | ----------------------------------------------------------------- |
| Microservices (separate API, worker, GenAI service) | Too much infra for 2 hours                                        |
| React Native / Expo                                 | PWA is faster to build + deploy; no app store review              |
| WhatsApp Business API                               | Requires Meta verification (weeks), not hackathon-friendly        |
| Self-hosted LLM (Ollama/Llama.cpp)                  | GPU setup time, lower quality for multilingual                    |
| NextAuth + custom auth                              | Phone OTP via Supabase/Firebase is 5 min setup                    |
| Full i18n with translation files                    | 12 languages × dynamic content = unmaintainable; GenAI handles it |

## Related

- ADR 0002: Data Model for Personalized Preparedness Plans
- ADR 0003: GenAI Prompt Architecture for Multilingual Safety Guidance
