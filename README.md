Milemark

Milemark is a travel expense planner for recording shared trip costs, splitting expenses, tracking money owed, and sharing a read-only trip summary.

It is designed around quick capture: enter an amount and description, and the app detects the likely category from English or Thai keywords.

## Features

- Supabase email/password authentication
- Quick shared-expense capture with `/3` and `-me` syntax
- English and Thai keyword-based category detection
- Manual category editing for saved expenses
- Expense history, filters, sorting, and category summaries
- Import of multiple dated expenses from pasted notes
- Read-only share links for trips
- THB, USD, EUR, GBP, JPY, and KRW display settings

## Stack

- Next.js 16 App Router
- React 19 and TypeScript
- Supabase Auth, Postgres, SSR helpers, and RPC
- Lucide React icons
- ESLint 9

## Local Setup

Requirements: Node.js 20 or newer and a Supabase project.

```bash
npm install
```

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Run [supabase/schema.sql](supabase/schema.sql) in the Supabase SQL Editor before using the app. The schema creates the tables, Row Level Security policies, and read-only share-link RPC.

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Expense Input

Enter an amount followed by a description:

```text
307.32 train /3
83 coke /5 -me
```

`/3` divides the expense between three people. `-me` excludes the current user from the split.

Imports support date headings, which remain active until another heading appears:

```text
6 sept 2026
7115.98 Hotel AMS
9146.06 Hotel BRU

8 sept 2026
960.67 Netherlands National Museum admission
```

Automatic categories are Food, Transport, Attraction, Shopping, and Other. Categories can be changed manually when editing an expense.

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

## Project Structure

```text
src/app/page.tsx                    Main authenticated planner UI
src/app/globals.css                 Global styles
src/app/share/[token]/              Read-only shared trip page
src/lib/demo-data.ts                Expense and Trip types
src/lib/expense-category.ts         Category scoring and overrides
src/lib/supabase/client.ts          Browser Supabase client
src/lib/supabase/server.ts          Server Supabase client
supabase/schema.sql                 Database schema and share RPC
```

See [CONTEXT.md](CONTEXT.md) for implementation notes intended for future AI coding sessions.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
