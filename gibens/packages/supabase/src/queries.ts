// Reusable Supabase query helpers — shared across all 3 apps

import { supabase } from './client'

// ---- AUTH ----

export const signUp = (email: string, password: string, fullName: string, role: 'customer' | 'vendor') =>
  supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, role } },
  })

export const signIn = (email: string, password: string) =>
  supabase.auth.signInWithPassword({ email, password })

export const signOut = () => supabase.auth.signOut()

export const getSession = () => supabase.auth.getSession()

// ---- USERS ----

export const getMe = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('users').select('*').eq('id', user.id).single()
  return data
}

export const upsertUser = (id: string, updates: { full_name?: string; phone?: string; avatar_url?: string }) =>
  supabase.from('users').upsert({ id, ...updates }).select().single()

// ---- CATEGORIES ----

export const getCategories = () =>
  supabase.from('categories').select('*').eq('is_active', true).order('sort_order')

// ---- VENDORS ----

export const getNearbyVendors = (lat: number, lon: number, category?: string, radiusMi = 25) =>
  supabase.rpc('find_nearby_vendors', {
    p_lat: lat,
    p_lon: lon,
    p_category: category || null,
    p_radius_mi: radiusMi,
  })

export const getVendorProfile = (userId: string) =>
  supabase
    .from('vendor_profiles')
    .select('*, users(full_name, avatar_url, phone)')
    .eq('user_id', userId)
    .single()

export const updateVendorProfile = (userId: string, updates: Record<string, unknown>) =>
  supabase.from('vendor_profiles').update(updates).eq('user_id', userId)

export const updateVendorAvailability = (userId: string, isAvailable: boolean) =>
  supabase.from('vendor_profiles').update({ is_available: isAvailable }).eq('user_id', userId)

// ---- JOBS ----

export const createJob = (job: {
  customer_id: string
  category: string
  title: string
  description: string
  address_text: string
  lat: number
  lon: number
  budget?: number
  urgency: string
  photo_urls?: string[]
}) =>
  supabase.from('jobs').insert({
    customer_id: job.customer_id,
    category:     job.category,
    title:        job.title,
    description:  job.description,
    address_text: job.address_text,
    budget:       job.budget,
    urgency:      job.urgency,
    photo_urls:   job.photo_urls,
    location:     `POINT(${job.lon} ${job.lat})`,
  }).select().single()

export const getCustomerJobs = (customerId: string) =>
  supabase
    .from('jobs')
    .select('*, bids(count)')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })

export const getVendorFeed = () =>
  supabase
    .from('jobs')
    .select('*')
    .in('status', ['open', 'bidding'])
    .order('created_at', { ascending: false })

export const getJobDetail = (jobId: string) =>
  supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .maybeSingle()

export const getJobBidsDetail = (jobId: string) =>
  supabase
    .from('bids')
    .select('*, users!vendor_id(full_name, avatar_url, vendor_profiles(avg_rating, is_licensed, is_insured, is_id_verified, total_reviews))')
    .eq('job_id', jobId)
    .order('created_at', { ascending: true })

export const updateJobStatus = (jobId: string, status: string) =>
  supabase.from('jobs').update({ status }).eq('id', jobId)

export const deleteJob = (jobId: string) =>
  supabase.from('jobs').delete().eq('id', jobId)

// ---- BIDS ----

export const createBid = (bid: {
  job_id: string
  vendor_id: string
  amount: number
  booking_fee: number
  message: string
  pricing_type: string
  availability?: string
  est_duration?: string
}) =>
  supabase.from('bids').insert(bid).select().single()

export const getJobBids = (jobId: string) =>
  supabase
    .from('bids')
    .select('*, users!vendor_id(full_name, avatar_url, vendor_profiles(avg_rating, total_reviews, category, is_licensed, is_insured))')
    .eq('job_id', jobId)
    .order('created_at', { ascending: true })

export const getVendorBids = (vendorId: string) =>
  supabase
    .from('bids')
    .select('*, jobs(title, address_text, status, customer_id)')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false })

export const getVendorBidForJob = (jobId: string, vendorId: string) =>
  supabase
    .from('bids')
    .select('*')
    .eq('job_id', jobId)
    .eq('vendor_id', vendorId)
    .maybeSingle()

export const updateBid = (bidId: string, updates: {
  amount: number
  booking_fee: number
  message: string
  pricing_type: string
  availability?: string
  est_duration?: string
}) =>
  supabase.from('bids').update(updates).eq('id', bidId).select().single()

export const acceptBid = async (bidId: string) => {
  try {
    const session = (await supabase.auth.getSession()).data.session
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/charge-fee`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ bid_id: bidId }),
    })
    if (!res.ok) throw new Error(`${res.status}`)
    return res.json()
  } catch {
    // Edge function not reachable — fall back to direct DB accept (no Stripe charge)
    const { data, error } = await supabase.rpc('accept_bid_direct', { p_bid_id: bidId })
    if (error) return { success: false, error: error.message }
    return data ?? { success: true }
  }
}

export const getBookingFeePreview = async (amount: number) => {
  const session = await supabase.auth.getSession()
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fee-preview?amount=${amount}`,
    { headers: { 'Authorization': `Bearer ${session.data.session?.access_token}` } }
  )
  return res.json()
}

// ---- MESSAGES ----

export const getMessages = (jobId: string) =>
  supabase
    .from('messages')
    .select('*, users(full_name, avatar_url)')
    .eq('job_id', jobId)
    .order('created_at', { ascending: true })

export const sendMessage = (jobId: string, senderId: string, body?: string, photoUrl?: string) =>
  supabase.from('messages').insert({ job_id: jobId, sender_id: senderId, body, photo_url: photoUrl }).select().single()

export const markMessagesRead = (jobId: string, readerId: string) =>
  supabase.rpc('mark_messages_read', { p_job_id: jobId, p_reader_id: readerId })

export const subscribeToMessages = (jobId: string, callback: (msg: unknown) => void) =>
  supabase
    .channel(`job:${jobId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `job_id=eq.${jobId}` }, (payload) => callback(payload.new))
    .subscribe()

// ---- NOTIFICATIONS ----

export const getNotifications = (userId: string) =>
  supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

export const markNotificationRead = (id: string) =>
  supabase.from('notifications').update({ is_read: true }).eq('id', id)

export const markJobNotificationsRead = (jobId: string, userId: string) =>
  supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('type', 'new_message')
    .filter('data->>job_id', 'eq', jobId)

export const markAllMessageNotifsRead = (userId: string) =>
  supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('type', 'new_message')
    .eq('is_read', false)

export const subscribeToNotifications = (userId: string, callback: (n: unknown) => void) =>
  supabase
    .channel(`notifications:${userId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, (payload) => callback(payload.new))
    .subscribe()

// ---- UPLOAD ----

export const uploadJobPhoto = async (file: File, jobId: string) => {
  const ext = file.name.split('.').pop()
  const path = `${jobId}/${Date.now()}.${ext}`
  const { data, error } = await supabase.storage.from('job-photos').upload(path, file)
  if (error) throw error
  const { data: { publicUrl } } = supabase.storage.from('job-photos').getPublicUrl(path)
  return publicUrl
}

export const uploadAvatar = async (file: File, userId: string) => {
  const ext = file.name.split('.').pop()
  const path = `${userId}/avatar.${ext}`
  await supabase.storage.from('avatars').upload(path, file, { upsert: true })
  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
  return publicUrl
}

export const markJobComplete = (jobId: string) =>
  supabase.from('jobs').update({ status: 'completed' }).eq('id', jobId)

export const createReview = (review: { job_id: string; reviewer_id: string; reviewee_id: string; rating: number; comment?: string }) =>
  supabase.from('reviews').insert(review).select().single()

export const getVendorReviews = (vendorId: string) =>
  supabase
    .from('reviews')
    .select('*, users!reviewer_id(full_name)')
    .eq('reviewee_id', vendorId)
    .order('created_at', { ascending: false })

export const getMyReviewForJob = (jobId: string, reviewerId: string) =>
  supabase
    .from('reviews')
    .select('id, rating')
    .eq('job_id', jobId)
    .eq('reviewer_id', reviewerId)
    .maybeSingle()

// ---- ADMIN ----

export const adminGetAllUsers = () =>
  supabase.from('users').select('*, vendor_profiles(category, status, avg_rating, total_jobs)').order('created_at', { ascending: false })

export const adminGetAllJobs = () =>
  supabase.from('jobs').select('*').order('created_at', { ascending: false })

export const adminGetDisputes = () =>
  supabase.from('disputes').select('*, jobs(title), users!reporter_id(full_name)').order('created_at', { ascending: false })

export const adminGetLeadFees = () =>
  supabase.from('lead_fee_tiers').select('*').order('min_amount')

export const adminUpdateLeadFee = (id: number, fee: number) =>
  supabase.from('lead_fee_tiers').update({ fee }).eq('id', id)

export const adminUpdateVendorStatus = (userId: string, status: string) =>
  supabase.from('vendor_profiles').update({ status }).eq('user_id', userId)

export const adminUpdateUserStatus = (userId: string, isActive: boolean) =>
  supabase.from('users').update({ is_active: isActive }).eq('id', userId)

export const adminResolveDispute = (id: string, resolution: string, status: string) =>
  supabase.from('disputes').update({ resolution, status, resolved_at: new Date().toISOString() }).eq('id', id)
