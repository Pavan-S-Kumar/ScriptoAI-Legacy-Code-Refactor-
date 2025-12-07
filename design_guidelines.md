# Design Guidelines: Legacy Code Analyzer

## Design Approach

**Selected Approach:** Design System - Material Design 3  
**Rationale:** This is a developer utility tool requiring clarity, efficiency, and familiar patterns. Material Design provides excellent data display components, clear status indicators, and established interaction patterns that developers expect.

## Core Design Principles

1. **Clarity Over Decoration** - Technical data must be immediately readable
2. **Functional Efficiency** - Every element serves a purpose in the analysis workflow
3. **Status Transparency** - Users always know where they are in the process
4. **Data Hierarchy** - Critical information (errors, warnings) stands out visually

---

## Typography System

**Font Family:** 
- Primary: Inter (via Google Fonts CDN)
- Code/Data: JetBrains Mono (via Google Fonts CDN)

**Type Scale:**
- Page Title: text-4xl font-bold (36px)
- Section Headers: text-2xl font-semibold (24px)
- Card Titles: text-lg font-medium (18px)
- Body Text: text-base (16px)
- Data Labels: text-sm font-medium (14px)
- Metadata/Timestamps: text-xs (12px)
- Code Blocks: font-mono text-sm

---

## Layout System

**Spacing Primitives:** Use Tailwind units of **4, 6, 8, 12** consistently
- Component padding: p-6 or p-8
- Section spacing: space-y-8 or space-y-12
- Element margins: m-4, m-6
- Grid gaps: gap-6

**Container Strategy:**
- Single column max-width layout: max-w-5xl mx-auto
- No hero section - this is a utility tool
- Content starts immediately with upload interface

**Grid Structure:**
- 12-column system for status/data displays
- Single column on mobile, 2-column on desktop for status indicators

---

## Component Library

### 1. Upload Interface (Primary Action Area)

**Structure:**
- Prominent upload card at top of page (w-full, p-8)
- Drag-and-drop zone with clear visual boundaries
- File input OR GitHub URL input (toggle between modes)
- Analysis mode selector (radio buttons or segmented control)
- Large primary action button

**Layout:**
```
[Upload Zone - p-8, border-2, border-dashed]
  ├─ Icon (upload cloud icon, large size)
  ├─ Primary instruction text
  ├─ File input OR URL input field
  ├─ Analysis mode selector (inline radio group)
  └─ Submit button (full-width on mobile, auto on desktop)
```

### 2. Status Indicator Component

**Real-time Job Status Display:**
- Inline status badge (pill shape)
- Progress spinner when polling
- Timestamp display (text-xs, muted)
- Request ID shown for reference

**States:**
- Pending: Animated spinner + "Processing..."
- Running: Progress indication + elapsed time
- Completed: Success indicator + duration
- Failed: Error indicator + retry option

### 3. Results Display Panel

**Structure:**
- Expandable/collapsible sections for different result types
- Summary cards grid (2 columns on desktop)
- Detailed JSON viewer with syntax highlighting
- Download results button

**Summary Cards:**
```
Grid layout (grid-cols-1 md:grid-cols-2, gap-6)
├─ Languages Detected Card
├─ Files Analyzed Card
├─ Issues Count Card (Critical/Major/Minor breakdown)
└─ Test Coverage Card
```

**Issues List:**
- Filterable/sortable table or list
- Severity badges (Critical, Major, Minor)
- File path with line numbers (monospace font)
- Expandable issue descriptions

### 4. Navigation/Header

**Minimal Header:**
- Logo/title on left (text-xl font-bold)
- Optional: New Analysis button on right
- Height: h-16
- Border bottom for separation

### 5. Footer

**Minimal Utility Footer:**
- API status indicator
- Documentation link
- Version number
- Centered, text-sm

---

## Form Elements

**Input Fields:**
- Height: h-12
- Padding: px-4
- Border radius: rounded-lg
- Font size: text-base
- Clear focus states with visible outline

**Buttons:**
- Primary action: px-8 py-3, rounded-lg, text-base font-medium
- Secondary action: px-6 py-2, rounded-md, text-sm
- Icon buttons: Square, p-3, rounded-md

**File Upload Zone:**
- Minimum height: min-h-48
- Border: border-2 border-dashed
- Padding: p-8
- Rounded: rounded-xl
- Center-aligned content

---

## Data Display Patterns

### Status Badges
- Inline-flex items-center
- Padding: px-3 py-1
- Rounded: rounded-full
- Font: text-xs font-medium uppercase tracking-wide

### Code/JSON Display
- Font: font-mono text-sm
- Background: Subtle background fill
- Padding: p-4
- Border radius: rounded-lg
- Max height with scroll: max-h-96 overflow-y-auto
- Line numbers in gutter (optional)

### Metric Cards
- Padding: p-6
- Border radius: rounded-xl
- Border: border
- Layout: Metric number (text-3xl font-bold) above label (text-sm)

---

## Icons

**Library:** Heroicons (outline style via CDN)

**Key Icons:**
- Upload: cloud-arrow-up
- Status/Spinner: arrow-path (with rotation animation)
- Success: check-circle
- Error: exclamation-triangle
- Info: information-circle
- Download: arrow-down-tray
- External link: arrow-top-right-on-square

---

## Responsive Behavior

**Mobile (base):**
- Single column layouts
- Full-width cards
- Stacked form elements
- Collapsible sections default closed

**Desktop (md and above):**
- 2-column summary grids
- Horizontal form layouts where appropriate
- Side-by-side upload options
- Expanded detailed views

---

## Animation & Interaction

**Minimal Motion:**
- Status spinner rotation (slow, continuous)
- Smooth transitions on state changes (transition-all duration-200)
- Subtle hover states on interactive elements (cards, buttons)
- No decorative animations

**Loading States:**
- Skeleton loaders for data areas while polling
- Spinner for active processing
- Fade-in for results appearance

---

## Accessibility

- All form inputs have visible labels
- Focus indicators on all interactive elements
- ARIA labels for status indicators
- Keyboard navigation for all functions
- Error messages clearly associated with inputs
- Sufficient contrast for all text (check against backgrounds)

---

## Special Considerations

**Polling UX:**
- Clear visual indicator that polling is happening
- Display last updated timestamp
- Manual refresh button option
- Stop polling button if needed

**Error Handling:**
- Inline error messages near relevant inputs
- Toast/banner for system-level errors
- Actionable error messages with retry options

**Empty States:**
- Helpful message when no jobs exist
- Clear next step guidance
- Upload prompt