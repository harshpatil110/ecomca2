# Lumina Realty

Lumina Realty is a React + Vite frontend for a luxury real-estate brand experience. It includes a public-facing editorial property site and a separate admin console for operations, listings, revenue, marketing, CRM, and settings workflows.

The project is currently a frontend-only implementation. Most data is hardcoded in components, one admin workflow persists to `localStorage`, and the property detail page loads the Razorpay checkout SDK in the browser for a booking-deposit demo.

## Tech Stack

- React 19
- Vite 8
- React Router DOM 7
- Tailwind CSS 4 via `@tailwindcss/vite`
- ESLint 9

## Key Features

### Public experience

- Editorial landing page with a full-screen hero video
- Explore page with mocked filters and curated property cards
- Property detail page with:
  - financial breakdown
  - EMI calculator
  - Razorpay booking-deposit flow
  - manual wire transfer / UTR submission modal
- Saved properties page
- Journal / blog page
- Auth / inquiry page
- Company and legal pages: contact, press, privacy, and terms

### Admin console

- Overview dashboard with KPI cards and recent activity
- Revenue model dashboard
- Marketing strategy dashboard with embedded short-form video asset
- CRM dashboard with mock tour requests and localStorage persistence
- Listings manager with view/edit modals
- New listing draft form
- Settings, notifications, help, and user profile pages

## Route Map

### Public routes

- `/` - home
- `/explore` - property discovery
- `/property/:id` - property detail
- `/auth` - inquiry / auth screen
- `/journal` - editorial content
- `/saved` - saved listings
- `/privacy` - privacy policy
- `/terms` - terms of service
- `/press` - press page
- `/contact` - contact page

### Admin routes

- `/admin` -> redirects to `/admin/overview`
- `/admin/overview`
- `/admin/revenue`
- `/admin/marketing`
- `/admin/crm`
- `/admin/listings`
- `/admin/listings/new`
- `/admin/settings`
- `/admin/notifications`
- `/admin/help`
- `/admin/profile`

## Project Structure

```text
src/
  App.jsx
  main.jsx
  index.css
  layouts/
    MainLayout.jsx
    AdminLayout.jsx
  pages/
    LuminaHome.jsx
    ExploreProperties.jsx
    PropertyDetail.jsx
    AuthSecurity.jsx
    JournalBlog.jsx
    SavedProperties.jsx
    OverviewAdmin.jsx
    RevenueModelAdmin.jsx
    MarketingStrategyAdmin.jsx
    CrmStrategyAdmin.jsx
    ListingsManagerAdmin.jsx
    SettingsAdmin.jsx
    admin/
    company/
    legal/
public/
src/assets/
```

## Environment Variables

Create a `.env` file in the project root:

```env
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

Notes:

- The property detail page falls back to a placeholder key if `VITE_RAZORPAY_KEY_ID` is missing.
- Razorpay checkout is loaded at runtime from `https://checkout.razorpay.com/v1/checkout.js`.

## Getting Started

### Install dependencies

```bash
npm install
```

### Start the dev server

```bash
npm run dev
```

The Vite dev server is configured to run on `http://localhost:5175`.

### Production build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

## Current Implementation Notes

- This repository does not include a backend, database, or API integration layer.
- Most listings, KPIs, pricing figures, articles, and admin analytics are mocked directly in page components.
- `src/pages/CrmStrategyAdmin.jsx` stores and reads mock tour requests from `localStorage` under the key `crm_tour_requests`.
- Media is a mix of local assets in `public/` and `src/assets/`, plus externally hosted images.
- The admin and auth flows are UI-only and do not perform real authentication or authorization checks.

## Verification Status

Checked in the current project state:

- `npm run build` - passes
- `npm run lint` - fails

Known lint issue:

- `src/pages/CrmStrategyAdmin.jsx`: React Hooks lint rule flags a synchronous `setState` call inside `useEffect`

## Recommended Next Steps

- Replace hardcoded data with a shared data layer or API
- Add real authentication and route protection for admin pages
- Move listing and CRM state into reusable hooks or context
- Add test coverage for routing and payment-related UI flows
- Resolve the current ESLint issue in `CrmStrategyAdmin.jsx`

