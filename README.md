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

## Available Scripts
- `pnpm install` - Install dependencies
- `pnpm run dev` - Start development server
- `pnpm run lint` - Lint source files
- `pnpm run build` - Build the project for production

## Tech Stack

- React
- Vite
- TailwindCSS
- ESLint
- Javascript

## Environment Variables

Copy `.env.example` to `.env` and replace the placeholder values with your Supabase credentials.

## Getting Started

```bash
pnpm install
pnpm run dev
```
The project can be built for production with:

```bash
pnpm run build
```

You can run the Supabase SQL scripts using the Supabase dashboard or with a command-line tool such as `psql`.
