# Photography Shop Quotation & Invoice Pro 📸

A production-ready web application built for professional photography studios, wedding cinematographers, and freelance photographers to generate, manage, print, download, and track quotations and tax invoices with a **single, consistent Classic Professional A4 document template**.

---

## 🌟 Key Features

### 1. Classic Professional A4 Document Template
- **Single, Consistent Layout**: Exactly one unified layout for both quotations and invoices, changing only the document heading (`QUOTATION` vs `TAX INVOICE`) and document-specific particulars.
- **A4 Print & PDF Ready**: Pixel-perfect A4 dimensions (`@media print` rules, margin control, page break avoidance) and client-side uncompressed PDF download via `html2canvas` + `jsPDF`.
- **Branding & Identifiers**: Studio logo, photographer name, studio address, contact numbers, email, website, and GSTIN.
- **Client & Shoot Particulars**: Client contact details alongside photography event type (e.g. Wedding, Reception, Pre-Wedding), shoot date, and venue.
- **Structured Service Table**: Line items with alternating row backgrounds, quantities, unit rates, and totals.
- **Financial Breakdown**: Subtotal, percentage or fixed discount, GST calculations (Intra-state CGST+SGST, Inter-state IGST, or Non-GST), advance booking payment, and balance outstanding.
- **Indian Rupees in Words**: Automatic conversion of total figures into Indian currency words (e.g., *Indian Rupees One Lakh Six Thousand Two Hundred Only*).
- **Instant Bank & UPI Details with Live QR Code**: Embeds bank account details and generates a scannable UPI QR code (`upi://pay?...`) for direct mobile payments via Google Pay, PhonePe, and Paytm.
- **Terms & Signatory**: Studio payment terms & conditions, legal disclaimer, and authorized signatory signature block.

### 2. Studio Profile & Shop Settings
- Studio Name, Tagline, Owner / Lead Photographer Name.
- Address, City, State, Pincode, Phone, Email, and Website.
- GSTIN and State Code.
- Bank Account (Bank Name, Account Holder, Account Number, IFSC Code, Branch).
- Instant UPI ID.
- Studio logo and digital signature upload.
- Configurable default payment terms and validity periods.

### 3. Customer Directory & Reusability
- Add, edit, search, and delete client profiles.
- Store client contact details, billing addresses, client GSTIN (for corporate/commercial clients), event types, shoot dates, and venues.
- 1-click **"+ Quote"** and **"+ Invoice"** shortcuts from any customer card that auto-populates all client details instantly.

### 4. Photography Services Catalogue
- Preloaded with photography deliverables:
  - Candid Wedding Photography
  - Cinematic 4K Wedding Highlight Film
  - Traditional Photography & Videography
  - Drone Aerial 4K Coverage
  - Pre-Wedding Creative Outdoor Shoot
  - Luxury Flush-Mount Photobooks (12x18 inch)
  - Studio Fashion & Portrait Sessions
  - Birthday & Anniversary Milestone Events
  - Additional Crew Overtime
  - Fine-Art Framed Canvas Prints
- Dynamic row additions, live total recalculation, and customizable rates per shoot.

### 5. Quotation-to-Invoice Workflow
- **1-Click Conversion**: Convert any accepted quotation into an official tax invoice without re-entering client details, event venue, or service deliverables.
- Links `reference_quotation_number` on the invoice and marks quotation status as `Accepted`.
- Advance booking deposits from quotations automatically carry forward into the invoice's payment ledger.

### 6. Payment Tracking & Instant Receipts
- Support for full payments and partial installment payments.
- Record payments with payment date, mode (UPI, Bank Transfer, Cash, Card, Cheque), transaction reference/UTR number, and notes.
- Automatic balance deduction and dynamic invoice status updates (`Unpaid` → `Partially Paid` → `Paid`).
- Instant printable payment receipt generation with receipt numbers.

### 7. WhatsApp Share Integration
- 1-click WhatsApp share generates a clean, formatted proposal message with emojis, shoot details, itemized service breakdown, totals, advance required, and bank/UPI payment details.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **QR Code**: [qrcode.react](https://github.com/zpao/qrcode.react)
- **PDF Generation**: [jsPDF](https://github.com/parallax/jsPDF) & [html2canvas](https://html2canvas.hertzen.com/)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL with Row Level Security)
- **Data Engine**: Hybrid dual-engine (works 100% offline via localStorage fallback + seamless sync with Supabase cloud database)

---

## 🚀 Getting Started

### 1. Installation
Clone the repository and install dependencies:
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Production Build
```bash
npm run build
npm run start
```

---

## 🗄️ Supabase Cloud Database Setup

The app works instantly with persistent local storage. To connect your cloud Supabase database:

1. Create a project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Open `supabase/migrations/20260221_init.sql` from this repository and run the entire script. This creates:
   - `shop_profile`
   - `customers`
   - `services`
   - `quotations`
   - `invoices`
   - Indexes and Row Level Security (RLS) policies.
4. Copy your project credentials into `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```
5. Restart your development server (`npm run dev`). The studio navigation bar will now display **"Supabase Live"** with active database synchronization!

---

## ☁️ Deployment on Vercel

1. Push your repository to GitHub / GitLab.
2. Import the project into [Vercel](https://vercel.com).
3. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Deploy**. Vercel will build the production bundle automatically.
