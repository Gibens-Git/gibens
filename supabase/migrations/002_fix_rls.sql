-- ============================================================
-- Fix RLS policies — safe to run multiple times
-- ============================================================

-- 1. USERS: allow any authenticated user to read basic profile info
DROP POLICY IF EXISTS "users_read_own" ON users;
DROP POLICY IF EXISTS "users_read_authenticated" ON users;
CREATE POLICY "users_read_authenticated" ON users
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- 2. VENDOR PROFILES: allow all authenticated users to read vendor profiles
DROP POLICY IF EXISTS "vendors_public_read" ON vendor_profiles;
CREATE POLICY "vendors_public_read" ON vendor_profiles
  FOR SELECT USING (
    user_id = auth.uid()
    OR auth_role() = 'admin'
    OR auth.uid() IS NOT NULL
  );

-- 3. JOBS: show all category-matching jobs to vendors without a location set
DROP POLICY IF EXISTS "jobs_customer_own" ON jobs;
DROP POLICY IF EXISTS "jobs_select" ON jobs;
CREATE POLICY "jobs_select" ON jobs FOR SELECT USING (
  customer_id = auth.uid()
  OR auth_role() = 'admin'
  OR (
    auth_role() = 'vendor'
    AND status IN ('open', 'bidding')
    AND EXISTS (
      SELECT 1 FROM vendor_profiles vp
      WHERE vp.user_id = auth.uid()
        AND vp.category = jobs.category
        AND (
          vp.location IS NULL
          OR ST_DWithin(vp.location, jobs.location, vp.travel_radius_mi * 1609)
        )
    )
  )
);

-- 4. MESSAGES: allow vendors with a pending bid to chat before acceptance
DROP POLICY IF EXISTS "messages_read" ON messages;
DROP POLICY IF EXISTS "messages_insert" ON messages;
CREATE POLICY "messages_read" ON messages FOR SELECT USING (
  sender_id = auth.uid()
  OR auth_role() = 'admin'
  OR EXISTS (
    SELECT 1 FROM jobs j
    WHERE j.id = messages.job_id
      AND (
        j.customer_id = auth.uid()
        OR j.accepted_vendor = auth.uid()
        OR EXISTS (
          SELECT 1 FROM bids b
          WHERE b.job_id = j.id AND b.vendor_id = auth.uid()
        )
      )
  )
);
CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM jobs j
    WHERE j.id = messages.job_id
      AND (
        j.customer_id = auth.uid()
        OR j.accepted_vendor = auth.uid()
        OR EXISTS (
          SELECT 1 FROM bids b
          WHERE b.job_id = j.id AND b.vendor_id = auth.uid()
        )
      )
  )
);
