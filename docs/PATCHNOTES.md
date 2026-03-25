# Patch Notes

## 2026-03-17 - Portfolio Repositioning Release

### Summary

This release repositioned the portfolio around senior-level, AI-augmented web development and legacy modernization, while keeping the live site protected behind a development-first workflow.

### Added

- Development branch workflow for safe iteration before production deployment.
- AI refactor case study page with before/after code comparison and quantified outcomes.
- Direct resume PDF download CTA for mobile-friendly access.
- Recruiter-facing skill grouping: Core Tech, AI Integration, Legacy & Enterprise.
- Visible keyboard focus states across portfolio and documentation pages.

### Changed

- Rewrote the main headline, bio, and about sections for stronger senior positioning.
- Quantified project and experience bullets using supported metrics already present in the portfolio.
- Updated public documentation to explain positioning strategy, release workflow, and deployment process.
- Generalized client references into domain-based descriptions to avoid naming accounts publicly.

### Fixed

- Mobile navigation now resets `aria-expanded` correctly when section links are selected.
- Documentation and portfolio interaction elements now expose clearer focus behavior for keyboard users.
- Resume CTA now points to the hosted PDF instead of only a Drive preview flow.

### Verification

- `npm run build` passes after each major content and QA update.
- Local preview routes verified for `/`, `/documentation.html`, and `/ai-refactor-showcase.html`.

### Notes

- Replace `portfolio-site/public/resume.pdf` if the current file is still a placeholder before treating production as final.

## 2026-03-25

- Contact form is not available in version 1; contact is via email link only.
- Version 1 is a minimalist, static HTML/CSS portfolio with no JavaScript interactivity or AI features.
- Updated v3 Case Study and Docs pages to match v2 content, then condensed for clarity and privacy.
- Ensured v3 internal pages do not leak client information; real employer names shown in Experience, clients anonymized elsewhere.
- Fixed navigation and CSS leaks in v3; all styles now in <head> and scoped.
- Added clear note to v3 Docs that version 2 is the main live version and v3 is in ongoing development.
- Removed redundant sections from v3 Docs; focused on About and Notes for clarity.
- Confirmed v2 remains the main entry point for live/production builds.