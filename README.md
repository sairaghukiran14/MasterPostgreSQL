# 🐘 Master PostgreSQL — 140 Hands-On Challenges

Learn and master PostgreSQL **fast** by *writing real SQL against a real database*.
This app boots an actual PostgreSQL engine **inside your browser** (via
[PGlite](https://pglite.dev) / WebAssembly — no server, no signup, no Docker),
gives you **14 topics × 10 challenges = 140 exercises** from Beginner to Expert,
and **auto-grades** every answer by comparing your result to a reference solution.

## Quick start

```bash
npm start          # serves the app at http://localhost:5173
```

Then open **http://localhost:5173** in your browser. (First load fetches ~3 MB of
WASM from a CDN, so you need an internet connection the first time.)

`npm start` runs a tiny no-cache dev server (`server.mjs`). No build step — any
static file server works too, e.g. `python3 -m http.server 5173`.

The UI is **fully responsive**: on phones/tablets the topic list collapses into a
slide-in drawer (tap **☰**), the editor toolbar stacks, and the schema view goes
full-screen; on desktop the sidebar stays pinned.

## Learn, then practice

Every topic opens with a **📚 Concepts to learn** card: a short summary plus the
key ideas for that topic, each with a one-line explanation and a tiny SQL example
(e.g. `OVER()`, `PARTITION BY`, `LEFT JOIN`, `ON CONFLICT`). Read it first, then
solve the 10 challenges to lock it in. The card is collapsible (your choice is
remembered) so it stays out of the way once a topic clicks.

## How to use it

1. Pick a topic in the sidebar and a challenge.
2. Read the prompt, write SQL in the editor.
3. **Run ▶** to see your result. **Check answer ✓** to grade it.
4. Stuck? Tap **Hint**, or **Show solution**.
5. Solved challenges get a ✓ and your progress is saved locally (localStorage).

Keyboard: `⌘/Ctrl + Enter` = Run · `Shift + Enter` = Check · `Tab` = indent.

Click **Schema** (top right) any time to see the tables you're querying.

## The learning path (Beginner → Advanced)

| # | Topic | Focus |
|---|-------|-------|
| 1 | SELECT Basics | projection, aliases, expressions, DISTINCT, LIMIT |
| 2 | Filtering (WHERE) | comparisons, AND/OR/NOT, BETWEEN, IN, LIKE, NULL |
| 3 | Sorting & Limiting | ORDER BY, LIMIT/OFFSET, NULLS ordering |
| 4 | Aggregate Functions | COUNT, SUM, AVG, MIN, MAX, ROUND, DISTINCT |
| 5 | GROUP BY & HAVING | per-group aggregates and group filters |
| 6 | Joins | INNER, LEFT, self joins, anti-joins, multi-table |
| 7 | Subqueries | scalar, IN, EXISTS, correlated |
| 8 | String, Date & Math | upper/length/substring, to_char/extract, round |
| 9 | CASE & Conditional | CASE, COALESCE, NULLIF, GREATEST/LEAST, FILTER |
| 10 | Set Operations | UNION, UNION ALL, INTERSECT, EXCEPT |
| 11 | Window Functions | ROW_NUMBER, RANK, LAG/LEAD, running totals, PARTITION BY |
| 12 | CTEs & Recursion | WITH, chained CTEs, RECURSIVE, generate_series |
| 13 | JSON / JSONB | `->`, `->>`, containment, array functions, building JSON |
| 14 | Data Modification & DDL | INSERT, UPDATE, DELETE, UPSERT, ALTER, VIEW |

## How grading works

- **Query challenges:** your query and the reference solution run on identical
  fresh copies of the database; the result rows are compared. For most challenges
  row order doesn't matter (rows are compared as a set); for `ORDER BY`-based
  challenges, order is enforced. Column values are normalized so `100`, `100.0`
  and `'100'` all match.
- **Mutation challenges (INSERT/UPDATE/DELETE/DDL):** your statements run on a
  fresh database, then a verification query checks the resulting state against
  the reference.

Because the DB is reset before every check, you can experiment freely — nothing
you do is permanent.

## Verify the content

Every one of the 140 reference solutions is checked against PGlite in CI:

```bash
npm test           # runs test/validate.mjs → "PASS: 140  FAIL: 0"
```

## Project layout

```
index.html          UI shell
css/styles.css      styling
js/seed.js          schema + seed data (company + e-commerce dataset)
js/challenges.js    all 140 challenges + reference solutions
js/app.js           PGlite engine, grading, progress, rendering
server.mjs          tiny no-cache static dev server
test/validate.mjs   validates that every solution executes correctly
```

Happy querying — solve all 140 and you'll have hands-on command of PostgreSQL. 🐘
