# TransFanz Design System

## Visual Aesthetic

TransFanz uses a trans-pride inspired but matured product palette with aurora/nebula motifs representing transformation and possibility.

---

## Color System

### Backgrounds

| Token | Value | Description |
|-------|-------|-------------|
| `tfz-bg` | `#0D0B1E` | Deep midnight purple (primary background) |
| `tfz-bg-secondary` | `#141127` | Slightly lighter background |
| `tfz-bg-tertiary` | `#1A1633` | Card backgrounds |

### Surfaces

| Token | Value | Description |
|-------|-------|-------------|
| `tfz-surface` | `#1E1A36` | Soft charcoal with purple hint |
| `tfz-surface-hover` | `#252142` | Hover state |
| `tfz-surface-active` | `#2C274F` | Active state |
| `tfz-surface-elevated` | `#322D54` | Elevated cards, modals |

### Primary Accent (Trans Pink)

| Token | Value | Description |
|-------|-------|-------------|
| `tfz-accent-primary` | `#F5A9B8` | Soft trans pink |
| `tfz-accent-primary-hover` | `#F7BCC8` | Lighter on hover |
| `tfz-accent-primary-muted` | `#F5A9B840` | 25% opacity |
| `tfz-accent-primary-subtle` | `#F5A9B820` | 12% opacity |

### Secondary Accent (Trans Blue)

| Token | Value | Description |
|-------|-------|-------------|
| `tfz-accent-secondary` | `#5BCEFA` | Trans blue |
| `tfz-accent-secondary-hover` | `#7DD6FB` | Lighter on hover |
| `tfz-accent-secondary-muted` | `#5BCEFA40` | 25% opacity |
| `tfz-accent-secondary-subtle` | `#5BCEFA20` | 12% opacity |

### Tertiary Accent (Lavender)

| Token | Value | Description |
|-------|-------|-------------|
| `tfz-accent-tertiary` | `#C8A2C8` | Lavender |
| `tfz-accent-tertiary-hover` | `#D4B4D4` | Lighter on hover |
| `tfz-accent-tertiary-muted` | `#C8A2C840` | 25% opacity |

### Text

| Token | Value | Description |
|-------|-------|-------------|
| `tfz-text` | `#FFFFFF` | Primary text |
| `tfz-text-secondary` | `#B8B4C8` | Secondary text |
| `tfz-text-tertiary` | `#7A7590` | Muted text |
| `tfz-text-inverse` | `#0D0B1E` | Text on light backgrounds |

### Borders

| Token | Value | Description |
|-------|-------|-------------|
| `tfz-border` | `#3D3760` | Default border |
| `tfz-border-subtle` | `#2A2548` | Subtle border |
| `tfz-border-focus` | `#F5A9B8` | Focus ring (pink) |

### Semantic Colors

| Token | Value | Description |
|-------|-------|-------------|
| `tfz-success` | `#34D399` | Emerald - "you're safe here" |
| `tfz-success-bg` | `#34D39920` | Success background |
| `tfz-warning` | `#FBBF24` | Amber |
| `tfz-warning-bg` | `#FBBF2420` | Warning background |
| `tfz-danger` | `#F87171` | Soft red (non-triggering) |
| `tfz-danger-bg` | `#F8717120` | Danger background |
| `tfz-info` | `#60A5FA` | Blue |
| `tfz-info-bg` | `#60A5FA20` | Info background |

---

## Gradients

### Aurora Gradient
```css
background: linear-gradient(135deg, #F5A9B8 0%, #C8A2C8 50%, #5BCEFA 100%);
```

### Aurora Subtle
```css
background: linear-gradient(135deg, #F5A9B820 0%, #C8A2C820 50%, #5BCEFA20 100%);
```

### Pink to Blue
```css
background: linear-gradient(90deg, #F5A9B8 0%, #5BCEFA 100%);
```

### Nebula
```css
background: radial-gradient(ellipse at top, #1E1A36 0%, #0D0B1E 100%);
```

---

## Typography

### Font Families

| Use | Font Stack |
|-----|------------|
| Headings | `'Plus Jakarta Sans', 'Inter', system-ui, sans-serif` |
| Body | `'Inter', system-ui, sans-serif` |
| Mono | `'JetBrains Mono', 'Fira Code', monospace` |

### Font Sizes

| Token | Size | Line Height |
|-------|------|-------------|
| `xs` | 0.75rem | 1rem |
| `sm` | 0.875rem | 1.25rem |
| `base` | 1rem | 1.5rem |
| `lg` | 1.125rem | 1.75rem |
| `xl` | 1.25rem | 1.75rem |
| `2xl` | 1.5rem | 2rem |
| `3xl` | 1.875rem | 2.25rem |
| `4xl` | 2.25rem | 2.5rem |
| `5xl` | 3rem | 1 |

### Font Weights

| Token | Weight |
|-------|--------|
| `normal` | 400 |
| `medium` | 500 |
| `semibold` | 600 |
| `bold` | 700 |

---

## Border Radius

| Token | Value |
|-------|-------|
| `none` | 0 |
| `sm` | 0.25rem |
| `DEFAULT` | 0.5rem |
| `md` | 0.625rem |
| `lg` | 0.75rem |
| `xl` | 1rem |
| `2xl` | 1.5rem |
| `full` | 9999px (pills) |

---

## Shadows

| Token | Value |
|-------|-------|
| `sm` | `0 1px 2px 0 rgba(0, 0, 0, 0.3)` |
| `DEFAULT` | `0 2px 4px 0 rgba(0, 0, 0, 0.4)` |
| `md` | `0 4px 8px -1px rgba(0, 0, 0, 0.4)` |
| `lg` | `0 10px 15px -3px rgba(0, 0, 0, 0.5)` |
| `xl` | `0 20px 25px -5px rgba(0, 0, 0, 0.5)` |
| `glow-pink` | `0 0 20px rgba(245, 169, 184, 0.3)` |
| `glow-blue` | `0 0 20px rgba(91, 206, 250, 0.3)` |
| `glow-aurora` | `0 0 30px rgba(200, 162, 200, 0.2)` |

---

## Component Styles

### Buttons

```css
/* Primary */
.btn-primary {
  background: linear-gradient(to right, var(--tfz-accent-primary), var(--tfz-accent-tertiary));
  color: var(--tfz-text-inverse);
  font-weight: 600;
  border-radius: 9999px;
  padding: 0.75rem 1.5rem;
  box-shadow: var(--shadow-glow-pink);
}

/* Secondary */
.btn-secondary {
  background: var(--tfz-surface);
  color: var(--tfz-text);
  border: 1px solid var(--tfz-border);
  border-radius: 9999px;
  padding: 0.75rem 1.5rem;
}

/* Ghost */
.btn-ghost {
  background: transparent;
  color: var(--tfz-text-secondary);
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
}
```

### Pronoun Pills

```css
.pronoun-pill {
  display: inline-flex;
  align-items: center;
  background: var(--tfz-accent-secondary-subtle);
  color: var(--tfz-accent-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 9999px;
  padding: 0.25rem 0.75rem;
  border: 1px solid var(--tfz-accent-secondary-muted);
}
```

### Identity Tags

```css
.identity-tag {
  display: inline-flex;
  align-items: center;
  background: var(--tfz-accent-primary-subtle);
  color: var(--tfz-accent-primary);
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 9999px;
  padding: 0.25rem 0.75rem;
  border: 1px solid var(--tfz-accent-primary-muted);
}
```

### Cards

```css
/* Default */
.card {
  background: var(--tfz-surface);
  border-radius: 0.75rem;
  border: 1px solid var(--tfz-border-subtle);
  padding: 1rem;
}

/* Elevated */
.card-elevated {
  background: var(--tfz-surface-elevated);
  border-radius: 0.75rem;
  border: 1px solid var(--tfz-border);
  box-shadow: var(--shadow-md);
  padding: 1rem;
}

/* Interactive */
.card-interactive {
  background: var(--tfz-surface);
  border-radius: 0.75rem;
  border: 1px solid var(--tfz-border-subtle);
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.card-interactive:hover {
  background: var(--tfz-surface-hover);
  border-color: var(--tfz-border);
}
```

### Inputs

```css
.input {
  width: 100%;
  background: var(--tfz-bg);
  border: 1px solid var(--tfz-border);
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  color: var(--tfz-text);
}

.input::placeholder {
  color: var(--tfz-text-tertiary);
}

.input:focus {
  outline: none;
  box-shadow: 0 0 0 2px var(--tfz-accent-primary);
  border-color: transparent;
}
```

---

## Visual Motifs

### Aurora Background

```css
.aurora-bg {
  background: linear-gradient(135deg,
    rgba(245, 169, 184, 0.1) 0%,
    rgba(200, 162, 200, 0.1) 50%,
    rgba(91, 206, 250, 0.1) 100%
  );
  background-size: 200% 200%;
  animation: aurora-shift 8s ease-in-out infinite;
}

@keyframes aurora-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
```

### Sparkle Effect

```css
.sparkle::after {
  content: '✨';
  position: absolute;
  top: -5px;
  right: -5px;
  font-size: 0.75rem;
  animation: sparkle 2s ease-in-out infinite;
}

@keyframes sparkle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

### Gradient Text

```css
.gradient-text {
  background: linear-gradient(90deg, #F5A9B8, #C8A2C8, #5BCEFA);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

---

## Iconography Guidelines

### Do:
- Use abstract shapes (stars, hearts, flames, waves, sparkles)
- Keep icons gender-neutral
- Use soft, rounded icon styles

### Don't:
- Use gendered symbols (no "heels vs weights" stereotypes)
- Use sharp, aggressive icon styles
- Use icons that reinforce binary gender

---

## Accessibility

- Minimum contrast ratio: 4.5:1 for text
- Focus indicators: 2px ring in `tfz-accent-primary`
- Interactive elements: Minimum 44x44px touch targets
- Motion: Respect `prefers-reduced-motion`
- Screen reader support: All interactive elements labeled
