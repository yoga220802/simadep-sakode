# 12 — Rebranding and Logo Technical Brief

## Brand identity

- Product name: `SIMADEP`
- Full name: `Sistem Manajemen Departemen`
- Primary: `#71CFFE`
- Secondary: `#F9723B`
- Accent: `#BC71FE`
- Neutral dark: `#172033`
- Light background: `#F7FBFE`
- Font: Nunito

## Logo direction

Create a clean native SVG identity, not a raster embedded inside SVG.

Concept:

- compact symbol combines three rounded blocks/nodes representing departments, projects, and tasks;
- blocks form a subtle letter `S` or connected organizational flow;
- primary blue is dominant;
- orange and purple are supporting accents;
- friendly rounded geometry consistent with Nunito;
- suitable for dashboard, login page, favicon, and monochrome use;
- no gradient required for v1; if used, provide solid fallback.

## Required assets

```text
public/brand/simadep-logo-full.svg       # horizontal wordmark
public/brand/simadep-logo-compact.svg    # symbol + SIMADEP compact
public/brand/simadep-mark.svg            # symbol only
public/brand/simadep-logo-dark.svg       # dark-background variant
public/brand/simadep-logo-mono.svg       # one-color variant
src/app/icon.svg                         # favicon/app icon source
```

## Full logo composition

- canvas approximately `360 × 96`;
- symbol left, wordmark right;
- `SIMADEP` uppercase, bold, dark neutral;
- subtitle `Sistem Manajemen Departemen` smaller below;
- preserve readable spacing at 160 px width;
- include `role="img"`, title/description or accessible alt at usage site.

## Application update checklist

Replace/update:

- `public/logo-color.svg` usage;
- login page logo and copy;
- dashboard header/sidebar;
- root metadata title/description;
- auth page metadata;
- favicon/icon;
- README title and screenshots;
- package name;
- environment variable names from `SMIP` to `SIMADEP` where still needed;
- empty/loading/error text;
- browser title;
- alt text.

## CSS tokens

```css
:root {
  --sakode-primary-color: #71cffe;
  --sakode-secondary-color: #f9723b;
  --sakode-accent-color: #bc71fe;
  --simadep-background: #f7fbfe;
  --simadep-surface: #ffffff;
  --simadep-foreground: #172033;
  --simadep-muted: #64748b;
  --simadep-border: #dbe8f0;
}
```

Keep the provided Sakode token names for company consistency and add semantic SIMADEP tokens.

## Acceptance criteria

- no old SMIP visual identity remains in visible UI;
- old base64 raster SVG removed;
- all SVGs render without external resources;
- light and dark backgrounds remain readable;
- favicon recognizable at 16/32 px;
- no layout shift caused by missing logo dimensions;
- color contrast is acceptable for text/actions;
- Nunito loaded through Next font optimization.
