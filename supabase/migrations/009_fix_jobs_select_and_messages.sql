-- Fix 1: jobs_select — vendors must be able to see any job they have a bid on
-- (regardless of status) so the messages_insert policy's subquery can find the row.
-- After bid acceptance the job status becomes 'accepted', but the old policy only
-- exposed 'open'/'bidding' jobs to vendors, blocking message sends.

DROP POLICY IF EXISTS "jobs_select" ON jobs;
CREATE POLICY "jobs_select" ON jobs FOR SELECT USING (
  -- Customer who owns the job
  customer_id = auth.uid()
  -- Admin sees everything
  OR auth_role() = 'admin'
  -- Accepted vendor can always see their job
  OR accepted_vendor = auth.uid()
  -- Any vendor who placed a bid can always see that job
  OR EXISTS (
    SELECT 1 FROM bids b
    WHERE b.job_id = jobs.id AND b.vendor_id = auth.uid()
  )
  -- Vendors browsing the open/bidding feed (location-gated)
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

-- Fix 2: mark_messages_read must run as SECURITY DEFINER because there is no
-- UPDATE policy on messages — the function needs to bypass RLS to mark rows read.

CREATE OR REPLACE FUNCTION mark_messages_read(p_job_id UUID, p_reader_id UUID)
RETURNS void AS $$
  UPDATE messages
  SET is_read = TRUE, read_at = NOW()
  WHERE job_id = p_job_id
    AND sender_id != p_reader_id
    AND is_read = FALSE;
$$ LANGUAGE sql SECURITY DEFINER;
