# Startup Landing Page

A modern, responsive startup landing page built with React 18, TypeScript, Vite, Tailwind CSS, and Framer Motion. This project features smooth animations, engaging interactions, and a beautiful UI designed to convert visitors into customers.

## Features

- **Hero Section** - Eye-catching hero with gradient backgrounds, animated elements, and clear CTAs
- **Features Section** - Showcase your product's core features with icons and descriptions
- **How It Works** - Step-by-step guide showing users how to get started
- **Pricing Section** - Multiple pricing tiers with monthly/annual toggle
- **Testimonials** - Customer reviews carousel with auto-rotation
- **FAQ Section** - Expandable accordion for common questions
- **Contact Form** - Fully validated contact form with React Hook Form
- **Newsletter Subscription** - Email capture for newsletter signups
- **Responsive Design** - Fully responsive across all device sizes
- **Smooth Animations** - Beautiful entrance animations and hover effects with Framer Motion
- **Smooth Scrolling** - Seamless navigation between sections

## Tech Stack

- **React 18** - Latest version of React
- **TypeScript** - Type-safe code
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations and transitions
- **React Hook Form** - Performant form validation
- **Lucide React** - Beautiful icon library

## Getting Started

### Prerequisites

- Node.js 16+ and npm/yarn/pnpm

### Installation

1. Clone the repository or navigate to this directory:
   ```bash
   cd web-apps/landing-pages/startup-landing
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and visit `http://localhost:3000`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
startup-landing/
├── src/
│   ├── components/
│   │   ├── Navbar.tsx          # Navigation bar with mobile menu
│   │   ├── Hero.tsx            # Hero section
│   │   ├── Features.tsx        # Features showcase
│   │   ├── HowItWorks.tsx      # Step-by-step guide
│   │   ├── Pricing.tsx         # Pricing plans
│   │   ├── Testimonials.tsx    # Customer testimonials carousel
│   │   ├── FAQ.tsx             # Frequently asked questions
│   │   ├── Contact.tsx         # Contact form
│   │   ├── Newsletter.tsx      # Newsletter subscription
│   │   └── Footer.tsx          # Footer with links
│   ├── styles/
│   │   └── index.css           # Global styles and Tailwind imports
│   ├── App.tsx                 # Main app component
│   └── main.tsx                # App entry point
├── index.html                  # HTML template
├── tailwind.config.js          # Tailwind configuration
├── vite.config.ts              # Vite configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Project dependencies

```

## Customization

### Colors

Edit the color palette in `tailwind.config.js`:

```js
colors: {
  primary: {
    // Your primary color shades
  },
  secondary: {
    // Your secondary color shades
  },
}
```

### Content

All content is directly in the component files. Simply edit the text, data arrays, and configurations in each component to match your needs.

### Fonts

The project uses Inter font from Google Fonts. To change it, edit the `index.html` file and update the font-family in `tailwind.config.js`.

## Features in Detail

### Smooth Scrolling

The navigation automatically scrolls to sections smoothly when clicked. This is implemented using native browser smooth scrolling.

### Responsive Design

The landing page is fully responsive with breakpoints:
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### Animations

Framer Motion provides:
- Entrance animations on scroll
- Hover effects on interactive elements
- Smooth page transitions
- Carousel animations for testimonials

### Form Validation

React Hook Form handles:
- Required field validation
- Email format validation
- Custom error messages
- Success states

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

- Optimized bundle size with Vite
- Lazy loading where applicable
- Optimized images and assets
- CSS purging with Tailwind

## License

MIT License - feel free to use this project for your own purposes.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you have any questions or need help, please open an issue in the repository.

---

Built with ❤️ using React, TypeScript, and Tailwind CSS
