# CougarFanz Platform Development TODO

## Overview
Building CougarFanz - a premium platform for mature women content creators (35+) - by adapting the Shadcn-UI template with sophisticated, age-positive branding.

## Brand Identity
- **Colors**: Deep purple/burgundy (#6B2C5C, #8B3A62), black, gold (#D4AF37), deep red/rose
- **Typography**: Sophisticated serif/elegant sans-serif
- **Aesthetic**: Premium, mature, confident, empowering

## Core Files to Create/Modify (8 files max)

### 1. **index.html** - Update title and meta tags
   - Change title to "CougarFanz - Premium Platform for Mature Women Creators"
   - Add appropriate meta descriptions
   - Update favicon reference

### 2. **src/index.css** - Brand colors and custom styles
   - Define CSS variables for CougarFanz color palette
   - Add custom scrollbar styles
   - Set sophisticated typography

### 3. **src/pages/Index.tsx** - Landing page
   - Hero section with empowering messaging
   - Feature highlights (15% commission, age-positive community)
   - Creator spotlight section
   - Call-to-action buttons

### 4. **src/components/Navigation.tsx** - Header navigation
   - Logo placement
   - Navigation menu (Home, For Creators, For Fans, About, Sign Up)
   - Responsive mobile menu

### 5. **src/components/Hero.tsx** - Hero section component
   - Compelling headline celebrating mature creators
   - Subheading about experience and confidence
   - Primary CTA buttons (Join as Creator, Explore Creators)
   - Background with sophisticated gradient

### 6. **src/components/Features.tsx** - Features section
   - Competitive commission rates (12-15%)
   - Age-specific discovery tools
   - Community and mentorship
   - Premium positioning

### 7. **src/components/Footer.tsx** - Footer component
   - Links to important pages
   - Social media links
   - Copyright and legal info
   - Contact information

### 8. **src/App.tsx** - Update routing if needed
   - Ensure proper routing structure
   - Add any additional routes

## Key Features to Highlight
1. **15% Commission** (vs OnlyFans 20%)
2. **Age-Positive Community** - Celebrating maturity as an asset
3. **Specialized Features** - Age-specific discovery and filtering
4. **Premium Positioning** - Quality over quantity
5. **Creator Support** - Mentorship and resources

## Design Principles
- Sophisticated and elegant (not youthful or playful)
- High contrast for readability (WCAG AA compliance)
- Generous white space
- Professional photography style
- Empowering, confident messaging

## Implementation Order
1. Update index.html with CougarFanz branding
2. Define brand colors in index.css
3. Create Navigation component
4. Create Hero component
5. Create Features component
6. Create Footer component
7. Update Index.tsx to use all components
8. Final polish and responsive testing