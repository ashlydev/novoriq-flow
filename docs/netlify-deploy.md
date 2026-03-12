# Netlify Deployment

Netlify uses [netlify.toml](/home/falcon/Desktop/NOVORIQ%20FLOW/netlify.toml) as the repo-level deploy contract for this project.

## Repo Hosting Contract

- framework: Next.js
- node version: `22`
- build command: `npm run build`
- publish directory: `.next`
- functions bundler: `esbuild`

## Required Environment Variables

- `DATABASE_URL`

Without `DATABASE_URL`, the app still builds and runs, but the server-backed runtime snapshot API falls back to unavailable mode and the product behaves like browser-local demo storage.

## Netlify Dashboard Steps

1. Import `ashlydev/novoriq-flow` from GitHub.
2. Let Netlify read `netlify.toml`.
3. Set `DATABASE_URL` in Site configuration -> Environment variables.
4. Deploy the site.

## Runtime Notes

- Dynamic Next.js routes are supported.
- The server snapshot endpoint is available at `/api/runtime-snapshots/[key]`.
- Browser session selection remains per-browser even when server-backed business state is enabled.
