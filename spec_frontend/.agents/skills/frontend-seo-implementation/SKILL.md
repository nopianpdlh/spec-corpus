---
name: frontend-seo-implementation
description: Use when defining how frontend pages handle metadata, canonicals, indexing signals, structured data, and search-visible rendering behavior for production web applications.
---

# Frontend SEO Implementation

This skill is the baseline owner for frontend SEO implementation. It defines how frontend pages express metadata, indexing intent, canonicals, and structured data so that discoverability is implemented deliberately rather than left to ad-hoc page code or audit-only review.

## When to Use

- building pages that should rank or be discoverable in search
- implementing title, description, canonical, robots, hreflang, and Open Graph behavior
- deciding what structured data belongs in the frontend output
- reviewing whether rendering strategy supports crawlability and search visibility
- pairing implementation work with `seo-audit`

Use `seo-audit` as the review companion after implementation. This skill owns policy and implementation patterns, not SEO diagnosis alone.

## Ownership Boundaries

- `frontend-seo-implementation` owns search-facing metadata and discoverability behavior emitted by the frontend.
- `frontend-design-system` owns visual structure, not search metadata policy.
- `web-accessibility` owns accessibility semantics; good semantics often support SEO but do not replace SEO policy.
- backend/content/domain specs own content strategy, taxonomy, editorial priorities, and non-frontend sitemap generation if those are server-managed.
- `seo-audit` remains the audit companion and should validate the result after implementation.

## Core Pattern

### 1. Treat metadata as page contract, not page decoration

Every search-visible route should define:

- canonical URL expectation
- title pattern
- meta description policy
- robots/indexing policy
- share metadata policy (Open Graph / Twitter equivalents if applicable)
- structured data policy when the page type supports it

### 2. Separate page type policy from page instance content

Example page types:

- marketing landing page
- pricing page
- product detail page
- article / documentation page
- account/settings page (usually non-indexable)

Each page type should answer:

- should this page be indexable?
- what makes its title unique?
- what is the canonical source URL?
- does it need JSON-LD?
- what duplicates or filtered states should not compete in search?

### 3. Prefer explicit indexing intent

Do not leave indexing behavior ambiguous.

Use explicit rules for:

- `index,follow`
- `noindex,follow`
- canonical to primary URL
- filtered/search/session states that should not become competing URLs

### 4. Structured data is implementation policy, not wishful markup

Only emit schema that is:

- correct for the page type
- backed by visible or source-of-truth data
- validated after rendering

Important: `seo-audit` already documents that static fetch tools may miss JS-injected JSON-LD. If structured data is injected client-side, validate with browser rendering or Rich Results tooling.

## Implementation Workflow

### Step 1: Classify the route

For each route or route family, define:

- public or private
- indexable or non-indexable
- canonical URL source
- title/description source
- eligible schema type, if any

### Step 2: Define metadata generation rules

Good metadata rules are:

- deterministic
- based on route data and content source of truth
- free of duplicated boilerplate across unrelated pages

Example:

| Page type | Title pattern | Robots | Canonical |
|---|---|---|---|
| Pricing | `Pricing – Product Name` | `index,follow` | primary pricing URL |
| Docs article | `<Article Title> – Docs` | `index,follow` | article permalink |
| Search results | `Search results for X` | `noindex,follow` | none or self with noindex, per stack |
| Account settings | `Account settings` | `noindex,nofollow` or protected route | private route |

### Step 3: Define duplicate-control rules

Document how the frontend handles:

- trailing slash / canonical normalization
- locale variants
- sort/filter/query parameter states
- paginated versus infinite-scroll experiences
- preview/draft URLs

### Step 4: Define structured data policy

If a page type supports schema, define:

- schema type
- minimum required fields
- rendering source (SSR, static, hydrated)
- validation step before release

### Step 5: Pair implementation with audit

After implementing metadata/schema/canonicals, run `seo-audit` or equivalent review to verify the output actually renders as intended.

## Quick Reference

| Topic | Rule |
|---|---|
| Titles | Unique, route-aware, content-driven |
| Canonicals | Explicit for public/indexable pages |
| Robots | Intentional for non-indexable, private, or duplicate-prone routes |
| Structured data | Only when valid, relevant, and validated |
| Validation | Pair implementation with `seo-audit` |

## Common Mistakes

- making every page indexable by default
- duplicating titles/descriptions across route families
- leaving filtered or search-result states indexable without strategy
- emitting schema that does not match visible content
- assuming static fetch is enough to validate client-injected JSON-LD
- mixing share-card metadata and canonical SEO rules without a page-type policy

## Delivery Checklist

- route families classified by indexability
- title/description/canonical rules defined
- robots policy defined for private and duplicate-prone states
- structured data policy documented where needed
- browser or Rich Results validation performed after implementation
