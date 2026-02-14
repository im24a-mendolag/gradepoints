# GradePoints

A grade tracking web app for Swiss vocational school students. Track grades across 6 semesters, final exams, and see pass/fail status at a glance.

**Live:** [gradepoints.mendolag.ch](https://gradepoints.mendolag.ch)

## Features

- **Semester-based grade tracking** — 6 semesters with predefined subjects per semester
- **Weighted grades** — assign weights to individual grades (weight 0 = excluded)
- **Subject averages** — automatically rounded to 0.5, with optional bonus/malus adjustments
- **Finals tab** — dedicated section for final exams (oral/written for German, French, English)
- **Overview tab** — 3-year final grades combining semester averages and finals
- **Pass/fail logic** — per-semester and overall, based on three rules (average ≥ 4.0, max 2 subjects below 4.0, max 2 negative points)
- **Statistics page** — charts for semester trends, subject progress, grade distribution, radar chart, and more
- **Email verification** — new accounts must verify their email before signing in
- **Dark mode** — full dark UI with true black background

## Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org) (App Router)
- **Auth:** [NextAuth.js v5](https://authjs.dev) (JWT + Credentials)
- **Database:** PostgreSQL via [Neon](https://neon.tech)
- **ORM:** [Prisma v7](https://www.prisma.io) with Neon HTTP adapter
- **Email:** [Resend](https://resend.com) for verification emails
- **Charts:** [Recharts](https://recharts.org)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com)
- **Deployment:** [Vercel](https://vercel.com)

## Getting Started

### Prerequisites

- Node.js 18+
- A [Neon](https://neon.tech) PostgreSQL database
- A [Resend](https://resend.com) API key

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/gradepoints.git
   cd gradepoints
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root with the following variables:
   ```env
   DATABASE_URL=postgresql://...your-neon-connection-string...
   AUTH_SECRET=your-random-secret
   NEXTAUTH_URL=http://localhost:3000
   RESEND_API_KEY=re_your-resend-api-key
   ```

4. Push the database schema:
   ```bash
   npx prisma db push
   ```

5. Start the dev server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `AUTH_SECRET` | Random secret for NextAuth.js session encryption |
| `NEXTAUTH_URL` | Base URL of the app (e.g. `https://gradepoints.mendolag.ch`) |
| `RESEND_API_KEY` | API key from Resend for sending verification emails |
| `EMAIL_FROM` | *(optional)* Sender address (default: `GradePoints <onboarding@resend.dev>`) |

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── adjustments/    # Bonus/malus CRUD
│   │   ├── grades/         # Grade CRUD
│   │   ├── register/       # User registration + email verification
│   │   └── verify/         # Email verification endpoint
│   ├── dashboard/
│   │   ├── components/     # SubjectCard, FinalsCard, OverviewCard, etc.
│   │   ├── DashboardContext.tsx  # Shared state via React Context
│   │   ├── stats/          # Statistics page with charts
│   │   ├── types.ts        # TypeScript interfaces
│   │   └── utils.ts        # Helper functions
│   ├── login/              # Login page
│   ├── register/           # Registration page
│   └── verify/             # Email verification result page
├── lib/
│   ├── auth.ts             # NextAuth configuration
│   ├── auth.config.ts      # Auth callbacks & middleware config
│   ├── email.ts            # Resend email + token verification
│   ├── prisma.ts           # Prisma client initialization
│   └── semesters.ts        # Semester/subject definitions
└── proxy.ts                # Auth middleware
```

## Deployment

The app is deployed on Vercel. Make sure all environment variables are set in your Vercel project settings, then push to your connected Git branch.

```bash
git push
```

Vercel will automatically build and deploy.
