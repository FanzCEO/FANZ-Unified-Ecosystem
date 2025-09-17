# 🎨 @fanz/ui - Universal Design System

> **Neon-Themed Design System for FANZ Unified Ecosystem**  
> Built on Radix UI primitives with cluster-specific theming and accessibility-first approach

## 📋 Overview

@fanz/ui is the comprehensive design system powering all 9 FANZ platform clusters. It provides consistent, accessible, and visually striking components with cluster-specific neon themes while maintaining brand cohesion across the ecosystem.

## 🌈 Platform Cluster Themes

### **Visual Identity Matrix**

| Cluster | Primary Color | Secondary | Theme Name | Target Audience |
|---------|---------------|-----------|------------|-----------------|
| **FanzLab** | `#00FFFF` (Cyan) | `#FF00FF` (Magenta) | `universal` | Universal Portal |
| **BoyFanz** | `#FF0040` (Neon Red) | `#FF6B8A` (Light Red) | `neon_red` | Male Creators |
| **GirlFanz** | `#FF0080` (Neon Pink) | `#FF66B3` (Light Pink) | `neon_pink` | Female Creators |
| **DaddyFanz** | `#FFD700` (Neon Gold) | `#FFEB66` (Light Gold) | `neon_gold` | Dom/Sub Community |
| **PupFanz** | `#00FF40` (Neon Green) | `#66FF80` (Light Green) | `neon_green` | Pup Community |
| **TabooFanz** | `#0040FF` (Dark Neon Blue) | `#6B80FF` (Light Blue) | `dark_neon_blue` | Extreme Content |
| **TransFanz** | `#00FFFF` (Turquoise) | `#66FFFF` (Light Turquoise) | `turquoise_neon` | Trans Creators |
| **CougarFanz** | `#FFAA00` (Mature Gold) | `#FFCC66` (Light Mature) | `mature_gold` | Mature Creators |
| **FanzCock** | `#FF0000` (XXX Red) | `#000000` (Black) | `xxx_red_black` | Adult TikTok |

## 🏗️ Architecture

```
@fanz/ui/
├── src/
│   ├── components/          # React components
│   │   ├── primitives/      # Radix UI wrappers
│   │   ├── composite/       # Complex components
│   │   └── layout/          # Layout components
│   ├── themes/              # Theme configurations
│   │   ├── tokens/          # Design tokens
│   │   ├── clusters/        # Cluster-specific themes
│   │   └── base/            # Base theme system
│   ├── utils/               # Utility functions
│   ├── hooks/               # Custom React hooks
│   └── styles/              # CSS modules & globals
├── stories/                 # Storybook stories
├── docs/                    # Documentation
└── dist/                    # Built package
```

## 🎯 Core Design Principles

### **1. Accessibility First**
- **WCAG 2.1 AA** compliance across all components
- **High contrast** neon themes with accessibility overlays
- **Keyboard navigation** support for all interactive elements
- **Screen reader** optimized markup and ARIA labels
- **Focus management** with visible focus indicators

### **2. Performance Optimized**
- **Tree-shakeable** component library
- **CSS-in-JS** with zero-runtime overhead via CSS variables
- **Lazy loading** for complex components
- **Bundle size** optimization with minimal dependencies
- **SSR compatible** with Next.js and other frameworks

### **3. Developer Experience**
- **TypeScript first** with comprehensive type definitions
- **Storybook integration** with live cluster theme switching
- **Auto-completion** for theme tokens and component props
- **ESLint rules** for consistent usage patterns
- **Jest testing** utilities for component testing

### **4. Brand Consistency**
- **Design tokens** system for consistent spacing, typography, colors
- **Motion language** with shared animation curves and durations
- **Icon system** with cluster-specific icon variants
- **Typography scale** optimized for adult content readability
- **Grid system** responsive across all device sizes

## 🚀 Quick Start

### **Installation**
```bash
npm install @fanz/ui
# or
yarn add @fanz/ui
```

### **Basic Usage**
```tsx
import { Button, ThemeProvider } from '@fanz/ui';
import { boyfanzTheme } from '@fanz/ui/themes';

function App() {
  return (
    <ThemeProvider theme={boyfanzTheme}>
      <Button variant="primary">
        Create Content
      </Button>
    </ThemeProvider>
  );
}
```

### **Theme Switching**
```tsx
import { useTheme } from '@fanz/ui';
import { girlfanzTheme, taboofanzTheme } from '@fanz/ui/themes';

function ClusterSwitcher() {
  const { setTheme } = useTheme();
  
  return (
    <div>
      <Button onClick={() => setTheme(girlfanzTheme)}>
        Switch to GirlFanz
      </Button>
      <Button onClick={() => setTheme(taboofanzTheme)}>
        Switch to TabooFanz
      </Button>
    </div>
  );
}
```

## 🎨 Design Tokens

### **Color System**
```typescript
// Theme tokens structure
interface ThemeTokens {
  colors: {
    primary: {
      50: string;   // Lightest
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;  // Base neon color
      600: string;
      700: string;
      800: string;
      900: string;  // Darkest
      950: string;  // Ultra dark
    };
    semantic: {
      success: string;
      warning: string;
      error: string;
      info: string;
    };
    surface: {
      background: string;
      foreground: string;
      muted: string;
      accent: string;
    };
  };
  // ... other token categories
}
```

### **Typography Scale**
```css
/* Base typography optimized for adult content */
--font-size-xs: 0.75rem;    /* 12px - Fine print */
--font-size-sm: 0.875rem;   /* 14px - Secondary text */
--font-size-base: 1rem;     /* 16px - Body text */
--font-size-lg: 1.125rem;   /* 18px - Emphasis */
--font-size-xl: 1.25rem;    /* 20px - Subheadings */
--font-size-2xl: 1.5rem;    /* 24px - Headings */
--font-size-3xl: 1.875rem;  /* 30px - Large headings */
--font-size-4xl: 2.25rem;   /* 36px - Display text */

/* Line heights optimized for readability */
--line-height-tight: 1.25;
--line-height-normal: 1.5;
--line-height-relaxed: 1.75;
```

### **Spacing System**
```css
/* Consistent spacing scale */
--space-px: 1px;
--space-0: 0;
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-5: 1.25rem;  /* 20px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-10: 2.5rem;  /* 40px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */
--space-20: 5rem;    /* 80px */
--space-24: 6rem;    /* 96px */
```

## 🧩 Component Categories

### **1. Primitive Components**
Built on Radix UI primitives with FANZ theming:

- **Button** - Primary, secondary, ghost, link variants
- **Input** - Text, email, password, search with validation states
- **Select** - Single and multi-select with search
- **Checkbox** - Binary and indeterminate states
- **Radio** - Radio groups with custom styling
- **Switch** - Toggle switches with animations
- **Slider** - Range sliders for filters and settings
- **Progress** - Linear and circular progress indicators

### **2. Navigation Components**
- **Navbar** - Main navigation with cluster branding
- **Sidebar** - Collapsible sidebar with cluster themes
- **Breadcrumb** - Navigation breadcrumbs
- **Tabs** - Horizontal and vertical tab navigation
- **Pagination** - Content pagination with infinite scroll
- **Menu** - Dropdown and context menus

### **3. Layout Components**
- **Container** - Responsive containers with max-widths
- **Grid** - CSS Grid-based layout system
- **Flex** - Flexbox utilities and components
- **Stack** - Vertical and horizontal stacks
- **Divider** - Section dividers with cluster theming
- **Card** - Content cards with elevation

### **4. Data Display**
- **Table** - Data tables with sorting and filtering
- **List** - Ordered and unordered lists
- **Avatar** - User avatars with fallbacks
- **Badge** - Status badges and labels
- **Tooltip** - Contextual tooltips
- **Popover** - Overlay content containers

### **5. Feedback Components**
- **Alert** - Success, warning, error, info alerts
- **Toast** - Temporary notification toasts
- **Modal** - Dialog modals with overlay
- **Skeleton** - Loading state skeletons
- **Spinner** - Loading spinners with cluster colors

### **6. Form Components**
- **FormField** - Complete form field with validation
- **Label** - Form labels with required indicators
- **HelperText** - Form helper and error text
- **Fieldset** - Grouped form fields
- **DatePicker** - Date and time selection
- **FileUpload** - File upload with drag-and-drop

### **7. Media Components**
- **Image** - Optimized image component with lazy loading
- **Video** - Video player with custom controls
- **Audio** - Audio player with waveform visualization
- **Gallery** - Image and video galleries
- **Carousel** - Content carousels with touch support

## 🎭 Cluster-Specific Features

### **BoyFanz Theme (Neon Red)**
```tsx
import { boyfanzTheme } from '@fanz/ui/themes';

// Specialized components for male creator platform
<CreatorCard
  theme={boyfanzTheme}
  variant="masculine"
  accentColor="neon-red"
/>
```

### **GirlFanz Theme (Neon Pink)**
```tsx
import { girlfanzTheme } from '@fanz/ui/themes';

// Specialized components for female creator platform
<CreatorCard
  theme={girlfanzTheme}
  variant="feminine"
  accentColor="neon-pink"
/>
```

### **TabooFanz Theme (Dark Neon Blue)**
```tsx
import { taboofanzTheme } from '@fanz/ui/themes';

// Enhanced warning components for extreme content
<ContentWarning
  theme={taboofanzTheme}
  severity="extreme"
  blurContent={true}
/>
```

### **FanzCock Theme (XXX Red/Black)**
```tsx
import { fanzcockTheme } from '@fanz/ui/themes';

// TikTok-style components for short videos
<VideoCard
  theme={fanzcockTheme}
  variant="tiktok-style"
  maxDuration={60}
/>
```

## 🔧 Advanced Configuration

### **Custom Theme Creation**
```typescript
import { createTheme } from '@fanz/ui/themes';

const customTheme = createTheme({
  name: 'custom-cluster',
  colors: {
    primary: '#YOUR_NEON_COLOR',
    secondary: '#YOUR_ACCENT_COLOR',
  },
  typography: {
    fontFamily: 'Your Custom Font',
  },
  spacing: {
    // Custom spacing overrides
  }
});
```

### **Runtime Theme Switching**
```tsx
import { ThemeProvider, useTheme } from '@fanz/ui';

function App() {
  const [currentCluster, setCurrentCluster] = useState('boyfanz');
  const theme = getThemeByCluster(currentCluster);
  
  return (
    <ThemeProvider theme={theme}>
      <YourApp />
    </ThemeProvider>
  );
}
```

### **CSS Variable Customization**
```css
/* Override theme variables for specific needs */
:root {
  --fanz-primary-500: #YOUR_CUSTOM_NEON;
  --fanz-accent-glow: 0 0 20px var(--fanz-primary-500);
}
```

## 🧪 Testing & Quality

### **Component Testing**
```typescript
import { render, screen } from '@fanz/ui/testing';
import { boyfanzTheme } from '@fanz/ui/themes';
import { Button } from '@fanz/ui';

test('Button renders with BoyFanz theme', () => {
  render(
    <Button theme={boyfanzTheme}>Click me</Button>
  );
  
  const button = screen.getByRole('button');
  expect(button).toHaveStyle({ 
    backgroundColor: boyfanzTheme.colors.primary[500] 
  });
});
```

### **Visual Regression Testing**
- **Chromatic** integration for visual testing
- **Percy** snapshots for design consistency
- **Accessibility testing** with axe-core
- **Cross-browser testing** matrix

### **Performance Monitoring**
- **Bundle size** tracking with bundlesize
- **Render performance** monitoring
- **Memory usage** profiling for complex components
- **Core Web Vitals** optimization

## 📚 Storybook Integration

### **Live Theme Switching**
```tsx
// .storybook/preview.js
export const parameters = {
  themes: {
    default: 'BoyFanz',
    list: [
      { name: 'FanzLab', class: 'theme-universal', color: '#00FFFF' },
      { name: 'BoyFanz', class: 'theme-neon-red', color: '#FF0040' },
      { name: 'GirlFanz', class: 'theme-neon-pink', color: '#FF0080' },
      { name: 'DaddyFanz', class: 'theme-neon-gold', color: '#FFD700' },
      { name: 'PupFanz', class: 'theme-neon-green', color: '#00FF40' },
      { name: 'TabooFanz', class: 'theme-dark-neon-blue', color: '#0040FF' },
      { name: 'TransFanz', class: 'theme-turquoise-neon', color: '#00FFFF' },
      { name: 'CougarFanz', class: 'theme-mature-gold', color: '#FFAA00' },
      { name: 'FanzCock', class: 'theme-xxx-red-black', color: '#FF0000' },
    ],
  },
};
```

## 🚢 Deployment & Distribution

### **Package Publishing**
```bash
# Build and publish to FANZ registry
npm run build
npm publish --registry=https://registry.fanz.com
```

### **CDN Distribution**
```html
<!-- Load from FANZ CDN -->
<link rel="stylesheet" href="https://cdn.fanz.com/ui/latest/fanz-ui.css">
<script src="https://cdn.fanz.com/ui/latest/fanz-ui.js"></script>
```

### **Integration Examples**
- **Next.js** - SSR-compatible setup
- **React Native** - Mobile component variants
- **Vue.js** - Vue 3 component wrappers
- **Angular** - Angular component library

---

## 🎯 **Implementation Status: READY FOR DEVELOPMENT**

The @fanz/ui design system provides:

✅ **Comprehensive Component Library** - 50+ components across all categories  
✅ **9 Cluster-Specific Themes** - Unique neon color schemes for each platform  
✅ **Accessibility First** - WCAG 2.1 AA compliance built-in  
✅ **Performance Optimized** - Tree-shakeable with minimal bundle impact  
✅ **Developer Experience** - TypeScript, Storybook, and testing utilities  
✅ **Brand Consistency** - Unified design language across all platforms  

This design system will ensure visual consistency and optimal user experience across all FANZ platform clusters while maintaining each cluster's unique identity.