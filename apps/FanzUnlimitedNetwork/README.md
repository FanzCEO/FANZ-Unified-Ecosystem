# FANZ Unlimited Website

⚡️ Creator-owned platform with cyberpunk neon energy

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to see the site.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS with custom FANZ cyberpunk theme
- **Language:** TypeScript
- **Fonts:** Chakra Petch, Inter, Share Tech Mono

## Project Structure

```
/app                    # Next.js app directory
  /globals.css         # Global styles + Tailwind imports
  /layout.tsx          # Root layout
  /page.tsx            # Home page
/components            # Reusable React components
  /ButtonPrimary.tsx
  /ButtonSecondary.tsx
  /CardGlass.tsx
  /BadgeUnderground.tsx
  /NeonSign.tsx
  /NavPill.tsx
  /Header.tsx
  /Footer.tsx
  /Hero.tsx
  /ValueProps.tsx
/brand                 # Brand assets
  /_tokens.json       # Design tokens
/docs                  # Documentation
  /brand-style.md     # Brand style guide
/public                # Static assets
  /textures/          # Noise, scanlines, stickers
```

## Brand System

The site uses a cyberpunk-inspired design system with:

- **Dark-first UI** (ink-900/800 backgrounds)
- **Neon accents** (pink #FF2DA1, cyan #19F0FF, lime #C8FF3D)
- **Flickering animations** mimicking vintage neon bar signs
- **Glass-morphism cards** with grid overlays
- **CRT scanline effects** for retro-futuristic vibes

See `/docs/brand-style.md` for complete brand guidelines.

## Key Features

- Fully responsive design
- Accessible (WCAG AA compliant)
- Optimized animations with `prefers-reduced-motion` support
- Custom Tailwind utilities for neon effects
- SEO-ready with Next.js metadata

## Customization

### Colors
Edit `tailwind.config.js` to modify the color palette.

### Typography
Font stacks are defined in `tailwind.config.js` and imported in `app/globals.css`.

### Components
All components are in `/components` and use TypeScript for type safety.

## Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import project in Vercel
3. Deploy automatically

### Other Platforms
```bash
npm run build
npm start
```

## Brand Assets

Add your logo and brand assets to:
- `/public/logo.svg` - Main logo
- `/public/textures/` - Noise textures and overlays

## License

See LICENSE file.

---

Built with 🖤 by FANZ CEO • Underground • Creator-Owned
