# React + Vite Template

A modern React template for web applications and games, featuring React 18, Vite, TailwindCSS, and Material UI.

## Project Structure

```
├── src/
│   ├── App.jsx          # Main application component
│   ├── main.jsx         # Application entry point
│   └── index.css        # Global styles (Tailwind)
├── public/              # Static assets
├── index.html           # HTML template
├── vite.config.js       # Vite configuration
├── tailwind.config.js   # Tailwind configuration
├── postcss.config.js    # PostCSS configuration
└── eslint.config.js     # ESLint configuration
```

## Development Guidelines

- Modify `index.html` and `src/App.jsx` as needed
- Create new folders or files in `src/` directory as needed
- Style components using TailwindCSS utility classes
- Avoid modifying `src/main.jsx` and `src/index.css`
- Only modify `vite.config.js` if absolutely necessary

## Environment Configuration

Create a local `.env` file by copying from the provided example and then
filling in your actual Supabase credentials:

```bash
cp .env.example .env
```

The resulting `.env` file is listed in `.gitignore` so it will not be committed
to the repository.

Set `VITE_APP_BASE_URL` to the public URL of your deployed app so invitation
links in emails point to the correct domain.

### Supabase setup

Run the provided SQL files to initialize the database and storage. In addition
to the existing setup scripts, execute the following to enable public video
uploads and allow invited users to access events:

```sql
\i supabase_create_videos_bucket.sql
\i supabase_configure_videos_bucket_policies.sql
\i supabase_get_invited_events_function.sql
\i supabase_get_user_events_function.sql
\i supabase_update_events_read_policy.sql
\i supabase_allow_invited_event_access.sql
```

These scripts create a public `videos` bucket and configure row level security
policies so users can upload clips without authentication. They also set up a
helper function for checking invitation access.

## Available Scripts
- `pnpm install` - Install dependencies
- `pnpm run dev` - Start development server
- `pnpm run lint` - Lint source files
- `pnpm run build` - Build the project for production
- `pnpm run start:server` - Launch the Express API server

## Tech Stack

- React
- Vite
- TailwindCSS
- ESLint
- Javascript
