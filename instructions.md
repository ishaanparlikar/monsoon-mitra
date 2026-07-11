# Monsoon Assistant - Implementation Instructions

> [!CAUTION]
> **No Mock Data Policy:** Do NOT use or introduce mock/hardcoded data in any implementation. All data must come from real Supabase DB queries or real API calls (IMD/IMD-equivalent, GenAI). Fake phone numbers, placeholder locations ("Worli", "0.8km"), static checklists, and hardcoded translations are forbidden.

## Objective

Implement a stunning, modern Mobile Web Application (PWA) prototype for Monsoon Preparedness in Mumbai, following the architecture outlined in `CLAUDE.md` and `CONTEXT.md`.

## Key Requirements

1. **Design System:** Build an incredibly premium, dynamic, and visually stunning UI. Embrace modern trends like glassmorphism, elegant dark modes, vibrant but cohesive colors (e.g., alert reds/oranges against deep dark backgrounds), and smooth typography.
2. **Dashboard UI:**
   - **Risk Score & Phase:** A high-level visual indicator of the family's current risk tier and the preparedness phase (Pre-Monsoon vs Active Monsoon).
   - **Weather Alerts:** Official alerts contextually translated into actionable, localized advice.
   - **Preparedness Checklist:** A progress tracker containing prioritized, interactive action items.
   - **Quick Actions / SOS:** Highly prominent buttons for emergency response, reporting issues, or finding shelters.
3. **Architecture:** Use the Next.js App Router workspace provided. Place React components in `/components` and route pages in `/app`.

## Step-by-Step Instructions

1. **Foundation:** Initialize global CSS (`/app/globals.css`) with premium design tokens, gradients, and utility classes. (We will use TailwindCSS).
2. **Components:** Build reusable, high-quality components (e.g., `Card`, `AlertBanner`, `ChecklistItem`, `SOSButton`).
3. **Dashboard Assembly:** Construct the main dashboard (`/app/page.tsx`) mapping the mock data structure from the domain model to the UI representations.
4. **Polish:** Ensure responsive behavior (mobile-first for a PWA), add micro-animations, and prepare for offline Service Worker integration.

## Note

Backend features (Supabase Auth/DB) and actual GenAI integration will take a backseat in this initial implementation task. The foremost priority is creating an aesthetically impressive, functional frontend prototype that embodies the design mockup.
