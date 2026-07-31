Markdown# TASK: Complete Architecture Refactor & Feature Expansion for Invoicing Web App

You are an expert full-stack web developer specializing in React, TypeScript, Tailwind CSS, and local state/database management. We need to refactor the Web App codebase to support an updated data schema, PDF engine, monochrome glassmorphic UI, and full double-entry ledger functionality.

Execute all changes step-by-step across the web app files. Do not skip any detail.

---

## 1. DATA MODEL & SCHEMA REFACTOR (`types.ts` / Database Models)

Refactor and expand the data models/interfaces to support two distinct entities (**Clients** and **Operators**) along with full double-entry ledger transactions:

### A. Company/Owner Profile Model:
- `companyName: string` ("MILAN CONSTRUCTION")
- `businessTagline: string` ("WORK CONTRACTOR & CIVIL CONTRACTOR")
- `businessServices: string` ("ALL TYPES OF EARTH WORK & CIVIL MAINTENANCE WORKS")
- `addressLine1: string`, `addressLine2: string`
- `companyGSTIN: string`, `companyPAN: String`, `companyPhone: string`
- `bankNameAndBranch: string`, `bankAccountNo: string`, `bankIFSCCode: string`
- `termsAndConditions: string[]`
- `authorizedSignatoryName: string` ("Milandeep Virk")
- `stampImageUrl: string` (Path to pre-signed/stamped PNG asset)

### B. Client & Operator Models:
- `Client`: `id`, `name`, `address`, `email`, `phone`, `gstin`, `panNumber`, `avatarUrl`
- `Operator`: `id`, `name`, `address`, `phone`, `panNumber`, `avatarUrl`

### C. Ledger Entry & Transaction Schema:
```typescript
interface LedgerEntry {
  id: string;
  timestamp: string; // ISO String
  transactionType: 'ClientInvoice' | 'ClientPayment' | 'OperatorPayment' | 'OperatorAdvance';
  amount: number; // Positive (+) for Money In / Payments, Negative (-) for Money Out / Advances
  noteDescription?: string;
  generatedByPerson: string; // Logged-in user
  entityType: 'Client' | 'Operator';
  entityId: string;
  invoicePDFUrl?: string;
  lineItems?: Array<{
    particulars: string;
    hsnCode?: string;
    qty: number;
    rate: number;
    amount: number;
    cgstRate?: number;
    cgstAmount?: number;
    sgstRate?: number;
    sgstAmount?: number;
    igstRate?: number;
    igstAmount?: number;
  }>;
}
2. CLIENT & OPERATOR LEDGER VIEWS (ClientsPage.tsx & OperatorsPage.tsx)Card Interactivity & Clean UI:Remove edit and trash/dustbin buttons directly from card list items.Clicking any profile card opens a full DetailLedgerModal / Drawer.Inside DetailLedgerModal, include an "Edit Profile" button and a "Delete Profile" button at the bottom requiring a Double Confirmation Modal/Alert before deletion.Profile Avatars:Add image upload / URL support for Client and Operator avatars (avatarUrl). Render circular avatars in list cards and ledger headers.Ledger Layout (Latest-to-Oldest):Header Card: Profile details + Avatar + 3 Key KPI Badges:Current Balance (Net balance)Total Payments (Sum of + entries)Total Received / Total Paid (Sum of - entries)Transaction Timeline: Chronological table/list with newest entry at top. Display Date, Time, Description/Invoice #, and Amount formatted cleanly with + (Green) or - (Red/White badge).Wording adjustments:Clients: Payments received = + Amount, Unpaid invoice = - Amount.Operators: Payments made to operator = + Amount (Settled), Advance paid = - Amount (Owed by operator).3. GLOBAL UI POLISH & NOTION-GLASS THEMEFloating Navigation Glass Bar:Adjust the center + action button so it is strictly center-aligned within the capsule container, eliminating any vertical clipping or overflow offset.Profile & Navigation:Replace generic settings gear icon with a profile icon (UserIcon).Monochrome Web Styling:Strict black, white, and subtle dark grays (#121212, rgba(255, 255, 255, 0.08)). Absolutely no vibrant rainbow colors.Use CSS backdrop-filter (backdrop-blur-md) for glassmorphism.Add browser haptic feedback (navigator.vibrate(20) if available) on button taps and invoice generation.4. INVOICE DATABASE & INSIGHTS OVERHAUL (DatabaseView.tsx & InsightsView.tsx)Reorder Tabs:Move Insights Section to the LEFT tab, and Archive Section to the RIGHT tab.Time Range Filter:Include a global time range filter bar across both Insights and Archive views: Today | This Week | This Month | This Year | All Time.Archive Search & Filter:Add a global search input field to filter by Client Name, Operator Name, or Invoice ID.Insights Metrics:Total Invoices Sent (Exclude Drafts completely; count only Sent status).Total Client Invoice Amount (Sum of sent client invoices).Total Operator Payment Amount (Sum of payments made to operators).Render responsive SVG/Recharts visual components adapting to the chosen time range filter.5. CSV / EXCEL DATA EXPORT ENGINE (exportUtils.ts)Create a web utility function exportAllDataToCSV():Provide a One-Click Export All Data button inside the database section.Export all historic data into a single comprehensive CSV sheet or two dedicated CSV sheets (Client & Operator).CSV Column Specification:Columns: Date | Time | Person Generated | Type (Client/Operator) | Entity Name | Particular/Task | HSN Code | Qty | Rate | Amount | CGST Rate % | CGST Amount | SGST Rate % | SGST Amount | IGST Rate % | IGST Amount | Total Amount | Money In (+) | Money Out (-) | DescriptionNote for Client Invoices: Every line item must occupy its own row, repeating metadata (Date, Time, Invoice ID, Generated By) while filling individual CGST/SGST/IGST rates and amounts in dedicated separate columns.6. HTML/PDF GENERATOR REFACTOR (pdfGenerator.ts / HTML Print Template)A. Overlap & Width Fixes:Prevent Text Overlaps:Ensure the "Estimated Grand Total" box automatically expands or scales down text size for six-digit numbers (e.g., Rs. 1,50,000) so "Total" and "Rs." never collide.Wrap multi-line addresses in block elements with explicit bottom margins so they don't overlap phone numbers or GSTIN rows underneath.Table Width Auto-Fit:Set table width to 100% with explicit column percentage widths. Ensure Particulars, HSN, Qty, Rate, and Amount expand edge-to-edge across the available paper width without leaving trailing blank columns.B. Pre-Signed Stamp & Re-ordered Footer:Remove Canvas Signature:Remove "Sign Here" canvas module from the new invoice creation flow completely.Footer Signature Block (Strict Right-Alignment):Align the signature container strictly to the RIGHT SIDE using flex/grid (margin-left: auto; text-align: right;).Order (Top to Bottom):HTML<div style="margin-left: auto; text-align: right; width: 220px;">
  <img src="/pre_signed_stamp.png" style="max-width: 180px; margin-left: auto;" />
  <hr style="border-top: 1px solid #000; margin: 8px 0;" />
  <p style="font-weight: bold; margin: 0;">For M/S MILAN CONSTRUCTION</p>
  <p style="margin: 0;">Proprietor / Authorised Signatory</p>
  <p style="font-weight: bold; margin: 0;">Milandeep Virk</p>
</div>
7. DYNAMIC + ENTRY FLOW (NewEntryModal.tsx)Type Selector:Tapping the center floating + button first asks: "Select Entry Type: [ Client Invoice ] or [ Operator Payment / Task ]".Client Invoice Form:Shows Client Selector, auto-populates address and GSTIN.Line Items: Provide explicit numeric input fields for CGST %, SGST %, and IGST %.Conditional Calculation: Only calculate and render tax lines in the generated PDF if a value $> 0$ is entered for that specific tax field.Operator Payment Form:Shows Operator Selector.Labels: Rename Item $\rightarrow$ Task / Work Done, rename Unit Price $\rightarrow$ Rate.Hide GSTIN, HSN Code, CGST, SGST, and IGST inputs entirely for Operator entries.8. SIMPLE PHONE / OTP WEB AUTHENTICATION (AuthModal.tsx)Build a lightweight local web authentication layer:Login Screen: Asks for Phone Number and Password / PIN.OTP Screen: Mock 4-digit SMS OTP verification (accepts code 1234 or auto-completes for offline web use).Session Persistence: Store auth token and Person Name in localStorage so all created invoices/ledger entries are tagged with generatedByPerson.Please implement these web app updates modularly across your TypeScript files, ensuring complete code compilation without syntax errors.