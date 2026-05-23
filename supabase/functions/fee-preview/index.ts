// Supabase Edge Function: fee-preview
// Returns the booking fee tier for a given bid amount

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const url = new URL(req.url)
    const amount = parseFloat(url.searchParams.get('amount') || '0')
    if (isNaN(amount) || amount <= 0) throw new Error('Invalid amount')

    const { data: tier, error } = await supabase
      .from('lead_fee_tiers')
      .select('*')
      .lte('min_amount', amount)
      .or(`max_amount.is.null,max_amount.gte.${amount}`)
      .order('min_amount', { ascending: false })
      .limit(1)
      .single()

    if (error) throw error

    return new Response(
      JSON.stringify({
        amount,
        fee: tier.fee,
        label: tier.label,
        net: amount - tier.fee,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
