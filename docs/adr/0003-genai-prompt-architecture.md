# ADR 0003: GenAI Prompt Architecture for Multilingual Safety Guidance

## Status

Accepted

## Context

The solution's core differentiation is GenAI-powered:

1. **Personalized Preparedness Plan Generation** — From family profile + location + phase
2. **Weather Alert Localization** — IMD/CWC alerts → citizen's language + actionable guidance
3. **Conversational Q&A** — Citizen asks "What should I do now?" in their language
4. **Risk Explanation** — "Why is my risk score 78?"
5. **Image Analysis** — User uploads waterlogging photo → severity assessment
6. **Voice Interaction** — Speech-to-text → GenAI → text-to-speech (low-literacy users)

All must work in 12 Indian languages + dialects, with safety-critical accuracy.

## Decision

We use a **modular prompt architecture** with **RAG over official advisories** as the grounding layer.

### 1. System Prompt Template (shared)

```typescript
const SYSTEM_PROMPT = `
You are "Monsoon Mitra" — a trusted monsoon preparedness assistant for Indian citizens.
Your guidance MUST be accurate, actionable, and safe. Lives may depend on your responses.

CORE PRINCIPLES:
1. ALWAYS ground responses in official sources: IMD alerts, NDMA guidelines, ULB advisories.
2. NEVER hallucinate evacuation routes, shelter locations, or emergency numbers.
3. If uncertain, say "I don't have official data for that. Please check [source] or call [number]."
4. Prioritize: Life safety > Property protection > Convenience.
5. Use simple, direct language. Avoid jargon. Translate to {{language}} naturally.

OFFICIAL SOURCES (provided in context):
- IMD Weather Alerts: {{imd_alerts}}
- NDMA Guidelines: {{ndma_guidelines}}
- ULB Advisories: {{ulb_advisories}}
- CWC River Data: {{cwc_data}}

FAMILY CONTEXT (when available):
- Location: {{district}}, {{ward}} (hazard zones: {{hazard_zones}})
- Housing: {{housing_type}}
- Composition: {{family_composition}}
- Medical: {{medical_conditions}}
- Preparedness Phase: {{phase}}
- Completed Items: {{completed_checklist_items}}

RESPONSE FORMAT:
- For plans: Structured JSON matching PlanJson schema
- For alerts: {title, guidance, urgencyScore, immediateActions[]}
- For Q&A: Natural language in {{language}}, with source citations
- For risk: {score, factors[], explanation, priorityActions[]}
`;
```

### 2. Prompt Modules (composed per use case)

| Module           | Purpose                             | Input                                            | Output                             |
| ---------------- | ----------------------------------- | ------------------------------------------------ | ---------------------------------- |
| `generatePlan`   | Create full preparedness plan       | Family profile, location, phase, weather context | `PlanJson`                         |
| `localizeAlert`  | Translate + contextualize IMD alert | IMD alert, family profile, language              | `LocalizedAlert`                   |
| `answerQuestion` | Conversational Q&A                  | User question, family context, RAG docs          | Natural language + citations       |
| `explainRisk`    | Explain risk score breakdown        | Risk score, factors, family profile              | Natural language explanation       |
| `analyzeImage`   | Waterlogging severity from photo    | Base64 image, location, timestamp                | {severity, description, actions[]} |
| `voiceResponse`  | TTS-optimized response              | Text response, language                          | SSML or plain text                 |

### 3. RAG Pipeline

```typescript
// At plan generation / alert localization time:
const relevantDocs = await retrieve({
  query: `monsoon preparedness ${phase} ${hazard_zones.join(' ')} ${family_composition}`,
  sources: ['NDMA', 'IMD', 'ULB'],
  topK: 5,
});

// Inject into prompt as {{ndma_guidelines}}, {{imd_alerts}}, etc.
```

### 4. Language Handling

- **Static UI**: `next-intl` with translation files for 12 languages
- **Dynamic GenAI content**: Language specified in prompt (`{{language: 'hi'}}`). GenAI generates directly in target language.
- **Dialects**: Map to nearest major language (Marwari→Hindi, Bhojpuri→Hindi, Tulu→Kannada, Konkani→Marathi) with prompt instruction: "Use simple {{language}} understandable in {{dialect}} regions."

### 5. Safety Guardrails

```typescript
const SAFETY_CHECKS = [
  // 1. No fabricated emergency numbers
  { pattern: /\b(100|101|102|108|112|109[0-9])\b/, allowList: ['108', '112', '100', '101', '102'] },
  // 2. No fabricated shelter names/routes
  { check: 'shelter_or_route_mentioned', action: 'verify_against_db' },
  // 3. Evacuation guidance must reference official alert level
  { check: 'evacuation_advice_given', require: 'alert_severity_warning_or_above' },
  // 4. Medical advice disclaimer
  { check: 'medical_advice_detected', append: 'DISCLAIMER: Not medical advice. Consult a doctor.' },
];
```

### 6. Model Selection

| Use Case           | Model                                 | Reason                                              |
| ------------------ | ------------------------------------- | --------------------------------------------------- |
| Plan generation    | GPT-4o-mini / Claude 3 Haiku          | Structured JSON output, good multilingual, low cost |
| Alert localization | GPT-4o-mini                           | Fast, accurate translation + contextualization      |
| Q&A                | GPT-4o-mini                           | Conversational, citation support                    |
| Image analysis     | GPT-4o / GPT-4o-mini vision           | Visual reasoning                                    |
| Voice (STT/TTS)    | Whisper + ElevenLabs / Web Speech API | Browser-native for hackathon                        |

### 7. Caching Strategy

- **Plan generation**: Cache by `(family_id, phase, weather_hash)` for 6 hours
- **Alert localization**: Cache by `(alert_id, language, family_risk_profile)` for alert validity period
- **Q&A**: No cache (personalized)
- **Image analysis**: No cache (unique per upload)

## Consequences

### Positive

- Modular prompts = testable, versionable, swappable
- RAG grounds safety-critical output in official sources
- Direct GenAI translation avoids i18n maintenance burden
- Safety checks catch common hallucination patterns
- Model selection optimizes cost/quality per use case

### Negative

- Prompt engineering complexity (mitigated: 6 modules × 12 languages = testing burden)
- GenAI latency (mitigated: streaming, cached plans, Haiku for speed)
- Cost scales with users (mitigated: hackathon scale, caching, Haiku)
- No offline GenAI (mitigated: cached plans work offline; alerts need connectivity)

## Alternatives Considered

| Alternative                         | Rejected Because                                         |
| ----------------------------------- | -------------------------------------------------------- |
| Fine-tuned model for monsoon domain | No training data, hackathon timeline                     |
| Single monolithic prompt            | Unmaintainable, hard to test, token waste                |
| Translation API + English GenAI     | Loses cultural nuance, 2× latency, 2× cost               |
| Rule-based templates (no GenAI)     | Can't handle personalization, multilingual nuance        |
| Open-source LLM (Llama 3.1)         | Multilingual quality gap for Indian languages, GPU setup |

## Related

- ADR 0001: Hackathon Architecture
- ADR 0002: Data Model
