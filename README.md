# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

## Runtime setup (backend + Supabase)

1. Configure env:
```sh
cp .env.development .env.local
```
Then fill:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MASSIVE_API_KEY`
- `RATE_LIMIT_DAILY_MAX` (default `200`)
- `RATE_LIMIT_WHITELIST` (comma-separated IP list)

2. Start backend proxy:
```sh
npm run backend:dev
```

3. Start frontend:
```sh
npm run dev
```

4. Create Supabase table:
- Run SQL in [`supabase/strategies.sql`](./supabase/strategies.sql).

## Cloudflare backend deployment (Worker)

Backend is now deployable as a Cloudflare Worker with the same API routes:
- `/api/backtest`
- `/api/leaderboard/live`
- `/api/identity`
- `/api/strategies`

Required Worker secrets:
- `MASSIVE_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional Worker vars (already in `wrangler.toml` defaults):
- `SUPABASE_TABLE` (default: `strategies`)
- `RATE_LIMIT_DAILY_MAX` (default: `200`)
- `RATE_LIMIT_WHITELIST` (comma-separated IPs)
- `LEADERBOARD_REFRESH_MS` (default: `20000`)

Commands:
```sh
# local worker dev
npm run backend:cf:dev

# deploy worker
npm run backend:cf:deploy
```

If your Cloudflare build command is still `npm run backend:production`, it is now a no-op build step (won't hang).

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
