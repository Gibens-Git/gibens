// Auto-generated from: supabase gen types typescript --project-id YOUR_PROJECT_ID
// Regenerate with: npx supabase gen types typescript --project-id <id> > packages/supabase/src/types.ts

export type UserRole = 'customer' | 'vendor' | 'admin'
export type JobStatus = 'open' | 'bidding' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'
export type JobUrgency = 'asap' | 'today' | 'this_week' | 'flexible'
export type BidStatus = 'pending' | 'accepted' | 'declined' | 'withdrawn'
export type BidPricing = 'fixed_incl' | 'fixed_excl' | 'hourly' | 'estimate'
export type VendorStatus = 'pending' | 'active' | 'suspended' | 'banned'
export type DisputeType = 'payment' | 'no_show' | 'quality' | 'fraud' | 'other'
export type DisputeStatus = 'open' | 'under_review' | 'resolved' | 'closed'

export interface User {
  id: string
  role: UserRole
  full_name: string
  phone: string | null
  avatar_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  // Joined
  vendor_profiles?: VendorProfile
}

export interface VendorProfile {
  user_id: string
  category: string
  bio: string | null
  travel_radius_mi: number
  location: unknown
  address_text: string | null
  is_available: boolean
  status: VendorStatus
  avg_rating: number
  total_reviews: number
  total_jobs: number
  base_rate: number | null
  hourly_rate: string | null
  working_hours: string | null
  stripe_account_id: string | null
  is_id_verified: boolean
  is_licensed: boolean
  is_insured: boolean
  license_url: string | null
  insurance_url: string | null
  created_at: string
  updated_at: string
  // Joined
  users?: User
}

export interface Job {
  id: string
  customer_id: string
  accepted_vendor: string | null
  category: string
  title: string
  description: string
  location: unknown
  address_text: string
  budget: number | null
  status: JobStatus
  urgency: JobUrgency
  photo_urls: string[]
  bid_count: number
  expires_at: string
  created_at: string
  updated_at: string
  // Joined
  users?: User
  bids?: Bid[]
}

export interface Bid {
  id: string
  job_id: string
  vendor_id: string
  amount: number
  booking_fee: number
  message: string
  pricing_type: BidPricing
  availability: string | null
  est_duration: string | null
  status: BidStatus
  stripe_charge_id: string | null
  created_at: string
  updated_at: string
  // Joined
  users?: User
  vendor_profiles?: VendorProfile
  jobs?: Job
}

export interface Message {
  id: string
  job_id: string
  sender_id: string
  body: string | null
  photo_url: string | null
  is_read: boolean
  read_at: string | null
  created_at: string
  // Joined
  users?: User
}

export interface Review {
  id: string
  job_id: string
  reviewer_id: string
  reviewee_id: string
  rating: number
  comment: string | null
  photo_urls?: string[]
  created_at: string
}

export interface ReviewWithUser extends Review {
  users?: { full_name: string }
}

export interface Category {
  id: number
  name: string
  slug: string
  icon: string | null
  is_active: boolean
  sort_order: number
}

export interface Dispute {
  id: string
  job_id: string
  reporter_id: string
  type: DisputeType
  description: string
  status: DisputeStatus
  resolution: string | null
  resolved_by: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
}

export interface LeadFeeTier {
  id: number
  min_amount: number
  max_amount: number | null
  fee: number
  label: string
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  body: string
  data: Record<string, unknown>
  is_read: boolean
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      users: { Row: User; Insert: Omit<User, 'created_at' | 'updated_at'>; Update: Partial<User> }
      vendor_profiles: { Row: VendorProfile; Insert: Omit<VendorProfile, 'created_at' | 'updated_at'>; Update: Partial<VendorProfile> }
      jobs: { Row: Job; Insert: Omit<Job, 'id' | 'created_at' | 'updated_at' | 'bid_count'>; Update: Partial<Job> }
      bids: { Row: Bid; Insert: Omit<Bid, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Bid> }
      messages: { Row: Message; Insert: Omit<Message, 'id' | 'created_at'>; Update: Partial<Message> }
      reviews: { Row: Review; Insert: Omit<Review, 'id' | 'created_at'>; Update: Partial<Review> }
      categories: { Row: Category; Insert: Omit<Category, 'id'>; Update: Partial<Category> }
      disputes: { Row: Dispute; Insert: Omit<Dispute, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Dispute> }
      lead_fee_tiers: { Row: LeadFeeTier; Insert: Omit<LeadFeeTier, 'id'>; Update: Partial<LeadFeeTier> }
      notifications: { Row: Notification; Insert: Omit<Notification, 'id' | 'created_at'>; Update: Partial<Notification> }
    }
  }
}
