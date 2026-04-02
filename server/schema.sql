-- ============================================================
-- Saydaliya SaaS — PostgreSQL + PostGIS Schema
-- ============================================================
-- Run: psql -U postgres -d saydaliya -f schema.sql
-- ============================================================

-- PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- ─── USERS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    name            TEXT        NOT NULL,
    email           TEXT        NOT NULL UNIQUE,
    password_hash   TEXT        NOT NULL,
    role            TEXT        NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'pharmacy', 'admin')),
    phone           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── PHARMACIES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pharmacies (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        TEXT        NOT NULL,
    address     TEXT,
    lat         NUMERIC(10, 7),
    lng         NUMERIC(10, 7),
    phone       TEXT,
    open_hours  TEXT        DEFAULT '08:00-22:00',
    is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
    location    GEOMETRY(Point, 4326),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pharmacies_location ON pharmacies USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_pharmacies_active ON pharmacies(is_active);

-- ─── SUBSCRIPTIONS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
    id          SERIAL PRIMARY KEY,
    pharmacy_id INTEGER     NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE UNIQUE,
    tier        TEXT        NOT NULL DEFAULT 'basic' CHECK (tier IN ('basic', 'pro', 'enterprise')),
    status      TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'trial')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── MEDICATIONS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS medications (
    id              SERIAL PRIMARY KEY,
    pharmacy_id     INTEGER     NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
    name            TEXT        NOT NULL,
    dosage          TEXT        DEFAULT '',
    barcode         TEXT,
    cost_price      NUMERIC(10,2) NOT NULL DEFAULT 0,
    price           NUMERIC(10,2) NOT NULL DEFAULT 0,
    quantity        INTEGER     NOT NULL DEFAULT 0,
    min_stock_level INTEGER     NOT NULL DEFAULT 5,
    category        TEXT        NOT NULL DEFAULT 'otc',
    description     TEXT        DEFAULT '',
    expiry_date     DATE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medications_pharmacy ON medications(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_medications_barcode ON medications(barcode);
CREATE INDEX IF NOT EXISTS idx_medications_name ON medications USING GIN (to_tsvector('simple', name));

-- ─── MEDICATION BATCHES ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS medication_batches (
    id              SERIAL PRIMARY KEY,
    medication_id   INTEGER     NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
    batch_number    TEXT        NOT NULL,
    expiry_date     DATE,
    quantity        INTEGER     NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_batches_medication ON medication_batches(medication_id);
CREATE INDEX IF NOT EXISTS idx_batches_expiry ON medication_batches(expiry_date);

-- ─── CUSTOMERS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
    id          SERIAL PRIMARY KEY,
    pharmacy_id INTEGER     NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
    name        TEXT        NOT NULL,
    phone       TEXT        DEFAULT '',
    email       TEXT        DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_pharmacy ON customers(pharmacy_id);

-- ─── SUPPLIERS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS suppliers (
    id              SERIAL PRIMARY KEY,
    pharmacy_id     INTEGER     NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
    name            TEXT        NOT NULL,
    contact_name    TEXT        DEFAULT '',
    email           TEXT        DEFAULT '',
    phone           TEXT        DEFAULT '',
    address         TEXT        DEFAULT '',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_pharmacy ON suppliers(pharmacy_id);

-- ─── PURCHASE ORDERS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchase_orders (
    id              SERIAL PRIMARY KEY,
    pharmacy_id     INTEGER     NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
    supplier_id     INTEGER     NOT NULL REFERENCES suppliers(id),
    total_amount    NUMERIC(12,2) NOT NULL DEFAULT 0,
    status          TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'received', 'cancelled')),
    notes           TEXT        DEFAULT '',
    received_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── PURCHASE ORDER ITEMS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS po_items (
    id              SERIAL PRIMARY KEY,
    po_id           INTEGER     NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    medication_id   INTEGER     NOT NULL REFERENCES medications(id),
    quantity        INTEGER     NOT NULL DEFAULT 0,
    unit_cost       NUMERIC(10,2) NOT NULL DEFAULT 0,
    batch_number    TEXT,
    expiry_date     DATE
);

-- ─── SALES ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sales (
    id              SERIAL PRIMARY KEY,
    pharmacy_id     INTEGER     NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
    medication_id   INTEGER     NOT NULL REFERENCES medications(id),
    batch_id        INTEGER     REFERENCES medication_batches(id),
    customer_id     INTEGER     REFERENCES customers(id),
    quantity        INTEGER     NOT NULL DEFAULT 1,
    unit_price      NUMERIC(10,2) NOT NULL DEFAULT 0,
    total_price     NUMERIC(12,2) NOT NULL DEFAULT 0,
    profit          NUMERIC(12,2) NOT NULL DEFAULT 0,
    tax_amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
    net_profit      NUMERIC(12,2) NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_pharmacy ON sales(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_medication ON sales(medication_id);

-- ─── PRESCRIPTIONS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prescriptions (
    id              SERIAL PRIMARY KEY,
    pharmacy_id     INTEGER     NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
    customer_id     INTEGER     REFERENCES customers(id),
    medications     JSONB       DEFAULT '[]',
    notes           TEXT        DEFAULT '',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── ALERTS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alerts (
    id          SERIAL PRIMARY KEY,
    pharmacy_id INTEGER     NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
    message     TEXT        NOT NULL,
    type        TEXT        NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'expiry', 'low_stock', 'error')),
    is_read     BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_pharmacy ON alerts(pharmacy_id);

-- ─── AUDIT LOGS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER     NOT NULL REFERENCES users(id),
    pharmacy_id INTEGER     REFERENCES pharmacies(id) ON DELETE SET NULL,
    action      TEXT        NOT NULL,
    entity_type TEXT,
    entity_id   INTEGER,
    details     JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_pharmacy ON audit_logs(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

-- ─── PROFIT SETTINGS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profit_settings (
    id                          SERIAL PRIMARY KEY,
    pharmacy_id                 INTEGER     NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE UNIQUE,
    default_margin_percentage   NUMERIC(5,2) NOT NULL DEFAULT 25,
    default_tva_rate            NUMERIC(5,2) NOT NULL DEFAULT 7,
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
