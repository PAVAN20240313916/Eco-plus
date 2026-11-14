-- =========================================================================
-- EcoPulse AI - Supabase Cloud PostgreSQL Initial Schema & Seed Migration
-- Migration: 001_initial_schema.sql
-- Standards: SI Units (kg, g, L, mL, km, °C, kg CO2e) & Indian Origin (₹ INR)
-- =========================================================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Tables
-- Organizations Table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    business_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inventory Table
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    cost_per_unit DECIMAL(10, 2) NOT NULL,
    expiration_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Waste Logs Table
CREATE TABLE IF NOT EXISTS public.waste_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    quantity_wasted DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    reason VARCHAR(150) NOT NULL,
    financial_loss DECIMAL(10, 2) NOT NULL,
    carbon_impact DECIMAL(10, 2) NOT NULL,
    log_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI Insights Cache Table
CREATE TABLE IF NOT EXISTS public.ai_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    insight_type VARCHAR(100) NOT NULL,
    recommendations JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Surplus Listings & Donations Table
CREATE TABLE IF NOT EXISTS public.surplus_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    expiration_date DATE NOT NULL,
    matched_partner VARCHAR(255),
    partner_type VARCHAR(100),
    status VARCHAR(50) DEFAULT 'AVAILABLE',
    pickup_window VARCHAR(100),
    carbon_saved DECIMAL(10, 2) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_inventory_org_exp
    ON public.inventory (organization_id, expiration_date);

CREATE INDEX IF NOT EXISTS idx_waste_logs_org_date
    ON public.waste_logs (organization_id, log_date DESC);

CREATE INDEX IF NOT EXISTS idx_ai_insights_org_created
    ON public.ai_insights (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_surplus_org_status
    ON public.surplus_listings (organization_id, status);

-- 4. Row Level Security (RLS) Policies
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waste_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surplus_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS org_isolation_organizations ON public.organizations;
CREATE POLICY org_isolation_organizations ON public.organizations
    FOR ALL
    USING (
        current_setting('request.jwt.claim.role', true) = 'service_role'
        OR id = nullif(current_setting('request.jwt.claim.org_id', true), '')::uuid
    )
    WITH CHECK (
        current_setting('request.jwt.claim.role', true) = 'service_role'
        OR id = nullif(current_setting('request.jwt.claim.org_id', true), '')::uuid
    );

DROP POLICY IF EXISTS org_isolation_inventory ON public.inventory;
CREATE POLICY org_isolation_inventory ON public.inventory
    FOR ALL
    USING (
        current_setting('request.jwt.claim.role', true) = 'service_role'
        OR organization_id = nullif(current_setting('request.jwt.claim.org_id', true), '')::uuid
    )
    WITH CHECK (
        current_setting('request.jwt.claim.role', true) = 'service_role'
        OR organization_id = nullif(current_setting('request.jwt.claim.org_id', true), '')::uuid
    );

DROP POLICY IF EXISTS org_isolation_waste ON public.waste_logs;
CREATE POLICY org_isolation_waste ON public.waste_logs
    FOR ALL
    USING (
        current_setting('request.jwt.claim.role', true) = 'service_role'
        OR organization_id = nullif(current_setting('request.jwt.claim.org_id', true), '')::uuid
    )
    WITH CHECK (
        current_setting('request.jwt.claim.role', true) = 'service_role'
        OR organization_id = nullif(current_setting('request.jwt.claim.org_id', true), '')::uuid
    );

DROP POLICY IF EXISTS org_isolation_insights ON public.ai_insights;
CREATE POLICY org_isolation_insights ON public.ai_insights
    FOR ALL
    USING (
        current_setting('request.jwt.claim.role', true) = 'service_role'
        OR organization_id = nullif(current_setting('request.jwt.claim.org_id', true), '')::uuid
    )
    WITH CHECK (
        current_setting('request.jwt.claim.role', true) = 'service_role'
        OR organization_id = nullif(current_setting('request.jwt.claim.org_id', true), '')::uuid
    );

DROP POLICY IF EXISTS org_isolation_surplus ON public.surplus_listings;
CREATE POLICY org_isolation_surplus ON public.surplus_listings
    FOR ALL
    USING (
        current_setting('request.jwt.claim.role', true) = 'service_role'
        OR organization_id = nullif(current_setting('request.jwt.claim.org_id', true), '')::uuid
    )
    WITH CHECK (
        current_setting('request.jwt.claim.role', true) = 'service_role'
        OR organization_id = nullif(current_setting('request.jwt.claim.org_id', true), '')::uuid
    );

-- 5. Service-Role SQL Execution Helper for Remote HTTPS Migrations
CREATE OR REPLACE FUNCTION public.exec_sql(sql_query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    EXECUTE sql_query;
END;
$$;

REVOKE ALL ON FUNCTION public.exec_sql(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.exec_sql(text) FROM anon;
REVOKE ALL ON FUNCTION public.exec_sql(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;

-- 6. Idempotent Seed Data (Demo Organization: demo@ecopulse.io / password123)
INSERT INTO public.organizations (id, name, email, password_hash, business_type)
VALUES (
    '7f9d8a30-1b2c-4e5f-9a0d-8e7c6b5a4f32',
    'Annapurna Grand Kitchen & Urban Bistro, Bengaluru',
    'demo@ecopulse.io',
    '$2a$10$t0n28RN01nyuiHKx5pyErOrYxHCQjbaQsv.Q3A7hxXGRyfUFiWxOS',
    'Restaurant / Cloud Kitchen'
)
ON CONFLICT (id) DO NOTHING;

-- Inventory Seed Data (10 SI + Indian items)
INSERT INTO public.inventory (id, organization_id, item_name, category, quantity, unit, cost_per_unit, expiration_date)
VALUES
    ('11111111-1111-4111-8111-111111111101', '7f9d8a30-1b2c-4e5f-9a0d-8e7c6b5a4f32', 'Fresh Malai Paneer', 'Dairy', 20.00, 'kg', 380.00, CURRENT_DATE + INTERVAL '2 days'),
    ('11111111-1111-4111-8111-111111111102', '7f9d8a30-1b2c-4e5f-9a0d-8e7c6b5a4f32', 'Amul Taaza Toned Milk', 'Dairy', 35.00, 'L', 56.00, CURRENT_DATE + INTERVAL '1 day'),
    ('11111111-1111-4111-8111-111111111103', '7f9d8a30-1b2c-4e5f-9a0d-8e7c6b5a4f32', 'Ratnagiri Alphonso Mangoes', 'Produce', 25.00, 'kg', 180.00, CURRENT_DATE + INTERVAL '2 days'),
    ('11111111-1111-4111-8111-111111111104', '7f9d8a30-1b2c-4e5f-9a0d-8e7c6b5a4f32', 'Fresh Palak (Spinach) & Coriander', 'Produce', 14.00, 'kg', 65.00, CURRENT_DATE + INTERVAL '1 day'),
    ('11111111-1111-4111-8111-111111111105', '7f9d8a30-1b2c-4e5f-9a0d-8e7c6b5a4f32', 'India Gate Classic Basmati Rice', 'Dry Goods', 50.00, 'kg', 115.00, CURRENT_DATE + INTERVAL '120 days'),
    ('11111111-1111-4111-8111-111111111106', '7f9d8a30-1b2c-4e5f-9a0d-8e7c6b5a4f32', 'Fresh Tandoori Chicken Cuts', 'Meat & Poultry', 16.00, 'kg', 260.00, CURRENT_DATE + INTERVAL '3 days'),
    ('11111111-1111-4111-8111-111111111107', '7f9d8a30-1b2c-4e5f-9a0d-8e7c6b5a4f32', 'Whole Wheat Tandoori Roti & Parotta Batch', 'Bakery', 45.00, 'units', 18.00, CURRENT_DATE + INTERVAL '1 day'),
    ('11111111-1111-4111-8111-111111111108', '7f9d8a30-1b2c-4e5f-9a0d-8e7c6b5a4f32', 'Dal Makhani & Paneer Butter Masala', 'Prepared Foods', 12.00, 'portions', 240.00, CURRENT_DATE),
    ('11111111-1111-4111-8111-111111111109', '7f9d8a30-1b2c-4e5f-9a0d-8e7c6b5a4f32', 'Fresh Dahi (Set Curd)', 'Dairy', 15.00, 'kg', 75.00, CURRENT_DATE + INTERVAL '4 days'),
    ('11111111-1111-4111-8111-111111111110', '7f9d8a30-1b2c-4e5f-9a0d-8e7c6b5a4f32', 'Nasik Red Onions & Roma Tomatoes', 'Produce', 30.00, 'kg', 45.00, CURRENT_DATE + INTERVAL '3 days')
ON CONFLICT (id) DO NOTHING;

-- Waste Logs Seed Data (7 SI + Indian events)
INSERT INTO public.waste_logs (id, organization_id, item_name, quantity_wasted, unit, reason, financial_loss, carbon_impact, log_date)
VALUES
    ('22222222-2222-4222-8222-222222222201', '7f9d8a30-1b2c-4e5f-9a0d-8e7c6b5a4f32', 'Steamed Basmati Rice Batch', 4.50, 'kg', 'Over-preparation', 517.50, 6.75, CURRENT_DATE - INTERVAL '6 days'),
    ('22222222-2222-4222-8222-222222222202', '7f9d8a30-1b2c-4e5f-9a0d-8e7c6b5a4f32', 'Fresh Palak & Methi Greens', 3.50, 'kg', 'Trimmings/Prep Waste', 227.50, 4.20, CURRENT_DATE - INTERVAL '5 days'),
    ('22222222-2222-4222-8222-222222222203', '7f9d8a30-1b2c-4e5f-9a0d-8e7c6b5a4f32', 'Amul Toned Milk', 6.00, 'L', 'Spoilage/Expiration', 336.00, 34.80, CURRENT_DATE - INTERVAL '4 days'),
    ('22222222-2222-4222-8222-222222222204', '7f9d8a30-1b2c-4e5f-9a0d-8e7c6b5a4f32', 'Awadhi Chicken Dum Biryani Prep', 2.50, 'kg', 'Over-preparation', 650.00, 31.25, CURRENT_DATE - INTERVAL '3 days'),
    ('22222222-2222-4222-8222-222222222205', '7f9d8a30-1b2c-4e5f-9a0d-8e7c6b5a4f32', 'Roma Tomatoes', 4.00, 'kg', 'Quality Failure', 180.00, 4.80, CURRENT_DATE - INTERVAL '2 days'),
    ('22222222-2222-4222-8222-222222222206', '7f9d8a30-1b2c-4e5f-9a0d-8e7c6b5a4f32', 'Thali & Banquet Buffet Leftovers', 6.00, 'kg', 'Customer Leftovers', 1440.00, 21.00, CURRENT_DATE - INTERVAL '1 day'),
    ('22222222-2222-4222-8222-222222222207', '7f9d8a30-1b2c-4e5f-9a0d-8e7c6b5a4f32', 'Garlic Naan & Kulcha Dough Batch', 3.00, 'kg', 'Over-preparation', 270.00, 5.40, CURRENT_DATE)
ON CONFLICT (id) DO NOTHING;

-- AI Insights Seed Data (1 DEMAND_FORECAST)
INSERT INTO public.ai_insights (id, organization_id, insight_type, recommendations)
VALUES (
    '33333333-3333-4333-8333-333333333301',
    '7f9d8a30-1b2c-4e5f-9a0d-8e7c6b5a4f32',
    'DEMAND_FORECAST',
    '{
      "summary": "Forecast indicates over-purchasing in Dairy (Amul Taaza Toned Milk & Fresh Malai Paneer) leading to 41% of your weekly carbon footprint. Weekend evening rain forecast in Bengaluru will raise dine-in hot thali and chai/kulfi orders by 25%.",
      "predictedDemandWarnings": [
        {
          "item": "Amul Taaza Toned Milk",
          "reason": "35 L on hand with a 1-day expiration horizon exceeds standard weekday beverage velocity.",
          "recommendedAction": "Reduce next supplier indent by 30% from 35 L to 24 L; convert 10 L immediately into fresh paneer/chenna or masala chai batch."
        },
        {
          "item": "Fresh Malai Paneer",
          "reason": "20 kg approaching cold-room shelf-life threshold (2 days remaining at 4 °C).",
          "recommendedAction": "Marinate 8 kg in tandoori tikka spices today to extend cold-chain usability by 72 hours."
        },
        {
          "item": "Fresh Palak (Spinach) & Coriander",
          "reason": "14 kg leafy produce loses moisture rapidly above 5 °C.",
          "recommendedAction": "Blanch and puree 6 kg into Palak Paneer base gravy today to lock freshness for 4 days."
        }
      ],
      "surplusRepurposingIdeas": [
        {
          "ingredient": "Amul Taaza Toned Milk",
          "recipeIdea": "Curdle into fresh artisanal chenna for high-margin Rasmalai, Paneer Bhurji, or slow-simmered Khoya."
        },
        {
          "ingredient": "Whole Wheat Tandoori Roti & Parotta Batch",
          "recipeIdea": "Crisp and season into spiced Masala Khakhra bites, Kothu Parotta specials, or Shahi Tukda dessert trays."
        },
        {
          "ingredient": "Ratnagiri Alphonso Mangoes",
          "recipeIdea": "Blend ripe pulp into Mango Lassi specials, Aamras thali add-ons, or freeze in 500 g vacuum pouches."
        }
      ],
      "carbonReductionTip": "Redirecting your 35 L dairy and 20 kg paneer at-risk batches prevents 319.0 kg CO2e emissions—equivalent to avoiding 420 km of passenger car travel."
    }'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Surplus Listings Seed Data (3 Indian NGO Partners)
INSERT INTO public.surplus_listings (id, organization_id, item_name, category, quantity, unit, expiration_date, matched_partner, partner_type, status, pickup_window, carbon_saved)
VALUES
    ('44444444-4444-4444-8444-444444444401', '7f9d8a30-1b2c-4e5f-9a0d-8e7c6b5a4f32', 'Whole Wheat Tandoori Roti & Parotta (Fresh Surplus)', 'Bakery', 30.00, 'units', CURRENT_DATE, 'Robin Hood Army - Bengaluru Chapter', 'Food Bank', 'MATCHED', 'Today 17:00 - 19:30 IST', 27.00),
    ('44444444-4444-4444-8444-444444444402', '7f9d8a30-1b2c-4e5f-9a0d-8e7c6b5a4f32', 'Dal Makhani & Steamed Rice Trays', 'Prepared Foods', 12.00, 'portions', CURRENT_DATE, 'Akshaya Patra Community Kitchen', 'Soup Kitchen', 'AVAILABLE', 'Today 20:00 - 21:30 IST', 42.00),
    ('44444444-4444-4444-8444-444444444403', '7f9d8a30-1b2c-4e5f-9a0d-8e7c6b5a4f32', 'Vegetable Prep Trimmings & Filter Coffee Grounds', 'Produce', 25.00, 'kg', CURRENT_DATE + INTERVAL '1 day', 'Hasiru Dala Bio-Compost & Biogas Hub', 'Composting Partner', 'DISPATCHED', 'Today 15:00 IST', 30.00)
ON CONFLICT (id) DO NOTHING;
