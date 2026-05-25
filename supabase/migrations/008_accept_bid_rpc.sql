-- Fallback RPC for accepting a bid without Stripe.
-- Used when the charge-fee edge function is not deployed or Stripe is not configured.
-- Runs with SECURITY DEFINER to bypass RLS (same as the edge function would).

CREATE OR REPLACE FUNCTION accept_bid_direct(p_bid_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_bid bids%ROWTYPE;
BEGIN
  SELECT * INTO v_bid FROM bids WHERE id = p_bid_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bid not found');
  END IF;

  IF v_bid.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bid is not in pending status');
  END IF;

  -- Accept this bid
  UPDATE bids SET status = 'accepted' WHERE id = p_bid_id;

  -- Move job to accepted, record the accepted vendor
  UPDATE jobs
  SET status = 'accepted', accepted_vendor = v_bid.vendor_id
  WHERE id = v_bid.job_id;

  -- Decline all other pending bids on this job
  UPDATE bids
  SET status = 'declined'
  WHERE job_id = v_bid.job_id
    AND id != p_bid_id
    AND status = 'pending';

  RETURN jsonb_build_object('success', true);
END;
$$;
