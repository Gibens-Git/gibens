-- Safe to run multiple times. Creates the message→notification trigger if missing.
CREATE OR REPLACE FUNCTION notify_message_recipient()
RETURNS TRIGGER AS $$
DECLARE
  v_customer_id UUID;
  v_job_title   TEXT;
  v_sender_name TEXT;
BEGIN
  SELECT j.customer_id, j.title INTO v_customer_id, v_job_title
  FROM jobs j WHERE j.id = NEW.job_id;

  SELECT u.full_name INTO v_sender_name
  FROM users u WHERE u.id = NEW.sender_id;

  IF NEW.sender_id = v_customer_id THEN
    -- Customer sent → notify every vendor with a bid on this job
    INSERT INTO notifications (user_id, type, title, body, data)
    SELECT
      b.vendor_id,
      'new_message',
      'New message from customer',
      COALESCE(v_sender_name, 'Customer') || ': ' || LEFT(COALESCE(NEW.body, 'Sent a photo'), 60),
      jsonb_build_object('job_id', NEW.job_id, 'job_title', v_job_title)
    FROM bids b
    WHERE b.job_id = NEW.job_id
      AND b.vendor_id != NEW.sender_id
      AND b.status IN ('pending', 'accepted');
  ELSE
    -- Vendor sent → notify the customer
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
      v_customer_id,
      'new_message',
      'New message from pro',
      COALESCE(v_sender_name, 'Pro') || ': ' || LEFT(COALESCE(NEW.body, 'Sent a photo'), 60),
      jsonb_build_object('job_id', NEW.job_id, 'job_title', v_job_title)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS message_notification ON messages;
CREATE TRIGGER message_notification
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION notify_message_recipient();
