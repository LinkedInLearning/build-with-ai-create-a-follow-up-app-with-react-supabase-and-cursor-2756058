# Followup App

A React application with Tailwind CSS and shadcn/ui for modern styling.

## Features

- ⚡️ Vite for fast development
- ⚛️ React 19 with TypeScript
- 🎨 Tailwind CSS for utility-first styling
- 🧩 shadcn/ui components for beautiful UI
- 🌙 Dark mode support (CSS variables ready)
- 📱 Responsive design

## Getting Started

### Prerequisites

- Node.js (version 20.19.0 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Building

Build for production:

```bash
npm run build
```

## Styling

### Tailwind CSS

This project uses Tailwind CSS for styling. The configuration is in `tailwind.config.js` and includes:

- Custom color palette with CSS variables
- Dark mode support
- Responsive breakpoints
- Animation utilities

### shadcn/ui Components

shadcn/ui components are located in `src/components/ui/`. To add new components:

1. Copy the component code from [shadcn/ui](https://ui.shadcn.com/)
2. Place it in `src/components/ui/`
3. Import and use in your components

### Available Components

- **Button** (`src/components/ui/button.tsx`) - Various button variants and sizes

### Adding New Components

1. Visit [shadcn/ui](https://ui.shadcn.com/)
2. Select the component you want
3. Copy the component code
4. Install any required dependencies
5. Place the component in `src/components/ui/`

## Project Structure

```
src/
├── components/
│   └── ui/           # shadcn/ui components
├── lib/
│   └── utils.ts      # Utility functions
├── App.tsx           # Main app component
├── index.css         # Global styles with Tailwind
└── main.tsx          # App entry point
```

## Customization

### Colors

Colors are defined as CSS variables in `src/index.css`. You can customize the theme by modifying these variables.

### Adding Custom Styles

Add custom styles in `src/index.css` using Tailwind's `@layer` directive:

```css
@layer components {
  .my-custom-class {
    @apply bg-blue-500 text-white;
  }
}
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Dependencies

### Core

- React 19
- TypeScript
- Vite

### Styling

- Tailwind CSS
- shadcn/ui utilities (class-variance-authority, clsx, tailwind-merge)
- Lucide React (icons)

### UI Components

- Radix UI (for shadcn/ui components)
