# @vibe/ui-components

A professional, production-ready React UI component library for Vibe-Coding-Apps. Built with TypeScript, Tailwind CSS, and accessibility in mind.

## Overview

`@vibe/ui-components` is a comprehensive UI component library that provides a consistent design system across all Vibe applications. Each component is carefully crafted to be accessible, performant, and developer-friendly.

## Features

- 🎨 **Beautiful & Modern** - Clean, professional designs that work out of the box
- 🎯 **TypeScript First** - Full type safety with comprehensive TypeScript definitions
- ⚡ **Lightweight** - Minimal dependencies, tree-shakeable, and optimized for performance
- 🔧 **Fully Customizable** - Extend styles with Tailwind classes or custom CSS
- 📱 **Responsive** - Mobile-first design that works on all screen sizes
- ♿ **Accessible** - WCAG 2.1 AA compliant with proper ARIA attributes
- 🧪 **Well Tested** - 105+ unit tests ensuring reliability and stability
- 📦 **Multiple Exports** - CommonJS and ESM support for maximum compatibility

## Installation

```bash
# Using pnpm (recommended)
pnpm add @vibe/ui-components

# Using npm
npm install @vibe/ui-components

# Using yarn
yarn add @vibe/ui-components
```

### Peer Dependencies

This library requires React 18+:

```bash
pnpm add react react-dom
```

## Quick Start

```tsx
import { Button, Input, Card, Modal, Toast } from '@vibe/ui-components';

function App() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Card padding="lg" variant="elevated">
      <h2 className="text-xl font-bold mb-4">Login</h2>

      <Input
        label="Email"
        type="email"
        placeholder="Enter your email"
        required
      />

      <Input
        label="Password"
        type="password"
        placeholder="Enter your password"
        required
      />

      <Button
        variant="primary"
        size="md"
        onClick={() => setIsOpen(true)}
        className="w-full mt-4"
      >
        Submit
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Success"
      >
        <p>Login successful!</p>
      </Modal>
    </Card>
  );
}
```

## Available Components

The library includes 9 core components covering common UI needs:

- **Button** - Interactive buttons with multiple variants and loading states
- **Input** - Form inputs with labels, validation, and helper text
- **Card** - Container component for grouping content
- **Modal** - Dialog overlays for focused interactions
- **Toast** - Non-blocking notifications with auto-dismiss
- **Avatar** - User profile images with initials fallback and status indicators
- **Badge** - Labels and tags for categorization
- **Spinner** - Loading indicators
- **ErrorBoundary** - Error handling wrapper for React components

## Component Documentation

### Button

Versatile button component with multiple variants, sizes, and loading states.

```tsx
import { Button } from '@vibe/ui-components';

// Basic usage
<Button variant="primary" size="md">
  Click me
</Button>

// With loading state
<Button variant="primary" isLoading>
  Submitting...
</Button>

// With icons
<Button
  variant="outline"
  leftIcon={<SaveIcon />}
  rightIcon={<ArrowIcon />}
>
  Save Changes
</Button>

// Disabled state
<Button variant="danger" isDisabled>
  Delete
</Button>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'danger'` | `'primary'` | Visual style variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| `isLoading` | `boolean` | `false` | Shows loading spinner |
| `isDisabled` | `boolean` | `false` | Disables button interaction |
| `leftIcon` | `React.ReactNode` | - | Icon displayed on the left |
| `rightIcon` | `React.ReactNode` | - | Icon displayed on the right |
| `className` | `string` | - | Additional CSS classes |

Extends all standard HTML button attributes (`onClick`, `type`, etc.).

### Input

Form input component with built-in label, validation, and helper text support.

```tsx
import { Input } from '@vibe/ui-components';

// Basic usage
<Input
  label="Username"
  placeholder="Enter username"
  required
/>

// With validation error
<Input
  label="Email"
  type="email"
  error="Please enter a valid email address"
  isInvalid
/>

// With helper text
<Input
  label="Password"
  type="password"
  helperText="Must be at least 8 characters"
/>

// With icons/elements
<Input
  label="Search"
  leftElement={<SearchIcon />}
  rightElement={<ClearButton />}
  placeholder="Type to search..."
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Input label text |
| `error` | `string` | - | Error message to display |
| `helperText` | `string` | - | Helper text below input |
| `isInvalid` | `boolean` | `false` | Mark input as invalid |
| `leftElement` | `React.ReactNode` | - | Element displayed on the left |
| `rightElement` | `React.ReactNode` | - | Element displayed on the right |
| `className` | `string` | - | Additional CSS classes |

Extends all standard HTML input attributes (`type`, `placeholder`, `required`, `disabled`, etc.).

### Card

Container component for grouping related content with various visual styles.

```tsx
import { Card } from '@vibe/ui-components';

// Basic usage
<Card>
  <h2>Card Title</h2>
  <p>Card content goes here</p>
</Card>

// Elevated card with hover effect
<Card variant="elevated" padding="lg" hoverable>
  <h3 className="text-lg font-bold mb-2">Feature Card</h3>
  <p>This card has a shadow and hover effect</p>
</Card>

// Outlined card with custom padding
<Card variant="outlined" padding="sm">
  <p>Compact card with border</p>
</Card>

// Filled card with no padding (for images)
<Card variant="filled" padding="none">
  <img src="/image.jpg" alt="Content" className="w-full" />
  <div className="p-4">
    <p>Image card</p>
  </div>
</Card>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'elevated' \| 'outlined' \| 'filled'` | `'elevated'` | Visual style variant |
| `padding` | `'none' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Internal padding size |
| `hoverable` | `boolean` | `false` | Adds hover effect and cursor pointer |
| `className` | `string` | - | Additional CSS classes |

Extends all standard HTML div attributes.

### Modal

Dialog component for focused user interactions, rendered using React portals.

```tsx
import { Modal } from '@vibe/ui-components';

function MyComponent() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Confirm Action"
        size="md"
      >
        <p className="mb-4">Are you sure you want to proceed?</p>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirm}>
            Confirm
          </Button>
        </div>
      </Modal>
    </>
  );
}

// Large modal without close button
<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Terms and Conditions"
  size="xl"
  showCloseButton={false}
  closeOnOverlayClick={false}
>
  <div className="prose">
    {/* Long content */}
  </div>
</Modal>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | **required** | Controls modal visibility |
| `onClose` | `() => void` | **required** | Callback when modal closes |
| `title` | `string` | - | Modal title in header |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'` | `'md'` | Modal width |
| `closeOnOverlayClick` | `boolean` | `true` | Close when clicking outside |
| `showCloseButton` | `boolean` | `true` | Show X button in header |
| `children` | `React.ReactNode` | **required** | Modal content |

**Features:**
- Automatically locks body scroll when open
- Uses React portals for proper z-index handling
- Keyboard accessibility support
- Smooth fade-in animations

### Badge

Label component for status indicators, tags, and categories.

```tsx
import { Badge } from '@vibe/ui-components';

// Status badges
<Badge variant="success">Active</Badge>
<Badge variant="danger">Inactive</Badge>
<Badge variant="warning">Pending</Badge>

// Different sizes
<Badge variant="info" size="sm">Small</Badge>
<Badge variant="info" size="md">Medium</Badge>
<Badge variant="info" size="lg">Large</Badge>

// Rounded pill style
<Badge variant="primary" rounded>
  New Feature
</Badge>

// With counts
<Badge variant="neutral" rounded>
  Messages <span className="ml-1 font-bold">12</span>
</Badge>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'success' \| 'warning' \| 'danger' \| 'info' \| 'neutral'` | `'neutral'` | Color scheme |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Badge size |
| `rounded` | `boolean` | `false` | Use pill/rounded style |
| `children` | `React.ReactNode` | **required** | Badge content |

### Spinner

Loading indicator with customizable size, color, and optional label.

```tsx
import { Spinner } from '@vibe/ui-components';

// Basic usage
<Spinner />

// With label
<Spinner label="Loading..." />

// Different sizes
<Spinner size="sm" />
<Spinner size="md" />
<Spinner size="lg" />
<Spinner size="xl" />

// Different colors
<Spinner color="primary" />
<Spinner color="secondary" />
<Spinner color="white" /> // For dark backgrounds

// Full page loading
<div className="min-h-screen flex items-center justify-center">
  <Spinner size="xl" label="Loading application..." />
</div>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Spinner size |
| `color` | `'primary' \| 'secondary' \| 'white'` | `'primary'` | Spinner color |
| `label` | `string` | - | Optional loading text |

### Avatar

User profile image component with automatic initials fallback and status indicators.

```tsx
import { Avatar } from '@vibe/ui-components';

// With image
<Avatar
  src="/profile.jpg"
  alt="User profile"
  size="md"
/>

// With initials fallback
<Avatar
  name="John Doe"
  size="md"
/>

// With status indicator
<Avatar
  src="/profile.jpg"
  name="Jane Smith"
  size="lg"
  status="online"
/>

// Different sizes
<Avatar name="A" size="xs" />
<Avatar name="AB" size="sm" />
<Avatar name="John Doe" size="md" />
<Avatar name="Jane Smith" size="lg" />
<Avatar name="Big Avatar" size="xl" />

// Status variations
<Avatar name="User" status="online" />   // Green
<Avatar name="User" status="away" />     // Yellow
<Avatar name="User" status="busy" />     // Red
<Avatar name="User" status="offline" />  // Gray
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | `string` | - | Image URL |
| `alt` | `string` | - | Image alt text |
| `name` | `string` | - | User name for initials fallback |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Avatar size |
| `status` | `'online' \| 'offline' \| 'away' \| 'busy'` | - | Status indicator |

**Features:**
- Automatically generates initials from name (up to 2 characters)
- Displays "?" if no image or name is provided
- Status indicator positioned at bottom-right
- Responsive sizing

### Toast

Non-blocking notification component with auto-dismiss functionality.

```tsx
import { Toast } from '@vibe/ui-components';

// Toast notification manager example
function ToastManager() {
  const [toasts, setToasts] = React.useState([]);

  const showToast = (message, type = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <>
      <Button onClick={() => showToast('Operation successful!', 'success')}>
        Show Success
      </Button>
      <Button onClick={() => showToast('An error occurred', 'error')}>
        Show Error
      </Button>

      {toasts.map(toast => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          duration={5000}
          onClose={removeToast}
        />
      ))}
    </>
  );
}

// Different toast types
<Toast id="1" message="Success message" type="success" onClose={handleClose} />
<Toast id="2" message="Error message" type="error" onClose={handleClose} />
<Toast id="3" message="Warning message" type="warning" onClose={handleClose} />
<Toast id="4" message="Info message" type="info" onClose={handleClose} />

// Custom duration (10 seconds)
<Toast
  id="5"
  message="This will stay for 10 seconds"
  type="info"
  duration={10000}
  onClose={handleClose}
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | `string` | **required** | Unique toast identifier |
| `message` | `string` | **required** | Toast message text |
| `type` | `'success' \| 'error' \| 'warning' \| 'info'` | `'info'` | Toast type/color |
| `duration` | `number` | `5000` | Duration in milliseconds |
| `onClose` | `(id: string) => void` | **required** | Callback when toast closes |

**Features:**
- Auto-dismiss after duration
- Manual dismiss with close button
- Smooth fade-in/fade-out animations
- Positioned at bottom-right by default
- Includes type-specific icons
- Uses React portals for proper positioning

### ErrorBoundary

React error boundary component for gracefully handling runtime errors.

```tsx
import { ErrorBoundary } from '@vibe/ui-components';

// Basic usage
<ErrorBoundary>
  <YourApp />
</ErrorBoundary>

// With custom fallback UI
<ErrorBoundary
  fallback={
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold text-red-600">Oops!</h1>
      <p>Something went wrong. Please refresh the page.</p>
    </div>
  }
>
  <YourComponent />
</ErrorBoundary>

// With error logging
<ErrorBoundary
  onError={(error, errorInfo) => {
    // Log to error tracking service
    console.error('Error caught:', error, errorInfo);
    logErrorToService(error, errorInfo);
  }}
  onReset={() => {
    // Reset application state
    resetAppState();
  }}
>
  <Application />
</ErrorBoundary>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `React.ReactNode` | **required** | Components to protect |
| `fallback` | `React.ReactNode` | - | Custom error UI (uses default if not provided) |
| `onError` | `(error: Error, errorInfo: ErrorInfo) => void` | - | Error callback for logging |
| `onReset` | `() => void` | - | Callback when user clicks reset |

**Features:**
- Catches JavaScript errors anywhere in child component tree
- Displays fallback UI instead of crashing the app
- Built-in default error UI with retry functionality
- Shows error details in development mode
- Supports custom error logging/reporting
- Provides reset functionality to recover from errors

**Default Error UI includes:**
- Error icon and message
- Error details (development only)
- Component stack trace (development only)
- Reset button to try recovering
- Refresh page button

## Testing

The library includes comprehensive test coverage with **105+ unit tests** covering:

- Component rendering and props
- User interactions (clicks, inputs, keyboard events)
- Accessibility attributes (ARIA labels, roles)
- Edge cases and error states
- Loading and async behaviors
- Portal rendering (Modal, Toast)
- Error boundary functionality

### Running Tests

```bash
# Run all tests
pnpm test

# Watch mode for development
pnpm test:watch

# Type checking
pnpm type-check
```

## Styling

This library uses Tailwind CSS for styling. Make sure your project has Tailwind CSS installed and configured.

### Tailwind Configuration

Add this library to your Tailwind content paths to ensure proper styling:

```js
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@vibe/ui-components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // Your custom theme extensions
    },
  },
  plugins: [],
};
```

### Custom Styling

All components accept a `className` prop for additional styling:

```tsx
<Button
  variant="primary"
  className="w-full mt-4 shadow-xl"
>
  Custom Styled Button
</Button>

<Card
  variant="outlined"
  className="border-blue-500 border-4"
>
  Custom Card
</Card>
```

## Development

### Building the Library

```bash
# Install dependencies
pnpm install

# Build for production (outputs to ./dist)
pnpm build

# Development mode with watch
pnpm dev

# Clean build artifacts
pnpm clean
```

### Code Quality

```bash
# Run linter
pnpm lint

# Type checking
pnpm type-check

# Run all tests
pnpm test

# Watch mode for TDD
pnpm test:watch
```

### Storybook

Interactive component documentation and development environment:

```bash
# Start Storybook dev server
pnpm storybook

# Build static Storybook site
pnpm build-storybook
```

## Package Information

- **Package Name:** `@vibe/ui-components`
- **Version:** 1.0.0
- **License:** MIT
- **Module Formats:** CommonJS, ES Modules
- **TypeScript:** Full type definitions included
- **Peer Dependencies:** React 18+
- **Bundle Size:** Optimized and tree-shakeable

## Contributing

When contributing to this library:

1. Ensure all components are fully typed with TypeScript
2. Write comprehensive unit tests for new components
3. Follow existing component patterns and naming conventions
4. Include accessibility attributes (ARIA labels, roles, etc.)
5. Test components across different screen sizes
6. Update this README with new component documentation

## Architecture

```
packages/ui-components/
├── src/
│   ├── Avatar/           # Avatar component
│   ├── Badge/            # Badge component
│   ├── Button/           # Button component
│   ├── Card/             # Card component
│   ├── ErrorBoundary/    # Error boundary component
│   ├── Input/            # Input component
│   ├── Modal/            # Modal component
│   ├── Spinner/          # Spinner component
│   ├── Toast/            # Toast component
│   ├── __tests__/        # Component tests
│   └── index.ts          # Main export file
├── dist/                 # Built output (generated)
├── package.json          # Package configuration
├── tsconfig.json         # TypeScript config
└── vitest.config.ts      # Test configuration
```

## License

MIT License - See package.json for details.

## Support

For issues, questions, or contributions, please refer to the main Vibe-Coding-Apps repository.
