-- Trigger: notify customer when a bid is placed
CREATE OR REPLACE FUNCTION notify_on_bid()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_customer_id UUID;
  v_job_title TEXT;
BEGIN
  SELECT customer_id, title INTO v_customer_id, v_job_title
  FROM jobs WHERE id = NEW.job_id;

  INSERT INTO notifications (user_id, type, title, body, data)
  VALUES (
    v_customer_id,
    'new_bid',
    'New bid received',
    'A pro placed a bid of $' || NEW.amount || ' on your job: ' || v_job_title,
    jsonb_build_object('job_id', NEW.job_id)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER bid_notification_trigger
AFTER INSERT ON bids
FOR EACH ROW EXECUTE FUNCTION notify_on_bid();

-- Trigger: notify vendor when their bid is accepted
CREATE OR REPLACE FUNCTION notify_on_bid_accepted()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_job_title TEXT;
BEGIN
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    SELECT title INTO v_job_title FROM jobs WHERE id = NEW.job_id;

    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
      NEW.vendor_id,
      'bid_accepted',
      'Your bid was accepted!',
      'Your bid of $' || NEW.amount || ' on "' || v_job_title || '" was accepted.',
      jsonb_build_object('job_id', NEW.job_id)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER bid_accepted_notification_trigger
AFTER UPDATE ON bids
FOR EACH ROW EXECUTE FUNCTION notify_on_bid_accepted();
