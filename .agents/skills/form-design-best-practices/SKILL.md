---
name: Form Design & Accessibility
description: Guidelines for creating premium, responsive, and user-friendly forms.
---

# Form Design Best Practices

## 1. Visual Hierarchy & Spacing
- **Group Related Fields:** Use `gap: 15px` to `20px` between fieldsets/rows.
- **Clear Labels:** Use descriptive labels above inputs with `margin-bottom: 5px`.
- **consistent Height:** All standard inputs should have a height of `40px` to `48px` for touch targets.

## 2. Responsive Layouts
- **Grid for Multi-column forms:** Use `grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))` to prevent overflow on mobile.
- **Full Width on Small Screens:** Ensure inputs occupy `100%` of their container width on mobile.

## 3. Interactive feedback
- **Focus States:** Add clear `outline` or `border-color` change on focus (e.g., `var(--admin-primary)`).
- **Validation support:** Show visual cues for required fields (red border/placeholder) and validation messages.

## 4. Modern Aesthetics
- **Rounded Corners:** Use `border-radius: 8px` or higher for a premium feel.
- **Subtle Shadows:** Use `box-shadow: 0 2px 5px rgba(0,0,0,0.05)` on inputs for depth.
- **Clean Backgrounds:** Use white or very light gray backgrounds with dark text (`#333 !important` per Duke rules).
