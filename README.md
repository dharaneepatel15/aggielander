# Aggielander

Your student calendar and campus events, together. Built with Next.js; the app itself lives in
[`public/aggielander.html`](public/aggielander.html) and is served at `/` (see `next.config.ts`).

## Run it locally

Needs [Node.js](https://nodejs.org) LTS and git.

```bash
git clone https://github.com/dharaneepatel15/aggielander.git
cd aggielander
npm install
npm run dev
```

Open http://localhost:3000. Edits to `public/aggielander.html` show up on refresh.

## Ship it

Push to `main`. Once the repo is imported into Vercel, every push redeploys automatically.

```bash
git add .
git commit -m "describe the change"
git push
```

API keys go in a `.env.local` file (already git-ignored) and in Vercel → Project → Settings →
Environment Variables. Never commit them.
