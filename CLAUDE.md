# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a single-file educational web application called "LA PROGRAMMAZIONE DINAMICA" (Dynamic Programming in Italian). It's an interactive learning platform for dynamic programming concepts built as a standalone HTML file with embedded CSS and JavaScript.

## Architecture

- **Single File Application**: The entire application is contained in `index.html`
- **Frontend Technologies**:
  - Pure HTML5/CSS3/JavaScript (no build system)
  - Pyodide for in-browser Python execution
  - Prism.js for syntax highlighting
  - Chart.js for data visualizations
  - D3.js for interactive visualizations
  - Font Awesome for icons

## Key Features

- **Interactive Learning Platform**: Chapters on dynamic programming with exercises
- **Code Execution**: In-browser Python code execution using Pyodide
- **Adaptive Learning**: Spaced repetition system, progress tracking, achievement system
- **Multi-mode Interface**: Learn mode, practice mode, review mode
- **Dark/Light Theme**: CSS custom properties for theming
- **Gamification**: Achievement system, progress tracking, statistics

## Application State Management

The app uses a global `appState` object to manage:
- User progress and completed exercises
- Spaced repetition scheduling
- Achievement tracking
- Statistics and performance metrics
- Adaptive difficulty levels

## Development

- **No Build Process**: Direct file editing and browser refresh
- **Testing**: Open `index.html` directly in a web browser
- **Python Integration**: Uses Pyodide v0.24.1 for Python execution
- **Responsive Design**: Mobile-first CSS with grid layouts

## Key JavaScript Functions

- `runPythonCode()`: Executes user Python code via Pyodide
- `switchMode()`: Toggles between learn/practice/review modes
- `updateProgressDisplay()`: Updates learning progress UI
- `addToSpacedRepetition()`: Manages spaced repetition system
- `saveState()`/`loadState()`: Local storage persistence

## Styling Architecture

- CSS custom properties for consistent theming
- Dark mode support via `[data-theme="dark"]` attribute
- Responsive grid layouts
- Animation system using CSS transitions and keyframes

### Preferred language
Italiano per testo, commenti e output.

### Coding style
- JS: ES2021, module syntax, camelCase.
- Python negli esercizi: PEP-8, funzioni pure.

### Out of scope
- Niente framework di build (React, Vue, …).
- Restare sito statico (no backend server).

### Roadmap
1. M1–M3 → MVP interattivo.
2. M4–M5 → memoria e progressi.
3. M6–M10 → pieno allineamento con le neuroscienze.