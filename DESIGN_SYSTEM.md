# DropLabz Design System & Brand Guidelines

## Vision

DropLabz is a **professional Web3 infrastructure platform** enabling NFT communities to manage whitelists, collaborations, pre-sales, and community operations on Solana.

**Not a marketplace. Not a launchpad. An operational infrastructure.**

---

## Visual Identity

### Color Palette

**Primary Base**

- `#0a0e27` - Very dark navy (near-black, main backgrounds)
- `#111528` - Slightly lighter dark navy (cards, panels)

**Primary Accent - Radioactive Green (Execution & Automation)**

- `#00ff41` - Pure radioactive green (CTAs, execution actions)
- `#00dd33` - Darker green (hover states)
- `#00ff41` with 10% opacity - Subtle glows, borders

**Secondary Accent - Electric Blue (Trust & Infrastructure)**

- `#00d4ff` - Cyan/electric blue (information, Solana, secondary CTAs)
- `#0099cc` - Darker blue (hover states)
- `#00d4ff` with 10% opacity - Subtle glows

**Accent Colors**

- **Green**: Execution, automation, "go" actions (Whitelist, Deploy, Create)
- **Blue**: Information, secondary actions, trust signals (Details, Learn More)
- **Red**: Warnings, errors, destructive actions
- **Gray**: Disabled states, secondary text (`#667085`)

### Color Usage Rules

- Green and blue should blend, not compete
- Do NOT use pure neon green overwhelmingly — balance with blue and dark tones
- Dark backgrounds with subtle glow effects around important elements
- Avoid bright white backgrounds completely
- Use transparency and glows instead of solid bright colors

### Brand Motif: The Droplet

**Meaning**: Represents "drops" (airdrops, giveaways, whitelists, access drops)

**Usage**:

- ✅ Logo and header branding
- ✅ Sparse accent element on hero/landing sections
- ❌ Do NOT repeat excessively throughout UI
- ❌ Do NOT use as decoration for every component

**Style**: Clean, geometric, minimal — fits infrastructure aesthetic

---

## Typography

**Font Family**: Modern, clean sans-serif (e.g., Inter, Roboto, -apple-system)

**Hierarchy**:

- **H1/Hero**: 48px-56px, bold, technical confidence
- **H2/Section**: 32px-40px, bold, clear structure
- **H3/Subsection**: 24px-28px, semibold
- **Body**: 14px-16px, regular, excellent readability
- **Small/Label**: 12px-13px, uppercase sparingly for badges
- **Monospace**: For wallet addresses, transaction IDs, code snippets

**Tone**:

- Technical and confident
- Professional, not playful
- Labels may use uppercase for emphasis (DEPLOY, WHITELIST, ACTIVE)
- No rounded, cartoon, or casual fonts

---

## UI Component Patterns

### Cards & Panels

- Dark background (`#111528`)
- Subtle border: 1px solid `rgba(0, 255, 65, 0.1)` (green glow)
- Rounded corners: 8px (clean, not excessive)
- No drop shadows — use borders and subtle glows instead
- Padding: 20px-24px

### Buttons

**Primary (Execution - Green)**

```
Background: #00ff41
Text: #0a0e27
Hover: #00dd33
Border: None
Width: Full or contained
```

**Secondary (Information - Blue)**

```
Background: #00d4ff
Text: #0a0e27
Hover: #0099cc
Border: None
```

**Tertiary (Ghost)**

```
Background: transparent
Border: 1px solid #667085
Text: #667085
Hover: 1px solid #00d4ff, text #00d4ff
```

**Disabled**

```
Opacity: 50%
Cursor: not-allowed
```

### Badges & Tags

- Background: `rgba(0, 255, 65, 0.15)` (green background, low opacity)
- Text: `#00ff41` (green text)
- Padding: 4px 8px
- Border radius: 4px
- Font: 12px uppercase, semibold
- Example: "ACTIVE", "WHITELIST", "PRE-SALE"

### Input Fields

- Background: `#111528` with border `1px solid #00d4ff`
- Text: White (`#ffffff`)
- Focus: Border color `#00ff41`, subtle glow
- Placeholder: `#667085`
- Padding: 12px 16px

### Dividers & Borders

- Color: `rgba(0, 255, 65, 0.1)` (subtle green)
- Or: `rgba(0, 212, 255, 0.1)` (subtle blue)
- Width: 1px

### Glows & Effects

- Use opacity and transparency, not pure bright colors
- Green glow: `box-shadow: 0 0 20px rgba(0, 255, 65, 0.2)`
- Blue glow: `box-shadow: 0 0 20px rgba(0, 212, 255, 0.2)`
- No drop shadows — use glows

---

## Layout & Structure

### Page Layouts

- **Hero/Landing**: Full-width dark, centered content, subtle droplet accent
- **Dashboard**: Sidebar navigation (dark), main content area, grid-based cards
- **Admin Panel**: Compact sidebar, full-width content, tabular data
- **Public Pages**: Clean, readable, security-focused

### Spacing

- Use consistent 8px or 16px grids
- Generous padding for dashboards (long session use)
- Compact spacing for data-heavy admin panels

### Navigation

- Dark sidebar or top navigation
- Active state: green accent (border or background)
- Icons: minimal, geometric, technical style

---

## Imagery & Icons

**Icon Style**:

- Minimal, geometric, hex-based or technical
- Consistent stroke width
- 24px or 32px default sizes
- Monochrome (white or green/blue)

**Photography/Graphics**:

- Solana-based visuals acceptable
- NFT iconography acceptable
- ❌ NO Bitcoin branding
- ❌ NO meme coins
- ❌ NO unrelated crypto imagery
- Infrastructure, tech, community themes

### Example Icons

- Whitelist: checkmark or verified badge
- Collaboration: connected nodes or handshake
- Pre-sale: rocket or upward trend
- Community: users or network graph
- Wallet: wallet or lock
- Security: shield or lock
- Settings: gear or sliders

---

## Platform Personality

### DropLabz Should Feel Like

✅ Professional Web3 infrastructure
✅ Powering communities with automation
✅ Built for serious projects and users
✅ Scalable, secure, reliable
✅ Technical and authoritative
✅ Ready for long admin sessions

### DropLabz Should NOT Feel Like

❌ A Discord server clone
❌ A meme launchpad
❌ A flashy NFT mint page
❌ A casual marketplace
❌ A gamified or playful platform

---

## Use Cases & Scenarios

### Whitelist Management

- **Visual Tone**: Secure, controlled, authoritative
- **Colors**: Green for "deploy/activate", blue for "details/view"
- **Icons**: Checkmarks, shields, verified badges
- **Messaging**: "Whitelist deployed", "Access verified", "Entry confirmed"

### Collaboration Management

- **Visual Tone**: Connected, networked, collaborative
- **Colors**: Blue for "connect/propose", green for "approve/execute"
- **Icons**: Connected nodes, handshakes, bridges
- **Messaging**: "Partnership initiated", "Collaboration active", "Co-hosted event"

### Pre-Sale Management

- **Visual Tone**: Countdown, active, exciting (but professional)
- **Colors**: Green for "go live", blue for "upcoming", red for "ended"
- **Icons**: Rocket, timer, graph
- **Messaging**: "Pre-sale live", "Slots filled", "Launch time"

### Community Management

- **Visual Tone**: Inclusive, organized, governed
- **Colors**: Green for "action items", blue for "member info"
- **Icons**: Users, groups, organization charts
- **Messaging**: "Members active", "Roles assigned", "Community governed"

---

## Implementation Checklist

When building any DropLabz feature:

- [ ] Dark backgrounds (`#0a0e27` or `#111528`)
- [ ] Green for execution/primary actions
- [ ] Blue for information/secondary actions
- [ ] Subtle glows, not bright neons
- [ ] Professional typography (clean sans-serif)
- [ ] Minimal, geometric icons
- [ ] No bright white
- [ ] No playful fonts or rounded cartoonish elements
- [ ] Infrastructure/technical aesthetic
- [ ] Droplet accent (sparingly)
- [ ] Card-based layout with subtle borders
- [ ] Accessibility: good contrast on dark backgrounds

---

## Reference Images

(User provided visual direction images - referenced for design inspiration)

---

**Updated**: January 25, 2026
**Status**: Active design system for all DropLabz components
