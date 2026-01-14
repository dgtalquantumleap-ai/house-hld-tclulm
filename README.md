# House HLD

This app was built using [Natively.dev](https://natively.dev) - a platform for creating mobile apps.

Made with 💙 for creativity.

## Environment Setup

### Supabase Configuration

This project uses Supabase for backend services. Environment variables are configured using `.env.local` for local development.

#### Setup Instructions

1. Create a `.env.local` file in the project root (this file is git-ignored)
2. Add your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

The Supabase client in `lib/supabase.ts` will automatically load these environment variables with the following priority:
1. `app.json` extra config (for EAS builds)
2. Environment variables from `.env.local` (local development)
3. Hardcoded fallback values

#### File Priority

- `.env.local` - Local development (git-ignored, highest priority for local env)
- `.env` - Default environment variables (committed to repo)
- `app.json` - Expo configuration with extra Supabase config
- `eas.json` - EAS Build configuration for different build profiles

**Note:** `.env.local` takes precedence over `.env` and is not committed to version control.
