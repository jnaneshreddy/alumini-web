# 🎨 Admin Dashboard CSS Variables & Theming Guide

## Complete Color System

### CSS Root Variables (Defined at top of admin.css)

```css
:root {
  /* Background Colors */
  --bg-primary:    #0f172a;    /* Sidebar dark navy */
  --bg-secondary:  #1e293b;    /* Secondary dark color */
  --bg-tertiary:   #f8fafc;    /* Page light background */
  
  /* Text Colors */
  --text-primary:     #ffffff;    /* White text on dark */
  --text-secondary:   #94a3b8;    /* Secondary gray text */
  --text-muted:       #64748b;    /* Muted gray text */
  --text-dark:        #1e293b;    /* Dark text on light */
  
  /* Accent Colors */
  --accent-primary:  #3b82f6;    /* Main blue color */
  --accent-hover:    #2563eb;    /* Darker blue on hover */
  --accent-light:    #dbeafe;    /* Light blue background */
  
  /* Borders */
  --border-color: #e2e8f0;       /* Light gray border */
  
  /* Shadows */
  --shadow-sm:  0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md:  0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg:  0 10px 15px -3px rgba(0, 0, 0, 0.1);
}
```

### How to Use Variables in CSS

```css
/* Example: Change button background */
.button {
  background: var(--accent-primary);  /* Uses #3b82f6 */
}

.button:hover {
  background: var(--accent-hover);    /* Uses #2563eb */
}

/* Example: Change text colors */
.label {
  color: var(--text-primary);         /* Uses #ffffff */
}

.description {
  color: var(--text-secondary);       /* Uses #94a3b8 */
}
```

---

## Component-Specific Styling

### 1. Sidebar (.admin aside)

```css
.admin aside {
  background: var(--bg-primary);           /* #0f172a */
  color: var(--text-primary);              /* #ffffff */
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.2);
}

/* Scrollbar styling */
.admin aside::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
}

.admin aside::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
```

### 2. Brand Icon (.adminBrand > b)

```css
.adminBrand > b {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  font-size: 18px;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}
```

### 3. Navigation Buttons (.admin aside nav button)

```css
.admin aside nav button {
  padding: 10px 12px;
  border-radius: 10px;
  color: var(--text-secondary);      /* #94a3b8 */
  transition: all 0.2s ease;
}

.admin aside nav button:hover {
  background: rgba(59, 130, 246, 0.1);
  color: var(--text-primary);        /* #ffffff */
}
```

### 4. Stats Cards (.adminStats > div)

```css
.adminStats > div {
  padding: 24px;
  border: 1px solid var(--border-color);   /* #e2e8f0 */
  border-radius: 12px;
  background: white;
  box-shadow: var(--shadow-sm);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.adminStats > div::before {
  content: "";
  position: absolute;
  top: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--accent-primary), var(--accent-hover));
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.adminStats > div:hover {
  border-color: var(--accent-primary);     /* #3b82f6 */
  box-shadow: 0 8px 16px rgba(59, 130, 246, 0.1);
  transform: translateY(-4px);
}

.adminStats > div:hover::before {
  transform: scaleX(1);
}
```

### 5. Module Cards (.adminModules > div)

```css
.adminModules > div {
  padding: 24px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: white;
  box-shadow: var(--shadow-sm);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.adminModules > div:hover {
  border-color: var(--accent-primary);
  box-shadow: 0 12px 24px rgba(59, 130, 246, 0.15);
  transform: translateY(-4px);
}
```

---

## Animation Specifications

### Staggered Entrance Animation

```css
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.adminStats > div {
  animation: slideInUp 0.3s ease-out;
}

/* Stagger delays */
.adminStats > div:nth-child(1) { animation-delay: 0.05s; }
.adminStats > div:nth-child(2) { animation-delay: 0.1s; }
.adminStats > div:nth-child(3) { animation-delay: 0.15s; }
.adminStats > div:nth-child(4) { animation-delay: 0.2s; }
```

### Hover Transitions

```css
/* Standard hover transition */
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

/* What animates on hover */
- border-color
- box-shadow
- transform (translateY)
- background-color
```

---

## Spacing System

### Consistency Guidelines

```css
/* Gap values (flexbox/grid) */
gap: 6px;      /* Minimal spacing */
gap: 12px;     /* Small spacing */
gap: 16px;     /* Medium spacing */
gap: 20px;     /* Card spacing */
gap: 24px;     /* Section spacing */
gap: 32px;     /* Major spacing */
gap: 40px;     /* Large spacing */
gap: 48px;     /* Extra large spacing */

/* Padding inside components */
padding: 10px 12px;    /* Button padding */
padding: 24px;         /* Card padding */
padding: 32px 20px;    /* Sidebar padding */
padding: 48px;         /* Main content padding */

/* Border radius */
border-radius: 8px;    /* Buttons */
border-radius: 10px;   /* Navigation items */
border-radius: 12px;   /* Cards */
```

---

## Typography Hierarchy

### Font Sizes & Weights

```css
/* Page Title */
.adminContent h1 {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-dark);
  letter-spacing: -0.5px;
}

/* Section Title */
.adminHeading h2 {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-dark);
}

/* Card Title */
.adminModules h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-dark);
}

/* Label */
.adminContent header p {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(--accent-primary);
  text-transform: uppercase;
}

/* Body Text */
.adminContent header span {
  font-size: 15px;
  color: var(--text-muted);
}

/* Card Description */
.adminModules p {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted);
}
```

---

## Responsive Media Queries

### Desktop (1024px+)
```css
.admin {
  grid-template-columns: 280px 1fr;
}

.adminModules {
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

.adminStats {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.adminContent {
  padding: 48px;
}
```

### Tablet (768px - 1024px)
```css
.admin {
  grid-template-columns: 240px 1fr;
}

.adminModules {
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}

.adminStats {
  grid-template-columns: repeat(2, 1fr);
}

.adminContent {
  padding: 32px;
}
```

### Mobile (480px - 768px)
```css
.admin {
  grid-template-columns: 1fr;
}

.admin aside {
  position: fixed;
  width: 280px;
  transform: translateX(-100%);
}

.adminModules,
.adminStats {
  grid-template-columns: 1fr;
}

.adminContent {
  padding: 20px;
}

.adminContent h1 {
  font-size: 28px;
}

.adminHeading {
  flex-direction: column;
  align-items: flex-start;
}
```

### Small Mobile (<480px)
```css
.adminContent {
  padding: 16px;
}

.adminStats > div,
.adminModules > div {
  padding: 16px;
}

.adminContent h1 {
  font-size: 24px;
}
```

---

## Shadow System

### Usage Guidelines

```css
/* Light shadow - Cards at rest */
box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

/* Medium shadow - Cards on hover */
box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);

/* Large shadow - Prominent elements */
box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);

/* Blue tinted shadow - For accent hover */
box-shadow: 0 8px 16px rgba(59, 130, 246, 0.1);

/* Brand shadow - Logo background */
box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
```

---

## Customization Examples

### Change Primary Color

```css
/* In :root { } */
--accent-primary: #ff6b6b;  /* Change from blue to red */
--accent-hover: #ee5a52;    /* Adjust hover shade */
--accent-light: #ffe5e5;    /* Adjust light variant */

/* All buttons, hover states, borders will update automatically! */
```

### Change Sidebar Color

```css
/* In :root { } */
--bg-primary: #1a1a2e;      /* Change to different navy */

/* Sidebar immediately updates! */
```

### Adjust Spacing

```css
/* In specific component */
.adminContent {
  padding: 64px;  /* Increase from 48px */
  gap: 56px;      /* Increase from 40px */
}

/* Cards will have more breathing room */
```

---

## Best Practices

### ✅ DO
- Use CSS variables for all colors
- Use var() function for consistency
- Apply transitions to smooth interactions
- Test responsive breakpoints
- Maintain consistent spacing

### ❌ DON'T
- Hardcode color values (use variables)
- Create new animations without cubic-bezier
- Forget hover states
- Ignore responsive design
- Use too many different shadow values

---

## Quick Reference Card

```css
/* Colors */
Primary Blue:    #3b82f6
Hover Blue:      #2563eb
Dark Navy:       #0f172a
Light Slate:     #f8fafc
Gray Text:       #64748b

/* Transitions */
Default:   all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
Fast:      all 0.2s ease;
Slow:      all 0.5s ease;

/* Spacing */
Gap:       12px 20px 24px 32px 48px
Padding:   10px 12px 16px 20px 24px 32px 48px

/* Animation */
Duration:  0.3s
Easing:    cubic-bezier(0.4, 0, 0.2, 1)
Props:     transform, opacity (GPU accelerated)
```

---

This complete guide ensures your admin dashboard maintains consistency, performance, and visual appeal across all devices and interactions. All styling follows modern web design best practices!
