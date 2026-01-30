-- EZLAUNCH ENHANCED SETUP
-- Run this script to add search, speed, and starter data on top of your 4 tables.

-- 1. SEARCH & SPEED EXTENSIONS
-- Makes searching items by name ultra-fast
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. PERFORMANCE INDEXES
-- This ensures searching for items and barcoding remains 0ms
CREATE INDEX IF NOT EXISTS idx_pm_barcode ON public.product_master(barcode);
CREATE INDEX IF NOT EXISTS idx_pm_item_name_trgm ON public.product_master USING gin (item_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_logs_scanned_at ON public.onboarding_logs(scanned_at DESC);

-- 3. PERMISSIONS (Disable RLS)
-- This ensures the App and Web Panel can read/write without permission issues
ALTER TABLE public.product_master DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.units DISABLE ROW LEVEL SECURITY;

-- 4. STARTER DATA
-- Populate your dropdowns with baseline values
INSERT INTO public.categories (name) VALUES 
('Groceries'), ('Beverages'), ('Snacks'), ('Dairy'), ('Personal Care'), ('Household')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.units (name) VALUES 
('Pcs'), ('Kg'), ('Gram'), ('Litre'), ('ML'), ('Pkt'), ('Box')
ON CONFLICT (name) DO NOTHING;
