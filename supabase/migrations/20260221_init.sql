-- Photography Shop Quotation & Invoice Database Schema
-- Supabase PostgreSQL Migration

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. SHOP PROFILE TABLE
CREATE TABLE IF NOT EXISTS shop_profile (
    id TEXT PRIMARY KEY DEFAULT 'shop-01',
    shop_name TEXT NOT NULL,
    tagline TEXT DEFAULT '',
    owner_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    website TEXT DEFAULT '',
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    gstin TEXT DEFAULT '',
    state_code TEXT DEFAULT '',
    bank_name TEXT NOT NULL,
    account_holder TEXT NOT NULL,
    account_number TEXT NOT NULL,
    ifsc_code TEXT NOT NULL,
    branch TEXT NOT NULL,
    upi_id TEXT NOT NULL,
    logo_url TEXT DEFAULT '',
    signature_url TEXT DEFAULT '',
    default_terms TEXT DEFAULT '',
    default_validity_days INTEGER DEFAULT 15,
    default_due_days INTEGER DEFAULT 7,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY DEFAULT ('cust-' || gen_random_uuid()),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT DEFAULT '',
    billing_address TEXT DEFAULT '',
    city TEXT DEFAULT '',
    state TEXT DEFAULT '',
    gstin TEXT DEFAULT '',
    event_type TEXT DEFAULT '',
    event_date DATE,
    event_venue TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SERVICES CATALOG TABLE
CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY DEFAULT ('srv-' || gen_random_uuid()),
    name TEXT NOT NULL,
    category TEXT DEFAULT 'General',
    description TEXT DEFAULT '',
    unit TEXT DEFAULT 'Day',
    default_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. QUOTATIONS TABLE
CREATE TABLE IF NOT EXISTS quotations (
    id TEXT PRIMARY KEY DEFAULT ('quo-' || gen_random_uuid()),
    quotation_number TEXT NOT NULL UNIQUE,
    customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT DEFAULT '',
    customer_address TEXT DEFAULT '',
    customer_gstin TEXT DEFAULT '',
    event_type TEXT DEFAULT '',
    event_date DATE,
    event_venue TEXT DEFAULT '',
    quotation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    validity_date DATE NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discount_type TEXT DEFAULT 'fixed',
    discount_value NUMERIC(12, 2) DEFAULT 0.00,
    discount_amount NUMERIC(12, 2) DEFAULT 0.00,
    tax_type TEXT DEFAULT 'none',
    tax_rate NUMERIC(5, 2) DEFAULT 0.00,
    tax_amount NUMERIC(12, 2) DEFAULT 0.00,
    cgst_amount NUMERIC(12, 2) DEFAULT 0.00,
    sgst_amount NUMERIC(12, 2) DEFAULT 0.00,
    igst_amount NUMERIC(12, 2) DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    advance_amount NUMERIC(12, 2) DEFAULT 0.00,
    balance_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    terms TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'Draft',
    converted_to_invoice_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. INVOICES TABLE
CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY DEFAULT ('inv-' || gen_random_uuid()),
    invoice_number TEXT NOT NULL UNIQUE,
    quotation_id TEXT,
    quotation_number TEXT DEFAULT '',
    customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT DEFAULT '',
    customer_address TEXT DEFAULT '',
    customer_gstin TEXT DEFAULT '',
    event_type TEXT DEFAULT '',
    event_date DATE,
    event_venue TEXT DEFAULT '',
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discount_type TEXT DEFAULT 'fixed',
    discount_value NUMERIC(12, 2) DEFAULT 0.00,
    discount_amount NUMERIC(12, 2) DEFAULT 0.00,
    tax_type TEXT DEFAULT 'none',
    tax_rate NUMERIC(5, 2) DEFAULT 0.00,
    tax_amount NUMERIC(12, 2) DEFAULT 0.00,
    cgst_amount NUMERIC(12, 2) DEFAULT 0.00,
    sgst_amount NUMERIC(12, 2) DEFAULT 0.00,
    igst_amount NUMERIC(12, 2) DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    advance_amount NUMERIC(12, 2) DEFAULT 0.00,
    paid_amount NUMERIC(12, 2) DEFAULT 0.00,
    balance_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    payment_status TEXT NOT NULL DEFAULT 'Unpaid',
    payment_method TEXT DEFAULT 'UPI',
    payments JSONB NOT NULL DEFAULT '[]'::jsonb,
    terms TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. INDEXES FOR HIGH PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_quotations_customer ON quotations(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_date ON quotations(quotation_date);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);

-- 8. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE shop_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Allow read/write for authenticated users & studio anon client
CREATE POLICY "Allow full access to shop_profile" ON shop_profile FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to customers" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to services" ON services FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to quotations" ON quotations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to invoices" ON invoices FOR ALL USING (true) WITH CHECK (true);
