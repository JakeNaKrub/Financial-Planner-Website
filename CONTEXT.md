# AI Context

## Project

Milemark is a Next.js 16 travel expense planner. It uses the App Router, React 19, TypeScript, Supabase Auth/Postgres, and Lucide React. The application records shared travel expenses, calculates each user's share, tracks money owed, and creates read-only trip share links.

## Important Instructions

- Read `AGENTS.md` before making code changes. This repository has project-specific Next.js guidance.
- The Next.js version is `16.3.5`, not a generic older Next.js setup. Follow the relevant documentation under `node_modules/next/dist/docs/` when changing Next.js behavior.
- Preserve existing user changes. Do not reset or revert unrelated work.
- Use `apply_patch` for edits. Keep changes focused and preserve the existing UI style.
- Run `npm run lint && npm run build` after meaningful changes.
- Do not commit or create branches unless explicitly requested.

## Commands

```bash
npm install
npm run dev
npm run lint
npm run build
npm run start
```

## Environment

The browser and server Supabase clients require:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Do not use or expose a Supabase service-role key in client code.

## Data Setup

Run `supabase/schema.sql` in the Supabase SQL Editor. It creates:

- `trips`
- `people`
- `categories`
- `expenses`
- `expense_participants`
- `settlements`
- Row Level Security policies
- `get_shared_trip(text)` for read-only share links

Expenses reference `categories` through `category_id`. New and edited expenses upsert one of the built-in categories before saving. Supabase-loaded expenses prefer a saved category and fall back to keyword detection when no valid saved category exists.

## Main Code Paths

- `src/app/page.tsx`: authenticated planner UI, auth state, Supabase loading, trip management, expense parsing, creation, editing, deletion, splitting, import, and share-link actions.
- `src/lib/demo-data.ts`: `Expense`, `Trip`, `ExpenseStatus`, and `ExpenseIcon` types. Despite the filename, demo records were removed; the app starts with empty local state and loads real Supabase data after login.
- `src/lib/expense-category.ts`: category names, category-to-icon mapping, weighted keyword rules, explicit overrides, and `detectExpenseCategory()`.
- `src/lib/supabase/client.ts`: browser Supabase client.
- `src/lib/supabase/server.ts`: server Supabase client used by shared-trip pages.
- `src/app/share/[token]/page.tsx`: server-rendered read-only share route.
- `src/app/share/[token]/SharedTripView.tsx`: shared-trip presentation.
- `src/app/globals.css`: global application styling.

## Expense Input Grammar

Quick capture and import accept an amount followed by a description:

```text
307.32 train /3
83 coke /5 -me
```

- `/3` means the amount is split among three people.
- `-me` excludes the current user from the split.
- Date headings such as `6 sept 2026` set the date for following imported lines.
- Amounts may use decimals, commas, currency symbols, or Thai/English currency words supported by `parseExpense()`.

## Category Behavior

Built-in categories are:

- `Food` -> coffee icon
- `Transport` -> train icon
- `Attraction` -> map-pin icon
- `Shopping` -> wallet icon
- `Other` -> receipt icon

The classifier normalizes Unicode text, scores all matching rules, and then applies explicit overrides for ambiguous descriptions. Important current decisions:

- `bike ride`, bicycle rental, metro, tram, train, taxi, and fare are Transport.
- Museum admissions, Louvre, Van Gogh Museum, tours, and entry fees are Attraction.
- Meals, snacks, gelato, cake, ingredients, groceries, and food brands are Food.
- Souvenirs and keychains are Shopping, including when the title mentions a museum.
- Hotels, city taxes, luggage lockers, Canva, tips, and cigarettes are Other.
- A manually selected category in the edit modal overrides automatic detection and is persisted through `category_id`.

When adding category rules, update `src/lib/expense-category.ts` and consider both scoring conflicts and explicit overrides. Prefer specific phrases over broad words.

## UI and State Notes

- The app requires authentication before rendering the planner.
- `expenses` and `trips` initialize as empty arrays. Supabase loading replaces them after authentication.
- The active trip is selected from the first remote trip after loading.
- Local profile name and display currency are stored in `localStorage`.
- Money values are stored and calculated as minor units (`amountCents` in the UI, corresponding to `*_minor` in Supabase).
- The current UI supports THB, USD, EUR, GBP, JPY, and KRW display symbols, but expense editing currently labels the amount input as THB.
- Shared links use the Supabase `get_shared_trip` RPC and must not expose owner IDs or share tokens in the returned trip payload.

## Validation Expectations

At minimum, run:

```bash
npm run lint && npm run build
```

There is currently no automated unit-test script. For parser or classifier changes, manually verify examples such as:

```text
960.67 Netherlands National Museum admission  -> Attraction
189.12 Bicycle rental /3                     -> Transport
419.74 Dinner + next-day breakfast            -> Food
231.76 Ghent tram -me                         -> Transport
152.77 Andorra souvenir keychain              -> Shopping
7115.98 Hotel AMS                             -> Other
```
