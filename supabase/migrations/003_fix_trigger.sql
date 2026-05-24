-- Fix increment_bid_count so it can update jobs regardless of the calling user's RLS
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
