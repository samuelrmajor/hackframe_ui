# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

Supabase - frame_hack:
Tables:
app_settings
widget_discord
widget_stattrak


How Accounts Work:


How each widget works:

CalenderWidget
DiscordWidget
- Two Parts:
  - Discord Bot:
    - Github: https://github.com/samuelrmajor/hackframe_discord_bot
    - Running on Render:
      - https://dashboard.render.com/project/prj-d4t24qfdiees73apgie0/settings
      - Login: samuelrmajor@gmail.com
      - Project: mwt_discord_bot
    - Functionality:
      - Upon user updating their voice state, the bot will get all the users' voice states & update the server id's row in widget_discord in the supabase server directly from the bot -> db via the supabase client.
  - Supabase Broadcast
    - Will broadcast to the relevant users every time the thing is updated on topic widget_discord:{id}:update with event discord_update
    - See SQL Editor / BroadCasts / Widget_Discord

FantasyWidget
 - Just pulls in the sleeper data directly from client and parses it. Has some caching
HockeyScoreWidget
 - Supabase Edge Function nhl-widget -> the user's client polls the thing every x seconds
MiscWidget
StattrakWidget
 - Users subscribe to the topic abc with event xyz
 - Every n seconds, there is a cron job in supabase db running that calls to supabase edge function stattrak-from-steam
 - this calls the steam api, if there is an update to the stattrak number, the edge function updates the table which triggers broadcast to user
 - Update todo: This should just poll from the client, as there is a bottleneck here to due steam api ratelimiting
TopBar
 - Just a bunch of stuff, simple, in client

UploadedPhotosWidget
- Needs work, but basically there is a storage bucket called "images" & users have access to this bucket.
- The images are pulled down and cached or whatever - then they are rendered on screen
- TODO: actually creating the bucket as i did this manually for davids fake account




TODOS:
 - Update email service to use my custom domain
 - Update account creation to create an image bucket
 - allow users to upload and delete their images
