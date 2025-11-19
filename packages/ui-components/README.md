# @vibe/ui-components

Shared React UI component library for Vibe-Coding-Apps.

## Features

- 🎨 Beautiful, accessible components
- 🎯 TypeScript first
- ⚡ Lightweight and performant
- 🔧 Fully customizable
- 📱 Responsive by default
- ♿ WCAG compliant

## Installation

```bash
pnpm add @vibe/ui-components
```

## Usage

```tsx
import { Button, Input, Card, Modal } from '@vibe/ui-components';

function App() {
  return (
    <Card padding="lg">
      <Input
        label="Email"
        type="email"
        placeholder="Enter your email"
      />
      <Button variant="primary" size="md">
        Submit
      </Button>
    </Card>
  );
}
```

## Components

### Button

```tsx
<Button variant="primary" size="md" isLoading={false}>
  Click me
</Button>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
- `size`: 'sm' | 'md' | 'lg'
- `isLoading`: boolean
- `isDisabled`: boolean
- `leftIcon`: React.ReactNode
- `rightIcon`: React.ReactNode

### Input

```tsx
<Input
  label="Username"
  placeholder="Enter username"
  error="Username is required"
  helperText="Choose a unique username"
/>
```

**Props:**
- `label`: string
- `error`: string
- `helperText`: string
- `isInvalid`: boolean
- `leftElement`: React.ReactNode
- `rightElement`: React.ReactNode

### Card

```tsx
<Card variant="elevated" padding="md" hoverable>
  <h2>Card Title</h2>
  <p>Card content goes here</p>
</Card>
```

**Props:**
- `variant`: 'elevated' | 'outlined' | 'filled'
- `padding`: 'none' | 'sm' | 'md' | 'lg'
- `hoverable`: boolean

### Modal

```tsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Modal Title"
  size="md"
>
  <p>Modal content</p>
</Modal>
```

**Props:**
- `isOpen`: boolean
- `onClose`: () => void
- `title`: string
- `size`: 'sm' | 'md' | 'lg' | 'xl' | 'full'
- `closeOnOverlayClick`: boolean
- `showCloseButton`: boolean

### Badge

```tsx
<Badge variant="success" size="md" rounded>
  Active
</Badge>
```

**Props:**
- `variant`: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'
- `size`: 'sm' | 'md' | 'lg'
- `rounded`: boolean

### Spinner

```tsx
<Spinner size="md" color="primary" label="Loading..." />
```

**Props:**
- `size`: 'sm' | 'md' | 'lg' | 'xl'
- `color`: 'primary' | 'secondary' | 'white'
- `label`: string

### Avatar

```tsx
<Avatar
  src="/avatar.jpg"
  name="John Doe"
  size="md"
  status="online"
/>
```

**Props:**
- `src`: string
- `alt`: string
- `name`: string
- `size`: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
- `status`: 'online' | 'offline' | 'away' | 'busy'

### Toast

```tsx
import { Toast } from '@vibe/ui-components';

<Toast
  id="toast-1"
  message="Success!"
  type="success"
  duration={5000}
  onClose={(id) => console.log('Closed', id)}
/>
```

**Props:**
- `id`: string
- `message`: string
- `type`: 'success' | 'error' | 'warning' | 'info'
- `duration`: number (in ms)
- `onClose`: (id: string) => void

## Styling

This library uses Tailwind CSS for styling. Make sure your project has Tailwind CSS installed and configured.

### Tailwind Configuration

Add this library to your Tailwind content:

```js
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@vibe/ui-components/**/*.{js,ts,jsx,tsx}',
  ],
  // ... rest of config
};
```

## Storybook

View all components in Storybook:

```bash
pnpm storybook
```

## Development

```bash
# Build
pnpm build

# Watch mode
pnpm dev

# Run tests
pnpm test

# Lint
pnpm lint
```

## License

MIT
