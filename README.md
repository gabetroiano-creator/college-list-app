# College List — Admissions Decision Studio

A premium, single-page tool for building, scoring, and deciding a college list.
Add schools, weight 30 decision criteria, work each school through eight
decision frameworks, assign holistic grades, compare schools side by side, and
export a print-ready dossier.

**Live:** https://college-list-app-eight.vercel.app

## Features

- **Dashboard** — tier breakdown, average matrix score, framework completion,
  visit progress, a top-schools leaderboard, grade distribution, action-required
  cards, an auto-saving notepad, and a recent-activity feed.
- **My Schools** — sortable, filterable table (tier, status, visit, framework
  completion, grade) with inline priority stars and a slide-over detail drawer.
- **Add / Edit** — a three-step wizard with validation and live character counts.
- **Decision Matrix** — global weights and per-school scoring across 30 criteria
  in six groups, with a category radar, school overlay, and a live ranking.
- **Framework Evaluator** — eight sequential frameworks, each scored 1–10 with a
  plain-English interpretation, feeding a combined keep/cut recommendation,
  confidence level, and a synthesized summary paragraph.
- **Grades** — A+ → F grading with GPA equivalents, a grade-vs-matrix scatter
  plot, and a distribution chart.
- **Comparison** — 2–4 schools side by side across stats, all 30 criteria, the
  frameworks, and an auto-generated head-to-head analysis.
- **Export** — a print-ready / PDF dossier plus a copy-to-clipboard text version.

## Privacy

There is no backend and no account. All data lives in your browser's
`localStorage` (key `college-list-app-v1`), scoped to your browser and device.
Different visitors to the same URL each have their own separate list; your data
never leaves your browser. Use **Export** to back it up.

## Tech stack

Vite · React · TypeScript · Tailwind CSS · Zustand (with persist middleware) ·
Radix UI primitives · Recharts · lucide-react · react-hot-toast · react-to-print.

## Local development

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build to dist/
npm run preview  # serve the production build locally
```

## Deployment

Hosted on Vercel. With the GitHub repo connected, every push to `main`
auto-deploys to production. To deploy manually instead:

```bash
npx vercel --prod
```
