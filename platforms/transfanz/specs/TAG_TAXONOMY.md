# TransFanz Tag Taxonomy

A respectful, inclusive, and non-fetishizing tag system for discovery.

---

## 1. Gender Identity Tags

**Category:** `GENDER_IDENTITY`
**Behavior:** Opt-in, multi-select, allows custom

| Slug | Display Name | Description |
|------|--------------|-------------|
| `trans-woman` | Trans woman | Transgender woman |
| `trans-man` | Trans man | Transgender man |
| `trans-femme` | Trans femme | Transgender feminine-presenting |
| `trans-masc` | Trans masc | Transgender masculine-presenting |
| `nonbinary` | Nonbinary | Non-binary gender identity |
| `genderfluid` | Genderfluid | Gender identity that changes |
| `agender` | Agender | Without gender or gender-neutral |
| `bigender` | Bigender | Two gender identities |
| `two-spirit` | Two-spirit | Indigenous gender identity (used respectfully) |
| `intersex` | Intersex | Intersex individuals |
| `questioning` | Questioning | Exploring gender identity |
| `genderqueer` | Genderqueer | Non-normative gender identity |

**Custom Option:** Yes - free-text field for unlisted identities

---

## 2. Pronoun Tags

**Category:** `PRONOUNS`
**Behavior:** Displayed prominently on profile and in search results

| Slug | Display | Notes |
|------|---------|-------|
| `she-her` | she/her | |
| `he-him` | he/him | |
| `they-them` | they/them | |
| `she-they` | she/they | |
| `he-they` | he/they | |
| `any-pronouns` | any | |
| `neopronouns` | neo | Custom field enabled |

**Custom Option:** Yes - for neo-pronouns (e.g., xe/xem, fae/faer)

---

## 3. Expression / Style Tags

**Category:** `EXPRESSION_STYLE`
**Behavior:** Multi-select

| Slug | Display Name |
|------|--------------|
| `femme` | Femme |
| `masc` | Masc |
| `androgynous` | Androgynous |
| `soft` | Soft |
| `punk` | Punk |
| `goth` | Goth |
| `e-girl` | E-girl |
| `e-boy` | E-boy |
| `e-enby` | E-enby |
| `cottagecore` | Cottagecore |
| `streetwear` | Streetwear |
| `glam` | Glam |
| `alt` | Alt |
| `cyber` | Cyber |

---

## 4. Body & Transition Journey Tags

**Category:** `BODY_JOURNEY`
**Behavior:** Opt-in only, sensitive, self-chosen, non-fetishizing

| Slug | Display Name | Description |
|------|--------------|-------------|
| `on-hrt` | On HRT | Currently on hormone replacement therapy |
| `pre-hrt` | Pre-HRT | Before starting HRT |
| `post-op` | Post-op | Post-surgical transition (not detailed) |
| `non-medical` | Non-medical transition | Social/non-medical transition |
| `open-journey` | Open about journey | Openly shares transition journey |
| `private-journey` | Private about journey | Keeps transition details private |

**Important Notes:**
- All tags are self-selected and optional
- Never forced or required
- Used for recommendation matching, not public filtering
- `stealth` is internal-only (affects recommendations but never displayed)

---

## 5. Vibe / Personality Tags

**Category:** `VIBE_PERSONALITY`
**Behavior:** Multi-select

| Slug | Display Name | Emoji |
|------|--------------|-------|
| `soft-cozy` | Soft & cozy | 🛋️ |
| `chaotic-gay` | Chaotic gay energy | 🌈 |
| `flirty` | Flirty | 😏 |
| `nerdy` | Nerdy | 🤓 |
| `artsy` | Artsy | 🎨 |
| `gamer` | Gamer | 🎮 |
| `activist` | Activist | ✊ |
| `witchy` | Witchy | 🔮 |
| `cosmic` | Cosmic | ✨ |
| `tender` | Tender | 💕 |
| `bold` | Bold | 🔥 |
| `spicy-kind` | Spicy but kind | 🌶️ |

---

## 6. Content Style Tags

**Category:** `CONTENT_STYLE`
**Behavior:** Multi-select, non-explicit

| Slug | Display Name | Description |
|------|--------------|-------------|
| `selfies` | Selfies / looks | Photo content |
| `fashion` | Fashion & outfits | Fashion content |
| `makeup` | Makeup & glow-ups | Makeup tutorials and looks |
| `transition-updates` | Transition updates | Transition journey content |
| `voice-asmr` | Voice & ASMR | Audio/voice content |
| `lifestyle` | Lifestyle vlogs | Day-in-life content |
| `dating-talk` | Dating/love talk | Relationship discussions (non-explicit) |
| `fitness` | Fitness & glow-up | Fitness journey content |
| `mental-health` | Mental health & check-ins | Mental wellness (non-medical) |

---

## 7. Community & Culture Tags

**Category:** `COMMUNITY_CULTURE`
**Behavior:** Sensitive, optionally shown, creator controls visibility

| Slug | Display Name | Description |
|------|--------------|-------------|
| `trans-latina` | Trans Latina | Latinx trans community |
| `black-trans` | Black trans | Black trans community |
| `asian-trans` | Asian trans | Asian trans community |
| `white-trans` | White trans | White trans community |
| `indigenous-2s` | Indigenous 2S | Indigenous two-spirit (respectfully) |
| `mixed-trans` | Mixed race trans | Mixed race trans community |

**Regional Tags:** Additional city/country tags available for local discovery

---

## Collections (Curated Groupings)

| ID | Name | Emoji | Filter Tags |
|----|------|-------|-------------|
| `glow-up-journeys` | Glow-Up Journeys | 🦋 | transition-updates, makeup, fitness |
| `soft-cozy` | Soft & Cozy | 🛋️ | soft, soft-cozy, cottagecore, tender |
| `trans-masc-energy` | Trans Masc Energy | 💪 | trans-man, trans-masc, masc |
| `nonbinary-magic` | Nonbinary Magic | ✨ | nonbinary, genderfluid, agender, androgynous |
| `new-creators` | New Creators | 🌟 | (sort by join date) |
| `rising-stars` | Rising Stars | 🚀 | (sort by trending) |

---

## Tag Guidelines

### Do:
- Allow multi-select for all categories
- Let creators control visibility of sensitive tags
- Use tags for respectful discovery
- Show pronouns prominently everywhere
- Allow custom/write-in options

### Don't:
- Use fetishizing language
- Make any tags mandatory
- Expose sensitive tags without consent
- Use body-part focused categories
- Create objectifying search terms

---

## Implementation Notes

```typescript
// Tag visibility levels
enum TagVisibility {
  PUBLIC,           // Shown on profile and in search
  SUBSCRIBERS_ONLY, // Only visible to subscribers
  PRIVATE,          // Only affects recommendations
  INTERNAL          // System use only (e.g., 'stealth')
}

// Tag sensitivity levels
enum TagSensitivity {
  NORMAL,           // Standard tags
  SENSITIVE,        // Requires explicit opt-in
  PROTECTED         // Extra privacy controls
}
```
