# MemoryOS — Living Memory Interface
## Product Website Design & Performance Specification

**Status:** Approved direction  
**Design concept:** Living Memory Interface  
**Product:** MemoryOS  
**Primary goal:** Make MemoryOS feel like a serious, premium AI infrastructure product while using interaction to demonstrate what memory actually does.

---

## 1. Executive Direction

### The decision

Do **not** ship the existing Hologram HUD, Elegant Modern Dark, or Aurora Nebula moodboards unchanged.

Use them as ingredients for a fourth design direction:

> **MemoryOS — Living Memory Interface**

The visual formula is:

- **35% Elegant Modern Dark** — credibility, restraint, enterprise quality
- **25% Aurora Nebula** — atmosphere and emotional identity
- **20% Hologram HUD** — technical identity and system visualization
- **20% modern interactive component patterns** — especially the kinds of hero, spotlight, parallax, scroll and interactive components commonly used in current 21st.dev ecosystems

The final result must feel like:

> **A premium developer infrastructure company from 2026.**

It must NOT feel like:

- a generic AI landing page
- a Web3 website
- a cyberpunk dashboard
- a gaming website
- an AI-generated template overloaded with effects

### Core design principle

**The website itself should demonstrate MemoryOS.**

Do not merely tell visitors:

> MemoryOS stores, retrieves, updates and manages memories.

Instead, let the visitor watch a memory:

1. enter the system
2. get extracted
3. get classified
4. conflict with an existing memory
5. supersede the old memory
6. become retrievable
7. expose its provenance

This is the primary differentiator of the website.

---

# 2. Product Positioning

## Primary message

### Headline

> **Give your AI a memory it can trust.**

### Supporting copy

> MemoryOS is the memory infrastructure for AI applications — storing what matters, updating what changed, and giving every retrieved memory a reason.

### Primary CTA

> **Build with MemoryOS →**

### Secondary CTA

> **See how memory works**

### Positioning statement

MemoryOS should be presented as a **memory infrastructure layer**, not as another chatbot, AI assistant, RAG UI, or vector database.

The website should communicate:

- persistent memory
- memory updates
- conflict resolution
- supersession
- provenance
- retrieval
- privacy
- explainability
- developer integration

---

# 3. Design Principles

## 3.1 Interaction must have meaning

Every major animation should communicate something about the product.

### Good animation

A memory changes from:

`coffee → tea`

because the user stated a new preference.

### Bad animation

A random glowing orb continuously spinning because it looks cool.

---

## 3.2 Premium, not flashy

Use:

- subtle glow
- restrained gradients
- soft glass
- precise borders
- smooth transitions
- sparse particles
- high-quality typography
- strong whitespace

Avoid:

- rainbow gradients
- excessive neon
- bouncing UI
- constant parallax
- huge 3D objects
- excessive blur
- continuous particle storms

---

## 3.3 The interface should feel alive

The page should have a sense of an underlying system operating continuously.

Examples:

- small memory nodes subtly moving
- a connection becoming active
- a memory card changing status
- a retrieval score updating
- a terminal event appearing
- a graph connection lighting up

The motion should be slow and intentional.

---

# 4. Visual Identity

## 4.1 Background

Primary:

```text
#07070A
```

Secondary surfaces:

```text
#0D0D11
#121218
#17171E
```

Borders:

```text
rgba(255,255,255,0.08)
rgba(255,255,255,0.12)
```

Do not use pure black as the dominant background.

---

## 4.2 Accent palette

### Primary — Electric Indigo

```text
#7C5CFF
```

### Secondary — Ice Blue

```text
#8FE7FF
```

### Success

```text
#5EE6A8
```

### Superseded / warning

```text
#FF7AA8
```

### Text

```text
#F7F7FA
```

### Secondary text

```text
#A5A5B0
```

### Muted text

```text
#6F707C
```

Important:

Accent colors should represent **state**, not decoration.

For example:

- indigo = active system
- blue = information / retrieval
- green = successful operation
- pink = superseded / conflict

---

# 5. Typography

Use a three-font system.

## Display

Preferred:

**Space Grotesk**

Alternative:

**Sora**

Use for:

- hero headline
- major section headings
- important numerical values

## Body

**Inter**

Use for:

- descriptions
- navigation
- buttons
- UI labels

## Machine / technical

**IBM Plex Mono**

Alternative:

**JetBrains Mono**

Use for:

- API requests
- memory IDs
- confidence values
- provenance
- terminal
- technical labels
- system states

### Typography rule

The distinction should visually communicate:

```text
Human interface
       ↓
Space Grotesk / Inter

Machine memory
       ↓
IBM Plex Mono
```

---

# 6. Logo

Do not use a generic glowing orb as the final logo.

Create a small abstract memory-network symbol.

Concept:

```text
       ●
      / \
     ●───●
      \ /
       ●
```

The final mark should be simplified enough to work at:

- 16px
- 24px
- 32px
- favicon size

### Logo animation

Idle:

- static network

Processing:

- one connection becomes active

Memory update:

- one node changes state

This animation should only run when the brand mark is visible and should be extremely subtle.

---

# 7. Navigation

Desktop:

```text
MemoryOS

Product    Developers    How it works    Docs

                         GitHub
                         Get started →
```

Keep the navigation minimal.

On scroll:

- transform into a compact floating glass pill
- maintain readability
- use backdrop blur sparingly
- avoid a giant sticky header

Mobile:

```text
MemoryOS                         ☰
```

---

# 8. Page Architecture

The homepage should contain five major acts.

```text
01  HERO
02  THE PROBLEM
03  MEMORY GRAPH
04  DECISION STREAM
05  DEVELOPER EXPERIENCE
06  TRUST / PROOF
07  FINAL CTA
```

Optional:

```text
08  FOOTER
```

---

# 9. ACT 01 — Hero

## Goal

Immediately communicate:

1. what MemoryOS is
2. why it matters
3. what makes it different

## Layout

Desktop:

```text
--------------------------------------------------

MemoryOS

                [small system visualization]

        Give your AI
        a memory it can trust.

  Memory infrastructure for AI applications —
  storing what matters, updating what changed,
  and giving every memory a reason.

       [ Build with MemoryOS → ]
       [ See how memory works ]

--------------------------------------------------
```

The hero should not be overloaded with text.

---

# 10. Hero Interactive Memory Core

This is the signature visual.

## Concept

A lightweight interactive memory graph sits behind or beside the hero content.

Example:

```text
                 MEMORY CORE

       ●────────────●
       │             \
       │              ● preference
       │
       ●────────────●
              \
               ● retrieval
```

Nodes represent memory entities.

Edges represent relationships.

The center represents the memory engine.

---

## Cursor interaction

When the user moves the pointer:

- nearby nodes gently move
- connections react
- central core shifts slightly
- a soft radial highlight follows the cursor
- no heavy DOM transformations

Do not make the graph chase the pointer aggressively.

Use interpolation.

Example conceptual behavior:

```text
targetX = mouseX
currentX += (targetX - currentX) * 0.05
```

---

# 11. Hero Memory Animation

After a short delay, demonstrate:

```text
USER INPUT

"I prefer tea now."
```

Then:

```text
EXTRACTING MEMORY

preference.drink
```

Then:

```text
EXISTING MEMORY

coffee
```

Then:

```text
CONFLICT DETECTED
```

Then:

```text
coffee → superseded
tea → active
```

Finally:

```text
MEMORY UPDATED

confidence     0.94
source         user_stated
status         active
```

This sequence should be approximately:

**4–6 seconds**

Do not loop continuously without pause.

After completing:

- remain in the final state for several seconds
- restart only when appropriate
- pause when the section is not visible

---

# 12. Hero Performance Requirements

The hero is the most performance-sensitive area.

## Preferred rendering

Use:

1. CSS for gradients
2. CSS transforms for simple motion
3. SVG for small static/interactive diagrams
4. Canvas 2D for a larger particle/node field

Avoid Three.js/WebGL unless a measurable visual requirement genuinely needs it.

Current 21st.dev hero collections contain many WebGL and shader-based examples, but many also use Motion or plain React/Tailwind. Use the lighter implementation when it delivers the same visual result.

The goal is not to prove that the website uses WebGL.

The goal is to make the website feel expensive.

---

# 13. ACT 02 — The Problem

Headline:

> **AI can generate.  
> It still doesn't remember.**

Then demonstrate a conversation.

```text
USER

I prefer tea now.
```

MemoryOS:

```text
+ preference.drink

tea
```

Then:

```text
3 WEEKS LATER

USER

What should I drink?
```

Assistant:

```text
Tea.
```

MemoryOS:

```text
memory retrieved
source: user_stated
confidence: 0.94
```

Closing statement:

> **That is memory.**

---

# 14. ACT 03 — Interactive Memory Graph

This is the most important section after the hero.

## Heading

> **Make memory visible.**

Supporting text:

> Know what your AI remembers, why it remembers it, and what changed.

---

## Graph

Use approximately:

```text
15–30 nodes
20–40 connections
```

Do NOT create hundreds of animated nodes.

Each node should represent something meaningful.

Examples:

```text
preference
project
location
relationship
habit
constraint
fact
instruction
```

---

## Hover state

When hovering:

```text
MEMORY

preference.drink

VALUE
tea

SOURCE
user_stated

CONFIDENCE
94%

STATUS
ACTIVE
```

The surrounding graph should subtly dim.

---

## Click state

Clicking opens a larger memory inspector.

Example:

```text
MEMORY INSPECTOR

ID
mem_8f3a92

TYPE
preference

KEY
drink

VALUE
tea

SOURCE
user_stated

CONFIDENCE
0.94

CREATED
Aug 11, 2026

UPDATED
Aug 11, 2026

STATUS
ACTIVE
```

---

# 15. Memory State Model

The UI should visually support:

```text
NEW
ACTIVE
SUPERSEDED
DELETED
REDACTED
CONFLICT
```

Use consistent visual semantics.

Example:

```text
ACTIVE       → green / indigo
SUPERSEDED   → muted pink
DELETED      → muted gray
CONFLICT     → pink
NEW          → blue
```

Do not rely on color alone.

Use:

- icons
- labels
- status text

for accessibility.

---

# 16. ACT 04 — Decision Stream

Heading:

> **See every choice it makes.**

This idea is already present in the existing Elegant Dark/HUD direction and should be retained.

Use a premium terminal-style component.

Example:

```text
MEMORYOS / SESSION 001

> ingest:
  "Actually I switched to tea now."

extract
  preference.drink

pii
  clean

conflict
  coffee

resolution
  coffee → superseded

update
  tea → active

provenance
  user_stated

confidence
  0.94

✓ memory updated
```

---

# 17. Make the Decision Stream Interactive

Allow the user to click:

```text
Why did this memory win?
```

Expand:

```text
RESOLUTION EXPLANATION

New memory:
tea

Existing memory:
coffee

Conflict:
same semantic slot

Resolution:
newer explicit user statement

Evidence:
"user stated"

Confidence:
0.94
```

This is more valuable than simply showing fake terminal output.

---

# 18. ACT 05 — Developer Experience

Heading:

> **One API call.  
> Persistent memory.**

Show a minimal integration.

Example:

```typescript
const memory = await memoryOS.remember({
  userId: "user_123",
  input: message
});
```

Then show the resulting memory:

```json
{
  "type": "preference",
  "key": "drink",
  "value": "tea",
  "confidence": 0.94,
  "source": "user_stated"
}
```

---

# 19. Developer Integration Animation

Show:

```text
APP
 │
 ▼
MemoryOS
 │
 ├── Extract
 ├── Resolve
 ├── Store
 ├── Retrieve
 └── Explain
 │
 ▼
LLM
```

Animate only the active request path.

Use a single traveling particle or line.

Do not animate every connection simultaneously.

---

# 20. ACT 06 — Trust / Proof

Heading:

> **Your AI remembers.  
> But can you prove what it remembers?**

Four interactive cards:

### Provenance

Where did this memory come from?

### Supersession

What changed?

### Forgetting

What was deleted?

### Privacy

What was never stored?

Each card opens a small technical explanation.

---

# 21. Metrics

Only show real metrics.

Never fabricate performance claims such as:

```text
11ms p95
0% PII leakage
97 passing tests
```

unless the product actually measures and proves those numbers.

If metrics are not yet available, use capability labels instead:

```text
AUDITABLE
DETERMINISTIC
TRACEABLE
PRIVACY-AWARE
```

This is important for credibility.

---

# 22. Final CTA

Keep it simple.

```text
Your AI is getting smarter.

Give it a memory.

[ Build with MemoryOS → ]

Open source core · API docs · GitHub
```

Avoid another huge animation here.

A slow ambient glow is enough.

---

# 23. Footer

```text
MemoryOS

Memory infrastructure for AI.

Product
Developers
Docs
GitHub
Privacy
Security

© 2026 MemoryOS
```

---

# 24. Animation System

## Animation categories

### A. Ambient

Examples:

- gradient drift
- subtle glow
- very slow node movement

Frequency:

continuous, but low-cost.

### B. Interaction

Examples:

- hover
- cursor proximity
- card expansion

Frequency:

only while interacting.

### C. Narrative

Examples:

- memory ingestion
- conflict resolution
- retrieval

Frequency:

triggered by viewport or user.

### D. Scroll

Examples:

- section reveal
- graph transition
- content opacity

Frequency:

only while scrolling.

---

# 25. Animation Performance Rules

## Rule 1 — Prefer transform and opacity

Animate:

```css
transform
opacity
```

Avoid continuously animating:

```css
top
left
width
height
box-shadow
filter
```

unless there is a measured reason.

---

## Rule 2 — Never animate layout unnecessarily

Avoid animations that force repeated layout calculations.

Prefer:

```css
transform: translate3d(...)
```

over:

```css
top: ...
left: ...
```

---

## Rule 3 — Use requestAnimationFrame

For JavaScript-driven canvas/graph animation:

```javascript
function tick(time) {
  update(time);
  render();
  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);
```

Do not use:

```javascript
setInterval(render, 16);
```

for visual animation.

---

# 26. Canvas Optimization

If Canvas 2D is used:

## Limit device pixel ratio

Do not blindly render at extreme DPR.

Use:

```javascript
const dpr = Math.min(window.devicePixelRatio || 1, 2);
```

For low-end/mobile devices, consider:

```javascript
const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
```

depending on profiling.

## Limit node count

Desktop:

```text
20–40 nodes
```

Mobile:

```text
8–18 nodes
```

## Limit connection count

Do not calculate every node against every other node every frame if avoidable.

Precompute or spatially limit nearby connections.

---

# 27. Visibility-Based Animation

Animations should stop when the component is off-screen.

Use:

```javascript
IntersectionObserver
```

Example logic:

```text
if visible:
    animation.start()

if hidden:
    animation.pause()
```

Do not keep a 60 FPS canvas running several screens below the viewport.

This is especially important on laptops and mobile devices.

---

# 28. Page Visibility

Pause heavy animation when the browser tab is hidden.

Use:

```javascript
document.visibilityState
```

If:

```text
hidden
```

then:

```text
pause canvas
pause timers
pause loops
```

Resume when:

```text
visible
```

---

# 29. Reduced Motion

Respect:

```css
@media (prefers-reduced-motion: reduce)
```

When enabled:

- disable continuous particle movement
- disable parallax
- disable cursor-following animation
- replace animated graph with static graph
- replace animated text with simple fade
- remove unnecessary looping effects

Provide an optional manual:

```text
Motion: On / Off
```

control in the footer or accessibility menu.

This is both an accessibility requirement and a useful performance fallback.

---

# 30. Mobile Performance Mode

Do not simply scale the desktop experience down.

Create a mobile-specific rendering mode.

Desktop:

```text
30 nodes
40 connections
ambient motion
cursor interaction
```

Mobile:

```text
10–15 nodes
limited connections
no cursor interaction
slower animation
less blur
no large canvas
```

Potentially replace the graph with an SVG or static visual if performance testing shows canvas is unnecessary.

---

# 31. Blur Rules

Backdrop blur and large filters can be expensive.

Use glass effects sparingly.

Good:

```css
backdrop-filter: blur(12px);
```

on a few small elements.

Avoid:

```css
backdrop-filter: blur(60px);
```

across giant full-screen layers.

Similarly, avoid multiple overlapping:

```css
filter: blur(100px)
```

objects.

Use CSS radial gradients for most atmospheric effects.

---

# 32. Aurora Background Optimization

The Aurora effect should use:

- 2–3 large CSS radial gradients
- slow transforms
- low opacity

Do not render multiple giant animated SVG filters.

Recommended:

```text
2–3 gradients
1 subtle noise layer
1 optional moving blob
```

The visual result should be atmospheric but cheap.

---

# 33. Noise Texture

If grain/noise is required:

Prefer:

- tiny static image
- CSS gradient approximation

Avoid generating noise every frame using JavaScript.

Do not run a canvas noise renderer just for grain.

---

# 34. WebGL Policy

### Default

**No WebGL.**

Use WebGL only if:

1. the effect cannot reasonably be created with CSS/SVG/Canvas 2D
2. the effect materially improves the product story
3. performance is measured on mobile
4. there is a fallback
5. reduced-motion mode exists

A shader that looks impressive but drops mobile performance is not worth it.

---

# 35. 3D Policy

Avoid Three.js for the main landing page unless there is a compelling product reason.

MemoryOS is infrastructure.

The website should communicate:

```text
precision
trust
intelligence
systems
```

not:

```text
3D graphics demo
```

---

# 36. React Architecture

Recommended stack:

```text
Next.js
React
TypeScript
Tailwind CSS
Motion
Lucide
Canvas 2D / SVG where needed
```

Use Motion selectively.

Do not wrap every element in Motion components.

---

# 37. Component Structure

Recommended:

```text
app/
├── page.tsx
├── layout.tsx
└── globals.css

components/
├── navigation/
│   └── Navbar.tsx
│
├── hero/
│   ├── Hero.tsx
│   ├── MemoryCore.tsx
│   └── MemorySequence.tsx
│
├── problem/
│   └── MemoryConversation.tsx
│
├── graph/
│   ├── MemoryGraph.tsx
│   ├── MemoryNode.tsx
│   └── MemoryInspector.tsx
│
├── decision/
│   └── DecisionStream.tsx
│
├── developer/
│   ├── CodeExample.tsx
│   └── Pipeline.tsx
│
├── trust/
│   └── TrustCards.tsx
│
├── cta/
│   └── FinalCTA.tsx
│
└── footer/
    └── Footer.tsx
```

---

# 38. Lazy Loading

Heavy/interactive components should not block initial page rendering.

Examples:

```text
MemoryGraph
DecisionStream
advanced canvas
optional WebGL
```

can be dynamically imported when appropriate.

The hero's text and primary CTA must render immediately.

---

# 39. Initial Load Priority

Priority order:

```text
1. HTML
2. critical CSS
3. hero typography
4. hero content
5. primary CTA
6. lightweight visual
7. interactive memory animation
8. below-the-fold effects
```

Never make the visitor wait for a WebGL/canvas scene before seeing the product message.

---

# 40. Font Optimization

Do not load five weights for every font.

Use only required weights.

Recommended:

```text
Space Grotesk:
400
500
600
700

Inter:
400
500
600

IBM Plex Mono:
400
500
```

If possible:

- self-host fonts
- preload only critical font files
- use `font-display: swap`
- avoid blocking render on decorative fonts

---

# 41. Image Optimization

Avoid unnecessary raster images.

When images are needed:

- use WebP/AVIF
- use responsive sizes
- lazy-load below the fold
- specify dimensions
- avoid huge source images

Use Next.js image optimization where appropriate.

---

# 42. Video Policy

Avoid autoplay video in the hero.

If a product demo video is eventually added:

- poster image first
- lazy load
- muted
- compressed
- responsive
- pause when offscreen
- respect reduced motion

The interactive memory system should be the primary hero experience.

---

# 43. Performance Budget

Target:

### Core Web Vitals

Aim for:

```text
LCP       < 2.5s
INP       < 200ms
CLS       < 0.1
```

Preferably:

```text
LCP       < 2.0s
INP       < 150ms
CLS       < 0.05
```

These are targets, not excuses to sacrifice the product experience.

---

# 44. Animation FPS Target

Desktop:

```text
Target: 60 FPS
Acceptable: 50+ FPS
```

Mobile:

```text
Target: 60 FPS
Acceptable: 45+ FPS
```

If the visual cannot maintain performance:

**reduce visual complexity before reducing application responsiveness.**

The UI must remain interactive even if ambient animation is disabled.

---

# 45. Frame-Time Budget

At 60 FPS:

```text
~16.67ms/frame
```

Do not spend the majority of this budget on decorative animation.

Ideally:

```text
UI / browser work
+
animation
+
rendering
```

should remain comfortably below the frame budget.

---

# 46. Avoid React Re-render Loops

Do not store rapidly changing animation coordinates in React state.

Bad:

```tsx
const [x, setX] = useState(0);

requestAnimationFrame(() => {
  setX(...)
});
```

This can cause unnecessary React renders.

Prefer:

- refs
- Canvas
- Motion values
- CSS transforms

for high-frequency animation.

---

# 47. Pointer Events

Do not attach expensive pointer handlers to the entire page.

Prefer:

```text
hero canvas
specific interactive components
```

Use passive listeners where appropriate.

Throttle or interpolate pointer updates.

---

# 48. Scroll Performance

Do not calculate expensive layout information on every scroll event.

Prefer:

- IntersectionObserver
- Motion scroll values
- requestAnimationFrame batching

Avoid repeatedly calling:

```javascript
getBoundingClientRect()
```

inside unrestricted scroll handlers.

---

# 49. Accessibility

Must support:

- keyboard navigation
- visible focus states
- semantic headings
- screen-reader labels
- reduced motion
- sufficient contrast
- buttons that are actually buttons
- links that are actually links

Interactive graphs must have an accessible alternative.

Example:

```text
Memory graph
[View memories as list]
```

---

# 50. Responsive Design

## Desktop

```text
1440+
```

Use:

- large hero
- graph visualization
- generous whitespace

## Laptop

```text
1024–1439
```

Reduce:

- graph size
- particle density
- typography slightly

## Tablet

```text
768–1023
```

Simplify:

- graph
- navigation
- multi-column layouts

## Mobile

```text
<768
```

Use:

- single-column
- reduced animation
- smaller graph
- no cursor effects
- simpler terminal
- larger touch targets

---

# 51. Interaction Details

## Buttons

Primary:

```text
Build with MemoryOS →
```

Hover:

- subtle translateY(-1px)
- border/glow increase
- arrow moves 2–4px

Do NOT create large magnetic movement.

---

## Cards

Hover:

```text
translateY(-2px)
border opacity increases
subtle radial glow
```

Avoid:

```text
translateY(-15px)
rotate(5deg)
scale(1.1)
```

---

# 52. Section Transitions

Use subtle transitions between sections.

Example:

```text
dark
↓
slightly lighter surface
↓
dark
```

Do not make every section a completely different visual world.

The site should feel like one operating system.

---

# 53. Design Tokens

Centralize all design values.

Example:

```css
:root {
  --background: #07070A;
  --surface: #0D0D11;
  --surface-raised: #121218;

  --text: #F7F7FA;
  --text-muted: #A5A5B0;
  --text-faint: #6F707C;

  --primary: #7C5CFF;
  --secondary: #8FE7FF;

  --success: #5EE6A8;
  --danger: #FF7AA8;

  --border: rgba(255,255,255,.08);
  --border-strong: rgba(255,255,255,.12);

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 18px;
  --radius-xl: 24px;
}
```

---

# 54. Don't Overuse Glassmorphism

Glass should communicate:

> elevated system layer

Use it for:

- navigation
- memory inspector
- selected cards
- modal/overlay

Do not make every card glass.

Otherwise the hierarchy disappears.

---

# 55. Loading Strategy

Initial load should show the hero immediately.

Do not create a full-screen:

```text
LOADING MEMORYOS...
```

preloader.

A preloader is unnecessary unless a genuinely unavoidable asset is required.

---

# 56. Error / Fallback Strategy

If the animation fails:

The website should still look intentional.

Example:

```text
interactive graph unavailable
        ↓
static graph visualization
```

Never show:

```text
canvas failed
```

or broken empty containers.

---

# 57. Performance Testing Matrix

Before shipping, test:

### Desktop

- Chrome
- Firefox
- Safari

### Mobile

- iPhone Safari
- Android Chrome

### Hardware

At least:

```text
high-end laptop
mid-range laptop
low-end / throttled mobile profile
```

Use Chrome DevTools CPU throttling.

---

# 58. Performance Acceptance Criteria

The implementation is NOT complete until:

- [ ] no noticeable scroll jank
- [ ] hero remains responsive during animation
- [ ] mobile does not heat excessively during idle
- [ ] animation pauses offscreen
- [ ] hidden tab pauses heavy animation
- [ ] reduced-motion mode works
- [ ] keyboard navigation works
- [ ] no layout shifts from fonts/images
- [ ] no unnecessary React render loop
- [ ] no giant JS bundle for a single visual effect
- [ ] no full-screen WebGL unless justified by profiling

---

# 59. Bundle Rules

Before adding a dependency, ask:

> Can this be done with CSS, SVG, browser APIs, or existing dependencies?

Do not install a library for one small animation.

Preferred:

```text
CSS
SVG
Canvas
Motion
```

before:

```text
Three.js
GSAP
large shader libraries
multiple animation frameworks
```

Use one primary animation abstraction.

---

# 60. 21st.dev Usage Strategy

21st.dev should be treated as a **component research source**, not a visual template to copy.

Useful categories to investigate:

- animated hero
- spotlight
- text reveal
- magnetic button
- scroll media expansion
- interactive cards
- animated gradient
- hero background
- feature spotlight
- bento sections

The current 21st.dev ecosystem contains hundreds of landing-page and hero components, with many implemented using React/Tailwind and a significant subset using Motion, while some use WebGL/shaders.

For MemoryOS, prefer components that:

1. use React/Tailwind directly
2. use CSS transforms
3. use Motion for interaction
4. use Canvas only where justified
5. avoid unnecessary WebGL

---

# 61. Recommended Interaction Budget

The entire site should have approximately:

```text
1 signature hero visualization
1 interactive memory graph
1 decision stream
4 interactive trust cards
small hover interactions throughout
```

That is enough.

Do not make every section animated.

---

# 62. Signature Moment

The visitor should remember this sequence:

```text
"I prefer coffee."

        ↓

MemoryOS

preference.drink = coffee

        ↓

"I switched to tea."

        ↓

CONFLICT

coffee
   ↓
superseded

tea
   ↓
active

        ↓

"What do I drink?"

        ↓

TEA

source:
user_stated
```

This is the website's equivalent of a product demo.

---

# 63. Visual Hierarchy

Every viewport should have one primary focal point.

Hero:

```text
headline
   ↓
memory core
```

Graph section:

```text
memory graph
```

Decision section:

```text
decision stream
```

Developer section:

```text
code + architecture
```

Trust section:

```text
four capabilities
```

Never allow background animation to compete with the headline.

---

# 64. SEO

Use semantic HTML.

Title:

```text
MemoryOS — Memory Infrastructure for AI
```

Description:

```text
MemoryOS gives AI applications persistent, auditable memory.
Store what matters, update what changed, and retrieve memories with provenance.
```

Use one H1.

Use meaningful H2 sections.

Avoid putting essential content only inside Canvas/WebGL.

Search engines and accessibility tools must be able to read the product story without executing the animation.

---

# 65. Analytics

Track only useful product signals.

Recommended:

```text
hero_cta_clicked
docs_clicked
github_clicked
memory_graph_interacted
memory_inspector_opened
decision_stream_interacted
developer_example_copied
trust_card_opened
final_cta_clicked
```

Do not add heavy analytics packages unless needed.

---

# 66. Implementation Phases

## Phase 1 — Foundation

Build:

- Next.js structure
- typography
- design tokens
- navigation
- responsive layout
- hero copy
- CTA
- footer

No advanced animation yet.

---

## Phase 2 — Signature Visual

Build:

- MemoryCore
- node system
- lightweight graph
- cursor interaction
- memory state transitions

Profile performance immediately.

---

## Phase 3 — Product Story

Build:

- problem conversation
- memory graph
- memory inspector
- decision stream
- developer pipeline

---

## Phase 4 — Polish

Add:

- subtle gradients
- section reveals
- hover states
- micro-interactions
- typography refinements
- ambient motion

---

## Phase 5 — Performance

Measure:

- Lighthouse
- Chrome Performance
- Web Vitals
- mobile FPS
- bundle size
- memory usage

Then remove unnecessary effects.

---

# 67. Definition of Done

The MemoryOS website is finished when a new visitor can answer these questions within approximately 15 seconds:

### What is this?

> Memory infrastructure for AI.

### Why do I care?

> AI can finally maintain useful long-term memory.

### Why is it different?

> Memory is visible, updateable, explainable and traceable.

### How do I use it?

> Through a simple developer API.

### Why should I trust it?

> Every memory has state, provenance and resolution logic.

---

# 68. Final Design Principle

The most important rule:

> **Don't build an animated website. Build a website that happens to be alive.**

Animation should make the product concept clearer.

The visitor should leave thinking:

> **"I just watched an AI memory change."**

—not:

> **"That website had cool particles."**

That is the difference between a visually impressive landing page and a product website that creates product understanding.

---

# 69. Source / Research Notes

The existing MemoryOS moodboards establish three useful visual directions:

- **Hologram HUD:** cyan/teal technical visual language, Chakra Petch + Space Grotesk + JetBrains Mono, grid/scanline atmosphere, interactive canvas constellation, and a live decision stream.
- **Elegant Modern Dark:** restrained charcoal/violet system, Inter + JetBrains Mono, minimal navigation, metrics, cards, switches and terminal-style product proof.
- **Aurora Nebula:** deep-space atmosphere, indigo/orchid/cyan glow, slow-moving ambient blobs and a softer emotional identity.

These should be combined rather than copied literally.

Current 21st.dev research confirms that modern React/Tailwind landing-page ecosystems heavily use animated heroes, parallax, spotlight effects, scroll interactions, animated gradients, and other interactive components. The important implementation decision for MemoryOS is to selectively use these patterns while avoiding unnecessary WebGL and continuously running expensive effects.

Performance guidance should follow browser animation best practices: prefer efficient animation properties, use `requestAnimationFrame` for JavaScript-driven rendering, pause work when content is not visible, and honor `prefers-reduced-motion`.

---

# 70. Final Build Instruction

If an AI coding agent is implementing this specification, it should follow this priority:

```text
1. PRODUCT CLARITY
2. VISUAL IDENTITY
3. INTERACTION QUALITY
4. PERFORMANCE
5. ACCESSIBILITY
6. MICRO-POLISH
```

Never reverse this order.

If a visual effect makes the page slower without improving product understanding:

**remove it.**

If a component looks impressive but makes MemoryOS less credible:

**remove it.**

If a component is technically simple but makes the concept of memory immediately understandable:

**keep it.**

The website should feel:

**precise · intelligent · alive · trustworthy · technical · premium**

and never:

**childish · noisy · generic · over-animated · Web3-ish · template-like**.
