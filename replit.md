# Reputa Score

## Overview
A React + TypeScript application built with Vite and Tailwind CSS v4. This is a Pi Network application that calculates reputation scores.

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite 6
- **Styling**: Tailwind CSS 4.1, MUI, Radix UI components
- **Build Tool**: Vite with React plugin
- **Package Manager**: npm

## Project Structure
```
├── src/
│   ├── app/          # Application components
│   ├── assets/       # Static assets
│   ├── styles/       # CSS styles
│   └── main.tsx      # Entry point
├── public/           # Public static files
├── api/              # API routes (Vercel)
├── index.html        # HTML template
├── vite.config.ts    # Vite configuration
└── package.json      # Dependencies
```

## Development
- Server runs on port 5000
- Run with `npm run dev`

## Deployment
- Static deployment with build command: `npm run build`
- Output directory: `dist`

## Recent Changes
- January 28, 2026: Configured for Replit environment (port 5000, host 0.0.0.0, allowed all hosts)
