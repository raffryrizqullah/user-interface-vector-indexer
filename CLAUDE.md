# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development server**: `npm run dev` (uses Next.js with Turbopack for fast builds)
- **Production build**: `npm run build` (builds with Turbopack optimization)
- **Production server**: `npm run start`
- **Linting**: `npm run lint` (uses ESLint with Next.js config)

## Technology Stack

- **Framework**: Next.js 15.5.0 with App Router
- **Runtime**: React 19.1.0
- **Styling**: Tailwind CSS v4 with PostCSS
- **UI Components**: Headless UI v2.2.7 and Heroicons v2.2.0
- **Build Tool**: Turbopack (Next.js built-in)
- **Language**: TypeScript 5.x

## Architecture

This is a Next.js App Router application with the following structure:

- **App Directory**: Uses `src/app/` structure for pages and layouts
- **Path Aliases**: `@/*` maps to `./src/*` for cleaner imports
- **Styling System**:
  - Tailwind CSS v4 with custom theme configuration
  - CSS custom properties for theming (light/dark mode support)
  - Geist Sans and Geist Mono fonts from Google Fonts

## UI Framework Integration

The project uses Headless UI React components with Heroicons for consistent, accessible UI patterns. This ecosystem provides:

### Heroicons (316 icons total)

**4 Icon Variants:**

- **Outline** (24x24px, 1.5px stroke) - Minimalist style for primary UI elements
- **Solid** (24x24px, filled) - Bold style for visual emphasis
- **Mini** (20x20px) - Compact icons for dense UI layouts
- **Micro** (16x16px) - Smallest icons for mobile/tight spaces

### Headless UI React Components

**Philosophy:** Unstyled, fully accessible UI components that integrate seamlessly with Tailwind CSS

**Core Components Available:**

- **Interactive:** Menu, Dialog, Disclosure, Popover, Tabs, Transition
- **Forms:** Button, Checkbox, Combobox, Input, Listbox, Radio Group, Select, Switch, Textarea

**Key Features:**

- **Accessibility:** Full keyboard navigation, ARIA attributes, screen reader support
- **Styling Flexibility:** Data attributes (`data-hover`, `data-active`) and render props
- **State Management:** Built-in focus trapping, state tracking, transition lifecycle
- **Integration:** Seamless with Tailwind CSS classes and animations

### Tailwind UI Blocks Integration

**Available Elements:** Autocomplete, Command palette, Dialog, Disclosure, Dropdown menu, Popover, Select, Tabs

**Implementation Strategy:**

1. Start with monolithic components from Tailwind UI blocks
2. Progressively extract into smaller, reusable components
3. Use local data variables for better readability
4. Leverage Headless UI for logic + Tailwind CSS for styling

**Integration Pattern:**

- **Headless UI** → Provides logic & accessibility
- **Heroicons** → Visual icons and graphics
- **Tailwind CSS** → Styling and theming
- **Tailwind UI Blocks** → Pre-built component patterns

## Code Conventions

- **TypeScript**: Strict mode enabled with ES2017 target
- **ESLint**: Configured with Next.js core web vitals and TypeScript rules
- **Component Structure**: Follow the example in `knowledge-base/simple_card.jsx` for Tailwind UI patterns
- **Import Paths**: Use `@/` prefix for local imports

### UI Component Development Guidelines

**Headless UI Integration:**

- Always leverage Headless UI components for interactive elements (menus, dialogs, forms)
- Use data attributes for conditional styling: `data-hover:`, `data-active:`, `data-closed:`
- Implement render props when dynamic state access is needed
- Ensure full keyboard navigation and accessibility compliance

**Icon Usage:**

- **Outline icons** for primary navigation and main actions
- **Solid icons** for completed states, emphasis, or call-to-action buttons
- **Mini icons** (20px) for secondary actions, inline elements
- **Micro icons** (16px) for compact mobile interfaces, badges, indicators

**Knowledge Base Resources:**

- Reference `knowledge-base/link-resource.md` for official documentation links
- Use `knowledge-base/simple_card.jsx` as pattern template for Tailwind UI components
- Follow Tailwind UI implementation strategies: start monolithic, then extract reusable parts

## Safety Features

This system implements several safety mechanisms:

- **Comprehensive error handling**: Detailed error responses with context

### Core Principles of Clean Code

### 1. Use Clear and Descriptive Names

Use clear names for variables and functions so the code can explain its own purpose (self-documenting).

- **Variables:** Avoid vague names like `x` or `data`. Use specific names, for example, `userCount` or `productPrice`.
- **Functions:** Avoid generic names like `doSomething()` or `processData()`. Use names that describe the action being performed, such as `calculateTotalPrice()` or `validateUserInput()`.

### 2. Apply the Single Responsibility Principle

Each function should be responsible for **one specific task**. Do not create functions that do many things at once.

- **Bad Example:** A single `processOrder()` function that performs validation, calculates the price, saves to the database, and sends a notification.
- **Good Example:** Break that function down into smaller, focused functions:
  - `validateOrder()`
  - `calculateOrderPrice()`
  - `saveOrderToDatabase()`
  - `sendOrderNotification()`

This makes the code more modular, easier to test, and easier to understand.

### 3. Avoid Code Repetition (Don't Repeat Yourself - DRY)

Do not write the same block of code repeatedly in different parts of the application. If you find duplicated code, extract it into a **reusable function or module**.

- **Benefits:**
  - **Efficient:** Changes only need to be made in one place.
  - **Reliable:** Reduces the risk of bugs from inconsistent changes.
  - **Maintainable:** The code becomes more concise and organized.

## Important Instructions

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (\*.md) or README files. Only create documentation files if explicitly requested by the User.
