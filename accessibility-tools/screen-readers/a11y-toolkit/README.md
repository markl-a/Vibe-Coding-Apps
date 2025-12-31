# A11y Toolkit

A comprehensive accessibility testing toolkit with screen reader simulation, automated auditing, and color contrast checking.

## Features

- **Accessibility Audit**: Check for common WCAG violations
- **Screen Reader Simulator**: See how content is announced
- **Color Contrast Checker**: Verify WCAG color requirements
- **Element Analysis**: Get accessibility info for any element

## Quick Start

```bash
pnpm install
pnpm dev
```

Open http://localhost:5173 in your browser.

## Usage

### Accessibility Audit

```typescript
import { runAudit, formatAuditResult } from '@vibe/a11y-toolkit';

const result = runAudit(document);
console.log(formatAuditResult(result));

// Check specific issues
result.violations.forEach(issue => {
  console.log(`[${issue.severity}] ${issue.rule}`);
  console.log(`  Element: ${issue.selector}`);
  console.log(`  Help: ${issue.help}`);
});
```

### Screen Reader Simulator

```typescript
import { ScreenReaderSimulator } from '@vibe/a11y-toolkit';

const simulator = new ScreenReaderSimulator();

// Get accessibility info for an element
const button = document.querySelector('button');
const info = simulator.getElementInfo(button);
console.log('Role:', info.role);
console.log('Name:', info.name);
console.log('Focusable:', info.focusable);

// Simulate announcement
const announcement = simulator.announce(button);
console.log('Would announce:', announcement.text);

// Get all focusable elements
const focusable = simulator.getFocusableElements();
console.log('Tab order:', focusable.length, 'elements');
```

### Color Contrast

```typescript
import { checkContrast, getContrastRatio, suggestAccessibleColor } from '@vibe/a11y-toolkit';

// Check if colors meet WCAG requirements
const result = checkContrast('#333333', '#ffffff');
console.log('Ratio:', result.ratio);
console.log('AA Normal:', result.aa.normal); // true (needs 4.5:1)
console.log('AA Large:', result.aa.large);   // true (needs 3:1)
console.log('AAA Normal:', result.aaa.normal); // true (needs 7:1)

// Get just the ratio
const ratio = getContrastRatio('#007bff', '#ffffff');
console.log('Contrast ratio:', ratio);

// Get a suggested accessible alternative
const suggestion = suggestAccessibleColor('#aaaaaa', '#ffffff', 4.5);
console.log('Suggested color:', suggestion);
```

## Audit Rules

The toolkit checks for these common issues:

| Rule | Severity | Description |
|------|----------|-------------|
| `img-alt` | Critical | Images must have alt text |
| `label` | Critical | Form elements must have labels |
| `button-name` | Critical | Buttons must have accessible names |
| `link-name` | Serious | Links must have accessible names |
| `heading-order` | Moderate | Heading levels should not be skipped |
| `html-lang` | Serious | HTML must have lang attribute |
| `tabindex` | Moderate | Avoid positive tabindex values |
| `landmark-main` | Moderate | Page should have main landmark |

## WCAG Requirements

### Color Contrast

| Level | Normal Text | Large Text |
|-------|-------------|------------|
| AA | 4.5:1 | 3:1 |
| AAA | 7:1 | 4.5:1 |

Large text is defined as:
- 18pt (24px) or larger
- 14pt (18.66px) bold or larger

## API Reference

### runAudit(document)

Returns audit results with violations and passes.

### ScreenReaderSimulator

| Method | Description |
|--------|-------------|
| `getElementInfo(element)` | Get accessibility info |
| `announce(element)` | Simulate announcement |
| `getFocusableElements(container)` | Get tab order |
| `getAnnouncements()` | Get announcement history |
| `observeLiveRegions(callback)` | Watch for live region updates |

### Contrast Functions

| Function | Description |
|----------|-------------|
| `getContrastRatio(fg, bg)` | Calculate contrast ratio |
| `checkContrast(fg, bg)` | Check WCAG compliance |
| `getElementColors(element)` | Get computed colors |
| `checkAllTextContrast(container)` | Check all text elements |
| `suggestAccessibleColor(color, bg, ratio)` | Suggest accessible alternative |

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

## License

MIT
