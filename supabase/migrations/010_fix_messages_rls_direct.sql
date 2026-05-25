-- The messages_read and messages_insert policies both do EXISTS(SELECT FROM jobs)
-- which is filtered by jobs_select RLS, creating a chain that can silently return
-- no rows even when the vendor legitimately has access.
--
-- Fix: check bids directly for vendors (bids_read allows vendor_id = auth.uid()
-- with no further joins), and check jobs.customer_id directly for customers.
-- This breaks the RLS chain and avoids any silent filtering.

DROP POLICY IF EXISTS "messages_read" ON messages;
CREATE POLICY "messages_read" ON messages FOR SELECT USING (
  -- Sender always sees their own messages
  sender_id = auth.uid()
  OR auth_role() = 'admin'
  -- Customer sees messages on their own jobs
  OR EXISTS (
    SELECT 1 FROM jobs j
    WHERE j.id = messages.job_id AND j.customer_id = auth.uid()
  )
  -- Vendor sees messages on any job they have a bid on
  OR EXISTS (
    SELECT 1 FROM bids b
    WHERE b.job_id = messages.job_id AND b.vendor_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "messages_insert" ON messages;
CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (
  sender_id = auth.uid()
  AND (
    -- Customer can send on their own job
    EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.id = messages.job_id AND j.customer_id = auth.uid()
    )
    -- Vendor can send on any job they have a bid on
    OR EXISTS (
      SELECT 1 FROM bids b
      WHERE b.job_id = messages.job_id AND b.vendor_id = auth.uid()
    )
  )
);
