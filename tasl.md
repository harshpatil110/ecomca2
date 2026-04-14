# Project Implementation Plan: Online Real Estate Business Showcase (Integration Phase)

**CRITICAL INSTRUCTION FOR AI AGENT (ANTIGRAVITY):** The frontend UI components (React + Tailwind CSS) have already been generated and downloaded via Stitch. **DO NOT generate new UI designs from scratch.** Your primary objective is to take the existing UI components and wire them up. Every button, form, and link must be fully functional. No "dummy" buttons are allowed. All interactions must trigger actual React Router navigations or backend API calls to the database.

---

## Phase 1: Project Initialization & Wiring Setup
**Objective:** Integrate the existing Stitch UI files into the React environment, set up robust routing, and initialize the database/auth connections.

* **Task 1.1: Environment & Dependency Setup**
    * Install routing and state dependencies: `react-router-dom`.
    * Install backend/db dependencies: `firebase` (for Auth), `drizzle-orm`, `drizzle-kit`, and NeonDB serverless driver.
* **Task 1.2: Asset Integration**
    * Map all downloaded Stitch UI components into the `/components` and `/pages` directories.
    * Ensure global Tailwind CSS files from Stitch are properly imported.
* **Task 1.3: Router Configuration**
    * Implement `BrowserRouter`.
    * Wire up the downloaded `PublicLayout`, `AdminLayout`, and `UserLayout` as wrapper components in the route definitions.

---

## Phase 2: Core User Interface (Public Facing) - Functional Wiring
**Objective:** Make the landing page and property discovery fully interactive.

* **Task 2.1: The Landing Page (Home)**
    * **2.1.1:** Wire the Hero Search bar to capture state and `Maps()` to the Property Listings page with query parameters (e.g., `?location=X&type=Y`).
    * **2.1.2:** Wire the "Featured Properties" cards so clicking them routes to `/property/:id`.
* **Task 2.2: Property Listings Page**
    * **2.2.1:** Wire the Filter sidebar to update URL search parameters dynamically and filter the displayed data from the database.
    * **2.2.2:** Ensure all buttons on Property Cards (e.g., "Favorite", "View Details") trigger their respective state changes or route pushes.
* **Task 2.3: Single Property Detail Page**
    * **2.3.1:** Make the image gallery interactive (click thumbnails to change the main image).
    * **2.3.2:** Wire the "Schedule a Tour/Contact Agent" form to submit data to the CRM database table via API.

---

## Phase 3: Security & Legal (Criterion E) - Functional Wiring
**Objective:** Implement actual authentication and route protection.

* **Task 3.1: Authentication Implementation (Firebase)**
    * **3.1.1:** Wire the existing Login/Register UI forms to Firebase Authentication. Implement proper error handling (e.g., "Invalid password") displayed in the UI.
    * **3.1.2:** Store the selected User Role (Buyer, Seller, Agent, Admin) in the database upon registration and link it to the Firebase UID.
* **Task 3.2: Protected Routing**
    * **3.2.1:** Implement a `<ProtectedRoute>` component that checks the user's authentication state and role. Redirect unauthorized users back to the login page.
* **Task 3.3: Legal Pages**
    * **3.3.1:** Ensure footer links route correctly to the static Terms of Service and Privacy Policy UI pages.

---

## Phase 4: Multi-User Dashboards - Functional Wiring
**Objective:** Fetch and display real user-specific data in the dashboards.

* **Task 4.1: Buyer Dashboard**
    * **4.1.1:** Wire the "Saved Properties" list to fetch from a user-specific favorites table in the database. Clicking "Unsave" must execute a DELETE request and update the UI.
* **Task 4.2: Seller Dashboard**
    * **4.2.1:** Wire the "My Listings" table. Add a working "Create New Listing" button that opens a form, saves to the database, and refetches the list.
* **Task 4.3: Agent Dashboard**
    * **4.3.1:** Wire the lead management list to pull inquiries submitted from the Single Property Detail pages (Task 2.3.2). Add a working "Mark as Contacted" toggle.

---

## Phase 5: Admin Panel - Revenue Model (Criterion B) - Functional Wiring
**Objective:** Populate the Revenue Dashboard with fetched data.

* **Task 5.1: Revenue Data Fetching**
    * **5.1.1:** Wire the main dashboard UI to fetch aggregation metrics (Total ARR, MRR) from the backend API.
* **Task 5.2: Revenue Stream Visuals**
    * **5.2.1:** Pass the fetched API data into the existing UI charts/widgets for all 5 streams (Transaction Fees, Subscriptions, Ads, Affiliates, Ancillary). 
    * *(Note: If data is simulated for the assignment, ensure it is fetched from a dedicated backend route, not hardcoded directly in the React component).*

---

## Phase 6: Admin Panel - Marketing Strategy (Criterion C) - Functional Wiring
**Objective:** Populate the Marketing Dashboard with fetched data.

* **Task 6.1: Marketing Data Fetching**
    * **6.1.1:** Wire the Campaign Overview UI to fetch ad spend and lead generation metrics from the backend.
* **Task 6.2: Strategy Widget Wiring**
    * **6.2.1:** Ensure the UI widgets for Google Ads, Social Media, Referrals, SEO, and Email Campaigns are receiving props from the backend API response and rendering correctly.

---

## Phase 7: Admin Panel - CRM Strategy (Criterion D) - Functional Wiring
**Objective:** Implement the data mapping and automated flagging logic.

* **Task 7.1: Data Collection Pipeline**
    * **7.1.1:** Wire the public "Submit Feedback/Report Issue" form to save entries into a `user_feedback` database table.
* **Task 7.2: Automated Issue Analysis (Logic Implementation)**
    * **7.2.1:** Create a backend utility that analyzes the `user_feedback` table. Have the UI fetch the results of this analysis to populate the "Insights & Flags" widget (e.g., displaying the "Map not loading" critical flag based on actual fetched feedback counts).
* **Task 7.3: Review Management Interactions**
    * **7.3.1:** Wire the CRM Review table. Make the "Resolve" button execute an UPDATE query to change the ticket status in the database, immediately reflecting the change in the UI.

---

## Phase 8: Backend & Database Implementation
**Objective:** Build the active backend to support the frontend wiring using Node, Drizzle ORM, and NeonDB.

* **Task 8.1: Database Schema (Drizzle ORM)**
    * Define schemas for `users`, `properties`, `leads`, `feedback`, and `analytics`.
    * Push the schema to NeonDB using `drizzle-kit`.
* **Task 8.2: API Route Creation**
    * `GET/POST /api/properties` (Filters, Fetching, Creation)
    * `POST /api/crm/feedback` (Writes to feedback table)
    * `GET /api/crm/insights` (Runs aggregation logic on feedback for Task 7.2)
    * `GET /api/admin/metrics` (Serves data for Revenue and Marketing dashboards)
* **Task 8.3: Integration**
    * Ensure all frontend Axios/Fetch calls are pointed to these active endpoints.