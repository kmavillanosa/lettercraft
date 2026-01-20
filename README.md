# LetterCraft

A modern, elegant web application for crafting personalized cover letters with customizable templates and dynamic form fields.

## Features

- 📝 Multiple cover letter templates (Upwork, Regular Job Application, etc.)
- 🎨 Beautiful, paper-like UI with cream white theme
- 🔍 Searchable tech stack autocomplete with custom skill support
- 📋 Copy to clipboard functionality
- 📄 Export as PDF or plain text
- 🔗 Shareable links with pre-filled form data
- ⚙️ Configurable default values (name, email, phone)
- 💾 LocalStorage persistence for user preferences

## Tech Stack

- React 19
- TypeScript
- Redux Toolkit
- Vite
- Tailwind CSS (via inline styles)
- jsPDF

## Getting Started

### Prerequisites

- Node.js 20.19+ or 22.12+
- npm

### Installation

```bash
cd app
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed GitHub Pages deployment instructions.

## Project Structure

```
jah-bless/
├── app/                    # Main application directory
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── store/         # Redux store and slices
│   │   ├── utils/         # Utility functions
│   │   └── types/         # TypeScript type definitions
│   ├── public/            # Static assets
│   └── dist/              # Build output (generated)
├── .github/
│   └── workflows/         # GitHub Actions workflows
└── LICENSE.md
```

## License

See [LICENSE.md](./LICENSE.md) for details.

## Credits

Created by [Kim Cyriel S. Avillanosa](https://kmavillanosa.github.io/kmavillanosa)
