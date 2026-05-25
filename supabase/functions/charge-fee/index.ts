// Supabase Edge Function: charge-fee
// Called when a customer accepts a bid — charges the vendor the booking fee via Stripe

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@13'

const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: '2023-10-16' }) : null

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { bid_id } = await req.json()
    if (!bid_id) throw new Error('bid_id is required')

    // Load the bid with job and vendor data
    const { data: bid, error: bidErr } = await supabase
      .from('bids')
      .select('*, jobs(id, title, customer_id), vendor_profiles(stripe_account_id)')
      .eq('id', bid_id)
      .single()

    if (bidErr || !bid) throw new Error('Bid not found')
    if (bid.status !== 'pending') throw new Error('Bid is not in pending status')

    const feeAmountCents = Math.round(bid.booking_fee * 100)
    const vendorStripeId = bid.vendor_profiles?.stripe_account_id

    let chargeId: string | null = null

    if (vendorStripeId && stripe) {
      // Charge vendor's connected Stripe account
      const charge = await stripe.charges.create({
        amount: feeAmountCents,
        currency: 'usd',
        source: vendorStripeId,
        description: `Gibens lead fee — Job: ${bid.jobs.title} — Bid: $${bid.amount}`,
        metadata: {
          bid_id: bid.id,
          job_id: bid.jobs.id,
          vendor_id: bid.vendor_id,
          customer_id: bid.jobs.customer_id,
        },
      })
      chargeId = charge.id
    }

    // Update bid to accepted, record charge ID
    const { error: updateBidErr } = await supabase
      .from('bids')
      .update({ status: 'accepted', stripe_charge_id: chargeId })
      .eq('id', bid_id)

    if (updateBidErr) throw updateBidErr

    // Update job to accepted, set accepted vendor
    const { error: updateJobErr } = await supabase
      .from('jobs')
      .update({ status: 'accepted', accepted_vendor: bid.vendor_id })
      .eq('id', bid.job_id)

    if (updateJobErr) throw updateJobErr

    // Decline all other pending bids on this job
    await supabase
      .from('bids')
      .update({ status: 'declined' })
      .eq('job_id', bid.job_id)
      .neq('id', bid_id)
      .eq('status', 'pending')

    // Notify vendor their bid was accepted
    await supabase.from('notifications').insert({
      user_id: bid.vendor_id,
      type: 'bid_accepted',
      title: 'Your bid was accepted!',
      body: `The customer accepted your $${bid.amount} bid for "${bid.jobs.title}". Booking fee of $${bid.booking_fee} charged.`,
      data: { job_id: bid.job_id, bid_id: bid.id },
    })

    // Notify customer the bid was accepted
    await supabase.from('notifications').insert({
      user_id: bid.jobs.customer_id,
      type: 'job_accepted',
      title: 'Pro confirmed!',
      body: `Your job "${bid.jobs.title}" is confirmed. The pro will be in touch shortly.`,
      data: { job_id: bid.job_id, bid_id: bid.id },
    })

    return new Response(
      JSON.stringify({ success: true, charge_id: chargeId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
