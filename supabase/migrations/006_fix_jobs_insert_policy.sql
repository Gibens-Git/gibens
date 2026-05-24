-- Remove the auth_role() = 'customer' guard from job inserts.
-- customer_id = auth.uid() is sufficient — no one can insert a job on behalf of another user.
DROP POLICY IF EXISTS "jobs_customer_insert" ON jobs;
CREATE POLICY "jobs_customer_insert" ON jobs FOR INSERT WITH CHECK (customer_id = auth.uid());
