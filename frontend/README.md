# Future Me - Frontend

Personal Decision-Support Workspace for context-aware time management and decision making.

## 🎨 Design Principles

- **Warm & Calm Aesthetics**: Inspired by mymind's visual language
- **Structured Workspace**: Sunsama-inspired 3-column layout
- **AI Transparency**: Reclaim.ai-inspired explainable AI reasoning
- **NOT a chatbot**: Decision-support environment, not a chat interface

## 🏗️ Architecture

### 3-Column Layout (Desktop)

```
┌─────────────┬──────────────────┬─────────────┐
│   LEFT      │     CENTER       │    RIGHT    │
│   20-24%    │     44-48%       │   32-34%    │
├─────────────┼──────────────────┼─────────────┤
│  Personal   │   Decision &     │  Temporal   │
│  Context    │   Context        │  Reality    │
│  Anchors    │   Stream         │  (Calendar) │
│             │                  │             │
│ • Goals     │ • Dashboard      │ 8am-8pm     │
│ • Roles     │ • Interventions  │ Timeline    │
│ • Context   │ • Decisions      │ 4 Layers    │
│   Check     │ • Clarifications │             │
└─────────────┴──────────────────┴─────────────┘
```

### Responsive Breakpoints

- **< 768px**: Vertical stack, tab switching
- **< 1024px**: Left sidebar collapses to icon rail
- **≥ 1024px**: Full 3-column layout

## 🎨 Design Tokens

### Colors

```css
--color-background: #FBF9F6      /* Warm cream */
--color-surface: #FFFFFF         /* Pure white */
--color-text-primary: #2D3748    /* Slate */
--color-text-secondary: #718096  /* Gray slate */

/* Semantic accents */
--color-accent-anchor: #3182CE    /* Trust blue - fixed commitments */
--color-accent-intention: #319795 /* Calm teal - flexible intentions */
--color-accent-ai: #7C3AED       /* Intuition violet - AI suggestions */
--color-accent-warning: #D97706   /* Warm amber - alerts */
--color-accent-rest: #10B981     /* Healing green - recovery time */
```

### Typography

- **Serif**: Reflective moments (hero cards, headings)
- **Sans-serif**: UI controls, body text
- **Monospace**: Time, numbers, data

## 📦 Tech Stack

- **React 18** + **TypeScript**
- **Vite** (build tool)
- **TailwindCSS** (styling)
- **React Router** (routing - needs installation)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Install React Router (required)
npm install react-router-dom

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Development Server

The dev server runs on `http://localhost:5173` by default.

## 📁 Project Structure

```
src/
├── api/
│   └── client.ts           # Mock API client (replace with real API)
├── components/
│   └── layout/
│       ├── AppShell.tsx    # 3-column responsive shell
│       ├── LeftSidebar.tsx # Personal context anchors
│       └── RightSidebar.tsx# Calendar timeline
├── pages/
│   ├── HomePage.tsx        # Dashboard with interventions
│   ├── ContextPage.tsx     # What Future Me understands
│   ├── DecisionsPage.tsx   # Ask Future Me (decision queries)
│   ├── CalendarPage.tsx    # Full calendar view
│   └── DemoPage.tsx        # Demo mode scenarios
├── types/
│   └── domain.ts           # TypeScript domain types
├── App.tsx                 # Root component with routing
├── main.tsx               # Entry point
└── index.css              # Tailwind + custom styles
```

## 🎯 Core Features

### Calendar Timeline Layers

1. **Fixed Anchors**: Solid blocks (meetings, rigid commitments)
2. **Flexible Intentions**: Lighter tint (planned work, movable)
3. **Ghost Slots**: Dashed border (AI proposals, not confirmed)
4. **Recovery Buffers**: Diagonal stripes (rest, breaks)

### Intervention Intensity Levels

1. **Ambient Nudge**: Subtle badge (lowest priority)
2. **Suggestion Card**: Dismissible card (medium)
3. **Proactive Intervention**: Requires user action (high priority)

### Decision Support Components

- **Recommendation**: AI's suggested action
- **Reasoning**: Factor-based explanation with weights
- **Trade-offs**: Explicit gains vs. costs
- **Alternatives**: Other options with suitability scores
- **Impact Analysis**: Short-term & long-term consequences

## 🔌 API Integration

Currently uses mock data from `src/api/client.ts`. To connect to real backend:

1. Set `VITE_API_BASE_URL` environment variable
2. Replace mock implementations with real fetch calls
3. Types are already defined in `src/types/domain.ts`

### Environment Variables

Create `.env` file (see `.env.example`):

```bash
VITE_API_BASE_URL=http://localhost:3000/api
```

## 🎨 Styling Guidelines

### Using Design Tokens

```tsx
// Tailwind utility classes
<div className="bg-background text-text-primary" />
<div className="text-accent-ai" />
<time className="font-mono" />
<h1 className="font-serif" />

// Timeline layer classes
<div className="timeline-anchor" />     // Fixed commitment
<div className="timeline-intention" />  // Flexible intention
<div className="timeline-ghost" />      // AI suggestion
<div className="timeline-recovery" />   // Recovery buffer

// Intervention intensity classes
<div className="intervention-ambient" />
<div className="intervention-suggestion" />
<div className="intervention-proactive" />
```

## 📱 Responsive Behavior

The layout automatically adapts:

- **Desktop (≥1024px)**: Full 3-column layout
- **Tablet (768px-1023px)**: Left sidebar collapses, 2-column
- **Mobile (<768px)**: Single column, tab navigation

## 🧪 Demo Mode

Demo mode provides pre-configured scenarios to showcase Future Me's capabilities:

1. **Overcommitted Developer**: Capacity alerts, schedule optimization
2. **Energy-Aware Scheduling**: (Coming soon)
3. **Goal Drift Alert**: (Coming soon)

Access via `/demo` route or navigation menu.

## 🛠️ Development

### Adding New Components

Follow the established patterns:

1. Use TypeScript with proper types from `domain.ts`
2. Apply design tokens via Tailwind classes
3. Maintain the calm, warm aesthetic
4. Ensure responsive behavior

### Code Style

- **TypeScript**: Strict mode enabled
- **React**: Functional components with hooks
- **Styling**: Tailwind utility-first, custom classes for patterns
- **Naming**: Clear, semantic component and variable names

## 🎯 MVP Scope (5-day Hackathon)

✅ **Completed Foundation**:
- 3-column responsive layout
- Basic routing structure
- Design token system
- Mock API client
- Core page skeletons
- Calendar timeline layers
- Intervention card patterns

🚧 **Next Steps** (Backend Integration):
- Install react-router-dom dependency
- Connect to real API endpoints
- Implement state management (Context API / Zustand)
- Add real-time data fetching
- Complete decision query flow
- Implement demo scenarios

## 📚 References

- **Design Research**: `../docs/design-research/REFERENCE_ANALYSIS.md`
- **Product Specs**: `../docs/` directory
- **UX Inspiration**: mymind, Sunsama, Reclaim.ai

## 🤝 Contributing

This is a hackathon MVP. Focus on:
- Functionality over perfection
- User experience fundamentals
- Clean, maintainable code
- Responsive design

## 📄 License

Private - Hackathon Project
