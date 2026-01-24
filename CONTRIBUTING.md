# Contributing to Actions Wrangler

Thanks for your interest in contributing to Actions Wrangler! This document provides guidelines for contributing to the project.

## Development Setup

### Prerequisites

- Node.js (v18 or later)
- npm
- `rsvg-convert` for icon generation (install via `brew install librsvg` on macOS)

### Getting Started

1. Fork and clone the repository:
   ```bash
   git clone https://github.com/your-username/actions-wrangler.git
   cd actions-wrangler
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Load the extension in Chrome:
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

### Development Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Build for production |
| `npm run watch` | Watch mode for development |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run clean` | Remove dist folder |
| `npm run package` | Create distributable zip file |

### Rebuilding Icons

If you modify the SVG icons in `assets/`, rebuild the PNGs:

```bash
make clean && make
```

## Project Structure

```
actions-wrangler/
├── src/               # TypeScript source files
│   ├── content.ts     # Main content script (runs on GitHub)
│   ├── background.ts  # Service worker (icon switching)
│   └── popup.ts       # Extension popup
├── assets/            # Source SVG icons
├── dist/              # Built extension (generated)
├── manifest.json      # Extension manifest
└── popup.html         # Popup UI
```

## Making Changes

1. Create a branch for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and test thoroughly

3. Run type checking:
   ```bash
   npm run typecheck
   ```

4. Commit your changes with a clear message:
   ```bash
   git commit -m "Add feature: description of your changes"
   ```

5. Push and open a pull request

## Code Style

- Use TypeScript for all new code
- Follow existing patterns in the codebase
- Keep functions small and focused
- Add comments for complex logic

## Reporting Issues

When reporting issues, please include:

- Browser version
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

## Questions?

Feel free to open an issue for any questions or discussions.
