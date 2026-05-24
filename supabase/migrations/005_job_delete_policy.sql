-- Allow customers to delete their own jobs while no vendor has been accepted yet
CREATE POLICY "jobs_customer_delete" ON jobs FOR DELETE USING (
  customer_id = auth.uid() AND status IN ('open', 'bidding')
);
