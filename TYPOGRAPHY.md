# Typography Reference

This file defines the project's typography tokens for consistent UI text styling.

## Font Family

- Primary: `Geist, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`
- Monospace: `"Geist Mono", "Fira Code", Consolas, "Courier New", monospace`

## Font Weights

- Regular: `400`
- Medium: `500`
- Semibold: `600`
- Bold: `700`

## Type Scale

- Display: `48px / 56px` (`3rem / 3.5rem`) - Weight `700`
- H1: `40px / 48px` (`2.5rem / 3rem`) - Weight `700`
- H2: `32px / 40px` (`2rem / 2.5rem`) - Weight `700`
- H3: `28px / 36px` (`1.75rem / 2.25rem`) - Weight `600`
- H4: `24px / 32px` (`1.5rem / 2rem`) - Weight `600`
- H5: `20px / 28px` (`1.25rem / 1.75rem`) - Weight `600`
- H6: `18px / 28px` (`1.125rem / 1.75rem`) - Weight `600`
- Body Large: `18px / 28px` (`1.125rem / 1.75rem`) - Weight `400`
- Body: `16px / 24px` (`1rem / 1.5rem`) - Weight `400`
- Body Small: `14px / 20px` (`0.875rem / 1.25rem`) - Weight `400`
- Caption: `12px / 16px` (`0.75rem / 1rem`) - Weight `400`
- Overline: `12px / 16px` (`0.75rem / 1rem`) - Weight `600`, uppercase, letter-spacing `0.08em`

## Text Colors

- Primary text: `#0F172A`
- Secondary text: `#334155`
- Muted text: `#64748B`
- Disabled text: `#94A3B8`
- Inverse text: `#F8FAFC`
- Accent text: `#0EA5E9`
- Error text: `#DC2626`
- Success text: `#16A34A`

## Optional CSS Tokens

```css
:root {
  --font-sans: Geist, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  --font-mono: "Geist Mono", "Fira Code", Consolas, "Courier New", monospace;

  --text-primary: #0f172a;
  --text-secondary: #334155;
  --text-muted: #64748b;
  --text-disabled: #94a3b8;
  --text-inverse: #f8fafc;
  --text-accent: #0ea5e9;
  --text-error: #dc2626;
  --text-success: #16a34a;
}
```
