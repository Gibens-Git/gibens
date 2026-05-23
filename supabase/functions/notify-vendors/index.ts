// Supabase Edge Function: notify-vendors
// Triggered after a new job is posted — finds matching vendors and sends notifications

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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { job_id } = await req.json()
    if (!job_id) throw new Error('job_id required')

    // Load the job
    const { data: job, error: jobErr } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', job_id)
      .single()

    if (jobErr || !job) throw new Error('Job not found')

    // Find all active, available vendors in the job's category within their travel radius
    const { data: vendors, error: vendorErr } = await supabase.rpc('find_nearby_vendors', {
      p_category: job.category,
      p_lon: job.location.coordinates[0],
      p_lat: job.location.coordinates[1],
    })

    if (vendorErr) throw vendorErr

    if (!vendors || vendors.length === 0) {
      return new Response(
        JSON.stringify({ success: true, notified: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Insert a notification for each matched vendor
    const notifications = vendors.map((v: { user_id: string }) => ({
      user_id: v.user_id,
      type: 'new_job',
      title: 'New job near you!',
      body: `${job.title} — ${job.address_text}${job.budget ? ` — Budget: $${job.budget}` : ' — Open to bids'}`,
      data: { job_id: job.id, category: job.category },
    }))

    const { error: notifErr } = await supabase.from('notifications').insert(notifications)
    if (notifErr) throw notifErr

    return new Response(
      JSON.stringify({ success: true, notified: vendors.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
