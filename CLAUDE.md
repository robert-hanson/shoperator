# Shoperator

A web app for comparing grocery prices across stores (starting with Costco and Aldi). The core value is **unit price normalization** — showing users which product is cheapest per oz, per count, per fl oz, etc., even when products aren't identical across stores.

## Product Goals

- Users pick a generic product category (e.g. "Cold Brew Coffee")
- They select a specific product from each store
- The app calculates and displays the unit price for each, highlights the winner, and shows the savings %
- Adding more stores over time should require minimal effort
- An admin interface allows curating and maintaining product/price data

## Design Principles

- **Web-first, mobile-first**: The primary experience is a responsive website. Design for small screens first, then scale up. Touch targets must be at least 44×44px.
- **Simple and obvious**: Users should be able to compare prices in 3 taps with no instructions. Avoid forms and text input in the main flow.
- **Sleek and clean**: Minimal UI, clear typography, intentional whitespace. Not cluttered.
- **Fast**: Pages should feel instant. Show loading skeletons, not blank screens.

## Development Best Practices

### Code Quality
- TypeScript strict mode always — no `any` types
- Business logic (unit math, price calculations) must have unit tests
- Keep functions small and single-purpose
- Don't add abstractions until you need them 3 times

### Responsive Design
- Mobile-first CSS — design for ~375px wide first, then add breakpoints
- No fixed pixel widths on containers — use max-width, flexbox, grid
- Test on real mobile viewports before considering something done

### Accessibility
- Semantic HTML (`<main>`, `<nav>`, `<button>`, not `<div>` for everything)
- All interactive elements must be keyboard-navigable
- Images need meaningful `alt` text
- Color is never the only way to convey information (e.g. winners need a label, not just green)
- Form inputs need associated `<label>` elements

### Performance
- Lazy-load below-the-fold content
- Show loading skeletons for any async data
- Avoid layout shifts — reserve space for images before they load

### Security
- Never commit secrets — all credentials via environment variables
- Validate and sanitize all user input on the server
- Use parameterized queries — never concatenate user input into SQL
- Admin routes must require authentication

### Error Handling
- Show user-friendly error messages, not raw error objects
- Empty states should guide the user ("No products found — add one in admin")
- If a request takes >1.5s, show a loading indicator

### Testing
- Unit test all calculation/utility logic
- Test edge cases: zero prices, unit conversions, packs of multiple items

## What NOT to Do
- Don't hardcode prices or product data in the frontend
- Don't use `any` in TypeScript
- Don't design only for desktop
- Don't skip loading/error states
- Don't add features that weren't asked for
