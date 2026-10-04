# Milemark

Milemark is a travel expense planner for recording shared trip costs, splitting expenses, tracking money owed, and sharing a read-only trip summary. It also tracks trip-related income separately from spending.

## Features

- Supabase email/password authentication
- Quick expense capture with split (`/3`) and exclusion (`-me`) syntax
- Quick income capture using `income AMOUNT SOURCE`
- Separate trip income and expense totals
- Expense and income history with search and sorting
- English and Thai keyword-based expense categories, with manual category editing
- Import multiple expenses and income entries from dated notes
- Read-only trip links with expense and income summaries
- THB, USD, EUR, GBP, JPY, and KRW display settings

Income entries are not expenses: they do not change expense totals, shared-cost splits, or settlement balances.

## Stack

- Next.js 16 App Router
- React 19 and TypeScript
- Supabase Auth, Postgres, SSR helpers, and RPC
- Lucide React icons
- ESLint 9

## Local setup

Requirements: Node.js 20 or newer and a Supabase project.

```bash
npm install
```

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

In the Supabase SQL Editor:

- For a new project, run [supabase/schema.sql](supabase/schema.sql).
- For an existing project, run [supabase/income-migration.sql](supabase/income-migration.sql) to add income storage, then run [supabase/share-link-migration.sql](supabase/share-link-migration.sql) to ensure the share-link function returns income too. The share-link migration also safely creates the income table and policy if they are not already present.

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Quick input

Enter an expense amount followed by its description:

```text
307.32 train /3
83 coke /5 -me
```

`/3` divides the expense between three people. `-me` excludes the current user from the split.

Enter income with an explicit `income` prefix:

```text
income 4000 gift from Mom
```

This records ฿4,000 as trip income from Mom. It remains separate from expense and settlement calculations.

Imports accept one entry per line. Date headings apply to following expenses and income until another heading appears:

```text
6 sept 2026
7115.98 Hotel AMS
income 4000 gift from Mom
9146.06 Hotel BRU

8 sept 2026
960.67 Netherlands National Museum admission
```

Automatic expense categories are Food, Transport, Attraction, Shopping, and Other. Categories can be changed manually when editing an expense.

## Commands

```bash
npm run dev       # Start development server
npm run lint      # Run ESLint
npm run build     # Create production build
npm run start     # Start production server
```

## Deploy on Vercel

1. Push the repository to GitHub.
2. Import it at [vercel.com/new](https://vercel.com/new).
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to Development, Preview, and Production environment variables.
4. Deploy. Vercel detects Next.js and uses `npm run build`.
5. Add the deployed URL in Supabase under **Authentication -> URL Configuration** as the Site URL and an allowed redirect URL.

Never expose a Supabase service-role key in this application.

## Project structure

```text
src/app/page.tsx                    Main authenticated planner UI
src/app/globals.css                 Global styles
src/app/share/[token]/              Read-only shared trip page
src/lib/demo-data.ts                Expense, income, and trip types
src/lib/expense-category.ts         Category scoring and overrides
src/lib/supabase/client.ts          Browser Supabase client
src/lib/supabase/server.ts          Server Supabase client
supabase/schema.sql                 New-project database schema and share RPC
supabase/income-migration.sql       Add income storage to an existing project
supabase/share-link-migration.sql   Update share-link RPC to include income
```

See [CONTEXT.md](CONTEXT.md) for implementation details and [future.md](future.md) for potential follow-up work.
