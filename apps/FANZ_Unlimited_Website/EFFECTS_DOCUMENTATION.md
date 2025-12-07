# FANZ Unlimited - Epic Cyberpunk Effects Documentation

## 🎨 Overview

This document details all the badass cyberpunk visual effects implemented in the FANZ Unlimited website. The site features **10 layered visual effect systems** working together to create an immersive, interactive cyberpunk experience.

---

## 📊 Effect Layers (Z-Index Architecture)

```
Z-INDEX STACK:
├── 1    - HexagonalGrid (base pattern)
├── 2    - AudioVisualizerBars (animated bars)
├── 3    - MatrixRain (character drops)
├── 5    - NeonParticles (interactive particles)
├── 99   - HolographicOverlay vignette
├── 100  - HolographicOverlay interference
├── 101  - HolographicOverlay chromatic aberration
├── 150  - CyberpunkHUD (corner data readouts)
├── 200  - CursorTrail (mouse tracking)
├── 250  - ElectricSparks (click effects)
├── 9998 - ScrollProgress (progress indicators)
└── 9999 - LoadingScreen (initial load)
```

---

## 🔥 Component Details

### 1. **LoadingScreen** (z: 9999)
**File:** `components/LoadingScreen.tsx`

**Description:** Epic ASCII art loading screen with animated progress bar.

**Features:**
- ASCII art FANZ logo with neon glow
- Animated gradient progress bar (pink → cyan → lime)
- Progress percentage counter
- Loading state messages that change with progress
- Matrix-style background grid
- Scanlines overlay
- Corner decorative elements with status indicators

**Auto-hides:** After 100% progress (1-2 seconds)

**Performance:** Uses requestAnimationFrame for smooth progress updates

---

### 2. **HexagonalGrid** (z: 1)
**File:** `components/HexagonalGrid.tsx`

**Description:** Animated hexagonal mesh overlay with pulsing neon outlines.

**Features:**
- Mathematically positioned hexagons forming a grid
- Individual pulse animations for each hexagon
- Color cycling through pink, cyan, and lime
- Occasional random fill effects
- Screen-blend mode for subtle integration

**Canvas Size:** Full viewport, responsive
**Performance:** ~60fps, optimized with canvas rendering

**Customization:**
```typescript
const hexSize = 30;  // Size of each hexagon
opacity: 0.15        // Overall visibility
```

---

### 3. **AudioVisualizerBars** (z: 2)
**File:** `components/AudioVisualizerBars.tsx`

**Description:** Animated frequency bars that simulate an audio visualizer.

**Features:**
- 60 vertical bars across the screen
- Smooth interpolation to target heights
- Color coding based on height:
  - **Low** (0-15%): Lime (#C8FF3D)
  - **Medium** (15-25%): Cyan (#19F0FF)
  - **High** (25%+): Pink (#FF2DA1)
- Glow effects on bar tops
- Realistic movement with acceleration

**Performance:**
- Canvas-based rendering
- Optimized update loop
- Hardware-accelerated

---

### 4. **MatrixRain** (z: 3)
**File:** `components/MatrixRain.tsx`

**Description:** Falling character rain effect with Japanese katakana and tech symbols.

**Features:**
- Character set: Binary (01), Japanese katakana, Latin letters, currency symbols
- Random character mutations during fall
- Gradient color trail (cyan → pink)
- Brightest head character with strong glow
- 30% column density (not overwhelming)
- Font: 'Share Tech Mono' (monospace)

**Character Set:**
```
01アイウエオカキクケコサシスセソタチツテト...
ABCDEFGHIJKLMNOPQRSTUVWXYZ$¥₿₮
```

**Performance:**
- Fade trails using semi-transparent background fill
- Variable drop speeds (2-5px/frame)
- Automatic recycle when off-screen

---

### 5. **NeonParticles** (z: 5)
**File:** `components/NeonParticles.tsx`

**Description:** Interactive floating particle system with mouse repulsion.

**Features:**
- **80 particles** floating across the viewport
- **4 colors:** Pink, Cyan, Lime, Purple
- **Mouse interaction:** Particles repel within 150px radius
- **Connection lines:** Drawn between nearby particles (<150px)
- **Pulsing effect:** Size and opacity oscillate with sine wave
- **Physics:**
  - Random velocity (-0.5 to 0.5 px/frame)
  - Friction (0.99x per frame)
  - Boundary wrapping (particles reappear on opposite side)

**Interaction:**
```javascript
Mouse repulsion force = (150 - distance) / 150 * 0.5
```

**Performance:** 60fps, passive mouse event listeners

---

### 6. **HolographicOverlay** (z: 99-101)
**File:** `components/HolographicOverlay.tsx`

**Description:** Chromatic aberration and holographic interference patterns.

**Layers:**
1. **Holographic interference grid** (z: 100)
   - Horizontal and vertical lines
   - Pink and cyan cross-hatching
   - Scroll-parallax effect (0.1x scroll speed)

2. **Chromatic drift overlays** (z: 101)
   - Two radial gradients (pink & cyan)
   - Opposing animations (drift & drift-reverse)
   - Screen blend mode for color separation

3. **Vignette glow** (z: 99)
   - Radial gradient darkening edges
   - Creates depth and focus

**Performance:** Pure CSS, GPU-accelerated transforms

---

### 7. **CyberpunkHUD** (z: 150)
**File:** `components/CyberpunkHUD.tsx`

**Description:** Corner data readouts with system information.

**Corner Elements:**

**Top Left:**
- System status indicator (pulsing dot)
- Version number (VER: 4.5.2)
- User status (USER://GUEST)

**Top Right:**
- Real-time clock (HH:MM:SS)
- FPS counter (green if ≥55fps, red if lower)
- Connection status (SECURE/ONLINE)

**Bottom Left:**
- Protocol info (HTTPS)
- Port number (443)
- Signal strength bars (animated)

**Bottom Right:**
- Bandwidth status
- Latency display
- Uptime percentage

**Decorative:**
- Corner brackets (L-shaped borders)
- Edge scanlines (pulsing horizontal lines)

**Update Frequency:**
- Time: Every 1 second
- FPS: Every 1 second (via requestAnimationFrame)
- Status: Random flicker every 3 seconds

---

### 8. **CursorTrail** (z: 200)
**File:** `components/CursorTrail.tsx`

**Description:** RGB-separated neon cursor trail following mouse movement.

**Features:**
- **30-point trail** following cursor
- **Chromatic aberration:**
  - Pink layer (-1px horizontal offset)
  - Cyan layer (+1px horizontal offset)
  - Lime layer (-1px vertical offset)
- **Connecting lines** with gradient (pink → purple → cyan)
- **Lifetime decay:** Points fade over time (0.05 opacity/frame)
- **Screen blend mode** for authentic glow

**Performance:**
- Canvas-based
- Automatic cleanup of dead trail points
- Minimal memory footprint

---

### 9. **ElectricSparks** (z: 250)
**File:** `components/ElectricSparks.tsx`

**Description:** Electric spark particle explosion on button/link clicks.

**Features:**
- **25 sparks per click** on interactive elements
- **Physics simulation:**
  - Radial explosion (360° distribution)
  - Gravity (0.2px/frame² downward)
  - Air friction (0.98x velocity per frame)
- **Visual effects:**
  - Trailing lines showing motion blur
  - Random lightning bolt branches (30% chance)
  - Color-coded sparks (pink, cyan, lime)
- **Lifecycle:** 30-60 frames per spark

**Triggered On:**
- `<button>` clicks
- `<a>` clicks
- Any element containing button/link

**Performance:** Automatic cleanup of expired sparks

---

### 10. **ScrollProgress** (z: 9998)
**File:** `components/ScrollProgress.tsx`

**Description:** Dual scroll progress indicators.

**Features:**

**Top Bar:**
- Full-width gradient bar (pink → cyan → lime)
- Glow effect beneath bar
- Moving light accent at progress point
- 1px height, smooth transitions

**Circular Indicator (Desktop only, bottom-right):**
- 16x16 grid circular progress ring
- SVG-based with gradient stroke
- Percentage text in center
- Pulsing background glow
- Smooth arc animation

**Calculation:**
```javascript
progress = (scrollTop / (documentHeight - windowHeight)) * 100
```

**Performance:** Passive scroll event listener, 150ms transition smoothing

---

## 🎨 CSS Effects (globals.css)

### Chromatic Text
```css
.chromatic-text {
  text-shadow:
    -2px 0 0 rgba(255, 45, 161, 0.8),  /* Pink left */
    2px 0 0 rgba(25, 240, 255, 0.8),   /* Cyan right */
    0 -2px 0 rgba(200, 255, 61, 0.6);  /* Lime top */
}
```

### 3D Tilt
```css
.tilt-3d {
  transform-style: preserve-3d;
  transition: transform 0.3s ease;
}
.tilt-3d:hover {
  transform: perspective(1000px) rotateX(var(--rotate-x)) rotateY(var(--rotate-y)) translateZ(20px);
}
```

### Liquid Metal Button
```css
.btn-liquid::before {
  background: linear-gradient(45deg, #FF2DA1, #7A2CFF, #19F0FF, #C8FF3D);
  background-size: 400% 400%;
  animation: liquid-flow 4s ease infinite;
}
```

### Intense Glow
6-layer box shadow with progressive blur:
```css
.glow-intense {
  box-shadow:
    0 0 10px rgba(255, 45, 161, 0.6),
    0 0 20px rgba(255, 45, 161, 0.4),
    0 0 30px rgba(25, 240, 255, 0.4),
    0 0 40px rgba(255, 45, 161, 0.3),
    0 0 60px rgba(25, 240, 255, 0.2),
    inset 0 0 20px rgba(255, 45, 161, 0.1);
}
```

### Holographic Text
```css
.holographic {
  background: linear-gradient(45deg, #FF2DA1, #7A2CFF, #19F0FF, #C8FF3D, #FF2DA1);
  background-size: 300% 300%;
  animation: hologram-shift 6s ease infinite;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

### Glitch Hard
Aggressive glitch with skew and hue rotation:
```css
@keyframes glitch-hard {
  0%, 94%, 100% { transform: translate(0) skew(0deg); }
  95% { transform: translate(-5px, 2px) skew(-5deg); filter: hue-rotate(180deg); }
  96% { transform: translate(5px, -2px) skew(5deg); filter: hue-rotate(-180deg); }
  97% { transform: translate(-5px, -2px) skew(3deg); filter: hue-rotate(90deg); }
  98% { transform: translate(5px, 2px) skew(-3deg); filter: hue-rotate(-90deg); }
}
```

---

## ♿ Accessibility Features

### Reduced Motion Support
All animations and canvas effects are disabled when user prefers reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  canvas {
    display: none !important;
  }
}
```

**JavaScript Detection:**
```javascript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
```

### Scroll Reveal Component
**File:** `components/ScrollReveal.tsx`

Fade-in on scroll with automatic reduced-motion handling:
```jsx
<ScrollReveal delay={100}>
  <YourContent />
</ScrollReveal>
```

---

## ⚡ Performance Optimization

### Canvas Rendering
- All canvas effects use `requestAnimationFrame` for 60fps
- Passive event listeners for scroll/mouse
- Automatic cleanup on unmount

### Event Listeners
```javascript
window.addEventListener('scroll', handler, { passive: true });
window.addEventListener('mousemove', handler, { passive: true });
```

### GPU Acceleration
- CSS transforms instead of top/left positioning
- `will-change-transform` on animated elements
- `mix-blend-mode` for efficient compositing

### Memory Management
- Trail/spark arrays limited in size
- Automatic removal of expired particles
- Canvas cleared each frame

---

## 🎨 Color Palette

```css
/* Primary Colors */
--neon-pink:   #FF2DA1   /* Hot pink neon */
--neon-cyan:   #19F0FF   /* Bright cyan */
--acid-lime:   #C8FF3D   /* Electric lime */
--uv-purple:   #7A2CFF   /* UV purple */

/* Background */
--ink-900:     #0A0A0B   /* Deepest black */
--ink-800:     #111216   /* Dark gray */

/* Text */
--steel-400:   #9BA3AE   /* Muted text */
--steel-300:   #C7D0DA   /* Light text */
```

---

## 🚀 Usage Examples

### Add Scroll Reveal to Section
```jsx
import ScrollReveal from '@/components/ScrollReveal';

<ScrollReveal delay={200}>
  <section>
    Your content that fades in on scroll
  </section>
</ScrollReveal>
```

### Apply Chromatic Text Effect
```jsx
<h1 className="chromatic-text text-4xl">
  BADASS TITLE
</h1>
```

### Add 3D Tilt to Card
```jsx
<div className="tilt-3d hover-glow-pink">
  Card content
</div>
```

### Use Holographic Text
```jsx
<span className="holographic text-5xl font-display font-bold">
  UNLIMITED
</span>
```

---

## 📦 Component Summary

| Component | Type | Z-Index | Purpose | Performance |
|-----------|------|---------|---------|-------------|
| LoadingScreen | Canvas + UI | 9999 | Initial load experience | One-time render |
| ScrollProgress | SVG + UI | 9998 | Progress tracking | Passive scroll listener |
| ElectricSparks | Canvas | 250 | Click feedback | On-demand particles |
| CursorTrail | Canvas | 200 | Mouse tracking | 60fps trail |
| CyberpunkHUD | UI | 150 | Data display | 1fps updates |
| HolographicOverlay | CSS | 99-101 | Atmospheric depth | GPU-accelerated |
| NeonParticles | Canvas | 5 | Interactive ambience | 60fps physics |
| MatrixRain | Canvas | 3 | Background motion | 60fps character drops |
| AudioVisualizerBars | Canvas | 2 | Visual rhythm | 60fps bar animation |
| HexagonalGrid | Canvas | 1 | Base pattern | 60fps pulse effects |

---

## 🛠️ Customization

### Adjust Particle Count
**File:** `components/NeonParticles.tsx`
```javascript
const particleCount = 80;  // Change to increase/decrease particles
```

### Modify Matrix Density
**File:** `components/MatrixRain.tsx`
```javascript
if (Math.random() > 0.7) { // Change 0.7 to adjust density
  // Higher = fewer columns
  // Lower = more columns
}
```

### Change Hexagon Size
**File:** `components/HexagonalGrid.tsx`
```javascript
const hexSize = 30;  // Larger = bigger hexagons
```

### Adjust Spark Count
**File:** `components/ElectricSparks.tsx`
```javascript
createSparks(e.clientX, e.clientY, 25);  // Change 25 to more/fewer sparks
```

---

## 🔧 Troubleshooting

### Performance Issues
1. **Reduce particle counts** in respective components
2. **Disable specific effects** by commenting out imports in `layout.tsx`
3. **Enable reduced motion** in browser settings
4. **Lower canvas opacity** to reduce visual complexity

### Visual Glitches
1. Check **z-index conflicts** in browser DevTools
2. Verify **canvas dimensions** match viewport
3. Ensure **GPU acceleration** is enabled in browser
4. Clear browser cache and reload

### Mobile Performance
- Canvas effects automatically scale to device size
- Some effects (like ScrollProgress circular indicator) hidden on mobile
- Touch events don't trigger cursor trail or particles

---

## 📝 Development Notes

### Adding New Effect Layer
1. Create component in `/components`
2. Add to `layout.tsx` with appropriate z-index
3. Document in this file
4. Test with reduced motion enabled

### Best Practices
- Always use `passive: true` for scroll/mouse listeners
- Clear intervals/timeouts on component unmount
- Test performance on lower-end devices
- Maintain z-index hierarchy
- Add reduced motion checks for new animations

---

## 🎯 Browser Compatibility

**Tested On:**
- ✅ Chrome 120+
- ✅ Firefox 121+
- ✅ Safari 17+
- ✅ Edge 120+

**Required Features:**
- Canvas API
- IntersectionObserver
- CSS mix-blend-mode
- CSS backdrop-filter
- requestAnimationFrame
- matchMedia (prefers-reduced-motion)

---

## 📊 Bundle Impact

**Estimated Sizes:**
- Total components: ~15KB (gzipped)
- CSS effects: ~5KB (gzipped)
- Runtime overhead: Minimal (canvas + RAF)

**Loading Strategy:**
- All effects loaded client-side with 'use client'
- LoadingScreen prevents content shift
- Progressive enhancement approach

---

**Documentation Version:** 1.0
**Last Updated:** 2025-11-19
**Author:** Claude Code
**Status:** Production Ready 🚀

---

*For questions or customization requests, refer to component source files or contact the development team.*
