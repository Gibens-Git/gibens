-- ============================================================
-- Gibens Platform — Full Database Schema
-- Run in order against your Supabase project
-- ============================================================

-- Enable PostGIS for geo queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('customer', 'vendor', 'admin');
CREATE TYPE job_status AS ENUM ('open', 'bidding', 'accepted', 'in_progress', 'completed', 'cancelled');
CREATE TYPE job_urgency AS ENUM ('asap', 'today', 'this_week', 'flexible');
CREATE TYPE bid_status AS ENUM ('pending', 'accepted', 'declined', 'withdrawn');
CREATE TYPE bid_pricing AS ENUM ('fixed_incl', 'fixed_excl', 'hourly', 'estimate');
CREATE TYPE dispute_type AS ENUM ('payment', 'no_show', 'quality', 'fraud', 'other');
CREATE TYPE dispute_status AS ENUM ('open', 'under_review', 'resolved', 'closed');
CREATE TYPE vendor_status AS ENUM ('pending', 'active', 'suspended', 'banned');

-- ============================================================
-- USERS (extends Supabase auth.users)
-- ============================================================

CREATE TABLE users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role          user_role NOT NULL DEFAULT 'customer',
  full_name     TEXT NOT NULL,
  phone         TEXT,
  avatar_url    TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- VENDOR PROFILES
-- ============================================================

CREATE TABLE vendor_profiles (
  user_id           UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  category          TEXT NOT NULL,
  bio               TEXT,
  travel_radius_mi  INTEGER NOT NULL DEFAULT 15 CHECK (travel_radius_mi BETWEEN 1 AND 100),
  location          GEOGRAPHY(POINT, 4326),
  address_text      TEXT,
  is_available      BOOLEAN NOT NULL DEFAULT TRUE,
  status            vendor_status NOT NULL DEFAULT 'pending',
  avg_rating        NUMERIC(3,2) DEFAULT 0,
  total_reviews     INTEGER DEFAULT 0,
  total_jobs        INTEGER DEFAULT 0,
  base_rate         NUMERIC(10,2),
  hourly_rate       TEXT,
  working_hours     TEXT DEFAULT '7am-7pm',
  stripe_account_id TEXT,
  -- Verification
  is_id_verified    BOOLEAN DEFAULT FALSE,
  is_licensed       BOOLEAN DEFAULT FALSE,
  is_insured        BOOLEAN DEFAULT FALSE,
  license_url       TEXT,
  insurance_url     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX vendors_location_idx ON vendor_profiles USING GIST (location);
CREATE INDEX vendors_category_idx ON vendor_profiles (category);
CREATE INDEX vendors_status_idx ON vendor_profiles (status);

-- ============================================================
-- CATEGORIES
-- ============================================================

CREATE TABLE categories (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  icon        TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO categories (name, slug, icon, sort_order) VALUES
  ('Locksmith', 'locksmith', 'lock', 1),
  ('Electrician', 'electrician', 'bolt', 2),
  ('Plumber', 'plumber', 'droplet', 3),
  ('Painter', 'painter', 'palette', 4),
  ('Carpenter', 'carpenter', 'hammer', 5),
  ('Cleaner', 'cleaner', 'sparkles', 6),
  ('HVAC', 'hvac', 'wind', 7),
  ('Landscaper', 'landscaper', 'plant', 8),
  ('Handyman', 'handyman', 'tool', 9),
  ('Pest Control', 'pest_control', 'bug', 10),
  ('Roofing', 'roofing', 'home-2', 11),
  ('Flooring', 'flooring', 'layout-grid', 12),
  ('Tiling', 'tiling', 'grid-4x4', 13),
  ('Pool Service', 'pool_service', 'swimming', 14),
  ('Moving', 'moving', 'truck', 15),
  ('Appliance Repair', 'appliance_repair', 'device-floppy', 16),
  ('Security Systems', 'security_systems', 'shield', 17),
  ('Garage Door', 'garage_door', 'door', 18),
  ('Pressure Washing', 'pressure_washing', 'droplets', 19),
  ('Window Cleaning', 'window_cleaning', 'window', 20),
  ('Personal Trainer', 'personal_trainer', 'barbell', 21),
  ('Pet Grooming', 'pet_grooming', 'paw', 22),
  ('Tutoring', 'tutoring', 'book', 23),
  ('Photography', 'photography', 'camera', 24),
  ('Catering', 'catering', 'chef-hat', 25),
  ('Mobile Mechanic', 'mobile_mechanic', 'car', 26),
  ('Mobile Detailing', 'mobile_detailing', 'car-crash', 27),
  ('Auto Glass', 'auto_glass', 'eye', 28),
  ('Towing', 'towing', 'crane', 29),
  ('Auto Painting', 'auto_painting', 'spray', 30);

-- ============================================================
-- JOBS
-- ============================================================

CREATE TABLE jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  accepted_vendor UUID REFERENCES users(id),
  category        TEXT NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  location        GEOGRAPHY(POINT, 4326) NOT NULL,
  address_text    TEXT NOT NULL,
  budget          NUMERIC(10,2),
  status          job_status NOT NULL DEFAULT 'open',
  urgency         job_urgency NOT NULL DEFAULT 'flexible',
  photo_urls      TEXT[] DEFAULT '{}',
  bid_count       INTEGER DEFAULT 0,
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '48 hours',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX jobs_location_idx ON jobs USING GIST (location);
CREATE INDEX jobs_category_idx ON jobs (category);
CREATE INDEX jobs_status_idx ON jobs (status);
CREATE INDEX jobs_customer_idx ON jobs (customer_id);
CREATE INDEX jobs_created_idx ON jobs (created_at DESC);

-- ============================================================
-- BIDS
-- ============================================================

CREATE TABLE bids (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id           UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  vendor_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount           NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  booking_fee      NUMERIC(10,2) NOT NULL,
  message          TEXT NOT NULL,
  pricing_type     bid_pricing NOT NULL DEFAULT 'fixed_incl',
  availability     TEXT,
  est_duration     TEXT,
  status           bid_status NOT NULL DEFAULT 'pending',
  stripe_charge_id TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (job_id, vendor_id)
);

CREATE INDEX bids_job_idx ON bids (job_id);
CREATE INDEX bids_vendor_idx ON bids (vendor_id);
CREATE INDEX bids_status_idx ON bids (status);

-- ============================================================
-- MESSAGES
-- ============================================================

CREATE TABLE messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id      UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body        TEXT,
  photo_url   TEXT,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (body IS NOT NULL OR photo_url IS NOT NULL)
);

CREATE INDEX messages_job_idx ON messages (job_id, created_at ASC);
CREATE INDEX messages_sender_idx ON messages (sender_id);
CREATE INDEX messages_unread_idx ON messages (job_id, is_read) WHERE is_read = FALSE;

-- ============================================================
-- REVIEWS
-- ============================================================

CREATE TABLE reviews (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id       UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  reviewer_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewee_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating       INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (job_id, reviewer_id)
);

CREATE INDEX reviews_reviewee_idx ON reviews (reviewee_id);

-- ============================================================
-- DISPUTES
-- ============================================================

CREATE TABLE disputes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id       UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  reporter_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type         dispute_type NOT NULL,
  description  TEXT NOT NULL,
  status       dispute_status NOT NULL DEFAULT 'open',
  resolution   TEXT,
  resolved_by  UUID REFERENCES users(id),
  resolved_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- LEAD PRICING TIERS
-- ============================================================

CREATE TABLE lead_fee_tiers (
  id            SERIAL PRIMARY KEY,
  min_amount    NUMERIC(10,2) NOT NULL,
  max_amount    NUMERIC(10,2),
  fee           NUMERIC(10,2) NOT NULL,
  label         TEXT NOT NULL,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO lead_fee_tiers (min_amount, max_amount, fee, label) VALUES
  (0,     99.99,  5.00,  'Under $100'),
  (100,   199.99, 10.00, '$100 – $199'),
  (200,   NULL,   20.00, '$200 and above');

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  data        JSONB DEFAULT '{}',
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX notifications_user_idx ON notifications (user_id, created_at DESC);
CREATE INDEX notifications_unread_idx ON notifications (user_id, is_read) WHERE is_read = FALSE;

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER vendor_profiles_updated_at BEFORE UPDATE ON vendor_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER bids_updated_at BEFORE UPDATE ON bids FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Update vendor avg_rating when review inserted
CREATE OR REPLACE FUNCTION refresh_vendor_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE vendor_profiles
  SET
    avg_rating    = (SELECT ROUND(AVG(rating)::NUMERIC, 2) FROM reviews WHERE reviewee_id = NEW.reviewee_id),
    total_reviews = (SELECT COUNT(*) FROM reviews WHERE reviewee_id = NEW.reviewee_id)
  WHERE user_id = NEW.reviewee_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reviews_update_rating
AFTER INSERT OR UPDATE ON reviews
FOR EACH ROW EXECUTE FUNCTION refresh_vendor_rating();

-- Increment bid_count on jobs when a bid is created
CREATE OR REPLACE FUNCTION increment_bid_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE jobs SET bid_count = bid_count + 1, status = 'bidding' WHERE id = NEW.job_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE jobs SET bid_count = GREATEST(bid_count - 1, 0) WHERE id = OLD.job_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bids_count AFTER INSERT OR DELETE ON bids FOR EACH ROW EXECUTE FUNCTION increment_bid_count();

-- Compute booking fee from tiers
CREATE OR REPLACE FUNCTION compute_booking_fee(bid_amount NUMERIC)
RETURNS NUMERIC AS $$
  SELECT fee FROM lead_fee_tiers
  WHERE bid_amount >= min_amount
    AND (max_amount IS NULL OR bid_amount <= max_amount)
  LIMIT 1;
$$ LANGUAGE sql STABLE;

-- Mark message as read
CREATE OR REPLACE FUNCTION mark_messages_read(p_job_id UUID, p_reader_id UUID)
RETURNS void AS $$
  UPDATE messages
  SET is_read = TRUE, read_at = NOW()
  WHERE job_id = p_job_id
    AND sender_id != p_reader_id
    AND is_read = FALSE;
$$ LANGUAGE sql;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_fee_tiers ENABLE ROW LEVEL SECURITY;

-- Helper: get current user role
CREATE OR REPLACE FUNCTION auth_role()
RETURNS user_role AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- USERS policies
CREATE POLICY "users_read_own" ON users FOR SELECT USING (id = auth.uid() OR auth_role() = 'admin');
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (id = auth.uid());
CREATE POLICY "users_insert_own" ON users FOR INSERT WITH CHECK (id = auth.uid());

-- VENDOR PROFILES policies
CREATE POLICY "vendors_public_read" ON vendor_profiles FOR SELECT USING (status = 'active' OR user_id = auth.uid() OR auth_role() = 'admin');
CREATE POLICY "vendors_update_own" ON vendor_profiles FOR UPDATE USING (user_id = auth.uid() OR auth_role() = 'admin');
CREATE POLICY "vendors_insert_own" ON vendor_profiles FOR INSERT WITH CHECK (user_id = auth.uid());

-- JOBS policies
CREATE POLICY "jobs_customer_own" ON jobs FOR SELECT USING (
  customer_id = auth.uid() OR auth_role() = 'admin'
  OR (
    auth_role() = 'vendor'
    AND status IN ('open','bidding')
    AND EXISTS (
      SELECT 1 FROM vendor_profiles vp
      WHERE vp.user_id = auth.uid()
        AND vp.category = jobs.category
        AND ST_DWithin(vp.location, jobs.location, vp.travel_radius_mi * 1609)
    )
  )
);
CREATE POLICY "jobs_customer_insert" ON jobs FOR INSERT WITH CHECK (customer_id = auth.uid() AND auth_role() = 'customer');
CREATE POLICY "jobs_customer_update" ON jobs FOR UPDATE USING (customer_id = auth.uid() OR auth_role() = 'admin');

-- BIDS policies
CREATE POLICY "bids_read" ON bids FOR SELECT USING (
  vendor_id = auth.uid()
  OR EXISTS (SELECT 1 FROM jobs WHERE jobs.id = bids.job_id AND jobs.customer_id = auth.uid())
  OR auth_role() = 'admin'
);
CREATE POLICY "bids_vendor_insert" ON bids FOR INSERT WITH CHECK (vendor_id = auth.uid() AND auth_role() = 'vendor');
CREATE POLICY "bids_vendor_update" ON bids FOR UPDATE USING (vendor_id = auth.uid() OR auth_role() = 'admin');

-- MESSAGES policies
CREATE POLICY "messages_read" ON messages FOR SELECT USING (
  sender_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM jobs j
    WHERE j.id = messages.job_id
      AND (j.customer_id = auth.uid() OR j.accepted_vendor = auth.uid())
  )
  OR auth_role() = 'admin'
);
CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM jobs j
    WHERE j.id = messages.job_id
      AND (j.customer_id = auth.uid() OR j.accepted_vendor = auth.uid())
  )
);

-- REVIEWS policies
CREATE POLICY "reviews_public_read" ON reviews FOR SELECT USING (TRUE);
CREATE POLICY "reviews_insert" ON reviews FOR INSERT WITH CHECK (reviewer_id = auth.uid());

-- DISPUTES policies
CREATE POLICY "disputes_read" ON disputes FOR SELECT USING (reporter_id = auth.uid() OR auth_role() = 'admin');
CREATE POLICY "disputes_insert" ON disputes FOR INSERT WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "disputes_admin_update" ON disputes FOR UPDATE USING (auth_role() = 'admin');

-- NOTIFICATIONS policies
CREATE POLICY "notifications_own" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- LEAD FEE TIERS policies
CREATE POLICY "fee_tiers_read" ON lead_fee_tiers FOR SELECT USING (TRUE);
CREATE POLICY "fee_tiers_admin" ON lead_fee_tiers FOR ALL USING (auth_role() = 'admin');

-- ============================================================
-- STORAGE BUCKETS (run via Supabase dashboard or CLI)
-- ============================================================
-- supabase storage create job-photos --public
-- supabase storage create avatars --public
-- supabase storage create vendor-docs (private)

-- ============================================================
-- RPC: find_nearby_vendors
-- Used by: notify-vendors edge function, customer Home screen
-- ============================================================
CREATE OR REPLACE FUNCTION find_nearby_vendors(
  p_lat FLOAT,
  p_lon FLOAT,
  p_category TEXT DEFAULT NULL,
  p_radius_mi INTEGER DEFAULT 25
)
RETURNS TABLE (
  user_id       UUID,
  full_name     TEXT,
  category      TEXT,
  avg_rating    NUMERIC,
  total_reviews INTEGER,
  total_jobs    INTEGER,
  base_rate     NUMERIC,
  is_available  BOOLEAN,
  is_licensed   BOOLEAN,
  is_insured    BOOLEAN,
  is_id_verified BOOLEAN,
  distance_mi   FLOAT
) AS $$
  SELECT
    vp.user_id,
    u.full_name,
    vp.category,
    vp.avg_rating,
    vp.total_reviews,
    vp.total_jobs,
    vp.base_rate,
    vp.is_available,
    vp.is_licensed,
    vp.is_insured,
    vp.is_id_verified,
    ST_Distance(
      vp.location,
      ST_MakePoint(p_lon, p_lat)::geography
    ) / 1609.34 AS distance_mi
  FROM vendor_profiles vp
  JOIN users u ON u.id = vp.user_id
  WHERE vp.status = 'active'
    AND vp.is_available = TRUE
    AND u.is_active = TRUE
    AND (p_category IS NULL OR vp.category = p_category)
    AND ST_DWithin(
      vp.location,
      ST_MakePoint(p_lon, p_lat)::geography,
      LEAST(vp.travel_radius_mi, p_radius_mi) * 1609.34
    )
  ORDER BY distance_mi ASC;
$$ LANGUAGE sql STABLE;
