# Petloop 🐾

**A real-time, shared care dashboard for households, couples, and families coordinating pet care.**

## The Problem

In multi-person households, pet care responsibilities — feeding, walks, medication, bathroom breaks, vet appointments — are split across several people with no shared source of truth. This leads to missed or duplicated tasks, confusion during handoffs ("did anyone feed the dog?"), and no reliable way to brief a pet sitter without a verbal or written explanation every time. Emergency information (vet contact, insurance, allergies) is often scattered across memory, texts, or paper, making it hard to access quickly when it matters most.

Petloop solves this with a real-time, shared dashboard where household members log daily pet care with a single tap, receive medication and task reminders automatically, and grant pet sitters temporary, simplified access to exactly what they need.

## Core Features

- **Household setup with multi-pet support** — one household, multiple pets, distinct profiles
- **Role-based access** — owner, caregiver, and sitter permission levels
- **Quick-tap activity logging** — fed, walked, pooped, peed, slept, with timestamps
- **Real-time shared activity timeline** — every household member sees the same live feed
- **Recurring reminders** — medication, bath, and grooming reminders via push notification
- **Emergency/vet info card** — vet contact, clinic address, insurance, allergies, microchip number, accessible in seconds
- **Pet-sitter mode** — a time-limited, shareable link giving sitters a simplified, read-mostly view without full account access
- **Vet appointment tracker** — upcoming appointments with reminders, plus visit history

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Backend / Database | Supabase (Postgres, real-time subscriptions, auth) |
| Deployment | Cloudflare Pages / Workers (via Wrangler) |
| Linting | ESLint |

## Data Model (Highlights)

- `households`, `household_members` — households and role-based membership
- `pets`, `emergency_info` — pet profiles and emergency/vet details
- `logs` — quick-tap activity entries (fed/walked/pooped/peed/slept)
- `medications`, `reminders` — recurring schedules and generated reminders
- `appointments` — vet visit tracker and history
- `sitter_access` — time-limited share tokens scoping sitter permissions

Full migration history is in `supabase/migrations/`.

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your Supabase URL and anon key to .env

# Run the dev server
npm run dev

# Build for production
npm run build

# Deploy (Cloudflare)
npx wrangler deploy
```

## Roles & Permissions

| Role | Can Log Activity | Can Edit Medical/Emergency Info | Can Manage Household | Access Type |
|---|---|---|---|---|
| Owner | ✅ | ✅ | ✅ | Full account |
| Caregiver | ✅ | ✅ | ❌ | Full account |
| Sitter | ✅ | ❌ | ❌ | Time-limited link, no account |

## Project Status

This is an MSIT Capstone project built under the Accelerated Prototyping track. Core MVP and depth features (emergency card, sitter mode, appointment tracker) were built and validated with usability testing over a 10-week schedule.

## Out of Scope (Future Roadmap)

- Photo and weight tracking over time (growth charts, photo timeline)
- Direct API integrations with vet clinics or insurance providers
- In-app messaging between household members

## Author

Thais Lima
