-- SECURITY DEFINER helper: checks whether a user is allowed to send/read
-- messages for a job. Runs outside RLS so no policy chain / recursion possible.
CREATE OR REPLACE FUNCTION user_can_message_job(p_job_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM jobs j
    WHERE j.id = p_job_id
      AND (
        j.customer_id = p_user_id
        OR j.accepted_vendor = p_user_id
        OR EXISTS (
          SELECT 1 FROM bids b
          WHERE b.job_id = p_job_id AND b.vendor_id = p_user_id
        )
      )
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Rebuild messages policies using the SECURITY DEFINER helper so they never
-- go through jobs_select or bids_read RLS.
DROP POLICY IF EXISTS "messages_read" ON messages;
CREATE POLICY "messages_read" ON messages FOR SELECT USING (
  auth_role() = 'admin'
  OR user_can_message_job(messages.job_id, auth.uid())
);

DROP POLICY IF EXISTS "messages_insert" ON messages;
CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (
  sender_id = auth.uid()
  AND user_can_message_job(messages.job_id, auth.uid())
);

-- SECURITY DEFINER RPC: returns chat thread list for a vendor.
CREATE OR REPLACE FUNCTION get_vendor_chat_list(p_vendor_id UUID)
RETURNS TABLE (
  job_id       UUID,
  job_title    TEXT,
  other_name   TEXT,
  last_body    TEXT,
  last_at      TIMESTAMPTZ,
  unread_count BIGINT
) AS $$
  SELECT
    j.id                                            AS job_id,
    j.title                                         AS job_title,
    cu.full_name                                    AS other_name,
    (SELECT m2.body FROM messages m2
       WHERE m2.job_id = j.id
       ORDER BY m2.created_at DESC LIMIT 1)         AS last_body,
    (SELECT m2.created_at FROM messages m2
       WHERE m2.job_id = j.id
       ORDER BY m2.created_at DESC LIMIT 1)         AS last_at,
    (SELECT COUNT(*) FROM messages m3
       WHERE m3.job_id = j.id
         AND m3.sender_id != p_vendor_id
         AND m3.is_read = FALSE)                    AS unread_count
  FROM bids b
  JOIN jobs j  ON j.id  = b.job_id
  JOIN users cu ON cu.id = j.customer_id
  WHERE b.vendor_id = p_vendor_id
    AND EXISTS (SELECT 1 FROM messages m WHERE m.job_id = j.id)
  ORDER BY last_at DESC NULLS LAST
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- SECURITY DEFINER RPC: returns chat thread list for a customer.
CREATE OR REPLACE FUNCTION get_customer_chat_list(p_customer_id UUID)
RETURNS TABLE (
  job_id       UUID,
  job_title    TEXT,
  other_name   TEXT,
  last_body    TEXT,
  last_at      TIMESTAMPTZ,
  unread_count BIGINT
) AS $$
  SELECT
    j.id                                            AS job_id,
    j.title                                         AS job_title,
    COALESCE(
      (SELECT u2.full_name FROM messages m2
         JOIN users u2 ON u2.id = m2.sender_id
         WHERE m2.job_id = j.id AND m2.sender_id != p_customer_id
         ORDER BY m2.created_at DESC LIMIT 1),
      'Pro'
    )                                               AS other_name,
    (SELECT m2.body FROM messages m2
       WHERE m2.job_id = j.id
       ORDER BY m2.created_at DESC LIMIT 1)         AS last_body,
    (SELECT m2.created_at FROM messages m2
       WHERE m2.job_id = j.id
       ORDER BY m2.created_at DESC LIMIT 1)         AS last_at,
    (SELECT COUNT(*) FROM messages m3
       WHERE m3.job_id = j.id
         AND m3.sender_id != p_customer_id
         AND m3.is_read = FALSE)                    AS unread_count
  FROM jobs j
  WHERE j.customer_id = p_customer_id
    AND EXISTS (SELECT 1 FROM messages m WHERE m.job_id = j.id)
  ORDER BY last_at DESC NULLS LAST
$$ LANGUAGE sql STABLE SECURITY DEFINER;
