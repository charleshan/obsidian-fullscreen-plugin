## Obsidian fullscreen plugin

Adds a command to enable fullscreen focus mode for the current active leaf from the command palette or by a keyboard shortcut. `Esc` (or running the command again) returns obsidian back to the previous layout.

Desktop only.

### Fork changes

Forked from [Razumihin/obsidian-fullscreen-plugin](https://github.com/Razumihin/obsidian-fullscreen-plugin).

- Fixed the plugin failing to load on Obsidian 1.14+ (`Class constructor cannot be invoked without 'new'`): build now targets ES2018 with esbuild instead of ES5 with rollup.
- Marked desktop only.
- The command toggles fullscreen off as well as on.
- Menus, modals, and notices opened during fullscreen are moved back to `<body>` on exit, and listeners no longer leak between sessions.
- Fullscreen view uses the theme background instead of a black backdrop.
- Works in popout windows.

### Development

```bash
npm install
cp .env.example .env   # set OBSIDIAN_VAULT to deploy builds into a vault
npm run build
```
